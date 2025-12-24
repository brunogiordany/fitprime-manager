import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({}),
  getPersonalByUserId: vi.fn(),
  createPersonal: vi.fn(),
  updatePersonal: vi.fn(),
  getStudentsByPersonalId: vi.fn(),
  getStudentById: vi.fn(),
  createStudent: vi.fn(),
  updateStudent: vi.fn(),
  deleteStudent: vi.fn(),
  countStudentsByPersonalId: vi.fn(),
  getMonthlyRevenue: vi.fn(),
  countSessionsThisMonth: vi.fn(),
  getPendingChargesCount: vi.fn(),
  getTodaySessions: vi.fn(),
  getAnamnesisByStudentId: vi.fn(),
  createAnamnesis: vi.fn(),
  updateAnamnesis: vi.fn(),
  createAnamnesisHistory: vi.fn(),
  getAnamnesisHistory: vi.fn(),
  getMeasurementsByStudentId: vi.fn(),
  createMeasurement: vi.fn(),
  getPhotosByStudentId: vi.fn(),
  createPhoto: vi.fn(),
  deletePhoto: vi.fn(),
  getWorkoutsByStudentId: vi.fn(),
  createWorkout: vi.fn(),
  updateWorkout: vi.fn(),
  deleteWorkout: vi.fn(),
  getWorkoutDaysByWorkoutId: vi.fn(),
  createWorkoutDay: vi.fn(),
  updateWorkoutDay: vi.fn(),
  deleteWorkoutDay: vi.fn(),
  getExercisesByWorkoutDayId: vi.fn(),
  createExercise: vi.fn(),
  updateExercise: vi.fn(),
  deleteExercise: vi.fn(),
  getSessionsByPersonalId: vi.fn(),
  getSessionsByStudentId: vi.fn(),
  createSession: vi.fn(),
  updateSession: vi.fn(),
  deleteSession: vi.fn(),
  getPlansByPersonalId: vi.fn(),
  getPlanById: vi.fn(),
  createPlan: vi.fn(),
  updatePlan: vi.fn(),
  deletePlan: vi.fn(),
  getPackagesByStudentId: vi.fn(),
  createPackage: vi.fn(),
  updatePackage: vi.fn(),
  getChargesByPersonalId: vi.fn(),
  getChargesByStudentId: vi.fn(),
  createCharge: vi.fn(),
  updateCharge: vi.fn(),
  getMaterialsByStudentId: vi.fn(),
  createMaterial: vi.fn(),
  deleteMaterial: vi.fn(),
  getAutomationsByPersonalId: vi.fn(),
  createAutomation: vi.fn(),
  updateAutomation: vi.fn(),
  deleteAutomation: vi.fn(),
  getMessageQueueByPersonalId: vi.fn(),
  getMessageLogByPersonalId: vi.fn(),
  createMessageQueue: vi.fn(),
  getStudentByUserId: vi.fn(),
}));

import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

interface Personal {
  id: number;
  userId: number;
  businessName: string | null;
  cref: string | null;
  bio: string | null;
  specialties: string | null;
  workingHours: string | null;
  whatsappNumber: string | null;
  evolutionApiKey: string | null;
  evolutionInstance: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function createMockContext(options?: { personal?: Personal }): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const personal: Personal = options?.personal || {
    id: 1,
    userId: 1,
    businessName: "Test Personal",
    cref: "123456-G/SP",
    bio: "Test bio",
    specialties: "Musculação",
    workingHours: "Seg-Sex 6h-22h",
    whatsappNumber: "11999999999",
    evolutionApiKey: null,
    evolutionInstance: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("FitPrime Manager - Auth", () => {
  it("returns current user from auth.me", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeDefined();
    expect(result?.email).toBe("test@example.com");
    expect(result?.name).toBe("Test User");
  });

  it("logs out user and clears cookie", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(ctx.res.clearCookie).toHaveBeenCalled();
  });
});

describe("FitPrime Manager - Personal Profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gets personal profile", async () => {
    const mockPersonal: Personal = {
      id: 1,
      userId: 1,
      businessName: "João Personal",
      cref: "123456-G/SP",
      bio: "Personal trainer especializado",
      specialties: "Musculação, Funcional",
      workingHours: "Seg-Sex 6h-22h",
      whatsappNumber: "11999999999",
      evolutionApiKey: null,
      evolutionInstance: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.getPersonalByUserId).mockResolvedValue(mockPersonal);

    const ctx = createMockContext({ personal: mockPersonal });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.personal.get();

    expect(result).toBeDefined();
  });

  it("updates personal profile", async () => {
    const mockPersonal: Personal = {
      id: 1,
      userId: 1,
      businessName: "João Personal",
      cref: "123456-G/SP",
      bio: "Personal trainer",
      specialties: "Musculação",
      workingHours: "Seg-Sex 6h-22h",
      whatsappNumber: "11999999999",
      evolutionApiKey: null,
      evolutionInstance: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.getPersonalByUserId).mockResolvedValue(mockPersonal);
    vi.mocked(db.updatePersonal).mockResolvedValue(undefined);

    const ctx = createMockContext({ personal: mockPersonal });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.personal.update({
      businessName: "João Personal Trainer",
      bio: "Especialista em hipertrofia",
    });

    expect(result).toEqual({ success: true });
  });
});

describe("FitPrime Manager - Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns dashboard stats", async () => {
    const mockPersonal: Personal = {
      id: 1,
      userId: 1,
      businessName: "Test Personal",
      cref: null,
      bio: null,
      specialties: null,
      workingHours: null,
      whatsappNumber: null,
      evolutionApiKey: null,
      evolutionInstance: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.getPersonalByUserId).mockResolvedValue(mockPersonal);
    vi.mocked(db.countStudentsByPersonalId).mockResolvedValue(10);
    vi.mocked(db.getMonthlyRevenue).mockResolvedValue(5000);
    vi.mocked(db.countSessionsThisMonth).mockResolvedValue({ total: 20, completed: 18, noShow: 2 });
    vi.mocked(db.getPendingChargesCount).mockResolvedValue(3);

    const ctx = createMockContext({ personal: mockPersonal });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.stats();

    expect(result).toBeDefined();
    expect(result.totalStudents).toBe(10);
    expect(result.monthlyRevenue).toBe(5000);
    expect(result.sessionsThisMonth).toBe(20);
    expect(result.attendanceRate).toBe(90);
    expect(result.pendingCharges).toBe(3);
  });

  it("returns today sessions", async () => {
    const mockPersonal: Personal = {
      id: 1,
      userId: 1,
      businessName: "Test Personal",
      cref: null,
      bio: null,
      specialties: null,
      workingHours: null,
      whatsappNumber: null,
      evolutionApiKey: null,
      evolutionInstance: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockSessions = [
      {
        session: {
          id: 1,
          studentId: 1,
          personalId: 1,
          scheduledAt: new Date(),
          status: "scheduled" as const,
          duration: 60,
        },
        student: {
          id: 1,
          name: "Maria Silva",
        },
      },
    ];

    vi.mocked(db.getPersonalByUserId).mockResolvedValue(mockPersonal);
    vi.mocked(db.getTodaySessions).mockResolvedValue(mockSessions);

    const ctx = createMockContext({ personal: mockPersonal });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.todaySessions();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("FitPrime Manager - Students", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists students", async () => {
    const mockPersonal: Personal = {
      id: 1,
      userId: 1,
      businessName: "Test Personal",
      cref: null,
      bio: null,
      specialties: null,
      workingHours: null,
      whatsappNumber: null,
      evolutionApiKey: null,
      evolutionInstance: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockStudents = [
      {
        id: 1,
        personalId: 1,
        name: "Maria Silva",
        email: "maria@example.com",
        phone: "11999999999",
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        personalId: 1,
        name: "João Santos",
        email: "joao@example.com",
        phone: "11888888888",
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(db.getPersonalByUserId).mockResolvedValue(mockPersonal);
    vi.mocked(db.getStudentsByPersonalId).mockResolvedValue(mockStudents);

    const ctx = createMockContext({ personal: mockPersonal });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.students.list({});

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates a new student", async () => {
    const mockPersonal: Personal = {
      id: 1,
      userId: 1,
      businessName: "Test Personal",
      cref: null,
      bio: null,
      specialties: null,
      workingHours: null,
      whatsappNumber: null,
      evolutionApiKey: null,
      evolutionInstance: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.getPersonalByUserId).mockResolvedValue(mockPersonal);
    vi.mocked(db.createStudent).mockResolvedValue(1);

    const ctx = createMockContext({ personal: mockPersonal });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.students.create({
      name: "Novo Aluno",
      email: "novo@example.com",
      phone: "11777777777",
    });

    expect(result).toEqual({ id: 1 });
    expect(db.createStudent).toHaveBeenCalled();
  });

  it("updates a student", async () => {
    const mockPersonal: Personal = {
      id: 1,
      userId: 1,
      businessName: "Test Personal",
      cref: null,
      bio: null,
      specialties: null,
      workingHours: null,
      whatsappNumber: null,
      evolutionApiKey: null,
      evolutionInstance: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.getPersonalByUserId).mockResolvedValue(mockPersonal);
    vi.mocked(db.updateStudent).mockResolvedValue(undefined);

    const ctx = createMockContext({ personal: mockPersonal });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.students.update({
      id: 1,
      name: "Aluno Atualizado",
      status: "active",
    });

    expect(result).toEqual({ success: true });
    expect(db.updateStudent).toHaveBeenCalled();
  });
});

describe("FitPrime Manager - Plans", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists plans", async () => {
    const mockPersonal: Personal = {
      id: 1,
      userId: 1,
      businessName: "Test Personal",
      cref: null,
      bio: null,
      specialties: null,
      workingHours: null,
      whatsappNumber: null,
      evolutionApiKey: null,
      evolutionInstance: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockPlans = [
      {
        id: 1,
        personalId: 1,
        name: "Plano Mensal",
        type: "recurring" as const,
        billingCycle: "monthly" as const,
        price: "500.00",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(db.getPersonalByUserId).mockResolvedValue(mockPersonal);
    vi.mocked(db.getPlansByPersonalId).mockResolvedValue(mockPlans);

    const ctx = createMockContext({ personal: mockPersonal });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.plans.list();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates a new plan", async () => {
    const mockPersonal: Personal = {
      id: 1,
      userId: 1,
      businessName: "Test Personal",
      cref: null,
      bio: null,
      specialties: null,
      workingHours: null,
      whatsappNumber: null,
      evolutionApiKey: null,
      evolutionInstance: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.getPersonalByUserId).mockResolvedValue(mockPersonal);
    vi.mocked(db.createPlan).mockResolvedValue(1);

    const ctx = createMockContext({ personal: mockPersonal });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.plans.create({
      name: "Plano Premium",
      type: "recurring",
      billingCycle: "monthly",
      price: "800.00",
      sessionsPerWeek: 3,
      sessionDuration: 60,
    });

    expect(result).toEqual({ id: 1 });
    expect(db.createPlan).toHaveBeenCalled();
  });
});

describe("FitPrime Manager - Automations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists automations", async () => {
    const mockPersonal: Personal = {
      id: 1,
      userId: 1,
      businessName: "Test Personal",
      cref: null,
      bio: null,
      specialties: null,
      workingHours: null,
      whatsappNumber: null,
      evolutionApiKey: null,
      evolutionInstance: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockAutomations = [
      {
        id: 1,
        personalId: 1,
        name: "Lembrete de Sessão",
        trigger: "session_reminder" as const,
        messageTemplate: "Olá {nome}, lembrete da sua sessão amanhã às {hora}",
        isActive: true,
        triggerHoursBefore: 24,
        sendWindowStart: "08:00",
        sendWindowEnd: "20:00",
        maxMessagesPerDay: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(db.getPersonalByUserId).mockResolvedValue(mockPersonal);
    vi.mocked(db.getAutomationsByPersonalId).mockResolvedValue(mockAutomations);

    const ctx = createMockContext({ personal: mockPersonal });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.automations.list();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates a new automation", async () => {
    const mockPersonal: Personal = {
      id: 1,
      userId: 1,
      businessName: "Test Personal",
      cref: null,
      bio: null,
      specialties: null,
      workingHours: null,
      whatsappNumber: null,
      evolutionApiKey: null,
      evolutionInstance: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.getPersonalByUserId).mockResolvedValue(mockPersonal);
    vi.mocked(db.createAutomation).mockResolvedValue(1);

    const ctx = createMockContext({ personal: mockPersonal });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.automations.create({
      name: "Lembrete de Pagamento",
      trigger: "payment_reminder",
      messageTemplate: "Olá {nome}, sua mensalidade vence em {vencimento}",
      triggerHoursBefore: 48,
      sendWindowStart: "09:00",
      sendWindowEnd: "18:00",
      maxMessagesPerDay: 3,
    });

    expect(result).toEqual({ id: 1 });
    expect(db.createAutomation).toHaveBeenCalled();
  });
});

describe("FitPrime Manager - Security", () => {
  it("requires authentication for protected routes", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: vi.fn(),
      } as unknown as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    // Protected routes should throw UNAUTHORIZED error
    await expect(caller.personal.get()).rejects.toThrow();
    await expect(caller.dashboard.stats()).rejects.toThrow();
    await expect(caller.students.list({})).rejects.toThrow();
  });

  it("allows public routes without authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: vi.fn(),
      } as unknown as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    // Public routes should work without auth
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});
