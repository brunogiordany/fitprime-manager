/**
 * Script para importar dados da Tabela TACO (Tabela Brasileira de Composição de Alimentos)
 * para o banco de dados do FitPrime Manager
 * 
 * Fonte: https://github.com/machine-learning-mocha/taco
 * 
 * Uso: node scripts/seed-taco.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do banco de dados
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não configurada');
  process.exit(1);
}

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
  // Substituir vírgula por ponto
  const num = parseFloat(value.replace(',', '.'));
  return isNaN(num) ? null : num;
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
  
  // Conectar ao banco
  const connection = await mysql.createConnection(DATABASE_URL);
  console.log('✅ Conectado ao banco de dados\n');
  
  try {
    // Verificar se já existem alimentos TACO
    const [existing] = await connection.execute(
      'SELECT COUNT(*) as count FROM foods WHERE source = ?',
      ['taco']
    );
    
    if (existing[0].count > 0) {
      console.log(`⚠️  Já existem ${existing[0].count} alimentos TACO no banco.`);
      console.log('   Para reimportar, delete os existentes primeiro.\n');
      
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        rl.question('Deseja deletar os existentes e reimportar? (s/N): ', resolve);
      });
      rl.close();
      
      if (answer.toLowerCase() !== 's') {
        console.log('Operação cancelada.');
        await connection.end();
        return;
      }
      
      // Deletar existentes
      await connection.execute('DELETE FROM foods WHERE source = ?', ['taco']);
      console.log('🗑️  Alimentos TACO existentes deletados.\n');
    }
    
    // Inserir alimentos
    let inserted = 0;
    let errors = 0;
    
    for (const food of foods) {
      try {
        const name = food['Descrição dos alimentos'] || food['Descrição'];
        const category = food['Categoria do alimento'];
        const sourceId = food['Número do Alimento'];
        
        if (!name || !category) {
          console.log(`⚠️  Pulando registro sem nome/categoria: ${JSON.stringify(food)}`);
          errors++;
          continue;
        }
        
        const subcategory = getSubcategory(category, name);
        
        // Mapear colunas TACO para schema
        const values = {
          name: name,
          category: category,
          subcategory: subcategory,
          source: 'taco',
          sourceId: sourceId,
          servingSize: 100,
          servingUnit: 'g',
          
          // Macronutrientes
          calories: parseNumber(food['Energia..kcal.']),
          protein: parseNumber(food['Proteína..g.']),
          carbohydrates: parseNumber(food['Carboidrato..g.']),
          fiber: parseNumber(food['Fibra.Alimentar..g.']),
          totalFat: parseNumber(food['Lipídeos..g.']),
          cholesterol: parseNumber(food['Colesterol..mg.']),
          
          // Minerais
          calcium: parseNumber(food['Cálcio..mg.']),
          magnesium: parseNumber(food['Magnésio..mg.']),
          manganese: parseNumber(food['Manganês..mg.']),
          phosphorus: parseNumber(food['Fósforo..mg.']),
          iron: parseNumber(food['Ferro..mg.']),
          sodium: parseNumber(food['Sódio..mg.']),
          potassium: parseNumber(food['Potássio..mg.']),
          copper: parseNumber(food['Cobre..mg.']),
          zinc: parseNumber(food['Zinco..mg.']),
          
          // Vitaminas
          vitaminA: parseNumber(food['RE..mcg.']) || parseNumber(food['RAE..mcg.']),
          vitaminB1: parseNumber(food['Tiamina..mg.']),
          vitaminB2: parseNumber(food['Riboflavina..mg.']),
          vitaminB6: parseNumber(food['Piridoxina..mg.']),
          vitaminB3: parseNumber(food['Niacina..mg.']),
          vitaminC: parseNumber(food['Vitamina.C..mg.']),
          
          // Outros
          water: parseNumber(food['Umidade....']),
          ash: parseNumber(food['Cinzas..g.']),
          
          isActive: true
        };
        
        // Construir query de inserção
        const columns = Object.keys(values).filter(k => values[k] !== undefined);
        const placeholders = columns.map(() => '?').join(', ');
        const vals = columns.map(k => values[k]);
        
        await connection.execute(
          `INSERT INTO foods (${columns.join(', ')}, createdAt, updatedAt) VALUES (${placeholders}, NOW(), NOW())`,
          vals
        );
        
        inserted++;
        
        if (inserted % 100 === 0) {
          console.log(`   ${inserted} alimentos inseridos...`);
        }
      } catch (err) {
        console.error(`❌ Erro ao inserir "${food['Descrição dos alimentos']}": ${err.message}`);
        errors++;
      }
    }
    
    console.log(`\n✅ Importação concluída!`);
    console.log(`   📥 ${inserted} alimentos inseridos`);
    if (errors > 0) {
      console.log(`   ⚠️  ${errors} erros`);
    }
    
    // Mostrar estatísticas por categoria
    const [stats] = await connection.execute(
      'SELECT category, COUNT(*) as count FROM foods WHERE source = ? GROUP BY category ORDER BY count DESC',
      ['taco']
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
