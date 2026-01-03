/**
 * Activation Router
 * 
 * Handles account activation for customers who purchased via Cakto
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import bcrypt from "bcryptjs";

export const activationRouter = router({
  // Validate activation token
  validateToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const activation = await db.getPendingActivationByToken(input.token);
      
      if (!activation) {
        return {
          valid: false,
          message: "Link de ativação não encontrado ou inválido.",
        };
      }
      
      // Check if already activated
      if (activation.status === "activated") {
        return {
          valid: true,
          status: "activated",
          message: "Esta conta já foi ativada. Faça login para acessar.",
        };
      }
      
      // Check if expired
      if (activation.status === "expired" || new Date() > new Date(activation.tokenExpiresAt)) {
        // Mark as expired if not already
        if (activation.status !== "expired") {
          await db.expireOldActivations();
        }
        return {
          valid: false,
          message: "Este link de ativação expirou. Entre em contato com o suporte.",
        };
      }
      
      // Return activation data for the form
      return {
        valid: true,
        status: "pending",
        email: activation.email,
        name: activation.name,
        phone: activation.phone,
        planName: activation.productName || "Plano FitPrime",
        amount: activation.amount,
      };
    }),
  
  // Complete account activation
  completeActivation: publicProcedure
    .input(z.object({
      token: z.string(),
      name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
      phone: z.string().optional(),
      password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    }))
    .mutation(async ({ input }) => {
      // Get activation record
      const activation = await db.getPendingActivationByToken(input.token);
      
      if (!activation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Link de ativação não encontrado.",
        });
      }
      
      if (activation.status === "activated") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esta conta já foi ativada. Faça login para acessar.",
        });
      }
      
      if (activation.status === "expired" || new Date() > new Date(activation.tokenExpiresAt)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este link de ativação expirou.",
        });
      }
      
      // Check if user already exists with this email
      const existingUser = await db.getUserByEmail(activation.email);
      
      if (existingUser) {
        // User already exists - just update their subscription and mark activation complete
        await db.updateUserSubscription(existingUser.id, {
          status: "active",
          caktoOrderId: activation.caktoOrderId,
          caktoSubscriptionId: activation.caktoSubscriptionId || undefined,
          paidAt: new Date(),
          amount: parseFloat(activation.amount || "0"),
        });
        
        await db.markActivationAsCompleted(activation.id, existingUser.id);
        
        return {
          success: true,
          message: "Sua assinatura foi ativada! Faça login para acessar.",
          userId: existingUser.id,
        };
      }
      
      // Create new user
      const passwordHash = await bcrypt.hash(input.password, 10);
      
      // Generate a unique openId for the new user
      const openId = `cakto_${activation.caktoOrderId}_${Date.now()}`;
      
      await db.upsertUser({
        openId,
        name: input.name,
        email: activation.email,
        phone: input.phone || activation.phone || null,
        role: "personal",
        loginMethod: "cakto",
      });
      
      // Get the created user
      const newUser = await db.getUserByEmail(activation.email);
      
      if (!newUser) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar conta. Tente novamente.",
        });
      }
      
      // Create personal profile
      const personalId = await db.createPersonal({
        userId: newUser.id,
        subscriptionStatus: "active",
        subscriptionExpiresAt: getSubscriptionExpiry(activation.planType),
      });
      
      // Create default plans for the new personal
      const DEFAULT_PLANS = [
        { name: 'Mensal 1x semana', description: 'Plano mensal com 1 treino por semana', type: 'recurring' as const, billingCycle: 'monthly' as const, sessionsPerWeek: 1, sessionDuration: 60, price: '0' },
        { name: 'Mensal 2x semana', description: 'Plano mensal com 2 treinos por semana', type: 'recurring' as const, billingCycle: 'monthly' as const, sessionsPerWeek: 2, sessionDuration: 60, price: '0' },
        { name: 'Mensal 3x semana', description: 'Plano mensal com 3 treinos por semana', type: 'recurring' as const, billingCycle: 'monthly' as const, sessionsPerWeek: 3, sessionDuration: 60, price: '0' },
        { name: 'Mensal 4x semana', description: 'Plano mensal com 4 treinos por semana', type: 'recurring' as const, billingCycle: 'monthly' as const, sessionsPerWeek: 4, sessionDuration: 60, price: '0' },
        { name: 'Mensal 5x semana', description: 'Plano mensal com 5 treinos por semana', type: 'recurring' as const, billingCycle: 'monthly' as const, sessionsPerWeek: 5, sessionDuration: 60, price: '0' },
        { name: 'Mensal 6x semana', description: 'Plano mensal com 6 treinos por semana', type: 'recurring' as const, billingCycle: 'monthly' as const, sessionsPerWeek: 6, sessionDuration: 60, price: '0' },
      ];
      
      for (const plan of DEFAULT_PLANS) {
        await db.createPlan({ ...plan, personalId, isActive: true });
      }
      
      // Mark activation as completed
      await db.markActivationAsCompleted(activation.id, newUser.id);
      
      return {
        success: true,
        message: "Conta criada com sucesso! Faça login para acessar.",
        userId: newUser.id,
      };
    }),
});

// Helper to calculate subscription expiry based on plan type
function getSubscriptionExpiry(planType: string | null): Date {
  const now = new Date();
  
  switch (planType) {
    case "monthly":
    case "beginner":
    case "starter":
      now.setMonth(now.getMonth() + 1);
      break;
    case "quarterly":
    case "pro":
      now.setMonth(now.getMonth() + 3);
      break;
    case "semiannual":
    case "business":
      now.setMonth(now.getMonth() + 6);
      break;
    case "annual":
    case "premium":
    case "enterprise":
      now.setFullYear(now.getFullYear() + 1);
      break;
    default:
      // Default to 1 month
      now.setMonth(now.getMonth() + 1);
  }
  
  return now;
}
