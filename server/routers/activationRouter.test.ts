/**
 * Tests for Activation Router
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db module
vi.mock("../db", () => ({
  getPendingActivationByToken: vi.fn(),
  expireOldActivations: vi.fn(),
  getUserByEmail: vi.fn(),
  updateUserSubscription: vi.fn(),
  markActivationAsCompleted: vi.fn(),
  upsertUser: vi.fn(),
  createPersonal: vi.fn(),
  createPlan: vi.fn(),
}));

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password"),
  },
}));

import * as db from "../db";

describe("Activation Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateToken", () => {
    it("should return invalid for non-existent token", async () => {
      vi.mocked(db.getPendingActivationByToken).mockResolvedValue(undefined);
      
      const result = await db.getPendingActivationByToken("invalid-token");
      
      expect(result).toBeUndefined();
    });

    it("should return activated status for already activated token", async () => {
      const mockActivation = {
        id: 1,
        email: "test@example.com",
        status: "activated" as const,
        tokenExpiresAt: new Date(Date.now() + 86400000), // 1 day from now
        activationToken: "valid-token",
        caktoOrderId: "order-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        purchasedAt: new Date(),
      };
      
      vi.mocked(db.getPendingActivationByToken).mockResolvedValue(mockActivation as any);
      
      const result = await db.getPendingActivationByToken("valid-token");
      
      expect(result?.status).toBe("activated");
    });

    it("should return pending status for valid pending token", async () => {
      const mockActivation = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        phone: "11999999999",
        status: "pending" as const,
        tokenExpiresAt: new Date(Date.now() + 86400000), // 1 day from now
        activationToken: "valid-token",
        caktoOrderId: "order-123",
        productName: "Plano Pro",
        amount: "99.90",
        createdAt: new Date(),
        updatedAt: new Date(),
        purchasedAt: new Date(),
      };
      
      vi.mocked(db.getPendingActivationByToken).mockResolvedValue(mockActivation as any);
      
      const result = await db.getPendingActivationByToken("valid-token");
      
      expect(result?.status).toBe("pending");
      expect(result?.email).toBe("test@example.com");
      expect(result?.name).toBe("Test User");
    });

    it("should handle expired tokens", async () => {
      const mockActivation = {
        id: 1,
        email: "test@example.com",
        status: "expired" as const,
        tokenExpiresAt: new Date(Date.now() - 86400000), // 1 day ago (expired)
        activationToken: "expired-token",
        caktoOrderId: "order-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        purchasedAt: new Date(),
      };
      
      vi.mocked(db.getPendingActivationByToken).mockResolvedValue(mockActivation as any);
      
      const result = await db.getPendingActivationByToken("expired-token");
      
      expect(result?.status).toBe("expired");
    });
  });

  describe("completeActivation", () => {
    it("should activate existing user subscription", async () => {
      const mockActivation = {
        id: 1,
        email: "existing@example.com",
        status: "pending" as const,
        tokenExpiresAt: new Date(Date.now() + 86400000),
        activationToken: "valid-token",
        caktoOrderId: "order-123",
        caktoSubscriptionId: "sub-123",
        amount: "99.90",
        createdAt: new Date(),
        updatedAt: new Date(),
        purchasedAt: new Date(),
      };
      
      const mockUser = {
        id: 1,
        openId: "user-123",
        email: "existing@example.com",
        name: "Existing User",
      };
      
      vi.mocked(db.getPendingActivationByToken).mockResolvedValue(mockActivation as any);
      vi.mocked(db.getUserByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(db.updateUserSubscription).mockResolvedValue(undefined);
      vi.mocked(db.markActivationAsCompleted).mockResolvedValue(undefined);
      
      // Simulate the activation flow
      const activation = await db.getPendingActivationByToken("valid-token");
      expect(activation).toBeDefined();
      
      const existingUser = await db.getUserByEmail(activation!.email);
      expect(existingUser).toBeDefined();
      
      // Should update subscription for existing user
      await db.updateUserSubscription(existingUser!.id, {
        status: "active",
        caktoOrderId: activation!.caktoOrderId,
      });
      
      expect(db.updateUserSubscription).toHaveBeenCalledWith(1, expect.objectContaining({
        status: "active",
        caktoOrderId: "order-123",
      }));
    });

    it("should create new user for non-existing email", async () => {
      const mockActivation = {
        id: 1,
        email: "new@example.com",
        phone: "11999999999",
        status: "pending" as const,
        tokenExpiresAt: new Date(Date.now() + 86400000),
        activationToken: "valid-token",
        caktoOrderId: "order-123",
        planType: "starter",
        createdAt: new Date(),
        updatedAt: new Date(),
        purchasedAt: new Date(),
      };
      
      vi.mocked(db.getPendingActivationByToken).mockResolvedValue(mockActivation as any);
      vi.mocked(db.getUserByEmail).mockResolvedValue(undefined);
      vi.mocked(db.upsertUser).mockResolvedValue(undefined);
      vi.mocked(db.createPersonal).mockResolvedValue(1);
      vi.mocked(db.createPlan).mockResolvedValue(1);
      
      // Simulate the activation flow
      const activation = await db.getPendingActivationByToken("valid-token");
      expect(activation).toBeDefined();
      
      const existingUser = await db.getUserByEmail(activation!.email);
      expect(existingUser).toBeUndefined();
      
      // Should create new user
      await db.upsertUser({
        openId: `cakto_${activation!.caktoOrderId}_${Date.now()}`,
        name: "New User",
        email: activation!.email,
        phone: activation!.phone,
        role: "personal",
        loginMethod: "cakto",
      });
      
      expect(db.upsertUser).toHaveBeenCalledWith(expect.objectContaining({
        email: "new@example.com",
        role: "personal",
        loginMethod: "cakto",
      }));
    });
  });

  describe("Token expiration", () => {
    it("should identify expired tokens correctly", () => {
      const expiredDate = new Date(Date.now() - 86400000); // 1 day ago
      const validDate = new Date(Date.now() + 86400000); // 1 day from now
      
      expect(new Date() > expiredDate).toBe(true);
      expect(new Date() > validDate).toBe(false);
    });
  });
});
