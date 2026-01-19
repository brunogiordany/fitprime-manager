import { z } from "zod";
import { router, ownerProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { activityLogs } from "../../drizzle/schema";
import { eq, desc, and, sql, gte, lte, like, or } from "drizzle-orm";

// Tipos de atividade para validação
const activityTypes = [
  "whatsapp_sent",
  "whatsapp_received",
  "whatsapp_failed",
  "whatsapp_bulk_sent",
  "email_sent",
  "email_failed",
  "email_opened",
  "email_clicked",
  "lead_created",
  "lead_updated",
  "lead_converted",
  "lead_tag_added",
  "lead_tag_removed",
  "funnel_stage_changed",
  "automation_triggered",
  "user_login",
  "user_action",
] as const;

// Função helper para registrar atividade (exportada para uso em outros routers)
export async function logActivity(data: {
  activityType: typeof activityTypes[number];
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  entityType?: string;
  entityId?: number;
  leadId?: number;
  leadName?: string;
  leadPhone?: string;
  leadEmail?: string;
  userId?: number;
  userName?: string;
  status?: "success" | "failed" | "pending" | "cancelled";
  errorMessage?: string;
  externalId?: string;
}) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[ActivityLog] Database not available");
      return null;
    }

    const result = await db.insert(activityLogs).values({
      activityType: data.activityType,
      title: data.title,
      description: data.description || null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      entityType: data.entityType || null,
      entityId: data.entityId || null,
      leadId: data.leadId || null,
      leadName: data.leadName || null,
      leadPhone: data.leadPhone || null,
      leadEmail: data.leadEmail || null,
      userId: data.userId || null,
      userName: data.userName || null,
      status: data.status || "success",
      errorMessage: data.errorMessage || null,
      externalId: data.externalId || null,
    });

    return result;
  } catch (error) {
    console.error("[ActivityLog] Error logging activity:", error);
    return null;
  }
}

export const activityLogRouter = router({
  // Listar logs de atividade com filtros
  list: ownerProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(50),
      activityType: z.enum(activityTypes).optional(),
      status: z.enum(["success", "failed", "pending", "cancelled"]).optional(),
      search: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      leadId: z.number().optional(),
      entityType: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const offset = (input.page - 1) * input.limit;
      const conditions: any[] = [];

      if (input.activityType) {
        conditions.push(eq(activityLogs.activityType, input.activityType));
      }

      if (input.status) {
        conditions.push(eq(activityLogs.status, input.status));
      }

      if (input.leadId) {
        conditions.push(eq(activityLogs.leadId, input.leadId));
      }

      if (input.entityType) {
        conditions.push(eq(activityLogs.entityType, input.entityType));
      }

      if (input.search) {
        const searchTerm = `%${input.search}%`;
        conditions.push(
          or(
            like(activityLogs.title, searchTerm),
            like(activityLogs.description, searchTerm),
            like(activityLogs.leadName, searchTerm),
            like(activityLogs.leadPhone, searchTerm),
            like(activityLogs.leadEmail, searchTerm)
          )
        );
      }

      if (input.startDate) {
        conditions.push(gte(activityLogs.createdAt, new Date(input.startDate)));
      }

      if (input.endDate) {
        conditions.push(lte(activityLogs.createdAt, new Date(input.endDate + " 23:59:59")));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [logs, countResult] = await Promise.all([
        db
          .select()
          .from(activityLogs)
          .where(whereClause)
          .orderBy(desc(activityLogs.createdAt))
          .limit(input.limit)
          .offset(offset),
        db
          .select({ count: sql<number>`COUNT(*)` })
          .from(activityLogs)
          .where(whereClause),
      ]);

      const total = countResult[0]?.count || 0;

      return {
        logs,
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  // Obter estatísticas de atividades
  getStats: ownerProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions: any[] = [];

      if (input.startDate) {
        conditions.push(gte(activityLogs.createdAt, new Date(input.startDate)));
      }

      if (input.endDate) {
        conditions.push(lte(activityLogs.createdAt, new Date(input.endDate + " 23:59:59")));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Estatísticas por tipo de atividade
      const [byType] = await db.execute(sql`
        SELECT activityType, COUNT(*) as count
        FROM activity_logs
        ${whereClause ? sql`WHERE ${whereClause}` : sql``}
        GROUP BY activityType
        ORDER BY count DESC
      `);

      // Estatísticas por status
      const [byStatus] = await db.execute(sql`
        SELECT status, COUNT(*) as count
        FROM activity_logs
        ${whereClause ? sql`WHERE ${whereClause}` : sql``}
        GROUP BY status
      `);

      // Total de atividades
      const [totalResult] = await db.execute(sql`
        SELECT COUNT(*) as total
        FROM activity_logs
        ${whereClause ? sql`WHERE ${whereClause}` : sql``}
      `);

      // Atividades por dia (últimos 7 dias)
      const [byDay] = await db.execute(sql`
        SELECT DATE(createdAt) as date, COUNT(*) as count
        FROM activity_logs
        WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(createdAt)
        ORDER BY date DESC
      `);

      // WhatsApp enviados vs falhas
      const [whatsappStats] = await db.execute(sql`
        SELECT 
          SUM(CASE WHEN activityType = 'whatsapp_sent' THEN 1 ELSE 0 END) as sent,
          SUM(CASE WHEN activityType = 'whatsapp_failed' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN activityType = 'whatsapp_bulk_sent' THEN 1 ELSE 0 END) as bulk
        FROM activity_logs
        ${whereClause ? sql`WHERE ${whereClause}` : sql``}
      `);

      // Email enviados vs falhas
      const [emailStats] = await db.execute(sql`
        SELECT 
          SUM(CASE WHEN activityType = 'email_sent' THEN 1 ELSE 0 END) as sent,
          SUM(CASE WHEN activityType = 'email_failed' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN activityType = 'email_opened' THEN 1 ELSE 0 END) as opened,
          SUM(CASE WHEN activityType = 'email_clicked' THEN 1 ELSE 0 END) as clicked
        FROM activity_logs
        ${whereClause ? sql`WHERE ${whereClause}` : sql``}
      `);

      return {
        total: (totalResult as any)?.[0]?.total || 0,
        byType: byType || [],
        byStatus: byStatus || [],
        byDay: byDay || [],
        whatsapp: (whatsappStats as any)?.[0] || { sent: 0, failed: 0, bulk: 0 },
        email: (emailStats as any)?.[0] || { sent: 0, failed: 0, opened: 0, clicked: 0 },
      };
    }),

  // Obter detalhes de uma atividade específica
  getById: ownerProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [log] = await db
        .select()
        .from(activityLogs)
        .where(eq(activityLogs.id, input.id));

      return log || null;
    }),

  // Obter logs de um lead específico
  getByLead: ownerProcedure
    .input(z.object({
      leadId: z.number(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const logs = await db
        .select()
        .from(activityLogs)
        .where(eq(activityLogs.leadId, input.leadId))
        .orderBy(desc(activityLogs.createdAt))
        .limit(input.limit);

      return logs;
    }),

  // Exportar logs para CSV
  export: ownerProcedure
    .input(z.object({
      activityType: z.enum(activityTypes).optional(),
      status: z.enum(["success", "failed", "pending", "cancelled"]).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions: any[] = [];

      if (input.activityType) {
        conditions.push(eq(activityLogs.activityType, input.activityType));
      }

      if (input.status) {
        conditions.push(eq(activityLogs.status, input.status));
      }

      if (input.startDate) {
        conditions.push(gte(activityLogs.createdAt, new Date(input.startDate)));
      }

      if (input.endDate) {
        conditions.push(lte(activityLogs.createdAt, new Date(input.endDate + " 23:59:59")));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const logs = await db
        .select()
        .from(activityLogs)
        .where(whereClause)
        .orderBy(desc(activityLogs.createdAt))
        .limit(10000); // Limite de exportação

      // Converter para formato CSV
      const headers = [
        "ID",
        "Tipo",
        "Título",
        "Descrição",
        "Lead",
        "Telefone",
        "Email",
        "Status",
        "Erro",
        "Data",
      ];

      const rows = logs.map((log) => [
        log.id,
        log.activityType,
        log.title,
        log.description || "",
        log.leadName || "",
        log.leadPhone || "",
        log.leadEmail || "",
        log.status,
        log.errorMessage || "",
        log.createdAt?.toISOString() || "",
      ]);

      return {
        headers,
        rows,
        total: logs.length,
      };
    }),
});
