/**
 * Testes do Webhook da Payt
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validatePaytWebhook,
  isFirstCharge,
  extractCustomerData,
  formatCentsToReais,
  calculateAffiliateCommission,
  getPlanFromProduct,
  PaytWebhookPayload,
  PaytCustomer,
  PaytSubscription,
} from "./payt";

describe("Payt Webhook", () => {
  describe("validatePaytWebhook", () => {
    it("should return true when integration keys match", () => {
      const payload = {
        integration_key: "test-key-123",
        transaction_id: "txn_001",
      } as PaytWebhookPayload;

      expect(validatePaytWebhook(payload, "test-key-123")).toBe(true);
    });

    it("should return false when integration keys don't match", () => {
      const payload = {
        integration_key: "test-key-123",
        transaction_id: "txn_001",
      } as PaytWebhookPayload;

      expect(validatePaytWebhook(payload, "wrong-key")).toBe(false);
    });
  });

  describe("isFirstCharge", () => {
    it("should return true when subscription is undefined (one-time purchase)", () => {
      expect(isFirstCharge(undefined)).toBe(true);
    });

    it("should return true when subscription charges is 1", () => {
      const subscription: PaytSubscription = {
        code: "SUB001",
        plan_name: "Plano Starter",
        charges: 1,
        periodicity: "1 month",
        next_charge_at: "2026-02-09",
        status: "active",
        started_at: "2026-01-09 10:00:00",
      };

      expect(isFirstCharge(subscription)).toBe(true);
    });

    it("should return false when subscription charges is greater than 1", () => {
      const subscription: PaytSubscription = {
        code: "SUB001",
        plan_name: "Plano Starter",
        charges: 2,
        periodicity: "1 month",
        next_charge_at: "2026-03-09",
        status: "active",
        started_at: "2026-01-09 10:00:00",
      };

      expect(isFirstCharge(subscription)).toBe(false);
    });

    it("should return false when subscription has many charges", () => {
      const subscription: PaytSubscription = {
        code: "SUB001",
        plan_name: "Plano Pro",
        charges: 12,
        periodicity: "1 month",
        next_charge_at: "2027-01-09",
        status: "active",
        started_at: "2026-01-09 10:00:00",
      };

      expect(isFirstCharge(subscription)).toBe(false);
    });
  });

  describe("extractCustomerData", () => {
    it("should extract customer data correctly", () => {
      const customer: PaytCustomer = {
        name: "João Silva",
        fake_email: false,
        email: "joao@example.com",
        doc: "12345678901",
        phone: "11999999999",
        ip: "192.168.1.1",
        code: "CUST001",
        url: "https://payt.com/customer/001",
      };

      const result = extractCustomerData(customer);

      expect(result).toEqual({
        name: "João Silva",
        email: "joao@example.com",
        phone: "11999999999",
        cpf: "12345678901",
      });
    });

    it("should return empty email when fake_email is true", () => {
      const customer: PaytCustomer = {
        name: "Maria Santos",
        fake_email: true,
        email: "fake@generated.com",
        doc: "98765432100",
        phone: "11888888888",
        ip: "192.168.1.2",
        code: "CUST002",
        url: "https://payt.com/customer/002",
      };

      const result = extractCustomerData(customer);

      expect(result.email).toBe("");
      expect(result.name).toBe("Maria Santos");
    });
  });

  describe("formatCentsToReais", () => {
    it("should format cents to reais correctly", () => {
      expect(formatCentsToReais(9700)).toBe("R$ 97,00");
      expect(formatCentsToReais(14700)).toBe("R$ 147,00");
      expect(formatCentsToReais(3990)).toBe("R$ 39,90");
      expect(formatCentsToReais(100)).toBe("R$ 1,00");
      expect(formatCentsToReais(50)).toBe("R$ 0,50");
      expect(formatCentsToReais(0)).toBe("R$ 0,00");
    });

    it("should handle large amounts", () => {
      expect(formatCentsToReais(100000)).toBe("R$ 1000,00");
      expect(formatCentsToReais(999999)).toBe("R$ 9999,99");
    });
  });

  describe("calculateAffiliateCommission", () => {
    it("should return full commission for first charge", () => {
      const payload = {
        transaction: { total_price: 9700 },
        subscription: {
          code: "SUB001",
          plan_name: "Starter",
          charges: 1,
          periodicity: "1 month" as const,
          next_charge_at: "2026-02-09",
          status: "active" as const,
          started_at: "2026-01-09 10:00:00",
        },
        commission: [
          { name: "Afiliado", email: "afiliado@example.com", type: "affiliate" as const, amount: 4850 },
        ],
      } as PaytWebhookPayload;

      const commission = calculateAffiliateCommission(payload);
      expect(commission).toBe(4850); // Returns the affiliate commission amount
    });

    it("should return 0 for subsequent charges (renewals)", () => {
      const payload = {
        transaction: { total_price: 9700 },
        subscription: {
          code: "SUB001",
          plan_name: "Starter",
          charges: 2, // Second charge
          periodicity: "1 month" as const,
          next_charge_at: "2026-03-09",
          status: "active" as const,
          started_at: "2026-01-09 10:00:00",
        },
        commission: [
          { name: "Afiliado", email: "afiliado@example.com", type: "affiliate" as const, amount: 4850 },
        ],
      } as PaytWebhookPayload;

      const commission = calculateAffiliateCommission(payload);
      expect(commission).toBe(0); // No commission for renewals
    });

    it("should return calculated commission when no affiliate commission defined", () => {
      const payload = {
        transaction: { total_price: 10000 },
        subscription: {
          code: "SUB001",
          plan_name: "Starter",
          charges: 1,
          periodicity: "1 month" as const,
          next_charge_at: "2026-02-09",
          status: "active" as const,
          started_at: "2026-01-09 10:00:00",
        },
        commission: [], // No commissions defined
      } as PaytWebhookPayload;

      const commission = calculateAffiliateCommission(payload, 50); // 50% commission
      expect(commission).toBe(5000); // 50% of 10000
    });

    it("should return full amount for one-time purchase (no subscription)", () => {
      const payload = {
        transaction: { total_price: 9700 },
        // No subscription = one-time purchase
      } as PaytWebhookPayload;

      const commission = calculateAffiliateCommission(payload, 100);
      expect(commission).toBe(9700); // Full amount
    });
  });

  describe("getPlanFromProduct", () => {
    it("should return plan mapping for known product codes", () => {
      const starterPlan = getPlanFromProduct("FITPRIME_STARTER");
      expect(starterPlan).toEqual({
        planId: "starter",
        planName: "Starter",
        price: 9700,
        maxStudents: 15,
        isAnnual: false,
      });
    });

    it("should return plan mapping for annual plans", () => {
      const proAnnual = getPlanFromProduct("FITPRIME_PRO_ANUAL");
      expect(proAnnual).toEqual({
        planId: "pro",
        planName: "Pro Anual",
        price: 141100,
        maxStudents: 36,
        isAnnual: true,
      });
    });

    it("should return null for unknown product codes", () => {
      const unknown = getPlanFromProduct("UNKNOWN_PRODUCT");
      expect(unknown).toBeNull();
    });
  });

  describe("Payt Webhook Payload Structure", () => {
    it("should handle complete webhook payload", () => {
      const payload: PaytWebhookPayload = {
        integration_key: "test-integration-key",
        transaction_id: "TXN123456",
        seller_id: "SELLER001",
        test: false,
        type: "order",
        status: "paid",
        tangible: false,
        cart_id: "CART001",
        customer: {
          name: "Personal Trainer",
          fake_email: false,
          email: "personal@example.com",
          doc: "12345678901",
          phone: "11999999999",
          ip: "192.168.1.1",
          code: "CUST001",
          url: "https://payt.com/customer/001",
        },
        product: {
          name: "FitPrime Starter",
          price: 9700,
          code: "FITPRIME_STARTER",
          sku: "FP-STARTER-001",
          type: "digital",
          quantity: 1,
        },
        link: {
          title: "Checkout FitPrime",
          url: "https://payt.com/checkout/fitprime",
        },
        transaction: {
          payment_method: "pix",
          payment_status: "paid",
          total_price: 9700,
          quantity: 1,
          created_at: "2026-01-09 10:00:00",
          updated_at: "2026-01-09 10:05:00",
        },
        subscription: {
          code: "SUB001",
          plan_name: "Starter Mensal",
          charges: 1,
          periodicity: "1 month",
          next_charge_at: "2026-02-09",
          status: "active",
          started_at: "2026-01-09 10:00:00",
        },
        commission: [
          { name: "Plataforma", email: "platform@payt.com", type: "platform", amount: 970 },
          { name: "Produtor", email: "producer@fitprime.com", type: "producer", amount: 4365 },
          { name: "Afiliado João", email: "joao@afiliado.com", type: "affiliate", amount: 4365 },
        ],
        started_at: "2026-01-09 09:55:00",
        updated_at: "2026-01-09 10:05:00",
      };

      // Validate structure
      expect(payload.integration_key).toBeDefined();
      expect(payload.customer.email).toBe("personal@example.com");
      expect(payload.product.code).toBe("FITPRIME_STARTER");
      expect(payload.transaction.total_price).toBe(9700);
      expect(payload.subscription?.charges).toBe(1);
      expect(payload.commission?.length).toBe(3);

      // Validate first charge logic
      expect(isFirstCharge(payload.subscription)).toBe(true);

      // Validate commission calculation
      const affiliateCommission = calculateAffiliateCommission(payload);
      expect(affiliateCommission).toBe(4365);
    });

    it("should handle renewal webhook (no affiliate commission)", () => {
      const renewalPayload: PaytWebhookPayload = {
        integration_key: "test-integration-key",
        transaction_id: "TXN123457",
        seller_id: "SELLER001",
        test: false,
        type: "order",
        status: "subscription_renewed",
        tangible: false,
        cart_id: "CART002",
        customer: {
          name: "Personal Trainer",
          fake_email: false,
          email: "personal@example.com",
          doc: "12345678901",
          phone: "11999999999",
          ip: "192.168.1.1",
          code: "CUST001",
          url: "https://payt.com/customer/001",
        },
        product: {
          name: "FitPrime Starter",
          price: 9700,
          code: "FITPRIME_STARTER",
          sku: "FP-STARTER-001",
          type: "digital",
          quantity: 1,
        },
        link: {
          title: "Checkout FitPrime",
          url: "https://payt.com/checkout/fitprime",
        },
        transaction: {
          payment_method: "credit_card",
          payment_status: "paid",
          total_price: 9700,
          quantity: 1,
          created_at: "2026-02-09 10:00:00",
          updated_at: "2026-02-09 10:05:00",
        },
        subscription: {
          code: "SUB001",
          plan_name: "Starter Mensal",
          charges: 2, // Second charge = renewal
          periodicity: "1 month",
          next_charge_at: "2026-03-09",
          status: "active",
          started_at: "2026-01-09 10:00:00",
        },
        commission: [
          { name: "Plataforma", email: "platform@payt.com", type: "platform", amount: 970 },
          { name: "Produtor", email: "producer@fitprime.com", type: "producer", amount: 8730 }, // Full amount to producer
        ],
        started_at: "2026-02-09 09:55:00",
        updated_at: "2026-02-09 10:05:00",
      };

      // Validate renewal
      expect(isFirstCharge(renewalPayload.subscription)).toBe(false);

      // No affiliate commission for renewals
      const affiliateCommission = calculateAffiliateCommission(renewalPayload);
      expect(affiliateCommission).toBe(0);
    });
  });
});
