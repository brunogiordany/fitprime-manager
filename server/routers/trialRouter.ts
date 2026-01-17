import { z } from "zod";
import { publicProcedure, router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";

// Schema para criar trial
const createTrialSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  cpf: z.string().min(11, "CPF inválido"),
  birthDate: z.string().min(10, "Data de nascimento inválida"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
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
      
      // Gerar openId único para usuários de trial (baseado no CPF + timestamp)
      const openId = `trial_${input.cpf.replace(/\D/g, '')}_${Date.now()}`;
      
      // Hash da senha
      const passwordHash = await bcrypt.hash(input.password, 10);
      
      // Converter data de DD/MM/YYYY para YYYY-MM-DD
      let birthDateFormatted = input.birthDate;
      if (input.birthDate.includes('/')) {
        const [day, month, year] = input.birthDate.split('/');
        birthDateFormatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      await db.execute(sql`
        INSERT INTO users (openId, name, email, cpf, phone, birthDate, role, passwordHash, loginMethod, createdAt, updatedAt)
        VALUES (${openId}, ${input.name}, ${input.email}, ${input.cpf.replace(/\D/g, '')}, ${input.phone.replace(/\D/g, '')}, ${birthDateFormatted}, 'user', ${passwordHash}, 'password', NOW(), NOW())
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

  // Vincular dados do quiz à conta existente
  linkQuizData: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(1, "Senha obrigatória"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Buscar usuário pelo email
      const userResult = await db.execute(sql`
        SELECT u.id, u.passwordHash, u.name, p.id as personalId
        FROM users u
        LEFT JOIN personals p ON p.userId = u.id
        WHERE u.email = ${input.email}
        LIMIT 1
      `);

      const user = (userResult as any)[0]?.[0];
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Email não encontrado. Verifique o email informado.",
        });
      }

      // Verificar senha
      const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
      if (!isValidPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Senha incorreta. Tente novamente.",
        });
      }

      // Buscar dados do quiz não vinculados com o mesmo email
      const quizResult = await db.execute(sql`
        SELECT id, name, email, phone, city, state, studentsCount, monthlyRevenue,
               utmSource, utmMedium, utmCampaign, utmContent, utmTerm,
               referrer, userAgent, deviceType, browser, operatingSystem,
               createdAt
        FROM quiz_responses
        WHERE email = ${input.email}
        AND linkedPersonalId IS NULL
        ORDER BY createdAt DESC
      `);

      const quizResponses = (quizResult as any)[0] || [];

      if (quizResponses.length === 0) {
        return {
          success: true,
          linked: 0,
          message: "Nenhum dado do quiz encontrado para vincular.",
        };
      }

      // Vincular todos os registros do quiz ao personal
      const quizIds = quizResponses.map((q: any) => q.id);
      await db.execute(sql`
        UPDATE quiz_responses
        SET linkedPersonalId = ${user.personalId || user.id}
        WHERE id IN (${sql.join(quizIds.map((id: number) => sql`${id}`), sql`, `)})
      `);

      // Atualizar dados do personal com informações mais recentes do quiz (se vazios)
      const latestQuiz = quizResponses[0];
      if (user.personalId && latestQuiz) {
        // Atualizar cidade/estado se não preenchidos
        await db.execute(sql`
          UPDATE personals
          SET 
            city = COALESCE(NULLIF(city, ''), ${latestQuiz.city}),
            state = COALESCE(NULLIF(state, ''), ${latestQuiz.state}),
            updatedAt = NOW()
          WHERE id = ${user.personalId}
        `);
      }

      // Registrar no histórico
      await db.execute(sql`
        INSERT INTO personal_registration_history (personalId, eventType, eventData, createdAt)
        VALUES (
          ${user.personalId || user.id},
          'quiz_linked',
          ${JSON.stringify({ quizIds, linkedAt: new Date().toISOString() })},
          NOW()
        )
      `);

      return {
        success: true,
        linked: quizResponses.length,
        message: `${quizResponses.length} registro(s) do quiz vinculado(s) à sua conta com sucesso!`,
      };
    }),

  // Verificar se existem dados do quiz para vincular
  checkQuizDataToLink: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se o email já existe como usuário
      const userResult = await db.execute(sql`
        SELECT id FROM users WHERE email = ${input.email} LIMIT 1
      `);
      const userExists = (userResult as any)[0]?.length > 0;

      if (!userExists) {
        return { hasQuizData: false, count: 0, userExists: false };
      }

      // Buscar dados do quiz não vinculados
      const quizResult = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM quiz_responses
        WHERE email = ${input.email}
        AND linkedPersonalId IS NULL
      `);

      const count = (quizResult as any)[0]?.[0]?.count || 0;

      return {
        hasQuizData: count > 0,
        count,
        userExists: true,
      };
    }),

  // Estatísticas de trials (admin)
  getTrialStats: adminProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      let whereClause = sql`p.subscriptionStatus = 'trial'`;
      
      if (input.startDate) {
        whereClause = sql`${whereClause} AND p.createdAt >= ${input.startDate}`;
      }
      if (input.endDate) {
        whereClause = sql`${whereClause} AND p.createdAt <= ${input.endDate}`;
      }

      // Total de trials criados
      const [totalResult] = await db.execute(sql`
        SELECT COUNT(*) as count FROM personals p WHERE ${whereClause}
      `);
      const total = (totalResult as any)?.count || 0;

      // Trials ativos (ainda dentro do período)
      const [activeResult] = await db.execute(sql`
        SELECT COUNT(*) as count FROM personals p 
        WHERE ${whereClause} AND p.trialEndsAt > NOW()
      `);
      const active = (activeResult as any)?.count || 0;

      // Trials expirados
      const expired = total - active;

      // Trials por dia
      const dailyTrials = await db.execute(sql`
        SELECT DATE(p.createdAt) as date, COUNT(*) as count
        FROM personals p
        WHERE ${whereClause}
        GROUP BY DATE(p.createdAt)
        ORDER BY DATE(p.createdAt)
      `);

      return {
        total,
        active,
        expired,
        daily: (dailyTrials as any)[0] || [],
      };
    }),
});
