/**
 * Script de Migração de Dados de Anamnese
 * 
 * Converte dados de texto livre para JSON estruturado nos campos:
 * - trainingRestrictions
 * - muscleEmphasis
 * - cardioActivities
 * 
 * Uso: pnpm exec tsx scripts/migrate-anamnesis-data.mjs [--dry-run]
 */

import mysql from 'mysql2/promise';

// Mapeamento de restrições de treino conhecidas
const RESTRICTION_MAPPINGS = {
  'lombar': 'lower_back',
  'coluna': 'lower_back',
  'costas': 'lower_back',
  'joelho': 'knee',
  'joelhos': 'knee',
  'ombro': 'shoulder',
  'ombros': 'shoulder',
  'punho': 'wrist',
  'pulso': 'wrist',
  'tornozelo': 'ankle',
  'quadril': 'hip',
  'pescoço': 'neck',
  'cervical': 'neck',
};

// Mapeamento de ênfases musculares conhecidas
const MUSCLE_MAPPINGS = {
  'gluteo': 'gluteos',
  'glúteo': 'gluteos',
  'gluteos': 'gluteos',
  'glúteos': 'gluteos',
  'bunda': 'gluteos',
  'perna': 'pernas',
  'pernas': 'pernas',
  'coxa': 'pernas',
  'coxas': 'pernas',
  'abdomen': 'abdomen',
  'abdômen': 'abdomen',
  'barriga': 'abdomen',
  'core': 'abdomen',
  'braço': 'bracos',
  'braços': 'bracos',
  'biceps': 'bracos',
  'bíceps': 'bracos',
  'triceps': 'bracos',
  'tríceps': 'bracos',
  'peito': 'peito',
  'peitoral': 'peito',
  'costa': 'costas',
  'costas': 'costas',
  'dorsal': 'costas',
  'ombro': 'ombros',
  'ombros': 'ombros',
  'deltóide': 'ombros',
  'panturrilha': 'panturrilha',
  'batata da perna': 'panturrilha',
};

// Mapeamento de atividades cardio conhecidas
const CARDIO_MAPPINGS = {
  'corrida': 'corrida',
  'correr': 'corrida',
  'caminhada': 'caminhada',
  'caminhar': 'caminhada',
  'bike': 'ciclismo',
  'bicicleta': 'ciclismo',
  'ciclismo': 'ciclismo',
  'pedal': 'ciclismo',
  'natação': 'natacao',
  'natacao': 'natacao',
  'nadar': 'natacao',
  'piscina': 'natacao',
  'dança': 'danca',
  'danca': 'danca',
  'dançar': 'danca',
  'luta': 'luta',
  'jiu': 'luta',
  'muay': 'luta',
  'boxe': 'luta',
  'karate': 'luta',
  'crossfit': 'crossfit',
  'funcional': 'crossfit',
  'hipismo': 'hipismo',
  'equitação': 'hipismo',
  'cavalo': 'hipismo',
  'remo': 'remo',
  'surf': 'surf',
  'tênis': 'tenis',
  'tenis': 'tenis',
  'futebol': 'futebol',
  'futsal': 'futebol',
  'vôlei': 'volei',
  'volei': 'volei',
  'basquete': 'basquete',
  'yoga': 'yoga',
  'pilates': 'yoga',
};

function isValidJson(str) {
  if (!str) return false;
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) || typeof parsed === 'object';
  } catch {
    return false;
  }
}

function isNegativeResponse(str) {
  if (!str) return true;
  const lower = str.toLowerCase().trim();
  return ['nao', 'não', 'nenhum', 'nenhuma', 'n/a', 'na', '-', 'nada', ''].includes(lower);
}

function parseRestrictions(value) {
  if (!value || isNegativeResponse(value)) return [];
  if (isValidJson(value)) return JSON.parse(value);
  
  const result = [];
  const lower = value.toLowerCase();
  
  for (const [key, mapped] of Object.entries(RESTRICTION_MAPPINGS)) {
    if (lower.includes(key) && !result.includes(mapped)) {
      result.push(mapped);
    }
  }
  
  // Se não encontrou nenhum mapeamento mas tem texto, retorna array vazio
  // (o texto original fica em restrictionNotes)
  return result;
}

function parseMuscleEmphasis(value) {
  if (!value || isNegativeResponse(value)) return [];
  if (isValidJson(value)) return JSON.parse(value);
  
  const result = [];
  const lower = value.toLowerCase();
  
  for (const [key, mapped] of Object.entries(MUSCLE_MAPPINGS)) {
    if (lower.includes(key) && !result.includes(mapped)) {
      result.push(mapped);
    }
  }
  
  return result;
}

function parseCardioActivities(value) {
  if (!value || isNegativeResponse(value)) return [];
  if (isValidJson(value)) return JSON.parse(value);
  
  const result = [];
  const lower = value.toLowerCase();
  
  // Tentar extrair frequência e duração do texto
  const freqMatch = value.match(/(\d+)\s*[xX]\s*(semana|por\s*semana|vezes)/i);
  const durationMatch = value.match(/(\d+)\s*(min|minutos|hora|horas|h)/i);
  
  const defaultFrequency = freqMatch ? parseInt(freqMatch[1]) : 2;
  let defaultDuration = 30;
  
  if (durationMatch) {
    const num = parseInt(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();
    if (unit.startsWith('h')) {
      defaultDuration = num * 60;
    } else {
      defaultDuration = num;
    }
  }
  
  for (const [key, mapped] of Object.entries(CARDIO_MAPPINGS)) {
    if (lower.includes(key)) {
      // Verificar se já não adicionamos essa atividade
      if (!result.some(r => r.activity === mapped)) {
        result.push({
          activity: mapped,
          frequency: defaultFrequency,
          duration: defaultDuration
        });
      }
    }
  }
  
  // Se tem texto mas não encontrou atividade conhecida, adiciona como "outro"
  if (result.length === 0 && value.trim()) {
    result.push({
      activity: 'outro',
      frequency: defaultFrequency,
      duration: defaultDuration
    });
  }
  
  return result;
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  
  console.log('='.repeat(60));
  console.log('MIGRAÇÃO DE DADOS DE ANAMNESE');
  console.log(isDryRun ? '(MODO DRY-RUN - nenhuma alteração será feita)' : '(MODO PRODUÇÃO - dados serão alterados)');
  console.log('='.repeat(60));
  
  const pool = mysql.createPool(process.env.DATABASE_URL);
  
  try {
    // Buscar todas as anamneses
    const [rows] = await pool.execute(`
      SELECT id, studentId, trainingRestrictions, muscleEmphasis, cardioActivities, restrictionNotes
      FROM anamneses
    `);
    
    console.log(`\nEncontradas ${rows.length} anamneses para verificar.\n`);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const row of rows) {
      const changes = {};
      let needsUpdate = false;
      
      // Verificar trainingRestrictions
      if (row.trainingRestrictions && !isValidJson(row.trainingRestrictions)) {
        const parsed = parseRestrictions(row.trainingRestrictions);
        changes.trainingRestrictions = JSON.stringify(parsed);
        
        // Se tinha texto que não foi mapeado, adicionar às notas
        if (parsed.length === 0 && !isNegativeResponse(row.trainingRestrictions)) {
          const currentNotes = row.restrictionNotes || '';
          if (!currentNotes.includes(row.trainingRestrictions)) {
            changes.restrictionNotes = currentNotes 
              ? `${currentNotes}\n\n[Migrado] ${row.trainingRestrictions}`
              : `[Migrado] ${row.trainingRestrictions}`;
          }
        }
        needsUpdate = true;
      }
      
      // Verificar muscleEmphasis
      if (row.muscleEmphasis && !isValidJson(row.muscleEmphasis)) {
        const parsed = parseMuscleEmphasis(row.muscleEmphasis);
        changes.muscleEmphasis = JSON.stringify(parsed);
        needsUpdate = true;
      }
      
      // Verificar cardioActivities
      if (row.cardioActivities && !isValidJson(row.cardioActivities)) {
        const parsed = parseCardioActivities(row.cardioActivities);
        changes.cardioActivities = JSON.stringify(parsed);
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        console.log(`\n--- Anamnese ID ${row.id} (Aluno ${row.studentId}) ---`);
        
        if (changes.trainingRestrictions !== undefined) {
          console.log(`  trainingRestrictions:`);
          console.log(`    Antes: "${row.trainingRestrictions}"`);
          console.log(`    Depois: ${changes.trainingRestrictions}`);
        }
        
        if (changes.muscleEmphasis !== undefined) {
          console.log(`  muscleEmphasis:`);
          console.log(`    Antes: "${row.muscleEmphasis}"`);
          console.log(`    Depois: ${changes.muscleEmphasis}`);
        }
        
        if (changes.cardioActivities !== undefined) {
          console.log(`  cardioActivities:`);
          console.log(`    Antes: "${row.cardioActivities}"`);
          console.log(`    Depois: ${changes.cardioActivities}`);
        }
        
        if (changes.restrictionNotes !== undefined) {
          console.log(`  restrictionNotes: (texto original preservado nas notas)`);
        }
        
        if (!isDryRun) {
          try {
            const setClauses = [];
            const values = [];
            
            for (const [key, value] of Object.entries(changes)) {
              setClauses.push(`${key} = ?`);
              values.push(value);
            }
            
            values.push(row.id);
            
            await pool.execute(
              `UPDATE anamneses SET ${setClauses.join(', ')} WHERE id = ?`,
              values
            );
            
            console.log(`  ✅ Atualizado com sucesso`);
            updated++;
          } catch (err) {
            console.log(`  ❌ Erro ao atualizar: ${err.message}`);
            errors++;
          }
        } else {
          console.log(`  [DRY-RUN] Seria atualizado`);
          updated++;
        }
      } else {
        skipped++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('RESUMO DA MIGRAÇÃO');
    console.log('='.repeat(60));
    console.log(`Total de anamneses: ${rows.length}`);
    console.log(`Atualizadas: ${updated}`);
    console.log(`Sem alteração: ${skipped}`);
    console.log(`Erros: ${errors}`);
    
    if (isDryRun) {
      console.log('\n⚠️  Modo dry-run. Execute sem --dry-run para aplicar as alterações.');
    }
    
  } catch (error) {
    console.error('Erro durante migração:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
