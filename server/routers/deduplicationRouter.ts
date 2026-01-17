import { z } from "zod";
import { router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const deduplicationRouter = router({
  // Listar personais com indicação de duplicação
  listPersonalsWithDuplicates: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(25),
      search: z.string().optional(),
      showOnlyDuplicates: z.boolean().default(false),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const offset = (input.page - 1) * input.limit;
      
      // Buscar personais com contagem de duplicações por email
      let query = sql`
        SELECT 
          p.id,
          p.userId,
          p.subscriptionStatus,
          p.createdAt,
          p.trialEndsAt,
          p.testAccessEndsAt,
          u.name,
          u.email,
          u.phone,
          u.cpf,
          (
            SELECT COUNT(*) 
            FROM users u2 
            JOIN personals p2 ON p2.userId = u2.id 
            WHERE LOWER(u2.email) = LOWER(u.email) 
            AND p2.deletedAt IS NULL
          ) as duplicateCount,
          (
            SELECT COUNT(*) 
            FROM quiz_responses qr 
            WHERE LOWER(qr.leadEmail) = LOWER(u.email)
          ) as quizCount,
          (
            SELECT COUNT(*) 
            FROM personal_registration_history prh 
            WHERE LOWER(prh.email) = LOWER(u.email)
          ) as registrationAttempts
        FROM personals p
        JOIN users u ON u.id = p.userId
        WHERE p.deletedAt IS NULL
      `;
      
      if (input.search) {
        query = sql`${query} AND (u.name LIKE ${`%${input.search}%`} OR u.email LIKE ${`%${input.search}%`} OR u.phone LIKE ${`%${input.search}%`})`;
      }
      
      if (input.showOnlyDuplicates) {
        query = sql`${query} HAVING duplicateCount > 1`;
      }
      
      query = sql`${query} ORDER BY p.createdAt DESC LIMIT ${input.limit} OFFSET ${offset}`;
      
      const result = await db.execute(query);
      const personals = (result as any)[0] || [];
      
      // Contagem total
      let countQuery = sql`
        SELECT COUNT(DISTINCT p.id) as count
        FROM personals p
        JOIN users u ON u.id = p.userId
        WHERE p.deletedAt IS NULL
      `;
      
      if (input.search) {
        countQuery = sql`${countQuery} AND (u.name LIKE ${`%${input.search}%`} OR u.email LIKE ${`%${input.search}%`})`;
      }
      
      const countResult = await db.execute(countQuery);
      const total = Number((countResult as any)[0]?.[0]?.count) || 0;
      
      return {
        personals,
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  // Buscar duplicações por email específico
  getDuplicatesByEmail: adminProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Buscar todos os registros com esse email
      const personalsResult = await db.execute(sql`
        SELECT 
          p.id,
          p.userId,
          p.subscriptionStatus,
          p.createdAt,
          p.trialEndsAt,
          p.testAccessEndsAt,
          u.name,
          u.email,
          u.phone,
          u.cpf,
          u.openId,
          u.loginMethod
        FROM personals p
        JOIN users u ON u.id = p.userId
        WHERE LOWER(u.email) = LOWER(${input.email})
        AND p.deletedAt IS NULL
        ORDER BY p.createdAt ASC
      `);
      const personals = (personalsResult as any)[0] || [];
      
      // Buscar histórico de registros
      const historyResult = await db.execute(sql`
        SELECT *
        FROM personal_registration_history
        WHERE LOWER(email) = LOWER(${input.email})
        ORDER BY createdAt DESC
      `);
      const registrationHistory = (historyResult as any)[0] || [];
      
      // Buscar leads do quiz com esse email
      const leadsResult = await db.execute(sql`
        SELECT 
          id,
          leadName,
          leadEmail,
          leadPhone,
          leadCity,
          studentsCount,
          revenue,
          isQualified,
          converted,
          utmSource,
          utmMedium,
          utmCampaign,
          createdAt
        FROM quiz_responses
        WHERE LOWER(leadEmail) = LOWER(${input.email})
        ORDER BY createdAt DESC
      `);
      const quizLeads = (leadsResult as any)[0] || [];
      
      return {
        personals,
        registrationHistory,
        quizLeads,
      };
    }),

  // Obter histórico completo de um personal
  getPersonalHistory: adminProcedure
    .input(z.object({ personalId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Buscar dados do personal
      const personalResult = await db.execute(sql`
        SELECT 
          p.*,
          u.name,
          u.email,
          u.phone,
          u.cpf,
          u.openId,
          u.loginMethod,
          u.createdAt as userCreatedAt
        FROM personals p
        JOIN users u ON u.id = p.userId
        WHERE p.id = ${input.personalId}
      `);
      
      const personal = (personalResult as any)[0]?.[0];
      if (!personal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Personal não encontrado" });
      }
      
      // Buscar histórico de registros
      const historyResult = await db.execute(sql`
        SELECT *
        FROM personal_registration_history
        WHERE LOWER(email) = LOWER(${personal.email})
        ORDER BY createdAt DESC
      `);
      const registrationHistory = (historyResult as any)[0] || [];
      
      // Buscar leads do quiz com esse email
      const leadsResult = await db.execute(sql`
        SELECT 
          id,
          leadName,
          leadEmail,
          leadPhone,
          leadCity,
          studentsCount,
          revenue,
          isQualified,
          converted,
          utmSource,
          utmMedium,
          utmCampaign,
          deviceType,
          browser,
          os,
          createdAt
        FROM quiz_responses
        WHERE LOWER(leadEmail) = LOWER(${personal.email})
        ORDER BY createdAt DESC
      `);
      const quizLeads = (leadsResult as any)[0] || [];
      
      // Buscar outros personais com mesmo email (duplicados)
      const duplicatesResult = await db.execute(sql`
        SELECT 
          p.id,
          p.subscriptionStatus,
          p.createdAt,
          u.name,
          u.email
        FROM personals p
        JOIN users u ON u.id = p.userId
        WHERE LOWER(u.email) = LOWER(${personal.email})
        AND p.id != ${input.personalId}
        AND p.deletedAt IS NULL
      `);
      const duplicates = (duplicatesResult as any)[0] || [];
      
      return {
        personal,
        registrationHistory,
        quizLeads,
        duplicates,
      };
    }),

  // Mesclar personais duplicados
  mergePersonals: adminProcedure
    .input(z.object({
      primaryPersonalId: z.number(),
      secondaryPersonalIds: z.array(z.number()),
      keepData: z.enum(["primary", "newest", "oldest"]).default("primary"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Buscar dados do personal principal
      const primaryResult = await db.execute(sql`
        SELECT p.*, u.email
        FROM personals p
        JOIN users u ON u.id = p.userId
        WHERE p.id = ${input.primaryPersonalId}
      `);
      
      const primaryPersonal = (primaryResult as any)[0]?.[0];
      if (!primaryPersonal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Personal principal não encontrado" });
      }
      
      // Para cada personal secundário, transferir dados e marcar como mesclado
      for (const secondaryId of input.secondaryPersonalIds) {
        // Buscar dados do secundário
        const secondaryResult = await db.execute(sql`
          SELECT p.*, u.email, u.name, u.phone
          FROM personals p
          JOIN users u ON u.id = p.userId
          WHERE p.id = ${secondaryId}
        `);
        
        const secondaryPersonal = (secondaryResult as any)[0]?.[0];
        if (!secondaryPersonal) continue;
        
        // Registrar no histórico
        await db.execute(sql`
          INSERT INTO personal_registration_history 
          (personalId, email, name, phone, source, status, mergedIntoId, createdAt)
          VALUES (
            ${input.primaryPersonalId},
            ${secondaryPersonal.email},
            ${secondaryPersonal.name},
            ${secondaryPersonal.phone},
            'migration',
            'merged',
            ${input.primaryPersonalId},
            NOW()
          )
        `);
        
        // Transferir alunos para o personal principal
        await db.execute(sql`
          UPDATE students 
          SET personalId = ${input.primaryPersonalId}
          WHERE personalId = ${secondaryId}
        `);
        
        // Transferir sessões
        await db.execute(sql`
          UPDATE sessions 
          SET personalId = ${input.primaryPersonalId}
          WHERE personalId = ${secondaryId}
        `);
        
        // Transferir treinos
        await db.execute(sql`
          UPDATE workouts 
          SET personalId = ${input.primaryPersonalId}
          WHERE personalId = ${secondaryId}
        `);
        
        // Transferir planos
        await db.execute(sql`
          UPDATE plans 
          SET personalId = ${input.primaryPersonalId}
          WHERE personalId = ${secondaryId}
        `);
        
        // Soft delete do personal secundário
        await db.execute(sql`
          UPDATE personals 
          SET deletedAt = NOW()
          WHERE id = ${secondaryId}
        `);
        
        // Soft delete do user secundário
        await db.execute(sql`
          UPDATE users 
          SET deletedAt = NOW()
          WHERE id = ${secondaryPersonal.userId}
        `);
      }
      
      return {
        success: true,
        message: `${input.secondaryPersonalIds.length} registro(s) mesclado(s) com sucesso`,
        primaryPersonalId: input.primaryPersonalId,
      };
    }),

  // Estatísticas de duplicação
  getDuplicationStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    
    // Total de personais
    const totalResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM personals WHERE deletedAt IS NULL
    `);
    const totalPersonals = Number((totalResult as any)[0]?.[0]?.count) || 0;
    
    // Emails duplicados
    const duplicatesResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM (
        SELECT u.email, COUNT(*) as cnt
        FROM personals p
        JOIN users u ON u.id = p.userId
        WHERE p.deletedAt IS NULL
        GROUP BY LOWER(u.email)
        HAVING cnt > 1
      ) as duplicates
    `);
    const duplicatedEmails = Number((duplicatesResult as any)[0]?.[0]?.count) || 0;
    
    // Total de registros duplicados
    const duplicateRecordsResult = await db.execute(sql`
      SELECT SUM(cnt) as count FROM (
        SELECT u.email, COUNT(*) as cnt
        FROM personals p
        JOIN users u ON u.id = p.userId
        WHERE p.deletedAt IS NULL
        GROUP BY LOWER(u.email)
        HAVING cnt > 1
      ) as duplicates
    `);
    const totalDuplicateRecords = Number((duplicateRecordsResult as any)[0]?.[0]?.count) || 0;
    
    // Leads convertidos
    const convertedResult = await db.execute(sql`
      SELECT COUNT(DISTINCT qr.leadEmail) as count
      FROM quiz_responses qr
      JOIN users u ON LOWER(qr.leadEmail) = LOWER(u.email)
      JOIN personals p ON p.userId = u.id
      WHERE p.deletedAt IS NULL
    `);
    const convertedLeads = Number((convertedResult as any)[0]?.[0]?.count) || 0;
    
    // Total de leads
    const totalLeadsResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM quiz_responses
    `);
    const totalLeads = Number((totalLeadsResult as any)[0]?.[0]?.count) || 0;
    
    return {
      totalPersonals,
      duplicatedEmails,
      totalDuplicateRecords,
      convertedLeads,
      totalLeads,
      conversionRate: totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : "0",
    };
  }),
});
