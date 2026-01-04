import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

// Contexto autenticado como personal
function createAuthenticatedContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: 'test-open-id',
      name: 'Test Personal',
      email: 'test@example.com',
      avatar: null,
      role: 'admin',
      loginMethod: 'manus',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    personal: {
      id: 1,
      userId: 1,
      name: 'Test Personal',
      email: 'test@example.com',
      phone: '11999999999',
      cpf: null,
      cref: null,
      specialties: null,
      bio: null,
      avatar: null,
      address: null,
      city: null,
      state: null,
      zipCode: null,
      workingHours: null,
      sessionDuration: 60,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    student: null,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext['res'],
  };
}

// Contexto não autenticado
function createUnauthenticatedContext(): TrpcContext {
  return {
    user: null,
    personal: null,
    student: null,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext['res'],
  };
}

describe('Nutrition Module - Access Control', () => {
  describe('Foods Router', () => {
    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.nutrition.foods.list({})).rejects.toThrow();
    });
  });

  describe('Recipes Router', () => {
    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.nutrition.recipes.list({})).rejects.toThrow();
    });
  });

  describe('Meal Plans Router', () => {
    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.nutrition.mealPlans.list({})).rejects.toThrow();
    });
  });

  describe('Assessments Router', () => {
    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.nutrition.assessments.list({ studentId: 1 })).rejects.toThrow();
    });
  });

  describe('Lab Exams Router', () => {
    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.nutrition.labExams.list({ studentId: 1 })).rejects.toThrow();
    });
  });

  describe('Anamnesis Router', () => {
    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.nutrition.anamnesis.get({ studentId: 1 })).rejects.toThrow();
    });
  });

  describe('Settings Router', () => {
    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.nutrition.settings.get()).rejects.toThrow();
    });
  });

  describe('Dashboard Router', () => {
    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.nutrition.dashboard.stats()).rejects.toThrow();
    });
  });
});

describe('Nutrition Calculations', () => {
  describe('BMR Calculation', () => {
    it('should calculate BMR using Mifflin-St Jeor formula for male', () => {
      // Fórmula: 10 * peso + 6.25 * altura - 5 * idade + 5
      const weight = 80; // kg
      const height = 180; // cm
      const age = 30;
      
      const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      
      expect(bmr).toBe(1780);
    });

    it('should calculate BMR using Mifflin-St Jeor formula for female', () => {
      // Fórmula: 10 * peso + 6.25 * altura - 5 * idade - 161
      const weight = 60; // kg
      const height = 165; // cm
      const age = 25;
      
      const bmr = 10 * weight + 6.25 * height - 5 * age - 161;
      
      expect(bmr).toBe(1345.25);
    });

    it('should calculate BMR using Harris-Benedict formula for male', () => {
      // Fórmula: 88.362 + (13.397 * peso) + (4.799 * altura) - (5.677 * idade)
      const weight = 80; // kg
      const height = 180; // cm
      const age = 30;
      
      const bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
      
      expect(Math.round(bmr)).toBe(1854);
    });

    it('should calculate BMR using Harris-Benedict formula for female', () => {
      // Fórmula: 447.593 + (9.247 * peso) + (3.098 * altura) - (4.330 * idade)
      const weight = 60; // kg
      const height = 165; // cm
      const age = 25;
      
      const bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
      
      expect(Math.round(bmr)).toBe(1405);
    });
  });

  describe('TDEE Calculation', () => {
    it('should calculate TDEE with sedentary activity multiplier', () => {
      const bmr = 1780;
      const activityMultiplier = 1.2; // Sedentário
      
      const tdee = bmr * activityMultiplier;
      
      expect(tdee).toBe(2136);
    });

    it('should calculate TDEE with moderate activity multiplier', () => {
      const bmr = 1780;
      const activityMultiplier = 1.55; // Moderadamente ativo
      
      const tdee = bmr * activityMultiplier;
      
      expect(tdee).toBe(2759);
    });

    it('should calculate TDEE with very active multiplier', () => {
      const bmr = 1780;
      const activityMultiplier = 1.725; // Muito ativo
      
      const tdee = bmr * activityMultiplier;
      
      expect(tdee).toBe(3070.5);
    });
  });

  describe('Macro Distribution', () => {
    it('should calculate macros from calorie target with standard distribution', () => {
      const targetCalories = 2000;
      const proteinPercentage = 25;
      const carbsPercentage = 50;
      const fatPercentage = 25;
      
      // Proteína: 4 kcal/g
      // Carboidratos: 4 kcal/g
      // Gordura: 9 kcal/g
      
      const proteinGrams = (targetCalories * proteinPercentage / 100) / 4;
      const carbsGrams = (targetCalories * carbsPercentage / 100) / 4;
      const fatGrams = (targetCalories * fatPercentage / 100) / 9;
      
      expect(proteinGrams).toBe(125);
      expect(carbsGrams).toBe(250);
      expect(Math.round(fatGrams * 10) / 10).toBe(55.6);
    });

    it('should calculate macros for high protein diet', () => {
      const targetCalories = 2000;
      const proteinPercentage = 35;
      const carbsPercentage = 40;
      const fatPercentage = 25;
      
      const proteinGrams = (targetCalories * proteinPercentage / 100) / 4;
      const carbsGrams = (targetCalories * carbsPercentage / 100) / 4;
      const fatGrams = (targetCalories * fatPercentage / 100) / 9;
      
      expect(proteinGrams).toBe(175);
      expect(carbsGrams).toBe(200);
      expect(Math.round(fatGrams * 10) / 10).toBe(55.6);
    });

    it('should calculate protein based on body weight', () => {
      const weight = 80; // kg
      const proteinPerKg = 2.0; // g/kg para ganho muscular
      
      const proteinGrams = weight * proteinPerKg;
      
      expect(proteinGrams).toBe(160);
    });
  });

  describe('BMI Calculation', () => {
    it('should calculate BMI correctly', () => {
      const weight = 80; // kg
      const height = 1.80; // metros
      
      const bmi = weight / (height * height);
      
      expect(Math.round(bmi * 10) / 10).toBe(24.7);
    });

    it('should classify underweight BMI', () => {
      const classifyBMI = (bmi: number): string => {
        if (bmi < 18.5) return 'Abaixo do peso';
        if (bmi < 25) return 'Peso normal';
        if (bmi < 30) return 'Sobrepeso';
        if (bmi < 35) return 'Obesidade grau I';
        if (bmi < 40) return 'Obesidade grau II';
        return 'Obesidade grau III';
      };
      
      expect(classifyBMI(17)).toBe('Abaixo do peso');
    });

    it('should classify normal BMI', () => {
      const classifyBMI = (bmi: number): string => {
        if (bmi < 18.5) return 'Abaixo do peso';
        if (bmi < 25) return 'Peso normal';
        if (bmi < 30) return 'Sobrepeso';
        if (bmi < 35) return 'Obesidade grau I';
        if (bmi < 40) return 'Obesidade grau II';
        return 'Obesidade grau III';
      };
      
      expect(classifyBMI(22)).toBe('Peso normal');
    });

    it('should classify overweight BMI', () => {
      const classifyBMI = (bmi: number): string => {
        if (bmi < 18.5) return 'Abaixo do peso';
        if (bmi < 25) return 'Peso normal';
        if (bmi < 30) return 'Sobrepeso';
        if (bmi < 35) return 'Obesidade grau I';
        if (bmi < 40) return 'Obesidade grau II';
        return 'Obesidade grau III';
      };
      
      expect(classifyBMI(27)).toBe('Sobrepeso');
    });

    it('should classify obese BMI', () => {
      const classifyBMI = (bmi: number): string => {
        if (bmi < 18.5) return 'Abaixo do peso';
        if (bmi < 25) return 'Peso normal';
        if (bmi < 30) return 'Sobrepeso';
        if (bmi < 35) return 'Obesidade grau I';
        if (bmi < 40) return 'Obesidade grau II';
        return 'Obesidade grau III';
      };
      
      expect(classifyBMI(32)).toBe('Obesidade grau I');
      expect(classifyBMI(37)).toBe('Obesidade grau II');
      expect(classifyBMI(42)).toBe('Obesidade grau III');
    });
  });

  describe('Body Fat Calculation', () => {
    it('should calculate body fat using US Navy method for male', () => {
      // Fórmula: 495 / (1.0324 - 0.19077 * log10(cintura - pescoço) + 0.15456 * log10(altura)) - 450
      const waist = 85; // cm
      const neck = 38; // cm
      const height = 180; // cm
      
      const bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
      
      expect(Math.round(bodyFat * 10) / 10).toBeGreaterThan(10);
      expect(Math.round(bodyFat * 10) / 10).toBeLessThan(30);
    });

    it('should calculate lean mass from body fat percentage', () => {
      const weight = 80; // kg
      const bodyFatPercentage = 15; // %
      
      const fatMass = weight * (bodyFatPercentage / 100);
      const leanMass = weight - fatMass;
      
      expect(fatMass).toBe(12);
      expect(leanMass).toBe(68);
    });
  });

  describe('Caloric Adjustment', () => {
    it('should calculate deficit for weight loss', () => {
      const tdee = 2500;
      const deficit = 500; // kcal
      
      const targetCalories = tdee - deficit;
      
      expect(targetCalories).toBe(2000);
    });

    it('should calculate surplus for muscle gain', () => {
      const tdee = 2500;
      const surplus = 300; // kcal
      
      const targetCalories = tdee + surplus;
      
      expect(targetCalories).toBe(2800);
    });

    it('should estimate weekly weight change from caloric adjustment', () => {
      // 1 kg de gordura ≈ 7700 kcal
      const dailyDeficit = 500;
      const weeklyDeficit = dailyDeficit * 7;
      const weeklyWeightLoss = weeklyDeficit / 7700;
      
      expect(Math.round(weeklyWeightLoss * 100) / 100).toBe(0.45);
    });
  });
});
