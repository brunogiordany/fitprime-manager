import { describe, it, expect } from "vitest";
import {
  findPlanForStudentCount,
  calculateExtraStudentCost,
  calculateTotalMonthlyCost,
  getPlanRecommendation,
  PLANS
} from "./plans";

describe("Plans - Pricing Logic", () => {
  describe("findPlanForStudentCount", () => {
    it("should find Starter plan for 10 students", () => {
      const plan = findPlanForStudentCount(10);
      expect(plan?.id).toBe("starter");
      expect(plan?.studentLimit).toBe(15);
    });

    it("should find Pro plan for 20 students", () => {
      const plan = findPlanForStudentCount(20);
      expect(plan?.id).toBe("pro");
      expect(plan?.studentLimit).toBe(25);
    });

    it("should find Business plan for 30 students", () => {
      const plan = findPlanForStudentCount(30);
      expect(plan?.id).toBe("business");
      expect(plan?.studentLimit).toBe(40);
    });

    it("should find Premium plan for 50 students", () => {
      const plan = findPlanForStudentCount(50);
      expect(plan?.id).toBe("premium");
      expect(plan?.studentLimit).toBe(70);
    });

    it("should find Enterprise plan for 100 students", () => {
      const plan = findPlanForStudentCount(100);
      expect(plan?.id).toBe("enterprise");
      expect(plan?.studentLimit).toBe(150);
    });

    it("should return null for more than 150 students", () => {
      const plan = findPlanForStudentCount(200);
      expect(plan).toBeNull();
    });
  });

  describe("calculateExtraStudentCost", () => {
    it("should return 0 for students within limit", () => {
      const plan = PLANS.starter;
      const cost = calculateExtraStudentCost(plan, 10);
      expect(cost).toBe(0);
    });

    it("should calculate extra cost for 1 extra student", () => {
      const plan = PLANS.starter;
      const cost = calculateExtraStudentCost(plan, 16); // 15 + 1
      expect(cost).toBeCloseTo(6.47, 2);
    });

    it("should calculate extra cost for 5 extra students", () => {
      const plan = PLANS.starter;
      const cost = calculateExtraStudentCost(plan, 20); // 15 + 5
      expect(cost).toBeCloseTo(32.35, 2); // 5 * 6.47
    });

    it("should calculate correctly for Pro plan", () => {
      const plan = PLANS.pro;
      const cost = calculateExtraStudentCost(plan, 30); // 25 + 5
      expect(cost).toBeCloseTo(29.4, 2); // 5 * 5.88
    });
  });

  describe("calculateTotalMonthlyCost", () => {
    it("should return plan price for students within limit", () => {
      const plan = PLANS.starter;
      const cost = calculateTotalMonthlyCost(plan, 10);
      expect(cost).toBe(97);
    });

    it("should include extra student cost", () => {
      const plan = PLANS.starter;
      const cost = calculateTotalMonthlyCost(plan, 20); // 15 + 5
      expect(cost).toBeCloseTo(97 + 32.35, 2);
    });

    it("should calculate correctly for different plans", () => {
      const plan = PLANS.pro;
      const cost = calculateTotalMonthlyCost(plan, 30); // 25 + 5
      expect(cost).toBeCloseTo(147 + 29.4, 2);
    });
  });

  describe("getPlanRecommendation", () => {
    it("should recommend upgrade when extra cost exceeds plan difference", () => {
      const recommendation = getPlanRecommendation(20); // Starter with 5 extra
      expect(recommendation.current?.id).toBe("starter");
      // Starter: 97 + (5 * 6.47) = 129.35
      // Pro: 147 (no extra)
      // No savings, so no recommendation
    });

    it("should not recommend when current plan is optimal", () => {
      const recommendation = getPlanRecommendation(10);
      expect(recommendation.current?.id).toBe("starter");
      expect(recommendation.recommended).toBeNull();
      expect(recommendation.savings).toBe(0);
    });

    it("should handle large student counts", () => {
      const recommendation = getPlanRecommendation(100);
      expect(recommendation.current?.id).toBe("enterprise");
      expect(recommendation.recommended).toBeNull();
    });
  });

  describe("Plan prices and limits", () => {
    it("should have correct Starter plan", () => {
      const plan = PLANS.starter;
      expect(plan.price).toBe(97);
      expect(plan.studentLimit).toBe(15);
      expect(plan.extraStudentPrice).toBe(6.47);
    });

    it("should have correct Pro plan", () => {
      const plan = PLANS.pro;
      expect(plan.price).toBe(147);
      expect(plan.studentLimit).toBe(25);
      expect(plan.extraStudentPrice).toBe(5.88);
    });

    it("should have correct Business plan", () => {
      const plan = PLANS.business;
      expect(plan.price).toBe(197);
      expect(plan.studentLimit).toBe(40);
      expect(plan.extraStudentPrice).toBe(4.03);
    });

    it("should have correct Premium plan", () => {
      const plan = PLANS.premium;
      expect(plan.price).toBe(297);
      expect(plan.studentLimit).toBe(70);
      expect(plan.extraStudentPrice).toBe(4.24);
    });

    it("should have correct Enterprise plan", () => {
      const plan = PLANS.enterprise;
      expect(plan.price).toBe(497);
      expect(plan.studentLimit).toBe(150);
      expect(plan.extraStudentPrice).toBe(3.31);
    });
  });
});
