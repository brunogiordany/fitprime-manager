import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import * as dbHelpers from "../db";
import { eq, and, like, or, desc, asc, sql, isNull } from "drizzle-orm";
import { getDb } from "../db";
import { 
  foods, recipes, recipeIngredients, mealPlans, mealPlanDays, meals, mealItems,
  nutritionLogs, nutritionAssessments, labExams, nutritionAnamneses, 
  nutritionGuidelines, nutritionSettings, personals, students, measurements, anamneses
} from "../../drizzle/schema";

// Helper to get or create personal profile
async function getOrCreatePersonal(userId: number) {
  let personal = await dbHelpers.getPersonalByUserId(userId);
  if (!personal) {
    const personalId = await dbHelpers.createPersonal({ userId });
    personal = { id: personalId, userId } as any;
  }
  return personal;
}

// Helper to check if personal has nutrition beta access
async function checkNutritionAccess(personalId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
  const personal = await db.select().from(personals).where(eq(personals.id, personalId)).limit(1);
  if (!personal[0]?.nutritionBetaEnabled) {
    throw new TRPCError({ 
      code: 'FORBIDDEN', 
      message: 'Acesso ao módulo FitPrime Nutrition não liberado. Entre em contato com o suporte.' 
    });
  }
  return personal[0];
}

// Personal procedure with nutrition access check
const nutritionProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const personal = await getOrCreatePersonal(ctx.user.id);
  if (!personal) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Personal não encontrado' });
  }
  await checkNutritionAccess(personal.id);
  return next({ ctx: { ...ctx, personal } });
});

export const nutritionRouter = router({
  // ==================== FOODS (Banco de Alimentos) ====================
  foods: router({
    // Listar alimentos com filtros
    list: nutritionProcedure
      .input(z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        source: z.enum(['taco', 'usda', 'custom', 'all']).default('all'),
        page: z.number().default(1),
        limit: z.number().default(50),
      }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        const offset = (input.page - 1) * input.limit;
        
        let conditions = [eq(foods.isActive, true)];
        
        // Filtrar por fonte (sistema ou custom do personal)
        if (input.source === 'custom') {
          conditions.push(eq(foods.personalId, ctx.personal.id));
        } else if (input.source === 'taco') {
          conditions.push(and(isNull(foods.personalId), eq(foods.source, 'taco'))!);
        } else if (input.source === 'usda') {
          conditions.push(and(isNull(foods.personalId), eq(foods.source, 'usda'))!);
        } else {
          // all: sistema + custom do personal
          conditions.push(
            or(
              isNull(foods.personalId),
              eq(foods.personalId, ctx.personal.id)
            )!
          );
        }
        
        if (input.search) {
          conditions.push(
            or(
              like(foods.name, `%${input.search}%`),
              like(foods.nameEn, `%${input.search}%`),
              like(foods.category, `%${input.search}%`)
            )!
          );
        }
        
        if (input.category) {
          conditions.push(eq(foods.category, input.category));
        }
        
        const [foodsList, countResult] = await Promise.all([
          db.select()
            .from(foods)
            .where(and(...conditions))
            .orderBy(asc(foods.name))
            .limit(input.limit)
            .offset(offset),
          db.select({ count: sql<number>`count(*)` })
            .from(foods)
            .where(and(...conditions))
        ]);
        
        return {
          foods: foodsList,
          total: countResult[0]?.count || 0,
          page: input.page,
          totalPages: Math.ceil((countResult[0]?.count || 0) / input.limit),
        };
      }),
    
    // Obter categorias disponíveis
    categories: nutritionProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      const result = await db
        .selectDistinct({ category: foods.category })
        .from(foods)
        .where(
          and(
            eq(foods.isActive, true),
            or(isNull(foods.personalId), eq(foods.personalId, ctx.personal.id))
          )
        )
        .orderBy(asc(foods.category));
      
      return result.map((r: { category: string | null }) => r.category).filter(Boolean);
    }),
    
    // Obter alimento por ID
    get: nutritionProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        const food = await db.select()
          .from(foods)
          .where(
            and(
              eq(foods.id, input.id),
              or(isNull(foods.personalId), eq(foods.personalId, ctx.personal.id))
            )
          )
          .limit(1);
        
        if (!food[0]) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Alimento não encontrado' });
        }
        
        return food[0];
      }),
    
    // Criar alimento customizado
    create: nutritionProcedure
      .input(z.object({
        name: z.string().min(2),
        category: z.string().min(2),
        subcategory: z.string().optional(),
        servingSize: z.string().default("100"),
        servingUnit: z.string().default("g"),
        householdMeasure: z.string().optional(),
        householdGrams: z.string().optional(),
        calories: z.string().optional(),
        protein: z.string().optional(),
        carbohydrates: z.string().optional(),
        fiber: z.string().optional(),
        totalFat: z.string().optional(),
        saturatedFat: z.string().optional(),
        sugar: z.string().optional(),
        sodium: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        const [result] = await db.insert(foods).values({
          ...input,
          personalId: ctx.personal.id,
          source: 'custom',
        });
        
        return { id: result.insertId };
      }),
    
    // Atualizar alimento customizado
    update: nutritionProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(2).optional(),
        category: z.string().optional(),
        subcategory: z.string().optional(),
        servingSize: z.string().optional(),
        servingUnit: z.string().optional(),
        householdMeasure: z.string().optional(),
        householdGrams: z.string().optional(),
        calories: z.string().optional(),
        protein: z.string().optional(),
        carbohydrates: z.string().optional(),
        fiber: z.string().optional(),
        totalFat: z.string().optional(),
        saturatedFat: z.string().optional(),
        sugar: z.string().optional(),
        sodium: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        const { id, ...data } = input;
        
        // Verificar se é alimento do personal
        const food = await db.select()
          .from(foods)
          .where(and(eq(foods.id, id), eq(foods.personalId, ctx.personal.id)))
          .limit(1);
        
        if (!food[0]) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Você só pode editar alimentos criados por você' });
        }
        
        await db.update(foods).set(data).where(eq(foods.id, id));
        
        return { success: true };
      }),
    
    // Deletar alimento customizado
    delete: nutritionProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        // Verificar se é alimento do personal
        const food = await db.select()
          .from(foods)
          .where(and(eq(foods.id, input.id), eq(foods.personalId, ctx.personal.id)))
          .limit(1);
        
        if (!food[0]) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Você só pode excluir alimentos criados por você' });
        }
        
        await db.update(foods).set({ isActive: false }).where(eq(foods.id, input.id));
        
        return { success: true };
      }),
    
    // Buscar informações nutricionais com IA
    searchWithAI: nutritionProcedure
      .input(z.object({ query: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: `Você é um especialista em nutrição. Quando o usuário descrever um alimento, retorne as informações nutricionais estimadas por 100g em formato JSON.
              
Se o alimento não for reconhecido ou a descrição for vaga, retorne null.

Formato esperado:
{
  "name": "Nome do alimento",
  "category": "Categoria (ex: Frutas, Carnes, Cereais)",
  "calories": "valor em kcal",
  "protein": "valor em g",
  "carbohydrates": "valor em g",
  "fiber": "valor em g",
  "totalFat": "valor em g",
  "sugar": "valor em g",
  "sodium": "valor em mg"
}`
            },
            { role: 'user', content: input.query }
          ],
          response_format: { type: 'json_object' }
        });
        
        const content = response.choices[0]?.message?.content;
        if (!content) return null;
        
        try {
          return JSON.parse(content as string);
        } catch {
          return null;
        }
      }),
  }),

  // ==================== RECIPES (Receitas) ====================
  recipes: router({
    // Listar receitas
    list: nutritionProcedure
      .input(z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        includePublic: z.boolean().default(true),
        page: z.number().default(1),
        limit: z.number().default(20),
      }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        const offset = (input.page - 1) * input.limit;
        
        let conditions = [eq(recipes.isActive, true)];
        
        if (input.includePublic) {
          conditions.push(
            or(
              eq(recipes.personalId, ctx.personal.id),
              eq(recipes.isPublic, true)
            )!
          );
        } else {
          conditions.push(eq(recipes.personalId, ctx.personal.id));
        }
        
        if (input.search) {
          conditions.push(like(recipes.name, `%${input.search}%`));
        }
        
        if (input.category) {
          conditions.push(eq(recipes.category, input.category));
        }
        
        const [recipesList, countResult] = await Promise.all([
          db.select()
            .from(recipes)
            .where(and(...conditions))
            .orderBy(desc(recipes.createdAt))
            .limit(input.limit)
            .offset(offset),
          db.select({ count: sql<number>`count(*)` })
            .from(recipes)
            .where(and(...conditions))
        ]);
        
        return {
          recipes: recipesList,
          total: countResult[0]?.count || 0,
          page: input.page,
          totalPages: Math.ceil((countResult[0]?.count || 0) / input.limit),
        };
      }),
    
    // Obter receita com ingredientes
    get: nutritionProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        const recipe = await db.select()
          .from(recipes)
          .where(
            and(
              eq(recipes.id, input.id),
              or(eq(recipes.personalId, ctx.personal.id), eq(recipes.isPublic, true))
            )
          )
          .limit(1);
        
        if (!recipe[0]) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Receita não encontrada' });
        }
        
        // Buscar ingredientes
        const ingredients = await db.select({
          id: recipeIngredients.id,
          quantity: recipeIngredients.quantity,
          unit: recipeIngredients.unit,
          notes: recipeIngredients.notes,
          calories: recipeIngredients.calories,
          protein: recipeIngredients.protein,
          carbs: recipeIngredients.carbs,
          fat: recipeIngredients.fat,
          sortOrder: recipeIngredients.sortOrder,
          food: {
            id: foods.id,
            name: foods.name,
            category: foods.category,
          }
        })
          .from(recipeIngredients)
          .innerJoin(foods, eq(recipeIngredients.foodId, foods.id))
          .where(eq(recipeIngredients.recipeId, input.id))
          .orderBy(asc(recipeIngredients.sortOrder));
        
        return { ...recipe[0], ingredients };
      }),
    
    // Criar receita
    create: nutritionProcedure
      .input(z.object({
        name: z.string().min(2),
        description: z.string().optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        prepTime: z.number().optional(),
        cookTime: z.number().optional(),
        servings: z.number().default(1),
        servingSize: z.string().optional(),
        difficulty: z.enum(['easy', 'medium', 'hard']).default('easy'),
        instructions: z.array(z.string()).optional(),
        tips: z.string().optional(),
        isPublic: z.boolean().default(false),
        ingredients: z.array(z.object({
          foodId: z.number(),
          quantity: z.string(),
          unit: z.string().default('g'),
          notes: z.string().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        const { ingredients, tags, instructions, ...recipeData } = input;
        
        // Criar receita
        const [result] = await db.insert(recipes).values({
          ...recipeData,
          personalId: ctx.personal.id,
          tags: tags ? JSON.stringify(tags) : null,
          instructions: instructions ? JSON.stringify(instructions) : null,
        });
        
        const recipeId = result.insertId;
        
        // Adicionar ingredientes e calcular totais
        let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0, totalFiber = 0, totalSodium = 0;
        
        for (let i = 0; i < ingredients.length; i++) {
          const ing = ingredients[i];
          
          // Buscar dados nutricionais do alimento
          const food = await db.select().from(foods).where(eq(foods.id, ing.foodId)).limit(1);
          if (!food[0]) continue;
          
          // Calcular valores proporcionais
          const factor = parseFloat(ing.quantity) / 100; // Assumindo que os valores são por 100g
          const calories = (parseFloat(food[0].calories || '0') * factor).toFixed(2);
          const protein = (parseFloat(food[0].protein || '0') * factor).toFixed(2);
          const carbs = (parseFloat(food[0].carbohydrates || '0') * factor).toFixed(2);
          const fat = (parseFloat(food[0].totalFat || '0') * factor).toFixed(2);
          
          totalCalories += parseFloat(calories);
          totalProtein += parseFloat(protein);
          totalCarbs += parseFloat(carbs);
          totalFat += parseFloat(fat);
          totalFiber += parseFloat(food[0].fiber || '0') * factor;
          totalSodium += parseFloat(food[0].sodium || '0') * factor;
          
          await db.insert(recipeIngredients).values({
            recipeId,
            foodId: ing.foodId,
            quantity: ing.quantity,
            unit: ing.unit,
            notes: ing.notes,
            calories,
            protein,
            carbs,
            fat,
            sortOrder: i,
          });
        }
        
        // Atualizar totais da receita (por porção)
        const servings = input.servings || 1;
        await db.update(recipes).set({
          totalCalories: (totalCalories / servings).toFixed(2),
          totalProtein: (totalProtein / servings).toFixed(2),
          totalCarbs: (totalCarbs / servings).toFixed(2),
          totalFat: (totalFat / servings).toFixed(2),
          totalFiber: (totalFiber / servings).toFixed(2),
          totalSodium: (totalSodium / servings).toFixed(2),
        }).where(eq(recipes.id, recipeId));
        
        return { id: recipeId };
      }),
    
    // Deletar receita
    delete: nutritionProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        const recipe = await db.select()
          .from(recipes)
          .where(and(eq(recipes.id, input.id), eq(recipes.personalId, ctx.personal.id)))
          .limit(1);
        
        if (!recipe[0]) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Você só pode excluir receitas criadas por você' });
        }
        
        await db.update(recipes).set({ isActive: false }).where(eq(recipes.id, input.id));
        
        return { success: true };
      }),
  }),

  // ==================== MEAL PLANS (Planos Alimentares) ====================
  mealPlans: router({
    // Listar planos do personal
    list: nutritionProcedure
      .input(z.object({
        studentId: z.number().optional(),
        status: z.enum(['draft', 'active', 'paused', 'completed', 'archived', 'all']).default('all'),
        page: z.number().default(1),
        limit: z.number().default(20),
      }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        const offset = (input.page - 1) * input.limit;
        
        let conditions = [eq(mealPlans.personalId, ctx.personal.id)];
        
        if (input.studentId) {
          conditions.push(eq(mealPlans.studentId, input.studentId));
        }
        
        if (input.status !== 'all') {
          conditions.push(eq(mealPlans.status, input.status));
        }
        
        const [plansList, countResult] = await Promise.all([
          db.select({
            id: mealPlans.id,
            name: mealPlans.name,
            description: mealPlans.description,
            objective: mealPlans.objective,
            status: mealPlans.status,
            startDate: mealPlans.startDate,
            endDate: mealPlans.endDate,
            targetCalories: mealPlans.targetCalories,
            targetProtein: mealPlans.targetProtein,
            targetCarbs: mealPlans.targetCarbs,
            targetFat: mealPlans.targetFat,
            generatedByAI: mealPlans.generatedByAI,
            createdAt: mealPlans.createdAt,
            student: {
              id: students.id,
              name: students.name,
            }
          })
            .from(mealPlans)
            .innerJoin(students, eq(mealPlans.studentId, students.id))
            .where(and(...conditions))
            .orderBy(desc(mealPlans.createdAt))
            .limit(input.limit)
            .offset(offset),
          db.select({ count: sql<number>`count(*)` })
            .from(mealPlans)
            .where(and(...conditions))
        ]);
        
        return {
          plans: plansList,
          total: countResult[0]?.count || 0,
          page: input.page,
          totalPages: Math.ceil((countResult[0]?.count || 0) / input.limit),
        };
      }),
    
    // Obter plano completo com dias e refeições
    get: nutritionProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        const plan = await db.select()
          .from(mealPlans)
          .where(and(eq(mealPlans.id, input.id), eq(mealPlans.personalId, ctx.personal.id)))
          .limit(1);
        
        if (!plan[0]) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Plano não encontrado' });
        }
        
        // Buscar dias
        const days = await db.select()
          .from(mealPlanDays)
          .where(eq(mealPlanDays.mealPlanId, input.id))
          .orderBy(asc(mealPlanDays.dayNumber));
        
        // Buscar refeições de cada dia
        const daysWithMeals = await Promise.all(days.map(async (day: typeof days[0]) => {
          const dayMeals = await db.select()
            .from(meals)
            .where(eq(meals.mealPlanDayId, day.id))
            .orderBy(asc(meals.sortOrder));
          
          // Buscar itens de cada refeição
          const mealsWithItems = await Promise.all(dayMeals.map(async (meal: typeof dayMeals[0]) => {
            const items = await db.select({
              id: mealItems.id,
              quantity: mealItems.quantity,
              unit: mealItems.unit,
              calories: mealItems.calories,
              protein: mealItems.protein,
              carbs: mealItems.carbs,
              fat: mealItems.fat,
              fiber: mealItems.fiber,
              notes: mealItems.notes,
              food: {
                id: foods.id,
                name: foods.name,
              },
            })
              .from(mealItems)
              .leftJoin(foods, eq(mealItems.foodId, foods.id))
              .where(eq(mealItems.mealId, meal.id))
              .orderBy(asc(mealItems.sortOrder));
            
            return { ...meal, items };
          }));
          
          return { ...day, meals: mealsWithItems };
        }));
        
        // Buscar dados do aluno
        const student = await db.select({
          id: students.id,
          name: students.name,
        })
          .from(students)
          .where(eq(students.id, plan[0].studentId))
          .limit(1);
        
        return { ...plan[0], days: daysWithMeals, student: student[0] };
      }),
    
    // Criar plano alimentar
    create: nutritionProcedure
      .input(z.object({
        studentId: z.number(),
        name: z.string().min(2),
        description: z.string().optional(),
        objective: z.enum([
          'weight_loss', 'muscle_gain', 'maintenance', 'recomposition', 
          'bulking', 'cutting', 'health', 'sports_performance', 'therapeutic'
        ]).default('maintenance'),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        targetCalories: z.number().optional(),
        targetProtein: z.number().optional(),
        targetCarbs: z.number().optional(),
        targetFat: z.number().optional(),
        targetFiber: z.number().optional(),
        mealsPerDay: z.number().default(5),
        restrictions: z.array(z.string()).optional(),
        allergies: z.array(z.string()).optional(),
        preferences: z.array(z.string()).optional(),
        dislikes: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        const { restrictions, allergies, preferences, dislikes, startDate, endDate, ...planData } = input;
        
        const [result] = await db.insert(mealPlans).values({
          ...planData,
          personalId: ctx.personal.id,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          restrictions: restrictions ? JSON.stringify(restrictions) : null,
          allergies: allergies ? JSON.stringify(allergies) : null,
          preferences: preferences ? JSON.stringify(preferences) : null,
          dislikes: dislikes ? JSON.stringify(dislikes) : null,
          status: 'draft',
        });
        
        return { id: result.insertId };
      }),
    
    // Atualizar status do plano
    updateStatus: nutritionProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['draft', 'active', 'paused', 'completed', 'archived']),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        await db.update(mealPlans)
          .set({ status: input.status })
          .where(and(eq(mealPlans.id, input.id), eq(mealPlans.personalId, ctx.personal.id)));
        
        return { success: true };
      }),
    
    // Gerar plano com IA
    generateWithAI: nutritionProcedure
      .input(z.object({
        studentId: z.number(),
        objective: z.enum([
          'weight_loss', 'muscle_gain', 'maintenance', 'recomposition', 
          'bulking', 'cutting', 'health', 'sports_performance', 'therapeutic'
        ]),
        targetCalories: z.number().optional(),
        mealsPerDay: z.number().default(5),
        restrictions: z.array(z.string()).optional(),
        allergies: z.array(z.string()).optional(),
        preferences: z.array(z.string()).optional(),
        dislikes: z.array(z.string()).optional(),
        additionalNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        // Buscar dados do aluno
        const student = await db.select()
          .from(students)
          .where(and(eq(students.id, input.studentId), eq(students.personalId, ctx.personal.id)))
          .limit(1);
        
        if (!student[0]) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        }
        
        // Buscar última medida
        const lastMeasurement = await db.select()
          .from(measurements)
          .where(eq(measurements.studentId, input.studentId))
          .orderBy(desc(measurements.measureDate))
          .limit(1);
        
        // Buscar anamnese
        const studentAnamnesis = await db.select()
          .from(anamneses)
          .where(eq(anamneses.studentId, input.studentId))
          .limit(1);
        
        // Montar contexto
        const weight = lastMeasurement[0]?.weight || '70';
        const height = lastMeasurement[0]?.height || '170';
        const age = student[0].birthDate 
          ? Math.floor((Date.now() - new Date(student[0].birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : 30;
        const gender = student[0].gender || 'male';
        
        const objectiveMap: Record<string, string> = {
          weight_loss: 'Perda de peso',
          muscle_gain: 'Ganho de massa muscular',
          maintenance: 'Manutenção',
          recomposition: 'Recomposição corporal',
          bulking: 'Bulking (ganho de massa)',
          cutting: 'Cutting (definição)',
          health: 'Saúde geral',
          sports_performance: 'Performance esportiva',
          therapeutic: 'Terapêutico',
        };
        
        const prompt = `Você é um nutricionista especializado em nutrição esportiva. Crie um plano alimentar completo para 7 dias.

DADOS DO PACIENTE:
- Nome: ${student[0].name}
- Idade: ${age} anos
- Sexo: ${gender === 'male' ? 'Masculino' : 'Feminino'}
- Peso: ${weight} kg
- Altura: ${height} cm
- Objetivo: ${objectiveMap[input.objective]}
${input.targetCalories ? `- Meta calórica: ${input.targetCalories} kcal/dia` : ''}
${input.restrictions?.length ? `- Restrições: ${input.restrictions.join(', ')}` : ''}
${input.allergies?.length ? `- Alergias: ${input.allergies.join(', ')}` : ''}
${input.preferences?.length ? `- Preferências: ${input.preferences.join(', ')}` : ''}
${input.dislikes?.length ? `- Não gosta de: ${input.dislikes.join(', ')}` : ''}
${input.additionalNotes ? `- Observações: ${input.additionalNotes}` : ''}
${studentAnamnesis[0]?.lifestyle ? `- Nível de atividade: ${studentAnamnesis[0].lifestyle}` : ''}

Crie um plano com ${input.mealsPerDay} refeições por dia.

Retorne em formato JSON com a seguinte estrutura:
{
  "name": "Nome do plano",
  "description": "Descrição breve",
  "targetCalories": número,
  "targetProtein": número em gramas,
  "targetCarbs": número em gramas,
  "targetFat": número em gramas,
  "days": [
    {
      "dayOfWeek": "monday",
      "meals": [
        {
          "name": "Café da manhã",
          "mealType": "breakfast",
          "scheduledTime": "07:00",
          "items": [
            {
              "foodName": "Nome do alimento",
              "quantity": 100,
              "unit": "g",
              "calories": 150,
              "protein": 10,
              "carbs": 20,
              "fat": 5
            }
          ]
        }
      ]
    }
  ]
}

Use alimentos brasileiros comuns e acessíveis. Seja específico nas quantidades.`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'Você é um nutricionista especializado. Responda apenas com JSON válido.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' }
        });
        
        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao gerar plano' });
        }
        
        try {
          const planData = JSON.parse(content as string);
          
          // Criar o plano no banco
          const [planResult] = await db.insert(mealPlans).values({
            personalId: ctx.personal.id,
            studentId: input.studentId,
            name: planData.name || `Plano ${objectiveMap[input.objective]}`,
            description: planData.description,
            objective: input.objective,
            status: 'draft',
            targetCalories: planData.targetCalories,
            targetProtein: planData.targetProtein,
            targetCarbs: planData.targetCarbs,
            targetFat: planData.targetFat,
            mealsPerDay: input.mealsPerDay,
            restrictions: input.restrictions ? JSON.stringify(input.restrictions) : null,
            allergies: input.allergies ? JSON.stringify(input.allergies) : null,
            generatedByAI: true,
            aiPrompt: prompt,
          });
          
          const planId = planResult.insertId;
          
          // Criar dias e refeições
          for (let i = 0; i < planData.days.length; i++) {
            const day = planData.days[i];
            
            const [dayResult] = await db.insert(mealPlanDays).values({
              mealPlanId: planId,
              dayOfWeek: day.dayOfWeek,
              dayNumber: i + 1,
              totalCalories: day.meals.reduce((sum: number, m: any) => 
                sum + m.items.reduce((s: number, item: any) => s + (item.calories || 0), 0), 0).toString(),
              totalProtein: day.meals.reduce((sum: number, m: any) => 
                sum + m.items.reduce((s: number, item: any) => s + (item.protein || 0), 0), 0).toString(),
              totalCarbs: day.meals.reduce((sum: number, m: any) => 
                sum + m.items.reduce((s: number, item: any) => s + (item.carbs || 0), 0), 0).toString(),
              totalFat: day.meals.reduce((sum: number, m: any) => 
                sum + m.items.reduce((s: number, item: any) => s + (item.fat || 0), 0), 0).toString(),
            });
            
            const dayId = dayResult.insertId;
            
            // Criar refeições
            for (let j = 0; j < day.meals.length; j++) {
              const meal = day.meals[j];
              
              const [mealResult] = await db.insert(meals).values({
                mealPlanDayId: dayId,
                name: meal.name,
                mealType: meal.mealType,
                scheduledTime: meal.scheduledTime,
                totalCalories: meal.items.reduce((s: number, item: any) => s + (item.calories || 0), 0).toString(),
                totalProtein: meal.items.reduce((s: number, item: any) => s + (item.protein || 0), 0).toString(),
                totalCarbs: meal.items.reduce((s: number, item: any) => s + (item.carbs || 0), 0).toString(),
                totalFat: meal.items.reduce((s: number, item: any) => s + (item.fat || 0), 0).toString(),
                sortOrder: j,
              });
              
              const mealId = mealResult.insertId;
              
              // Criar itens (sem vincular a alimentos do banco por enquanto)
              for (let k = 0; k < meal.items.length; k++) {
                const item = meal.items[k];
                
                await db.insert(mealItems).values({
                  mealId,
                  quantity: item.quantity.toString(),
                  unit: item.unit,
                  calories: item.calories?.toString(),
                  protein: item.protein?.toString(),
                  carbs: item.carbs?.toString(),
                  fat: item.fat?.toString(),
                  notes: item.foodName, // Guardar nome do alimento nas notas
                  sortOrder: k,
                });
              }
            }
          }
          
          return { id: planId, name: planData.name };
        } catch (e) {
          console.error('Erro ao processar plano:', e);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao processar plano gerado' });
        }
      }),
    
    // Deletar plano
    delete: nutritionProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        // Verificar se pertence ao personal
        const plan = await db.select()
          .from(mealPlans)
          .where(and(eq(mealPlans.id, input.id), eq(mealPlans.personalId, ctx.personal.id)))
          .limit(1);
        
        if (!plan[0]) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Plano não encontrado' });
        }
        
        // Deletar em cascata (dias -> refeições -> itens)
        const days = await db.select().from(mealPlanDays).where(eq(mealPlanDays.mealPlanId, input.id));
        
        for (const day of days) {
          const dayMeals = await db.select().from(meals).where(eq(meals.mealPlanDayId, day.id));
          
          for (const meal of dayMeals) {
            await db.delete(mealItems).where(eq(mealItems.mealId, meal.id));
          }
          
          await db.delete(meals).where(eq(meals.mealPlanDayId, day.id));
        }
        
        await db.delete(mealPlanDays).where(eq(mealPlanDays.mealPlanId, input.id));
        await db.delete(mealPlans).where(eq(mealPlans.id, input.id));
        
        return { success: true };
      }),
  }),

  // ==================== NUTRITION ASSESSMENTS (Avaliações Nutricionais) ====================
  assessments: router({
    // Listar avaliações de um aluno
    list: nutritionProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        return await db.select()
          .from(nutritionAssessments)
          .where(and(
            eq(nutritionAssessments.studentId, input.studentId),
            eq(nutritionAssessments.personalId, ctx.personal.id)
          ))
          .orderBy(desc(nutritionAssessments.assessmentDate));
      }),
    
    // Criar avaliação
    create: nutritionProcedure
      .input(z.object({
        studentId: z.number(),
        assessmentDate: z.string(),
        height: z.string().optional(),
        weight: z.string().optional(),
        bodyFatPercentage: z.string().optional(),
        muscleMass: z.string().optional(),
        waistCircumference: z.string().optional(),
        hipCircumference: z.string().optional(),
        activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
        assessmentMethod: z.enum(['bioimpedance', 'skinfold', 'dexa', 'hydrostatic', 'visual', 'other']).optional(),
        clinicalObservations: z.string().optional(),
        dietaryRecommendations: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        const { assessmentDate, height, weight, ...data } = input;
        
        // Calcular BMI e BMR
        let bmi: string | undefined;
        let bmr: number | undefined;
        let tdee: number | undefined;
        
        if (weight && height) {
          const w = parseFloat(weight);
          const h = parseFloat(height) / 100;
          if (w > 0 && h > 0) {
            bmi = (w / (h * h)).toFixed(2);
            
            // Buscar dados do aluno para BMR
            const student = await db.select()
              .from(students)
              .where(eq(students.id, input.studentId))
              .limit(1);
            
            if (student[0]) {
              const age = student[0].birthDate 
                ? Math.floor((Date.now() - new Date(student[0].birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                : 30;
              const gender = student[0].gender || 'male';
              
              // Mifflin-St Jeor
              if (gender === 'male') {
                bmr = Math.round(10 * w + 6.25 * parseFloat(height) - 5 * age + 5);
              } else {
                bmr = Math.round(10 * w + 6.25 * parseFloat(height) - 5 * age - 161);
              }
              
              // TDEE
              const activityMultipliers: Record<string, number> = {
                sedentary: 1.2,
                light: 1.375,
                moderate: 1.55,
                active: 1.725,
                very_active: 1.9,
              };
              const multiplier = activityMultipliers[data.activityLevel || 'moderate'];
              tdee = Math.round(bmr * multiplier);
            }
          }
        }
        
        // Classificação do BMI
        let bmiClassification: string | undefined;
        if (bmi) {
          const bmiValue = parseFloat(bmi);
          if (bmiValue < 18.5) bmiClassification = 'Baixo peso';
          else if (bmiValue < 25) bmiClassification = 'Normal';
          else if (bmiValue < 30) bmiClassification = 'Sobrepeso';
          else if (bmiValue < 35) bmiClassification = 'Obesidade Grau I';
          else if (bmiValue < 40) bmiClassification = 'Obesidade Grau II';
          else bmiClassification = 'Obesidade Grau III';
        }
        
        // Relação cintura/quadril
        let waistHipRatio: string | undefined;
        if (data.waistCircumference && data.hipCircumference) {
          const waist = parseFloat(data.waistCircumference);
          const hip = parseFloat(data.hipCircumference);
          if (waist > 0 && hip > 0) {
            waistHipRatio = (waist / hip).toFixed(3);
          }
        }
        
        const [result] = await db.insert(nutritionAssessments).values({
          ...data,
          studentId: input.studentId,
          personalId: ctx.personal.id,
          assessmentDate: new Date(assessmentDate),
          height,
          weight,
          bmi,
          bmiClassification,
          bmr,
          bmrFormula: 'mifflin_st_jeor',
          tdee,
          waistHipRatio,
        });
        
        return { id: result.insertId };
      }),
  }),

  // ==================== LAB EXAMS (Exames Laboratoriais) ====================
  labExams: router({
    // Listar exames de um aluno
    list: nutritionProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        return await db.select()
          .from(labExams)
          .where(and(
            eq(labExams.studentId, input.studentId),
            eq(labExams.personalId, ctx.personal.id)
          ))
          .orderBy(desc(labExams.examDate));
      }),
    
    // Obter exame por ID
    get: nutritionProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        const exam = await db.select()
          .from(labExams)
          .where(and(eq(labExams.id, input.id), eq(labExams.personalId, ctx.personal.id)))
          .limit(1);
        
        if (!exam[0]) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Exame não encontrado' });
        }
        
        return exam[0];
      }),
    
    // Criar exame
    create: nutritionProcedure
      .input(z.object({
        studentId: z.number(),
        examDate: z.string(),
        labName: z.string().optional(),
        // Hemograma
        hemoglobin: z.string().optional(),
        hematocrit: z.string().optional(),
        // Perfil lipídico
        totalCholesterol: z.string().optional(),
        hdlCholesterol: z.string().optional(),
        ldlCholesterol: z.string().optional(),
        triglycerides: z.string().optional(),
        // Glicemia
        fastingGlucose: z.string().optional(),
        hba1c: z.string().optional(),
        insulin: z.string().optional(),
        // Função renal
        creatinine: z.string().optional(),
        urea: z.string().optional(),
        uricAcid: z.string().optional(),
        // Função hepática
        ast: z.string().optional(),
        alt: z.string().optional(),
        ggt: z.string().optional(),
        // Tireoide
        tsh: z.string().optional(),
        t4Free: z.string().optional(),
        // Vitaminas
        vitaminD: z.string().optional(),
        vitaminB12: z.string().optional(),
        ferritin: z.string().optional(),
        // Hormônios
        testosterone: z.string().optional(),
        cortisol: z.string().optional(),
        // Inflamação
        crp: z.string().optional(),
        // Arquivo
        fileUrl: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        const { examDate, ...data } = input;
        
        const [result] = await db.insert(labExams).values({
          ...data,
          personalId: ctx.personal.id,
          examDate: new Date(examDate),
        });
        
        return { id: result.insertId };
      }),
    
    // Interpretar exames com IA
    interpretWithAI: nutritionProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        const exam = await db.select()
          .from(labExams)
          .where(and(eq(labExams.id, input.id), eq(labExams.personalId, ctx.personal.id)))
          .limit(1);
        
        if (!exam[0]) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Exame não encontrado' });
        }
        
        // Buscar dados do aluno
        const student = await db.select()
          .from(students)
          .where(eq(students.id, exam[0].studentId))
          .limit(1);
        
        const examData = exam[0];
        const examValues: string[] = [];
        
        if (examData.hemoglobin) examValues.push(`Hemoglobina: ${examData.hemoglobin} g/dL`);
        if (examData.totalCholesterol) examValues.push(`Colesterol Total: ${examData.totalCholesterol} mg/dL`);
        if (examData.hdlCholesterol) examValues.push(`HDL: ${examData.hdlCholesterol} mg/dL`);
        if (examData.ldlCholesterol) examValues.push(`LDL: ${examData.ldlCholesterol} mg/dL`);
        if (examData.triglycerides) examValues.push(`Triglicerídeos: ${examData.triglycerides} mg/dL`);
        if (examData.fastingGlucose) examValues.push(`Glicemia de jejum: ${examData.fastingGlucose} mg/dL`);
        if (examData.hba1c) examValues.push(`HbA1c: ${examData.hba1c}%`);
        if (examData.tsh) examValues.push(`TSH: ${examData.tsh} mUI/L`);
        if (examData.vitaminD) examValues.push(`Vitamina D: ${examData.vitaminD} ng/mL`);
        if (examData.vitaminB12) examValues.push(`Vitamina B12: ${examData.vitaminB12} pg/mL`);
        if (examData.ferritin) examValues.push(`Ferritina: ${examData.ferritin} ng/mL`);
        if (examData.crp) examValues.push(`PCR: ${examData.crp} mg/L`);
        
        const prompt = `Você é um nutricionista especializado em interpretação de exames laboratoriais.

PACIENTE: ${student[0]?.name || 'Não informado'}
SEXO: ${student[0]?.gender === 'male' ? 'Masculino' : student[0]?.gender === 'female' ? 'Feminino' : 'Não informado'}

RESULTADOS DOS EXAMES:
${examValues.join('\n')}

Forneça uma interpretação nutricional dos exames, incluindo:
1. Valores fora da faixa de referência
2. Possíveis deficiências nutricionais
3. Recomendações alimentares específicas
4. Suplementação que pode ser considerada (se aplicável)
5. Alertas importantes

Seja objetivo e prático. Lembre-se que você é um nutricionista, não um médico.`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'Você é um nutricionista especializado em análise de exames laboratoriais. Responda em português brasileiro.' },
            { role: 'user', content: prompt }
          ]
        });
        
        const interpretation = response.choices[0]?.message?.content || 'Não foi possível gerar a interpretação.';
        
        // Salvar interpretação
        await db.update(labExams)
          .set({ aiInterpretation: interpretation as string })
          .where(eq(labExams.id, input.id));
        
        return { interpretation };
      }),
  }),

  // ==================== NUTRITION ANAMNESIS (Anamnese Nutricional) ====================
  anamnesis: router({
    // Obter anamnese nutricional de um aluno
    get: nutritionProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        const anamnesis = await db.select()
          .from(nutritionAnamneses)
          .where(and(
            eq(nutritionAnamneses.studentId, input.studentId),
            eq(nutritionAnamneses.personalId, ctx.personal.id)
          ))
          .orderBy(desc(nutritionAnamneses.createdAt))
          .limit(1);
        
        return anamnesis[0] || null;
      }),
    
    // Criar ou atualizar anamnese nutricional
    upsert: nutritionProcedure
      .input(z.object({
        studentId: z.number(),
        // Histórico alimentar
        previousDiets: z.array(z.string()).optional(),
        dietHistory: z.string().optional(),
        eatingDisorderHistory: z.boolean().optional(),
        eatingDisorderDetails: z.string().optional(),
        // Hábitos alimentares
        mealsPerDay: z.number().optional(),
        mealTimes: z.record(z.string(), z.string()).optional(),
        eatingSpeed: z.enum(['very_fast', 'fast', 'normal', 'slow', 'very_slow']).optional(),
        chewingQuality: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
        screenWhileEating: z.boolean().optional(),
        // Preferências
        favoritesFoods: z.array(z.string()).optional(),
        dislikedFoods: z.array(z.string()).optional(),
        foodCravings: z.string().optional(),
        // Intolerâncias e alergias
        foodIntolerances: z.array(z.string()).optional(),
        foodAllergies: z.array(z.string()).optional(),
        // Restrições
        dietaryRestrictions: z.array(z.string()).optional(),
        // Líquidos
        waterIntakeLiters: z.string().optional(),
        alcoholConsumption: z.enum(['none', 'occasional', 'moderate', 'frequent']).optional(),
        // Suplementação
        currentSupplements: z.array(z.string()).optional(),
        // Sintomas GI
        digestiveIssues: z.array(z.string()).optional(),
        bowelFrequency: z.string().optional(),
        // Apetite
        appetiteLevel: z.enum(['very_low', 'low', 'normal', 'high', 'very_high']).optional(),
        emotionalEating: z.boolean().optional(),
        emotionalEatingTriggers: z.string().optional(),
        // Cozinha
        cookingSkills: z.enum(['none', 'basic', 'intermediate', 'advanced']).optional(),
        cookingFrequency: z.enum(['never', 'rarely', 'sometimes', 'often', 'always']).optional(),
        mealPrepTime: z.number().optional(),
        // Orçamento
        monthlyFoodBudget: z.string().optional(),
        budgetPriority: z.enum(['very_limited', 'limited', 'moderate', 'flexible', 'unlimited']).optional(),
        // Rotina
        eatingOutFrequency: z.enum(['never', 'rarely', 'weekly', 'often', 'daily']).optional(),
        deliveryFrequency: z.enum(['never', 'rarely', 'weekly', 'often', 'daily']).optional(),
        // Objetivos
        nutritionGoals: z.array(z.string()).optional(),
        expectedResults: z.string().optional(),
        timeline: z.string().optional(),
        // Observações
        additionalNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        const { studentId, previousDiets, mealTimes, favoritesFoods, dislikedFoods, 
          foodIntolerances, foodAllergies, dietaryRestrictions, currentSupplements,
          digestiveIssues, nutritionGoals, ...data } = input;
        
        // Verificar se já existe
        const existing = await db.select()
          .from(nutritionAnamneses)
          .where(and(
            eq(nutritionAnamneses.studentId, studentId),
            eq(nutritionAnamneses.personalId, ctx.personal.id)
          ))
          .limit(1);
        
        const jsonData = {
          previousDiets: previousDiets ? JSON.stringify(previousDiets) : null,
          mealTimes: mealTimes ? JSON.stringify(mealTimes) : null,
          favoritesFoods: favoritesFoods ? JSON.stringify(favoritesFoods) : null,
          dislikedFoods: dislikedFoods ? JSON.stringify(dislikedFoods) : null,
          foodIntolerances: foodIntolerances ? JSON.stringify(foodIntolerances) : null,
          foodAllergies: foodAllergies ? JSON.stringify(foodAllergies) : null,
          dietaryRestrictions: dietaryRestrictions ? JSON.stringify(dietaryRestrictions) : null,
          currentSupplements: currentSupplements ? JSON.stringify(currentSupplements) : null,
          digestiveIssues: digestiveIssues ? JSON.stringify(digestiveIssues) : null,
          nutritionGoals: nutritionGoals ? JSON.stringify(nutritionGoals) : null,
        };
        
        if (existing[0]) {
          await db.update(nutritionAnamneses)
            .set({ ...data, ...jsonData, version: (existing[0].version || 1) + 1 })
            .where(eq(nutritionAnamneses.id, existing[0].id));
          
          return { id: existing[0].id };
        } else {
          const [result] = await db.insert(nutritionAnamneses).values({
            ...data,
            ...jsonData,
            studentId,
            personalId: ctx.personal.id,
          });
          
          return { id: result.insertId };
        }
      }),
  }),

  // ==================== SETTINGS (Configurações) ====================
  settings: router({
    // Obter configurações
    get: nutritionProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      const settings = await db.select()
        .from(nutritionSettings)
        .where(eq(nutritionSettings.personalId, ctx.personal.id))
        .limit(1);
      
      return settings[0] || null;
    }),
    
    // Salvar configurações
    save: nutritionProcedure
      .input(z.object({
        defaultBmrFormula: z.enum(['mifflin_st_jeor', 'harris_benedict', 'katch_mcardle', 'cunningham']).optional(),
        defaultActivityMultiplier: z.string().optional(),
        defaultProteinPercentage: z.number().optional(),
        defaultCarbsPercentage: z.number().optional(),
        defaultFatPercentage: z.number().optional(),
        proteinPerKgWeightLoss: z.string().optional(),
        proteinPerKgMuscleGain: z.string().optional(),
        proteinPerKgMaintenance: z.string().optional(),
        defaultCaloricDeficit: z.number().optional(),
        defaultCaloricSurplus: z.number().optional(),
        defaultMealsPerDay: z.number().optional(),
        defaultMealNames: z.array(z.string()).optional(),
        trainingDayCaloriesBonus: z.number().optional(),
        trainingDayCarbsBonus: z.number().optional(),
        showMicronutrients: z.boolean().optional(),
        showGlycemicIndex: z.boolean().optional(),
        preferredFoodDatabase: z.enum(['taco', 'usda', 'both']).optional(),
        sendMealReminders: z.boolean().optional(),
        sendWeeklyReport: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        const { defaultMealNames, ...data } = input;
        
        const existing = await db.select()
          .from(nutritionSettings)
          .where(eq(nutritionSettings.personalId, ctx.personal.id))
          .limit(1);
        
        const jsonData = {
          defaultMealNames: defaultMealNames ? JSON.stringify(defaultMealNames) : undefined,
        };
        
        if (existing[0]) {
          await db.update(nutritionSettings)
            .set({ ...data, ...jsonData })
            .where(eq(nutritionSettings.personalId, ctx.personal.id));
          
          return { id: existing[0].id };
        } else {
          const [result] = await db.insert(nutritionSettings).values({
            ...data,
            ...jsonData,
            personalId: ctx.personal.id,
          });
          
          return { id: result.insertId };
        }
      }),
  }),

  // ==================== DASHBOARD (Estatísticas) ====================
  dashboard: router({
    // Estatísticas gerais
    stats: nutritionProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      const [
        totalPlans,
        activePlans,
        totalRecipes,
        totalCustomFoods,
        totalAssessments,
      ] = await Promise.all([
        db.select({ count: sql<number>`count(*)` })
          .from(mealPlans)
          .where(eq(mealPlans.personalId, ctx.personal.id)),
        db.select({ count: sql<number>`count(*)` })
          .from(mealPlans)
          .where(and(eq(mealPlans.personalId, ctx.personal.id), eq(mealPlans.status, 'active'))),
        db.select({ count: sql<number>`count(*)` })
          .from(recipes)
          .where(and(eq(recipes.personalId, ctx.personal.id), eq(recipes.isActive, true))),
        db.select({ count: sql<number>`count(*)` })
          .from(foods)
          .where(and(eq(foods.personalId, ctx.personal.id), eq(foods.isActive, true))),
        db.select({ count: sql<number>`count(*)` })
          .from(nutritionAssessments)
          .where(eq(nutritionAssessments.personalId, ctx.personal.id)),
      ]);
      
      return {
        totalPlans: totalPlans[0]?.count || 0,
        activePlans: activePlans[0]?.count || 0,
        totalRecipes: totalRecipes[0]?.count || 0,
        totalCustomFoods: totalCustomFoods[0]?.count || 0,
        totalAssessments: totalAssessments[0]?.count || 0,
      };
    }),
    
    // Planos recentes
    recentPlans: nutritionProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      return await db.select({
        id: mealPlans.id,
        name: mealPlans.name,
        status: mealPlans.status,
        objective: mealPlans.objective,
        createdAt: mealPlans.createdAt,
        student: {
          id: students.id,
          name: students.name,
        }
      })
        .from(mealPlans)
        .innerJoin(students, eq(mealPlans.studentId, students.id))
        .where(eq(mealPlans.personalId, ctx.personal.id))
        .orderBy(desc(mealPlans.createdAt))
        .limit(5);
    }),
  }),
});
