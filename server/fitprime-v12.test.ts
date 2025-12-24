import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock do banco de dados
vi.mock("./db", () => ({
  getPersonalByUserId: vi.fn(),
  getPlansByPersonalId: vi.fn(),
  getPlanById: vi.fn(),
  createPlan: vi.fn(),
  getStudentById: vi.fn(),
  getSessionsByStudentId: vi.fn(),
  createCharge: vi.fn(),
}));

import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
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

describe("Plans Router - v1.2 Features", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should list plans for a personal trainer", async () => {
    const mockPlans = [
      {
        id: 1,
        personalId: 1,
        name: "Mensal 2x/semana",
        description: "Plano mensal com 2 sessões por semana",
        type: "recurring",
        price: "800.00",
        billingCycle: "monthly",
        sessionsPerWeek: 2,
        sessionDuration: 60,
        billingDay: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(db.getPersonalByUserId).mockResolvedValue({
      id: 1,
      userId: 1,
      name: "Test Personal",
      email: "personal@test.com",
      phone: null,
      cpf: null,
      cref: null,
      specialties: null,
      bio: null,
      avatarUrl: null,
      businessName: null,
      businessAddress: null,
      workingHours: null,
      evolutionApiUrl: null,
      evolutionApiKey: null,
      evolutionInstance: null,
      whatsappNumber: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.getPlansByPersonalId).mockResolvedValue(mockPlans);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.plans.list();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Mensal 2x/semana");
    expect(result[0].sessionsPerWeek).toBe(2);
  });

  it("should create a plan with all billing cycles", async () => {
    vi.mocked(db.getPersonalByUserId).mockResolvedValue({
      id: 1,
      userId: 1,
      name: "Test Personal",
      email: "personal@test.com",
      phone: null,
      cpf: null,
      cref: null,
      specialties: null,
      bio: null,
      avatarUrl: null,
      businessName: null,
      businessAddress: null,
      workingHours: null,
      evolutionApiUrl: null,
      evolutionApiKey: null,
      evolutionInstance: null,
      whatsappNumber: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.createPlan).mockResolvedValue(1);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test creating plans with different billing cycles
    const billingCycles = ["weekly", "biweekly", "monthly", "quarterly", "semiannual", "annual"] as const;

    for (const cycle of billingCycles) {
      const result = await caller.plans.create({
        name: `Plano ${cycle}`,
        type: "recurring",
        price: "500.00",
        billingCycle: cycle,
        sessionsPerWeek: 2,
        sessionDuration: 60,
        billingDay: 10,
      });

      expect(result.id).toBe(1);
    }

    expect(db.createPlan).toHaveBeenCalledTimes(6);
  });
});

describe("Sessions Router - Student Stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return student attendance statistics", async () => {
    const now = new Date();
    const mockSessions = [
      { id: 1, studentId: 1, status: "completed", scheduledAt: now },
      { id: 2, studentId: 1, status: "completed", scheduledAt: now },
      { id: 3, studentId: 1, status: "no_show", scheduledAt: now },
      { id: 4, studentId: 1, status: "cancelled", scheduledAt: now },
    ];

    vi.mocked(db.getPersonalByUserId).mockResolvedValue({
      id: 1,
      userId: 1,
      name: "Test Personal",
      email: "personal@test.com",
      phone: null,
      cpf: null,
      cref: null,
      specialties: null,
      bio: null,
      avatarUrl: null,
      businessName: null,
      businessAddress: null,
      workingHours: null,
      evolutionApiUrl: null,
      evolutionApiKey: null,
      evolutionInstance: null,
      whatsappNumber: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.getSessionsByStudentId).mockResolvedValue(mockSessions as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.sessions.studentStats({ studentId: 1 });

    expect(result.total).toBe(4);
    expect(result.completed).toBe(2);
    expect(result.noShow).toBe(1);
    expect(result.cancelled).toBe(1);
    expect(result.attendanceRate).toBe(50); // 2/4 = 50%
    expect(result.monthlyData).toBeDefined();
    expect(result.monthlyData.length).toBe(6); // Last 6 months
  });
});

describe("Charges Router - Generate From Package", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate automatic charges for monthly plan", async () => {
    const mockPlan = {
      id: 1,
      personalId: 1,
      name: "Mensal 2x/semana",
      type: "recurring",
      price: "800.00",
      billingCycle: "monthly",
      sessionsPerWeek: 2,
      sessionDuration: 60,
      billingDay: 5,
      isActive: true,
    };

    const mockStudent = {
      id: 1,
      personalId: 1,
      name: "Test Student",
      email: "student@test.com",
    };

    vi.mocked(db.getPersonalByUserId).mockResolvedValue({
      id: 1,
      userId: 1,
      name: "Test Personal",
      email: "personal@test.com",
      phone: null,
      cpf: null,
      cref: null,
      specialties: null,
      bio: null,
      avatarUrl: null,
      businessName: null,
      businessAddress: null,
      workingHours: null,
      evolutionApiUrl: null,
      evolutionApiKey: null,
      evolutionInstance: null,
      whatsappNumber: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.getPlanById).mockResolvedValue(mockPlan as any);
    vi.mocked(db.getStudentById).mockResolvedValue(mockStudent as any);
    vi.mocked(db.createCharge).mockResolvedValue(1);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.charges.generateFromPackage({
      studentId: 1,
      planId: 1,
      startDate: "2025-01-01",
      billingDay: 5,
    });

    expect(result.success).toBe(true);
    expect(result.chargesCreated).toBe(12); // Monthly = 12 charges
    expect(db.createCharge).toHaveBeenCalledTimes(12);
  });

  it("should generate automatic charges for quarterly plan", async () => {
    const mockPlan = {
      id: 2,
      personalId: 1,
      name: "Trimestral",
      type: "recurring",
      price: "2200.00",
      billingCycle: "quarterly",
      sessionsPerWeek: 3,
      sessionDuration: 60,
      billingDay: 10,
      isActive: true,
    };

    const mockStudent = {
      id: 1,
      personalId: 1,
      name: "Test Student",
      email: "student@test.com",
    };

    vi.mocked(db.getPersonalByUserId).mockResolvedValue({
      id: 1,
      userId: 1,
      name: "Test Personal",
      email: "personal@test.com",
      phone: null,
      cpf: null,
      cref: null,
      specialties: null,
      bio: null,
      avatarUrl: null,
      businessName: null,
      businessAddress: null,
      workingHours: null,
      evolutionApiUrl: null,
      evolutionApiKey: null,
      evolutionInstance: null,
      whatsappNumber: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.getPlanById).mockResolvedValue(mockPlan as any);
    vi.mocked(db.getStudentById).mockResolvedValue(mockStudent as any);
    vi.mocked(db.createCharge).mockResolvedValue(1);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.charges.generateFromPackage({
      studentId: 1,
      planId: 2,
      startDate: "2025-01-01",
      billingDay: 10,
    });

    expect(result.success).toBe(true);
    expect(result.chargesCreated).toBe(4); // Quarterly = 4 charges
    expect(db.createCharge).toHaveBeenCalledTimes(4);
  });
});
