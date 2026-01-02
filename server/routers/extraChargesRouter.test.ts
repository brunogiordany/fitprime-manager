import { describe, it, expect, beforeEach, vi } from "vitest";
import * as db from "../db";
import { extraChargesRouter } from "./extraChargesRouter";
import { TRPCError } from "@trpc/server";

// Mock do db
vi.mock("../db", () => ({
  getPersonalByUserId: vi.fn(),
  getPersonalSubscription: vi.fn(),
  getActiveStudentsCount: vi.fn(),
  updatePersonalSubscriptionExtra: vi.fn(),
  logSubscriptionUsage: vi.fn(),
  getSubscriptionUsageLogs: vi.fn(),
}));

describe("Extra Charges Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calculate", () => {
    it("deve calcular sem alunos excedentes", async () => {
      const mockPersonal = { id: 1, userId: 1 };
      const mockSubscription = {
        id: 1,
        personalId: 1,
        planId: "fitprime_br_starter",
        planName: "Starter",
        studentLimit: 15,
        currentStudents: 10,
        extraStudents: 0,
        planPrice: 97,
        extraStudentPrice: 6.47,
        currency: "BRL",
        status: "active",
        accumulatedExtraCharge: 0,
        accumulatedExtraStudents: 0,
      };

      vi.mocked(db.getPersonalByUserId).mockResolvedValue(mockPersonal as any);
      vi.mocked(db.getPersonalSubscription).mockResolvedValue(mockSubscription as any);
      vi.mocked(db.getActiveStudentsCount).mockResolvedValue(10);

      const caller = extraChargesRouter.createCaller({ user: { id: 1 } } as any);
      const result = await caller.calculate();

      expect(result.currentStudents).toBe(10);
      expect(result.studentLimit).toBe(15);
      expect(result.extraStudents).toBe(0);
      expect(result.totalExtraCharge).toBe(0);
    });

    it("deve calcular com alunos excedentes", async () => {
      const mockPersonal = { id: 1, userId: 1 };
      const mockSubscription = {
        id: 1,
        personalId: 1,
        planId: "fitprime_br_starter",
        planName: "Starter",
        studentLimit: 15,
        currentStudents: 20,
        extraStudents: 5,
        planPrice: 97,
        extraStudentPrice: 6.47,
        currency: "BRL",
        status: "active",
        accumulatedExtraCharge: 0,
        accumulatedExtraStudents: 0,
      };

      vi.mocked(db.getPersonalByUserId).mockResolvedValue(mockPersonal as any);
      vi.mocked(db.getPersonalSubscription).mockResolvedValue(mockSubscription as any);
      vi.mocked(db.getActiveStudentsCount).mockResolvedValue(20);

      const caller = extraChargesRouter.createCaller({ user: { id: 1 } } as any);
      const result = await caller.calculate();

      expect(result.currentStudents).toBe(20);
      expect(result.studentLimit).toBe(15);
      expect(result.extraStudents).toBe(5);
      expect(result.totalExtraCharge).toBeCloseTo(32.35, 2);
    });

    it("deve lançar erro se personal não encontrado", async () => {
      vi.mocked(db.getPersonalByUserId).mockResolvedValue(null);

      const caller = extraChargesRouter.createCaller({ user: { id: 1 } } as any);

      await expect(caller.calculate()).rejects.toThrow(TRPCError);
    });

    it("deve lançar erro se subscription não encontrada", async () => {
      const mockPersonal = { id: 1, userId: 1 };

      vi.mocked(db.getPersonalByUserId).mockResolvedValue(mockPersonal as any);
      vi.mocked(db.getPersonalSubscription).mockResolvedValue(null);

      const caller = extraChargesRouter.createCaller({ user: { id: 1 } } as any);

      await expect(caller.calculate()).rejects.toThrow(TRPCError);
    });
  });

  describe("getReport", () => {
    it("deve gerar relatório sem excedentes", async () => {
      const mockPersonal = { id: 1, userId: 1 };
      const mockSubscription = {
        id: 1,
        personalId: 1,
        planId: "fitprime_br_starter",
        planName: "Starter",
        studentLimit: 15,
        planPrice: 97,
        extraStudentPrice: 6.47,
        currency: "BRL",
        status: "active",
        accumulatedExtraCharge: 0,
        accumulatedExtraStudents: 0,
      };

      vi.mocked(db.getPersonalByUserId).mockResolvedValue(mockPersonal as any);
      vi.mocked(db.getPersonalSubscription).mockResolvedValue(mockSubscription as any);
      vi.mocked(db.getActiveStudentsCount).mockResolvedValue(10);

      const caller = extraChargesRouter.createCaller({ user: { id: 1 } } as any);
      const result = await caller.getReport();

      expect(result.summary).toContain("✅");
      expect(result.summary).toContain("10/15");
      expect(result.shouldRecommendUpgrade).toBe(false);
    });

    it("deve recomendar upgrade com muitos excedentes", async () => {
      const mockPersonal = { id: 1, userId: 1 };
      const mockSubscription = {
        id: 1,
        personalId: 1,
        planId: "fitprime_br_starter",
        planName: "Starter",
        studentLimit: 15,
        planPrice: 97,
        extraStudentPrice: 6.47,
        currency: "BRL",
        status: "active",
        accumulatedExtraCharge: 0,
        accumulatedExtraStudents: 0,
      };

      vi.mocked(db.getPersonalByUserId).mockResolvedValue(mockPersonal as any);
      vi.mocked(db.getPersonalSubscription).mockResolvedValue(mockSubscription as any);
      vi.mocked(db.getActiveStudentsCount).mockResolvedValue(18);

      const caller = extraChargesRouter.createCaller({ user: { id: 1 } } as any);
      const result = await caller.getReport();

      expect(result.shouldRecommendUpgrade).toBe(true);
      expect(result.upgradeSuggestion).not.toBeNull();
      expect(result.upgradeSuggestion?.nextPlanName).toBe("Pro");
    });
  });

  describe("updateAccumulation", () => {
    it("deve atualizar acúmulo", async () => {
      const mockPersonal = { id: 1, userId: 1 };
      const mockSubscription = {
        id: 1,
        personalId: 1,
        planId: "fitprime_br_starter",
        currency: "BRL",
      };

      vi.mocked(db.getPersonalByUserId).mockResolvedValue(mockPersonal as any);
      vi.mocked(db.getPersonalSubscription).mockResolvedValue(mockSubscription as any);
      vi.mocked(db.updatePersonalSubscriptionExtra).mockResolvedValue(undefined);
      vi.mocked(db.logSubscriptionUsage).mockResolvedValue(undefined);

      const caller = extraChargesRouter.createCaller({ user: { id: 1 } } as any);
      const result = await caller.updateAccumulation({
        extraCharge: 32.35,
        extraStudents: 5,
      });

      expect(result.success).toBe(true);
      expect(db.updatePersonalSubscriptionExtra).toHaveBeenCalled();
      expect(db.logSubscriptionUsage).toHaveBeenCalled();
    });
  });

  describe("resetAccumulation", () => {
    it("deve resetar acúmulo", async () => {
      const mockPersonal = { id: 1, userId: 1 };
      const mockSubscription = {
        id: 1,
        personalId: 1,
        planId: "fitprime_br_starter",
        currency: "BRL",
      };

      vi.mocked(db.getPersonalByUserId).mockResolvedValue(mockPersonal as any);
      vi.mocked(db.getPersonalSubscription).mockResolvedValue(mockSubscription as any);
      vi.mocked(db.updatePersonalSubscriptionExtra).mockResolvedValue(undefined);
      vi.mocked(db.logSubscriptionUsage).mockResolvedValue(undefined);

      const caller = extraChargesRouter.createCaller({ user: { id: 1 } } as any);
      const result = await caller.resetAccumulation();

      expect(result.success).toBe(true);
      expect(db.updatePersonalSubscriptionExtra).toHaveBeenCalledWith(1, {
        accumulatedExtraCharge: 0,
        accumulatedExtraStudents: 0,
        lastAccumulationReset: expect.any(Date),
      });
    });
  });

  describe("getHistory", () => {
    it("deve retornar histórico de cobranças", async () => {
      const mockPersonal = { id: 1, userId: 1 };
      const mockLogs = [
        {
          id: 1,
          createdAt: new Date(),
          eventType: "extra_charged",
          chargeAmount: 32.35,
          newValue: 5,
          details: JSON.stringify({ accumulatedCharge: 32.35 }),
        },
      ];

      vi.mocked(db.getPersonalByUserId).mockResolvedValue(mockPersonal as any);
      vi.mocked(db.getSubscriptionUsageLogs).mockResolvedValue(mockLogs as any);

      const caller = extraChargesRouter.createCaller({ user: { id: 1 } } as any);
      const result = await caller.getHistory({ limit: 50 });

      expect(result).toHaveLength(1);
      expect(result[0].chargeAmount).toBe(32.35);
      expect(result[0].extraStudents).toBe(5);
    });
  });
});
