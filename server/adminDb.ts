/**
 * FitPrime Manager - Admin Database Functions
 * Funções de banco de dados para o painel de administração
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq, and, or, gte, gt, lte, lt, desc, asc, sql, isNull, isNotNull, inArray } from "drizzle-orm";
import {
  users,
  personals,
  students,
  sessions,
  workouts,
  charges,
  payments,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * Obtém métricas gerais do sistema para o dashboard admin
 */
export async function getAdminDashboardMetrics() {
  const db = await getDb();
  if (!db) return null;
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Total de personais
  const totalPersonalsResult = await db.select({ count: sql<number>`count(*)` }).from(personals);
  const totalPersonals = totalPersonalsResult[0]?.count || 0;
  
  // Personais ativos (assinatura ativa)
  const activePersonalsResult = await db.select({ count: sql<number>`count(*)` })
    .from(personals)
    .where(eq(personals.subscriptionStatus, 'active'));
  const activePersonals = activePersonalsResult[0]?.count || 0;
  
  // Personais em trial
  const trialPersonalsResult = await db.select({ count: sql<number>`count(*)` })
    .from(personals)
    .where(eq(personals.subscriptionStatus, 'trial'));
  const trialPersonals = trialPersonalsResult[0]?.count || 0;
  
  // Personais com acesso de teste
  const testAccessResult = await db.select({ count: sql<number>`count(*)` })
    .from(personals)
    .where(and(
      isNotNull(personals.testAccessEndsAt),
      gt(personals.testAccessEndsAt, now)
    ));
  const testAccessPersonals = testAccessResult[0]?.count || 0;
  
  // Personais cancelados
  const cancelledResult = await db.select({ count: sql<number>`count(*)` })
    .from(personals)
    .where(eq(personals.subscriptionStatus, 'cancelled'));
  const cancelledPersonals = cancelledResult[0]?.count || 0;
  
  // Novos personais nos últimos 30 dias
  const newPersonalsResult = await db.select({ count: sql<number>`count(*)` })
    .from(personals)
    .where(gte(personals.createdAt, thirtyDaysAgo));
  const newPersonals30Days = newPersonalsResult[0]?.count || 0;
  
  // Novos personais nos últimos 7 dias
  const newPersonals7Result = await db.select({ count: sql<number>`count(*)` })
    .from(personals)
    .where(gte(personals.createdAt, sevenDaysAgo));
  const newPersonals7Days = newPersonals7Result[0]?.count || 0;
  
  // Total de alunos no sistema
  const totalStudentsResult = await db.select({ count: sql<number>`count(*)` }).from(students);
  const totalStudents = totalStudentsResult[0]?.count || 0;
  
  // Alunos ativos
  const activeStudentsResult = await db.select({ count: sql<number>`count(*)` })
    .from(students)
    .where(eq(students.status, 'active'));
  const activeStudents = activeStudentsResult[0]?.count || 0;
  
  // Total de sessões realizadas
  const totalSessionsResult = await db.select({ count: sql<number>`count(*)` })
    .from(sessions)
    .where(eq(sessions.status, 'completed'));
  const totalSessions = totalSessionsResult[0]?.count || 0;
  
  // Sessões nos últimos 30 dias
  const sessions30DaysResult = await db.select({ count: sql<number>`count(*)` })
    .from(sessions)
    .where(and(
      eq(sessions.status, 'completed'),
      gte(sessions.scheduledAt, thirtyDaysAgo)
    ));
  const sessions30Days = sessions30DaysResult[0]?.count || 0;
  
  // Total de usuários
  const totalUsersResult = await db.select({ count: sql<number>`count(*)` }).from(users);
  const totalUsers = totalUsersResult[0]?.count || 0;
  
  return {
    personals: {
      total: totalPersonals,
      active: activePersonals,
      trial: trialPersonals,
      testAccess: testAccessPersonals,
      cancelled: cancelledPersonals,
      new30Days: newPersonals30Days,
      new7Days: newPersonals7Days,
    },
    students: {
      total: totalStudents,
      active: activeStudents,
    },
    sessions: {
      total: totalSessions,
      last30Days: sessions30Days,
    },
    users: {
      total: totalUsers,
    },
    calculatedAt: now,
  };
}

/**
 * Obtém dados de crescimento de usuários por dia (últimos N dias)
 */
export async function getGrowthData(days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const result = await db.select({
    date: sql<string>`DATE(${personals.createdAt})`,
    count: sql<number>`count(*)`,
  })
    .from(personals)
    .where(gte(personals.createdAt, startDate))
    .groupBy(sql`DATE(${personals.createdAt})`)
    .orderBy(sql`DATE(${personals.createdAt})`);
  
  return result;
}

/**
 * Obtém top personais por número de alunos
 */
export async function getTopPersonalsByStudents(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    personalId: students.personalId,
    studentCount: sql<number>`count(*)`,
  })
    .from(students)
    .where(eq(students.status, 'active'))
    .groupBy(students.personalId)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
  
  // Buscar detalhes dos personais
  const personalIds = result.map(r => r.personalId);
  if (personalIds.length === 0) return [];
  
  const personalDetails = await db.select({
    id: personals.id,
    businessName: personals.businessName,
    userId: personals.userId,
  })
    .from(personals)
    .where(inArray(personals.id, personalIds));
  
  // Buscar nomes dos usuários
  const userIds = personalDetails.map(p => p.userId).filter(Boolean) as number[];
  const userDetails = userIds.length > 0 
    ? await db.select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(inArray(users.id, userIds))
    : [];
  
  return result.map(r => {
    const personal = personalDetails.find(p => p.id === r.personalId);
    const user = personal?.userId ? userDetails.find(u => u.id === personal.userId) : null;
    return {
      personalId: r.personalId,
      businessName: personal?.businessName || 'Sem nome',
      userName: user?.name || 'Desconhecido',
      userEmail: user?.email || '',
      studentCount: r.studentCount,
    };
  });
}

/**
 * Obtém personais com sessões recentes (mais ativos)
 */
export async function getMostActivePersonals(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const result = await db.select({
    personalId: sessions.personalId,
    sessionCount: sql<number>`count(*)`,
  })
    .from(sessions)
    .where(and(
      gte(sessions.scheduledAt, thirtyDaysAgo),
      eq(sessions.status, 'completed')
    ))
    .groupBy(sessions.personalId)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
  
  // Buscar detalhes dos personais
  const personalIds = result.map(r => r.personalId);
  if (personalIds.length === 0) return [];
  
  const personalDetails = await db.select({
    id: personals.id,
    businessName: personals.businessName,
    userId: personals.userId,
  })
    .from(personals)
    .where(inArray(personals.id, personalIds));
  
  // Buscar nomes dos usuários
  const userIds = personalDetails.map(p => p.userId).filter(Boolean) as number[];
  const userDetails = userIds.length > 0 
    ? await db.select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(inArray(users.id, userIds))
    : [];
  
  return result.map(r => {
    const personal = personalDetails.find(p => p.id === r.personalId);
    const user = personal?.userId ? userDetails.find(u => u.id === personal.userId) : null;
    return {
      personalId: r.personalId,
      businessName: personal?.businessName || 'Sem nome',
      userName: user?.name || 'Desconhecido',
      userEmail: user?.email || '',
      sessionCount: r.sessionCount,
    };
  });
}

/**
 * Obtém distribuição de assinaturas por status
 */
export async function getSubscriptionDistribution() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    status: personals.subscriptionStatus,
    count: sql<number>`count(*)`,
  })
    .from(personals)
    .groupBy(personals.subscriptionStatus);
  
  return result;
}

/**
 * Obtém personais que vão expirar em breve
 */
export async function getExpiringSubscriptions(days: number = 7) {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  const result = await db.select({
    id: personals.id,
    businessName: personals.businessName,
    userId: personals.userId,
    subscriptionStatus: personals.subscriptionStatus,
    subscriptionExpiresAt: personals.subscriptionExpiresAt,
    testAccessEndsAt: personals.testAccessEndsAt,
  })
    .from(personals)
    .where(or(
      and(
        eq(personals.subscriptionStatus, 'active'),
        isNotNull(personals.subscriptionExpiresAt),
        lte(personals.subscriptionExpiresAt, futureDate),
        gte(personals.subscriptionExpiresAt, now)
      ),
      and(
        isNotNull(personals.testAccessEndsAt),
        lte(personals.testAccessEndsAt, futureDate),
        gte(personals.testAccessEndsAt, now)
      )
    ))
    .orderBy(personals.subscriptionExpiresAt);
  
  // Buscar nomes dos usuários
  const userIds = result.map(p => p.userId).filter(Boolean) as number[];
  const userDetails = userIds.length > 0 
    ? await db.select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(inArray(users.id, userIds))
    : [];
  
  return result.map(p => {
    const user = p.userId ? userDetails.find(u => u.id === p.userId) : null;
    return {
      ...p,
      userName: user?.name || 'Desconhecido',
      userEmail: user?.email || '',
    };
  });
}

/**
 * Obtém atividade recente do sistema
 */
export async function getRecentActivity(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  // Buscar últimos personais cadastrados
  const recentPersonals = await db.select({
    id: personals.id,
    businessName: personals.businessName,
    userId: personals.userId,
    createdAt: personals.createdAt,
  })
    .from(personals)
    .orderBy(desc(personals.createdAt))
    .limit(limit);
  
  // Buscar nomes dos usuários
  const userIds = recentPersonals.map(p => p.userId).filter(Boolean) as number[];
  const userDetails = userIds.length > 0 
    ? await db.select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(inArray(users.id, userIds))
    : [];
  
  return recentPersonals.map(p => {
    const user = p.userId ? userDetails.find(u => u.id === p.userId) : null;
    return {
      type: 'new_personal' as const,
      personalId: p.id,
      businessName: p.businessName,
      userName: user?.name || 'Desconhecido',
      userEmail: user?.email || '',
      createdAt: p.createdAt,
    };
  });
}

/**
 * Obtém detalhes completos de um personal para o admin
 */
export async function getPersonalDetailsForAdmin(personalId: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Buscar personal
  const personalResult = await db.select().from(personals).where(eq(personals.id, personalId));
  const personal = personalResult[0];
  if (!personal) return null;
  
  // Buscar usuário
  const user = personal.userId 
    ? (await db.select().from(users).where(eq(users.id, personal.userId)))[0]
    : null;
  
  // Contar alunos
  const studentCountResult = await db.select({ count: sql<number>`count(*)` })
    .from(students)
    .where(and(eq(students.personalId, personalId), eq(students.status, 'active')));
  const studentCount = studentCountResult[0]?.count || 0;
  
  // Contar sessões (últimos 30 dias)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sessionCountResult = await db.select({ count: sql<number>`count(*)` })
    .from(sessions)
    .where(and(
      eq(sessions.personalId, personalId),
      gte(sessions.scheduledAt, thirtyDaysAgo)
    ));
  const sessionCount = sessionCountResult[0]?.count || 0;
  
  // Contar treinos
  const workoutCountResult = await db.select({ count: sql<number>`count(*)` })
    .from(workouts)
    .where(eq(workouts.personalId, personalId));
  const workoutCount = workoutCountResult[0]?.count || 0;
  
  return {
    ...personal,
    userName: user?.name || 'Desconhecido',
    userEmail: user?.email || '',
    userPhone: user?.phone || '',
    stats: {
      studentCount,
      sessionCount,
      workoutCount,
    },
  };
}

/**
 * Obtém dados de receita estimada (baseado em assinaturas ativas)
 */
export async function getRevenueMetrics() {
  const db = await getDb();
  if (!db) return null;
  
  // Contar assinaturas ativas por plano
  const activeSubscriptions = await db.select({ count: sql<number>`count(*)` })
    .from(personals)
    .where(eq(personals.subscriptionStatus, 'active'));
  
  const activeCount = activeSubscriptions[0]?.count || 0;
  
  // Estimativa de receita (R$ 49,90 por assinatura mensal)
  const monthlyPrice = 49.90;
  const estimatedMRR = activeCount * monthlyPrice;
  const estimatedARR = estimatedMRR * 12;
  
  return {
    activeSubscriptions: activeCount,
    estimatedMRR,
    estimatedARR,
    currency: 'BRL',
  };
}

/**
 * Obtém dados para gráfico de conversão trial -> pagante
 */
export async function getConversionData() {
  const db = await getDb();
  if (!db) return null;
  
  // Total que passou pelo trial
  const totalTrialResult = await db.select({ count: sql<number>`count(*)` })
    .from(personals);
  const totalTrial = totalTrialResult[0]?.count || 0;
  
  // Total que converteu para pagante
  const convertedResult = await db.select({ count: sql<number>`count(*)` })
    .from(personals)
    .where(or(
      eq(personals.subscriptionStatus, 'active'),
      eq(personals.subscriptionStatus, 'cancelled') // já foi pagante
    ));
  const converted = convertedResult[0]?.count || 0;
  
  // Em trial ainda
  const inTrialResult = await db.select({ count: sql<number>`count(*)` })
    .from(personals)
    .where(eq(personals.subscriptionStatus, 'trial'));
  const inTrial = inTrialResult[0]?.count || 0;
  
  const conversionRate = totalTrial > 0 ? (converted / totalTrial) * 100 : 0;
  
  return {
    totalTrial,
    converted,
    inTrial,
    conversionRate: Math.round(conversionRate * 100) / 100,
  };
}


/**
 * Obtém lista completa de alunos de um personal com contatos
 */
export async function getPersonalStudentsWithContacts(personalId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    id: students.id,
    name: students.name,
    email: students.email,
    phone: students.phone,
    status: students.status,
    whatsappOptIn: students.whatsappOptIn,
    createdAt: students.createdAt,
  })
    .from(students)
    .where(and(
      eq(students.personalId, personalId),
      isNull(students.deletedAt)
    ))
    .orderBy(desc(students.createdAt));
  
  return result;
}

/**
 * Obtém estatísticas detalhadas de um personal
 */
export async function getPersonalDetailedStats(personalId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  
  // Total de alunos
  const totalStudentsResult = await db.select({ count: sql<number>`count(*)` })
    .from(students)
    .where(and(eq(students.personalId, personalId), isNull(students.deletedAt)));
  const totalStudents = totalStudentsResult[0]?.count || 0;
  
  // Alunos ativos
  const activeStudentsResult = await db.select({ count: sql<number>`count(*)` })
    .from(students)
    .where(and(
      eq(students.personalId, personalId),
      eq(students.status, 'active'),
      isNull(students.deletedAt)
    ));
  const activeStudents = activeStudentsResult[0]?.count || 0;
  
  // Alunos novos (últimos 30 dias)
  const newStudentsResult = await db.select({ count: sql<number>`count(*)` })
    .from(students)
    .where(and(
      eq(students.personalId, personalId),
      gte(students.createdAt, thirtyDaysAgo),
      isNull(students.deletedAt)
    ));
  const newStudents30Days = newStudentsResult[0]?.count || 0;
  
  // Total de sessões
  const totalSessionsResult = await db.select({ count: sql<number>`count(*)` })
    .from(sessions)
    .where(eq(sessions.personalId, personalId));
  const totalSessions = totalSessionsResult[0]?.count || 0;
  
  // Sessões realizadas
  const completedSessionsResult = await db.select({ count: sql<number>`count(*)` })
    .from(sessions)
    .where(and(
      eq(sessions.personalId, personalId),
      eq(sessions.status, 'completed')
    ));
  const completedSessions = completedSessionsResult[0]?.count || 0;
  
  // Sessões nos últimos 30 dias
  const sessions30DaysResult = await db.select({ count: sql<number>`count(*)` })
    .from(sessions)
    .where(and(
      eq(sessions.personalId, personalId),
      gte(sessions.scheduledAt, thirtyDaysAgo)
    ));
  const sessions30Days = sessions30DaysResult[0]?.count || 0;
  
  // Total de treinos
  const totalWorkoutsResult = await db.select({ count: sql<number>`count(*)` })
    .from(workouts)
    .where(eq(workouts.personalId, personalId));
  const totalWorkouts = totalWorkoutsResult[0]?.count || 0;
  
  // Total de cobranças
  const totalChargesResult = await db.select({ count: sql<number>`count(*)` })
    .from(charges)
    .where(eq(charges.personalId, personalId));
  const totalCharges = totalChargesResult[0]?.count || 0;
  
  // Cobranças pagas
  const paidChargesResult = await db.select({ 
    count: sql<number>`count(*)`,
    total: sql<number>`COALESCE(SUM(amount), 0)`,
  })
    .from(charges)
    .where(and(
      eq(charges.personalId, personalId),
      eq(charges.status, 'paid')
    ));
  const paidCharges = paidChargesResult[0]?.count || 0;
  const totalRevenue = paidChargesResult[0]?.total || 0;
  
  // Cobranças pendentes
  const pendingChargesResult = await db.select({ 
    count: sql<number>`count(*)`,
    total: sql<number>`COALESCE(SUM(amount), 0)`,
  })
    .from(charges)
    .where(and(
      eq(charges.personalId, personalId),
      eq(charges.status, 'pending')
    ));
  const pendingCharges = pendingChargesResult[0]?.count || 0;
  const pendingAmount = pendingChargesResult[0]?.total || 0;
  
  // Taxa de presença (sessões realizadas / sessões agendadas nos últimos 90 dias)
  const scheduledSessionsResult = await db.select({ count: sql<number>`count(*)` })
    .from(sessions)
    .where(and(
      eq(sessions.personalId, personalId),
      gte(sessions.scheduledAt, ninetyDaysAgo),
      lte(sessions.scheduledAt, now)
    ));
  const scheduledSessions = scheduledSessionsResult[0]?.count || 0;
  
  const completedInPeriodResult = await db.select({ count: sql<number>`count(*)` })
    .from(sessions)
    .where(and(
      eq(sessions.personalId, personalId),
      eq(sessions.status, 'completed'),
      gte(sessions.scheduledAt, ninetyDaysAgo),
      lte(sessions.scheduledAt, now)
    ));
  const completedInPeriod = completedInPeriodResult[0]?.count || 0;
  
  const attendanceRate = scheduledSessions > 0 
    ? Math.round((completedInPeriod / scheduledSessions) * 100) 
    : 0;
  
  return {
    students: {
      total: totalStudents,
      active: activeStudents,
      new30Days: newStudents30Days,
      inactive: totalStudents - activeStudents,
    },
    sessions: {
      total: totalSessions,
      completed: completedSessions,
      last30Days: sessions30Days,
      attendanceRate,
    },
    workouts: {
      total: totalWorkouts,
    },
    revenue: {
      totalCharges,
      paidCharges,
      pendingCharges,
      totalRevenue: Number(totalRevenue) / 100, // Converter de centavos para reais
      pendingAmount: Number(pendingAmount) / 100,
    },
  };
}

/**
 * Obtém histórico de crescimento de alunos de um personal
 */
export async function getPersonalStudentGrowth(personalId: number, days: number = 90) {
  const db = await getDb();
  if (!db) return [];
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const result = await db.select({
    date: sql<string>`DATE(${students.createdAt})`,
    count: sql<number>`count(*)`,
  })
    .from(students)
    .where(and(
      eq(students.personalId, personalId),
      gte(students.createdAt, startDate),
      isNull(students.deletedAt)
    ))
    .groupBy(sql`DATE(${students.createdAt})`)
    .orderBy(sql`DATE(${students.createdAt})`);
  
  return result;
}

/**
 * Obtém informações de login do personal
 */
export async function getPersonalLoginInfo(personalId: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Buscar personal
  const personalResult = await db.select({
    id: personals.id,
    userId: personals.userId,
    createdAt: personals.createdAt,
  }).from(personals).where(eq(personals.id, personalId));
  
  const personal = personalResult[0];
  if (!personal || !personal.userId) return null;
  
  // Buscar usuário
  const userResult = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    phone: users.phone,
    lastSignedIn: users.lastSignedIn,
    createdAt: users.createdAt,
    loginMethod: users.loginMethod,
  }).from(users).where(eq(users.id, personal.userId));
  
  const user = userResult[0];
  if (!user) return null;
  
  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    lastSignedIn: user.lastSignedIn,
    accountCreatedAt: user.createdAt,
    personalCreatedAt: personal.createdAt,
    loginMethod: user.loginMethod,
  };
}

/**
 * Obtém configurações do personal
 */
export async function getPersonalConfig(personalId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select({
    id: personals.id,
    businessName: personals.businessName,
    cref: personals.cref,
    bio: personals.bio,
    specialties: personals.specialties,
    workingHours: personals.workingHours,
    whatsappNumber: personals.whatsappNumber,
    evolutionApiKey: personals.evolutionApiKey,
    evolutionInstance: personals.evolutionInstance,
    logoUrl: personals.logoUrl,
    subscriptionStatus: personals.subscriptionStatus,
    subscriptionPeriod: personals.subscriptionPeriod,
    subscriptionExpiresAt: personals.subscriptionExpiresAt,
    trialEndsAt: personals.trialEndsAt,
    testAccessEndsAt: personals.testAccessEndsAt,
    testAccessGrantedBy: personals.testAccessGrantedBy,
    testAccessGrantedAt: personals.testAccessGrantedAt,
    createdAt: personals.createdAt,
    updatedAt: personals.updatedAt,
  }).from(personals).where(eq(personals.id, personalId));
  
  return result[0] || null;
}

/**
 * Exporta dados de alunos de um personal para CSV
 */
export async function exportPersonalStudentsData(personalId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    id: students.id,
    name: students.name,
    email: students.email,
    phone: students.phone,
    status: students.status,
    birthDate: students.birthDate,
    gender: students.gender,
    cpf: students.cpf,
    address: students.address,
    emergencyContact: students.emergencyContact,
    emergencyPhone: students.emergencyPhone,
    whatsappOptIn: students.whatsappOptIn,
    createdAt: students.createdAt,
  })
    .from(students)
    .where(and(
      eq(students.personalId, personalId),
      isNull(students.deletedAt)
    ))
    .orderBy(students.name);
  
  return result;
}

/**
 * Exporta todos os personais com seus dados
 */
export async function exportAllPersonalsData() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    id: personals.id,
    businessName: personals.businessName,
    cref: personals.cref,
    whatsappNumber: personals.whatsappNumber,
    subscriptionStatus: personals.subscriptionStatus,
    subscriptionExpiresAt: personals.subscriptionExpiresAt,
    createdAt: personals.createdAt,
    userId: personals.userId,
  }).from(personals).orderBy(personals.createdAt);
  
  // Buscar dados dos usuários
  const userIds = result.map(p => p.userId).filter(Boolean) as number[];
  const userDetails = userIds.length > 0 
    ? await db.select({ 
        id: users.id, 
        name: users.name, 
        email: users.email,
        phone: users.phone,
        lastSignedIn: users.lastSignedIn,
      })
        .from(users)
        .where(inArray(users.id, userIds))
    : [];
  
  // Contar alunos por personal
  const studentCounts = await db.select({
    personalId: students.personalId,
    count: sql<number>`count(*)`,
  })
    .from(students)
    .where(isNull(students.deletedAt))
    .groupBy(students.personalId);
  
  return result.map(p => {
    const user = p.userId ? userDetails.find(u => u.id === p.userId) : null;
    const studentCount = studentCounts.find(s => s.personalId === p.id)?.count || 0;
    return {
      id: p.id,
      name: user?.name || 'Sem nome',
      email: user?.email || '',
      phone: user?.phone || p.whatsappNumber || '',
      businessName: p.businessName || '',
      cref: p.cref || '',
      subscriptionStatus: p.subscriptionStatus,
      subscriptionExpiresAt: p.subscriptionExpiresAt,
      lastSignedIn: user?.lastSignedIn,
      studentCount,
      createdAt: p.createdAt,
    };
  });
}

/**
 * Resetar senha do personal (gera token de recuperação)
 */
export async function generatePasswordResetToken(userId: number) {
  // Por enquanto, apenas retorna informações do usuário
  // A implementação real dependeria do sistema de autenticação
  const db = await getDb();
  if (!db) return null;
  
  const userResult = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
  }).from(users).where(eq(users.id, userId));
  
  return userResult[0] || null;
}

/**
 * Bloquear/desbloquear personal
 */
export async function togglePersonalBlock(personalId: number, blocked: boolean) {
  const db = await getDb();
  if (!db) return false;
  
  // Atualiza o status da assinatura para 'cancelled' se bloqueado
  // ou restaura para 'trial' se desbloqueado
  await db.update(personals)
    .set({ 
      subscriptionStatus: blocked ? 'cancelled' : 'trial',
      updatedAt: new Date(),
    })
    .where(eq(personals.id, personalId));
  
  return true;
}

/**
 * Obtém todos os contatos (emails e WhatsApp) de todos os alunos do sistema
 */
export async function getAllStudentContacts() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    studentId: students.id,
    studentName: students.name,
    studentEmail: students.email,
    studentPhone: students.phone,
    personalId: students.personalId,
    whatsappOptIn: students.whatsappOptIn,
    status: students.status,
  })
    .from(students)
    .where(isNull(students.deletedAt))
    .orderBy(students.name);
  
  // Buscar nomes dos personais
  const personalIds = Array.from(new Set(result.map(s => s.personalId)));
  const personalDetails = personalIds.length > 0
    ? await db.select({
        id: personals.id,
        businessName: personals.businessName,
        userId: personals.userId,
      })
        .from(personals)
        .where(inArray(personals.id, personalIds))
    : [];
  
  const userIds = personalDetails.map(p => p.userId).filter(Boolean) as number[];
  const userDetails = userIds.length > 0
    ? await db.select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.id, userIds))
    : [];
  
  return result.map(s => {
    const personal = personalDetails.find(p => p.id === s.personalId);
    const user = personal?.userId ? userDetails.find(u => u.id === personal.userId) : null;
    return {
      ...s,
      personalName: user?.name || personal?.businessName || 'Desconhecido',
    };
  });
}


/**
 * Obtém dados de crescimento de alunos de um personal ao longo do tempo (por mês)
 */
export async function getPersonalStudentGrowthByMonth(personalId: number, months: number = 6) {
  const db = await getDb();
  if (!db) return [];
  
  const results: { month: string; count: number; newStudents: number }[] = [];
  const now = new Date();
  
  // Gerar dados para cada mês
  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    
    // Contar alunos ativos até o final do mês
    const totalAtMonth = await db.select({ count: sql<number>`count(*)` })
      .from(students)
      .where(and(
        eq(students.personalId, personalId),
        lte(students.createdAt, monthEnd),
        or(
          isNull(students.deletedAt),
          gte(students.deletedAt, monthEnd)
        )
      ));
    
    // Contar novos alunos no mês
    const newInMonth = await db.select({ count: sql<number>`count(*)` })
      .from(students)
      .where(and(
        eq(students.personalId, personalId),
        gte(students.createdAt, monthStart),
        lte(students.createdAt, monthEnd)
      ));
    
    const monthName = monthStart.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    
    results.push({
      month: monthName,
      count: totalAtMonth[0]?.count || 0,
      newStudents: newInMonth[0]?.count || 0,
    });
  }
  
  return results;
}

/**
 * Obtém dados de crescimento de todos os personais para comparação
 */
export async function getAllPersonalsGrowthComparison(months: number = 6) {
  const db = await getDb();
  if (!db) return [];
  
  // Buscar todos os personais
  const allPersonals = await db.select({
    id: personals.id,
    businessName: personals.businessName,
    userId: personals.userId,
  }).from(personals);
  
  // Buscar nomes dos usuários
  const userIds = allPersonals.map(p => p.userId).filter(Boolean) as number[];
  const userDetails = userIds.length > 0 
    ? await db.select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.id, userIds))
    : [];
  
  const results = [];
  
  for (const personal of allPersonals) {
    const user = personal.userId ? userDetails.find(u => u.id === personal.userId) : null;
    const growthData = await getPersonalStudentGrowthByMonth(personal.id, months);
    
    // Calcular crescimento total
    const firstMonth = growthData[0]?.count || 0;
    const lastMonth = growthData[growthData.length - 1]?.count || 0;
    const growth = lastMonth - firstMonth;
    const growthPercent = firstMonth > 0 ? ((growth / firstMonth) * 100).toFixed(1) : '0';
    
    results.push({
      personalId: personal.id,
      name: user?.name || 'Desconhecido',
      businessName: personal.businessName || '',
      currentStudents: lastMonth,
      growth,
      growthPercent: parseFloat(growthPercent),
      monthlyData: growthData,
    });
  }
  
  // Ordenar por crescimento
  return results.sort((a, b) => b.growth - a.growth);
}
