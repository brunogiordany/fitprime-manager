// Script para consultar dados da Laura diretamente
import mysql from 'mysql2/promise';

async function main() {
  const pool = mysql.createPool(process.env.DATABASE_URL);
  
  // Query direta
  const [rows] = await pool.execute(`
    SELECT s.id, s.name, 
           a.trainingRestrictions, a.muscleEmphasis, a.cardioActivities, 
           a.mainGoal, a.exerciseExperience, a.injuries, a.medications,
           a.weeklyFrequency, a.sessionDuration, a.restrictionNotes
    FROM students s 
    LEFT JOIN anamneses a ON s.id = a.studentId 
    WHERE s.name LIKE '%Laura%' 
    LIMIT 1
  `);
  
  console.log('=== DADOS DA LAURA ===');
  if (rows.length > 0) {
    const row = rows[0];
    for (const [key, value] of Object.entries(row)) {
      console.log(`${key}:`, value);
    }
  } else {
    console.log('Laura não encontrada');
  }
  
  await pool.end();
}

main().catch(console.error);
