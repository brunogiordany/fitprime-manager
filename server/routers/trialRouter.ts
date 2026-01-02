import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Schema para criar trial
const createTrialSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  cpf: z.string().min(11, "CPF inválido"),
  cref: z.string().optional(),
});

export const trialRouter = router({
  // Criar conta trial de 1 dia
  createTrial: publicProcedure
    .input(createTrialSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se CPF já existe
      const existingUser = await db.execute(sql`
        SELECT id FROM users WHERE cpf = ${input.cpf} LIMIT 1
      `);

      if ((existingUser as any)[0] && (existingUser as any)[0].length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "CPF já cadastrado. Faça login na sua conta existente.",
        });
      }

      // Verificar se email já existe
      const existingEmail = await db.execute(sql`
        SELECT id FROM users WHERE email = ${input.email} LIMIT 1
      `);

      if ((existingEmail as any)[0] && (existingEmail as any)[0].length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email já cadastrado. Faça login na sua conta existente.",
        });
      }

      // Criar usuário com trial de 1 dia
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 1); // 1 dia de trial

      await db.execute(sql`
        INSERT INTO users (name, email, cpf, phone, role, createdAt, updatedAt)
        VALUES (${input.name}, ${input.email}, ${input.cpf}, ${input.phone}, 'user', NOW(), NOW())
      `);

      // Obter o ID do usuário criado
      const userIdResult = await db.execute(sql`SELECT LAST_INSERT_ID() as id`);
      const userId = (userIdResult as any)[0]?.[0]?.id;

      if (!userId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar usuário",
        });
      }

      // Criar perfil de personal com trial
      await db.execute(sql`
        INSERT INTO personals (userId, trialEndsAt, subscriptionStatus, createdAt, updatedAt)
        VALUES (${userId}, ${trialEndsAt.toISOString()}, 'trial', NOW(), NOW())
      `);

      return {
        success: true,
        userId,
        trialEndsAt: trialEndsAt.toISOString(),
        message: "Conta trial criada com sucesso! Você tem 1 dia de acesso gratuito.",
      };
    }),

  // Verificar status do trial
  checkTrialStatus: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const result = await db.execute(sql`
        SELECT p.trialEndsAt, p.subscriptionStatus
        FROM users u
        JOIN personals p ON p.userId = u.id
        WHERE u.email = ${input.email}
        LIMIT 1
      `);

      const rows = (result as any)[0];
      if (!rows || rows.length === 0) {
        return { exists: false, isActive: false };
      }

      const personal = rows[0];
      const now = new Date();
      const trialEndsAt = personal.trialEndsAt ? new Date(personal.trialEndsAt) : null;
      const isActive = trialEndsAt ? now < trialEndsAt : false;

      return {
        exists: true,
        isActive,
        trialEndsAt: trialEndsAt?.toISOString(),
        status: personal.subscriptionStatus,
      };
    }),
});
