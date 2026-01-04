/**
 * Script para criar templates de planos alimentares pré-definidos
 * 
 * Templates disponíveis:
 * - Low Carb
 * - Cutting (Definição)
 * - Bulking (Ganho de massa)
 * - Manutenção
 * - Cetogênica
 * - Vegetariano
 * - Alto Proteína
 * - Jejum Intermitente 16:8
 * 
 * Uso: node scripts/seed-meal-plan-templates.mjs
 */

import mysql from 'mysql2/promise';

const templates = [
  {
    name: "Low Carb - Redução de Carboidratos",
    description: "Plano alimentar com redução significativa de carboidratos, ideal para perda de gordura e controle glicêmico. Foco em proteínas, gorduras saudáveis e vegetais de baixo índice glicêmico.",
    objective: "weight_loss",
    proteinPerKg: 2.0,
    carbsPerKg: 1.0,
    fatPerKg: 1.0,
    calorieDeficit: 300,
    calorieSurplus: 0,
    mealsPerDay: 4,
    includeSnacks: true,
    restrictions: JSON.stringify(["low_carb"]),
    preferences: JSON.stringify(["carnes", "ovos", "queijos", "vegetais verdes", "abacate", "oleaginosas"]),
    dislikes: JSON.stringify(["pão", "arroz", "massas", "açúcar", "frutas doces"]),
    notes: "Manter carboidratos abaixo de 100g/dia. Priorizar carboidratos de vegetais fibrosos. Aumentar consumo de água.",
    tags: JSON.stringify(["low_carb", "perda_peso", "controle_glicemico"]),
    difficulty: "intermediate",
    duration: "12_weeks"
  },
  {
    name: "Cutting - Definição Muscular",
    description: "Plano para fase de cutting com déficit calórico moderado, alta proteína para preservar massa muscular e carboidratos estratégicos ao redor do treino.",
    objective: "cutting",
    proteinPerKg: 2.2,
    carbsPerKg: 2.0,
    fatPerKg: 0.8,
    calorieDeficit: 400,
    calorieSurplus: 0,
    mealsPerDay: 5,
    includeSnacks: true,
    restrictions: JSON.stringify([]),
    preferences: JSON.stringify(["frango", "peixe", "clara de ovo", "arroz integral", "batata doce", "vegetais"]),
    dislikes: JSON.stringify(["frituras", "doces", "refrigerantes", "fast food"]),
    adjustForTraining: true,
    trainingDayCaloriesBonus: 200,
    trainingDayCarbsBonus: 50,
    notes: "Carboidratos concentrados no pré e pós-treino. Proteína distribuída ao longo do dia. Déficit moderado para preservar massa magra.",
    tags: JSON.stringify(["cutting", "definicao", "competicao", "alta_proteina"]),
    difficulty: "advanced",
    duration: "8_weeks"
  },
  {
    name: "Bulking - Ganho de Massa",
    description: "Plano para fase de bulking com superávit calórico controlado, foco em ganho de massa muscular com mínimo acúmulo de gordura.",
    objective: "bulking",
    proteinPerKg: 2.0,
    carbsPerKg: 4.0,
    fatPerKg: 1.0,
    calorieDeficit: 0,
    calorieSurplus: 400,
    mealsPerDay: 6,
    includeSnacks: true,
    restrictions: JSON.stringify([]),
    preferences: JSON.stringify(["arroz", "macarrão", "batata", "frango", "carne vermelha", "ovos", "leite", "aveia"]),
    dislikes: JSON.stringify([]),
    adjustForTraining: true,
    trainingDayCaloriesBonus: 300,
    trainingDayCarbsBonus: 80,
    notes: "Superávit calórico de 300-500 kcal. Carboidratos complexos como base energética. Proteína de alta qualidade em todas as refeições.",
    tags: JSON.stringify(["bulking", "ganho_massa", "hipertrofia", "alto_carbo"]),
    difficulty: "intermediate",
    duration: "16_weeks"
  },
  {
    name: "Manutenção - Equilíbrio",
    description: "Plano equilibrado para manutenção do peso e composição corporal. Distribuição balanceada de macronutrientes.",
    objective: "maintenance",
    proteinPerKg: 1.8,
    carbsPerKg: 3.0,
    fatPerKg: 1.0,
    calorieDeficit: 0,
    calorieSurplus: 0,
    mealsPerDay: 5,
    includeSnacks: true,
    restrictions: JSON.stringify([]),
    preferences: JSON.stringify([]),
    dislikes: JSON.stringify([]),
    adjustForTraining: true,
    trainingDayCaloriesBonus: 150,
    trainingDayCarbsBonus: 30,
    notes: "Plano flexível para manutenção. Ajustar conforme atividade física e objetivos específicos.",
    tags: JSON.stringify(["manutencao", "equilibrado", "flexivel"]),
    difficulty: "beginner",
    duration: "ongoing"
  },
  {
    name: "Cetogênica - Keto",
    description: "Dieta cetogênica com muito baixo carboidrato, alta gordura e proteína moderada. Induz estado de cetose para queima de gordura.",
    objective: "weight_loss",
    proteinPerKg: 1.8,
    carbsPerKg: 0.3,
    fatPerKg: 1.8,
    calorieDeficit: 200,
    calorieSurplus: 0,
    mealsPerDay: 3,
    includeSnacks: false,
    restrictions: JSON.stringify(["keto", "low_carb", "no_sugar"]),
    preferences: JSON.stringify(["bacon", "ovos", "queijos", "abacate", "azeite", "manteiga", "carnes gordas", "peixes"]),
    dislikes: JSON.stringify(["pão", "arroz", "massas", "frutas", "legumes", "açúcar", "mel"]),
    notes: "Carboidratos máximo 20-30g/dia. Foco em gorduras saudáveis. Suplementar eletrólitos. Período de adaptação de 2-4 semanas.",
    tags: JSON.stringify(["keto", "cetogenica", "low_carb", "alto_gordura"]),
    difficulty: "advanced",
    duration: "12_weeks"
  },
  {
    name: "Vegetariano - Sem Carne",
    description: "Plano alimentar vegetariano equilibrado, com fontes proteicas de origem vegetal e laticínios. Adequado para quem não consome carne.",
    objective: "health",
    proteinPerKg: 1.8,
    carbsPerKg: 3.5,
    fatPerKg: 1.0,
    calorieDeficit: 0,
    calorieSurplus: 0,
    mealsPerDay: 5,
    includeSnacks: true,
    restrictions: JSON.stringify(["vegetarian"]),
    preferences: JSON.stringify(["ovos", "queijos", "leite", "tofu", "leguminosas", "quinoa", "grão de bico", "lentilha"]),
    dislikes: JSON.stringify(["carne vermelha", "frango", "peixe", "frutos do mar"]),
    notes: "Combinar leguminosas com cereais para proteína completa. Atenção à vitamina B12 e ferro. Considerar suplementação.",
    tags: JSON.stringify(["vegetariano", "sem_carne", "plant_based"]),
    difficulty: "intermediate",
    duration: "ongoing"
  },
  {
    name: "Alto Proteína - Hipertrofia",
    description: "Plano com alta ingestão proteica para maximizar síntese muscular. Ideal para atletas e praticantes de musculação intenso.",
    objective: "muscle_gain",
    proteinPerKg: 2.5,
    carbsPerKg: 3.0,
    fatPerKg: 0.9,
    calorieDeficit: 0,
    calorieSurplus: 200,
    mealsPerDay: 6,
    includeSnacks: true,
    restrictions: JSON.stringify([]),
    preferences: JSON.stringify(["frango", "carne vermelha", "peixe", "ovos", "whey", "queijo cottage", "iogurte grego"]),
    dislikes: JSON.stringify([]),
    adjustForTraining: true,
    trainingDayCaloriesBonus: 250,
    trainingDayCarbsBonus: 40,
    notes: "Proteína distribuída em 5-6 refeições de 30-40g cada. Priorizar proteínas de alto valor biológico. Pós-treino com proteína rápida.",
    tags: JSON.stringify(["alta_proteina", "hipertrofia", "atletas", "musculacao"]),
    difficulty: "intermediate",
    duration: "12_weeks"
  },
  {
    name: "Jejum Intermitente 16:8",
    description: "Plano adaptado para protocolo de jejum intermitente 16:8. Janela alimentar de 8 horas com refeições concentradas.",
    objective: "weight_loss",
    proteinPerKg: 2.0,
    carbsPerKg: 2.5,
    fatPerKg: 1.0,
    calorieDeficit: 300,
    calorieSurplus: 0,
    mealsPerDay: 3,
    includeSnacks: false,
    restrictions: JSON.stringify(["intermittent_fasting"]),
    preferences: JSON.stringify([]),
    dislikes: JSON.stringify([]),
    adjustForTraining: true,
    trainingDayCaloriesBonus: 100,
    trainingDayCarbsBonus: 30,
    notes: "Janela alimentar das 12h às 20h (ajustável). Primeira refeição quebra o jejum. Última refeição até 20h. Água, café e chá sem açúcar permitidos no jejum.",
    tags: JSON.stringify(["jejum_intermitente", "16_8", "perda_peso", "flexivel"]),
    difficulty: "intermediate",
    duration: "8_weeks"
  },
  {
    name: "Recomposição Corporal",
    description: "Plano para simultânea perda de gordura e ganho de massa muscular. Déficit moderado com alta proteína e ciclagem de carboidratos.",
    objective: "recomposition",
    proteinPerKg: 2.2,
    carbsPerKg: 2.5,
    fatPerKg: 0.9,
    calorieDeficit: 200,
    calorieSurplus: 0,
    mealsPerDay: 5,
    includeSnacks: true,
    restrictions: JSON.stringify([]),
    preferences: JSON.stringify(["proteínas magras", "vegetais", "carboidratos complexos"]),
    dislikes: JSON.stringify(["processados", "açúcar refinado"]),
    adjustForTraining: true,
    trainingDayCaloriesBonus: 300,
    trainingDayCarbsBonus: 60,
    notes: "Dias de treino: mais carboidratos e calorias. Dias de descanso: menos carboidratos, mais gorduras. Proteína alta e constante.",
    tags: JSON.stringify(["recomposicao", "perda_gordura", "ganho_muscular"]),
    difficulty: "advanced",
    duration: "16_weeks"
  },
  {
    name: "Performance Esportiva",
    description: "Plano otimizado para atletas e praticantes de esportes de alta intensidade. Foco em energia, recuperação e performance.",
    objective: "sports_performance",
    proteinPerKg: 2.0,
    carbsPerKg: 5.0,
    fatPerKg: 1.0,
    calorieDeficit: 0,
    calorieSurplus: 300,
    mealsPerDay: 6,
    includeSnacks: true,
    restrictions: JSON.stringify([]),
    preferences: JSON.stringify(["arroz", "macarrão", "batata", "frutas", "mel", "proteínas magras"]),
    dislikes: JSON.stringify(["frituras", "alimentos pesados"]),
    adjustForTraining: true,
    trainingDayCaloriesBonus: 500,
    trainingDayCarbsBonus: 100,
    notes: "Carboidratos como principal fonte de energia. Timing nutricional importante. Hidratação e eletrólitos essenciais.",
    tags: JSON.stringify(["performance", "atletas", "esportes", "alto_carbo", "energia"]),
    difficulty: "advanced",
    duration: "ongoing"
  }
];

async function seedMealPlanTemplates() {
  console.log('🌱 Criando templates de planos alimentares...\n');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL não configurada');
    process.exit(1);
  }
  
  const connection = await mysql.createConnection(databaseUrl);
  console.log('✅ Conectado ao banco de dados\n');
  
  try {
    // Verificar se já existem templates
    const [existing] = await connection.execute(
      "SELECT COUNT(*) as count FROM meal_plan_templates"
    );
    
    if (existing[0].count > 0) {
      console.log(`⚠️  Já existem ${existing[0].count} templates no banco.`);
      console.log('   Pulando criação para evitar duplicatas.\n');
      await connection.end();
      return;
    }
    
    // Inserir templates
    let inserted = 0;
    
    for (const template of templates) {
      await connection.execute(
        `INSERT INTO meal_plan_templates (
          name, description, objective,
          proteinPerKg, carbsPerKg, fatPerKg,
          calorieDeficit, calorieSurplus,
          mealsPerDay, includeSnacks,
          restrictions, preferences, dislikes,
          adjustForTraining, trainingDayCaloriesBonus, trainingDayCarbsBonus,
          notes, tags, difficulty, duration,
          isActive, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [
          template.name,
          template.description,
          template.objective,
          template.proteinPerKg,
          template.carbsPerKg,
          template.fatPerKg,
          template.calorieDeficit || 0,
          template.calorieSurplus || 0,
          template.mealsPerDay,
          template.includeSnacks ? 1 : 0,
          template.restrictions,
          template.preferences,
          template.dislikes,
          template.adjustForTraining ? 1 : 0,
          template.trainingDayCaloriesBonus || 0,
          template.trainingDayCarbsBonus || 0,
          template.notes,
          template.tags,
          template.difficulty,
          template.duration
        ]
      );
      
      inserted++;
      console.log(`   ✅ ${template.name}`);
    }
    
    console.log(`\n✅ ${inserted} templates criados com sucesso!`);
    
  } finally {
    await connection.end();
    console.log('\n🔌 Conexão encerrada.');
  }
}

seedMealPlanTemplates().catch(console.error);
