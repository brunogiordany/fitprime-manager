/**
 * Script para criar perfis de nutrição por tipo de treino
 * 
 * Estes perfis definem ajustes automáticos de macros baseados no tipo de treino do dia
 * 
 * Uso: node scripts/seed-training-nutrition-profiles.mjs
 */

import mysql from 'mysql2/promise';

const profiles = [
  {
    name: "Treino de Força/Hipertrofia",
    trainingType: "strength",
    caloriesAdjustment: 300,
    caloriesAdjustmentPercent: null,
    proteinAdjustment: 10,
    carbsAdjustment: 50,
    fatAdjustment: 0,
    preWorkoutMealTiming: 90,
    postWorkoutMealTiming: 30,
    preWorkoutCarbs: 40,
    preWorkoutProtein: 25,
    postWorkoutCarbs: 60,
    postWorkoutProtein: 40,
    waterIntakeBonus: 0.5,
    notes: "Treino de musculação focado em hipertrofia ou força. Requer mais carboidratos para energia e proteína para recuperação.",
    recommendations: JSON.stringify({
      preWorkout: [
        "Refeição completa 90-120 min antes",
        "Carboidratos complexos (arroz, batata, aveia)",
        "Proteína magra (frango, peixe, ovos)",
        "Evitar gorduras em excesso"
      ],
      postWorkout: [
        "Proteína de rápida absorção (whey, ovos)",
        "Carboidratos de alto IG para repor glicogênio",
        "Janela anabólica: até 2h após treino",
        "Hidratação adequada"
      ],
      supplements: ["Whey protein", "Creatina", "BCAA (opcional)"]
    })
  },
  {
    name: "Cardio Baixa Intensidade",
    trainingType: "cardio_low",
    caloriesAdjustment: 100,
    caloriesAdjustmentPercent: null,
    proteinAdjustment: 0,
    carbsAdjustment: 20,
    fatAdjustment: 5,
    preWorkoutMealTiming: 60,
    postWorkoutMealTiming: 60,
    preWorkoutCarbs: 20,
    preWorkoutProtein: 10,
    postWorkoutCarbs: 30,
    postWorkoutProtein: 20,
    waterIntakeBonus: 0.3,
    notes: "Cardio de baixa intensidade como caminhada, bike leve, natação recreativa. Menor demanda energética.",
    recommendations: JSON.stringify({
      preWorkout: [
        "Lanche leve 30-60 min antes",
        "Pode treinar em jejum se objetivo for queima de gordura",
        "Frutas ou carboidratos leves"
      ],
      postWorkout: [
        "Refeição normal após",
        "Não há necessidade de suplementação específica",
        "Foco em hidratação"
      ],
      supplements: []
    })
  },
  {
    name: "Cardio Alta Intensidade (HIIT)",
    trainingType: "cardio_high",
    caloriesAdjustment: 250,
    caloriesAdjustmentPercent: null,
    proteinAdjustment: 5,
    carbsAdjustment: 40,
    fatAdjustment: 0,
    preWorkoutMealTiming: 120,
    postWorkoutMealTiming: 30,
    preWorkoutCarbs: 35,
    preWorkoutProtein: 15,
    postWorkoutCarbs: 50,
    postWorkoutProtein: 30,
    waterIntakeBonus: 0.7,
    notes: "HIIT, corrida intensa, spinning. Alta demanda de glicogênio e maior estresse metabólico.",
    recommendations: JSON.stringify({
      preWorkout: [
        "Refeição 2h antes com carboidratos",
        "Evitar alimentos pesados",
        "Boa hidratação prévia"
      ],
      postWorkout: [
        "Repor glicogênio rapidamente",
        "Proteína para recuperação muscular",
        "Eletrólitos se treino > 60 min"
      ],
      supplements: ["BCAA", "Eletrólitos", "Whey protein"]
    })
  },
  {
    name: "Treino Misto (Musculação + Cardio)",
    trainingType: "mixed",
    caloriesAdjustment: 350,
    caloriesAdjustmentPercent: null,
    proteinAdjustment: 10,
    carbsAdjustment: 60,
    fatAdjustment: 0,
    preWorkoutMealTiming: 90,
    postWorkoutMealTiming: 30,
    preWorkoutCarbs: 45,
    preWorkoutProtein: 25,
    postWorkoutCarbs: 70,
    postWorkoutProtein: 40,
    waterIntakeBonus: 0.6,
    notes: "Combinação de musculação e cardio no mesmo dia. Maior demanda energética total.",
    recommendations: JSON.stringify({
      preWorkout: [
        "Refeição completa 90 min antes",
        "Carboidratos suficientes para ambas atividades",
        "Proteína moderada"
      ],
      postWorkout: [
        "Priorizar recuperação muscular",
        "Carboidratos para repor glicogênio",
        "Proteína de qualidade"
      ],
      supplements: ["Whey protein", "Creatina", "Maltodextrina"]
    })
  },
  {
    name: "Dia de Descanso",
    trainingType: "rest",
    caloriesAdjustment: -200,
    caloriesAdjustmentPercent: null,
    proteinAdjustment: 0,
    carbsAdjustment: -30,
    fatAdjustment: 10,
    preWorkoutMealTiming: null,
    postWorkoutMealTiming: null,
    preWorkoutCarbs: null,
    preWorkoutProtein: null,
    postWorkoutCarbs: null,
    postWorkoutProtein: null,
    waterIntakeBonus: 0,
    notes: "Dia sem treino. Reduzir carboidratos e calorias totais, manter proteína para recuperação.",
    recommendations: JSON.stringify({
      general: [
        "Manter proteína alta para recuperação",
        "Reduzir carboidratos (menor demanda)",
        "Aumentar gorduras saudáveis",
        "Foco em alimentos anti-inflamatórios"
      ],
      foods: ["Peixes gordos", "Abacate", "Oleaginosas", "Vegetais verdes"],
      supplements: ["Ômega-3", "Vitamina D"]
    })
  },
  {
    name: "Recuperação Ativa",
    trainingType: "active_recovery",
    caloriesAdjustment: 0,
    caloriesAdjustmentPercent: null,
    proteinAdjustment: 5,
    carbsAdjustment: 0,
    fatAdjustment: 5,
    preWorkoutMealTiming: 60,
    postWorkoutMealTiming: 60,
    preWorkoutCarbs: 15,
    preWorkoutProtein: 10,
    postWorkoutCarbs: 20,
    postWorkoutProtein: 20,
    waterIntakeBonus: 0.3,
    notes: "Alongamento, yoga, mobilidade. Foco em recuperação e flexibilidade.",
    recommendations: JSON.stringify({
      general: [
        "Alimentação leve e nutritiva",
        "Alimentos anti-inflamatórios",
        "Boa hidratação",
        "Proteína para reparo tecidual"
      ],
      foods: ["Frutas vermelhas", "Cúrcuma", "Gengibre", "Vegetais coloridos"],
      supplements: ["Colágeno", "Magnésio", "Ômega-3"]
    })
  },
  {
    name: "Treino Esportivo Específico",
    trainingType: "sports",
    caloriesAdjustment: 400,
    caloriesAdjustmentPercent: null,
    proteinAdjustment: 10,
    carbsAdjustment: 80,
    fatAdjustment: 0,
    preWorkoutMealTiming: 120,
    postWorkoutMealTiming: 30,
    preWorkoutCarbs: 60,
    preWorkoutProtein: 20,
    postWorkoutCarbs: 80,
    postWorkoutProtein: 35,
    waterIntakeBonus: 1.0,
    notes: "Treino esportivo (futebol, basquete, natação competitiva, etc.). Alta demanda energética e de recuperação.",
    recommendations: JSON.stringify({
      preWorkout: [
        "Refeição rica em carboidratos 2-3h antes",
        "Lanche leve 30-60 min antes se necessário",
        "Hidratação iniciada horas antes"
      ],
      postWorkout: [
        "Recuperação imediata: carbos + proteína",
        "Refeição completa em até 2h",
        "Reposição de eletrólitos"
      ],
      supplements: ["Isotônico", "Whey protein", "BCAA", "Creatina"]
    })
  },
  {
    name: "Dia de Competição",
    trainingType: "competition",
    caloriesAdjustment: 500,
    caloriesAdjustmentPercent: null,
    proteinAdjustment: 5,
    carbsAdjustment: 100,
    fatAdjustment: -10,
    preWorkoutMealTiming: 180,
    postWorkoutMealTiming: 30,
    preWorkoutCarbs: 80,
    preWorkoutProtein: 20,
    postWorkoutCarbs: 100,
    postWorkoutProtein: 40,
    waterIntakeBonus: 1.5,
    notes: "Dia de competição ou evento esportivo. Maximizar energia disponível e performance.",
    recommendations: JSON.stringify({
      dayBefore: [
        "Carb loading: aumentar carboidratos",
        "Reduzir fibras para evitar desconforto",
        "Hidratação extra",
        "Evitar alimentos novos"
      ],
      competitionDay: [
        "Café da manhã familiar e testado",
        "Última refeição 3h antes",
        "Snacks leves se necessário",
        "Hidratação constante"
      ],
      postCompetition: [
        "Recuperação imediata",
        "Carboidratos + proteína",
        "Celebrar com moderação"
      ],
      supplements: ["Gel de carboidrato", "Isotônico", "Cafeína (se habituado)"]
    })
  }
];

async function seedTrainingNutritionProfiles() {
  console.log('🌱 Criando perfis de nutrição por tipo de treino...\n');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL não configurada');
    process.exit(1);
  }
  
  const connection = await mysql.createConnection(databaseUrl);
  console.log('✅ Conectado ao banco de dados\n');
  
  try {
    // Verificar se já existem perfis
    const [existing] = await connection.execute(
      "SELECT COUNT(*) as count FROM training_nutrition_profiles WHERE isSystem = 1"
    );
    
    if (existing[0].count > 0) {
      console.log(`⚠️  Já existem ${existing[0].count} perfis do sistema no banco.`);
      console.log('   Pulando criação para evitar duplicatas.\n');
      await connection.end();
      return;
    }
    
    // Inserir perfis
    let inserted = 0;
    
    for (const profile of profiles) {
      await connection.execute(
        `INSERT INTO training_nutrition_profiles (
          name, trainingType,
          caloriesAdjustment, caloriesAdjustmentPercent,
          proteinAdjustment, carbsAdjustment, fatAdjustment,
          preWorkoutMealTiming, postWorkoutMealTiming,
          preWorkoutCarbs, preWorkoutProtein,
          postWorkoutCarbs, postWorkoutProtein,
          waterIntakeBonus, notes, recommendations,
          isActive, isSystem, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW())`,
        [
          profile.name,
          profile.trainingType,
          profile.caloriesAdjustment,
          profile.caloriesAdjustmentPercent,
          profile.proteinAdjustment,
          profile.carbsAdjustment,
          profile.fatAdjustment,
          profile.preWorkoutMealTiming,
          profile.postWorkoutMealTiming,
          profile.preWorkoutCarbs,
          profile.preWorkoutProtein,
          profile.postWorkoutCarbs,
          profile.postWorkoutProtein,
          profile.waterIntakeBonus,
          profile.notes,
          profile.recommendations
        ]
      );
      
      inserted++;
      console.log(`   ✅ ${profile.name}`);
    }
    
    console.log(`\n✅ ${inserted} perfis criados com sucesso!`);
    
  } finally {
    await connection.end();
    console.log('\n🔌 Conexão encerrada.');
  }
}

seedTrainingNutritionProfiles().catch(console.error);
