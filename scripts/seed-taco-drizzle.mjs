/**
 * Script para importar dados da Tabela TACO (Tabela Brasileira de Composição de Alimentos)
 * para o banco de dados do FitPrime Manager usando Drizzle ORM
 * 
 * Fonte: https://github.com/machine-learning-mocha/taco
 * 
 * Uso: node scripts/seed-taco-drizzle.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/mysql2';
import { eq, sql } from 'drizzle-orm';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse do CSV
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    data.push(row);
  }
  
  return data;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

// Converter valor para número ou null
function parseNumber(value) {
  if (!value || value === 'NA' || value === '' || value === 'Tr' || value === '*') {
    return null;
  }
  // Substituir vírgula por ponto e tratar 1e-05 como 0
  let num = parseFloat(value.replace(',', '.'));
  if (isNaN(num)) return null;
  // Valores muito pequenos (1e-05) são tratados como 0
  if (num < 0.0001) num = 0;
  return num;
}

// Mapear categoria TACO para subcategoria
function getSubcategory(category, name) {
  const nameLower = name.toLowerCase();
  
  if (category === 'Cereais e derivados') {
    if (nameLower.includes('arroz')) return 'Arroz';
    if (nameLower.includes('pão') || nameLower.includes('pao')) return 'Pães';
    if (nameLower.includes('biscoito')) return 'Biscoitos';
    if (nameLower.includes('macarrão') || nameLower.includes('massa')) return 'Massas';
    if (nameLower.includes('farinha')) return 'Farinhas';
    if (nameLower.includes('cereal') || nameLower.includes('aveia')) return 'Cereais';
    if (nameLower.includes('bolo')) return 'Bolos';
    return 'Outros cereais';
  }
  
  if (category === 'Verduras, hortaliças e derivados') {
    if (nameLower.includes('alface') || nameLower.includes('rúcula') || nameLower.includes('agrião')) return 'Folhosas';
    if (nameLower.includes('tomate') || nameLower.includes('pepino') || nameLower.includes('pimentão')) return 'Frutos';
    if (nameLower.includes('cenoura') || nameLower.includes('beterraba') || nameLower.includes('batata')) return 'Raízes e tubérculos';
    if (nameLower.includes('brócolis') || nameLower.includes('couve')) return 'Crucíferas';
    return 'Outras hortaliças';
  }
  
  if (category === 'Frutas e derivados') {
    if (nameLower.includes('laranja') || nameLower.includes('limão') || nameLower.includes('tangerina')) return 'Cítricas';
    if (nameLower.includes('banana')) return 'Banana';
    if (nameLower.includes('maçã') || nameLower.includes('maca')) return 'Maçã';
    if (nameLower.includes('manga') || nameLower.includes('mamão') || nameLower.includes('abacaxi')) return 'Tropicais';
    if (nameLower.includes('morango') || nameLower.includes('uva')) return 'Vermelhas';
    return 'Outras frutas';
  }
  
  if (category === 'Carnes e derivados') {
    if (nameLower.includes('boi') || nameLower.includes('bovina') || nameLower.includes('contra') || nameLower.includes('alcatra') || nameLower.includes('patinho')) return 'Bovina';
    if (nameLower.includes('frango') || nameLower.includes('galinha') || nameLower.includes('peru')) return 'Aves';
    if (nameLower.includes('porco') || nameLower.includes('suína') || nameLower.includes('bacon') || nameLower.includes('presunto')) return 'Suína';
    if (nameLower.includes('linguiça') || nameLower.includes('salsicha') || nameLower.includes('mortadela')) return 'Embutidos';
    return 'Outras carnes';
  }
  
  if (category === 'Pescados e frutos do mar') {
    if (nameLower.includes('camarão') || nameLower.includes('lagosta') || nameLower.includes('caranguejo')) return 'Crustáceos';
    if (nameLower.includes('sardinha') || nameLower.includes('atum') || nameLower.includes('salmão')) return 'Peixes';
    return 'Outros pescados';
  }
  
  if (category === 'Leite e derivados') {
    if (nameLower.includes('leite')) return 'Leites';
    if (nameLower.includes('queijo')) return 'Queijos';
    if (nameLower.includes('iogurte')) return 'Iogurtes';
    if (nameLower.includes('manteiga') || nameLower.includes('creme')) return 'Derivados';
    return 'Outros laticínios';
  }
  
  if (category === 'Leguminosas e derivados') {
    if (nameLower.includes('feijão')) return 'Feijões';
    if (nameLower.includes('soja')) return 'Soja';
    if (nameLower.includes('lentilha') || nameLower.includes('grão')) return 'Outras leguminosas';
    return 'Outras leguminosas';
  }
  
  return null;
}

async function seedTACO() {
  console.log('🌱 Iniciando importação dos dados TACO...\n');
  
  // Ler arquivo CSV
  const csvPath = path.join(__dirname, '..', 'data', 'taco_alimentos.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error('❌ Arquivo taco_alimentos.csv não encontrado em data/');
    console.log('   Execute: curl -o data/taco_alimentos.csv "https://raw.githubusercontent.com/machine-learning-mocha/taco/main/formatados/alimentos.csv"');
    process.exit(1);
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const foods = parseCSV(csvContent);
  
  console.log(`📊 ${foods.length} alimentos encontrados no CSV\n`);
  
  // Conectar ao banco usando DATABASE_URL do ambiente
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL não configurada');
    process.exit(1);
  }
  
  const connection = await mysql.createConnection(databaseUrl);
  const db = drizzle(connection);
  console.log('✅ Conectado ao banco de dados\n');
  
  try {
    // Verificar se já existem alimentos TACO
    const [existing] = await connection.execute(
      "SELECT COUNT(*) as count FROM foods WHERE source = 'taco'"
    );
    
    const existingCount = existing[0].count;
    
    if (existingCount > 0) {
      console.log(`⚠️  Já existem ${existingCount} alimentos TACO no banco.`);
      console.log('   Pulando importação para evitar duplicatas.\n');
      console.log('   Para reimportar, delete os existentes primeiro com:');
      console.log("   DELETE FROM foods WHERE source = 'taco';\n");
      await connection.end();
      return;
    }
    
    // Inserir alimentos em lotes
    let inserted = 0;
    let errors = 0;
    const batchSize = 50;
    
    for (let i = 0; i < foods.length; i += batchSize) {
      const batch = foods.slice(i, i + batchSize);
      
      for (const food of batch) {
        try {
          const name = food['Descrição dos alimentos'] || food['Descrição'];
          const category = food['Categoria do alimento'];
          const sourceId = food['Número do Alimento'];
          
          if (!name || !category) {
            errors++;
            continue;
          }
          
          const subcategory = getSubcategory(category, name);
          
          await connection.execute(
            `INSERT INTO foods (
              name, category, subcategory, source, sourceId,
              servingSize, servingUnit,
              calories, protein, carbohydrates, fiber, totalFat, cholesterol,
              calcium, magnesium, manganese, phosphorus, iron, sodium, potassium, copper, zinc,
              vitaminA, vitaminB1, vitaminB2, vitaminB6, vitaminB3, vitaminC,
              water, ash, isActive, createdAt, updatedAt
            ) VALUES (?, ?, ?, 'taco', ?, 100, 'g', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
            [
              name,
              category,
              subcategory,
              sourceId,
              parseNumber(food['Energia..kcal.']),
              parseNumber(food['Proteína..g.']),
              parseNumber(food['Carboidrato..g.']),
              parseNumber(food['Fibra.Alimentar..g.']),
              parseNumber(food['Lipídeos..g.']),
              parseNumber(food['Colesterol..mg.']),
              parseNumber(food['Cálcio..mg.']),
              parseNumber(food['Magnésio..mg.']),
              parseNumber(food['Manganês..mg.']),
              parseNumber(food['Fósforo..mg.']),
              parseNumber(food['Ferro..mg.']),
              parseNumber(food['Sódio..mg.']),
              parseNumber(food['Potássio..mg.']),
              parseNumber(food['Cobre..mg.']),
              parseNumber(food['Zinco..mg.']),
              parseNumber(food['RE..mcg.']) || parseNumber(food['RAE..mcg.']),
              parseNumber(food['Tiamina..mg.']),
              parseNumber(food['Riboflavina..mg.']),
              parseNumber(food['Piridoxina..mg.']),
              parseNumber(food['Niacina..mg.']),
              parseNumber(food['Vitamina.C..mg.']),
              parseNumber(food['Umidade....']),
              parseNumber(food['Cinzas..g.'])
            ]
          );
          
          inserted++;
        } catch (err) {
          console.error(`❌ Erro: ${err.message}`);
          errors++;
        }
      }
      
      console.log(`   ${inserted} alimentos inseridos...`);
    }
    
    console.log(`\n✅ Importação concluída!`);
    console.log(`   📥 ${inserted} alimentos inseridos`);
    if (errors > 0) {
      console.log(`   ⚠️  ${errors} erros`);
    }
    
    // Mostrar estatísticas por categoria
    const [stats] = await connection.execute(
      "SELECT category, COUNT(*) as count FROM foods WHERE source = 'taco' GROUP BY category ORDER BY count DESC"
    );
    
    console.log('\n📊 Alimentos por categoria:');
    for (const stat of stats) {
      console.log(`   ${stat.category}: ${stat.count}`);
    }
    
  } finally {
    await connection.end();
    console.log('\n🔌 Conexão encerrada.');
  }
}

// Executar
seedTACO().catch(console.error);
