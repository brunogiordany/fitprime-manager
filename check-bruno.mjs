// Script para verificar dados do aluno Bruno
import { createConnection } from 'mysql2/promise';

async function main() {
  const connection = await createConnection(process.env.DATABASE_URL);
  
  console.log('=== ALUNO BRUNO ===');
  const [students] = await connection.execute(`
    SELECT s.id, s.name, s.email, s.personalId, s.status, s.deletedAt
    FROM students s 
    WHERE s.email = 'brunogiordany@gmail.com'
  `);
  console.table(students);
  
  if (students.length > 0) {
    const studentId = students[0].id;
    const personalId = students[0].personalId;
    
    console.log('\n=== TREINOS DO ALUNO ===');
    const [workouts] = await connection.execute(`
      SELECT id, name, studentId, personalId, deletedAt
      FROM workouts 
      WHERE studentId = ? AND deletedAt IS NULL
    `, [studentId]);
    console.table(workouts);
    
    console.log('\n=== SESSÕES DO ALUNO ===');
    const [sessions] = await connection.execute(`
      SELECT id, studentId, personalId, scheduledAt, status, deletedAt
      FROM sessions 
      WHERE studentId = ? AND deletedAt IS NULL
      LIMIT 10
    `, [studentId]);
    console.table(sessions);
    
    console.log('\n=== COBRANÇAS DO ALUNO ===');
    const [charges] = await connection.execute(`
      SELECT id, studentId, personalId, amount, status, dueDate
      FROM charges 
      WHERE studentId = ?
      LIMIT 10
    `, [studentId]);
    console.table(charges);
    
    console.log('\n=== ANAMNESE DO ALUNO ===');
    const [anamnesis] = await connection.execute(`
      SELECT id, studentId, personalId, mainGoal, exerciseExperience
      FROM anamnesis 
      WHERE studentId = ?
    `, [studentId]);
    console.table(anamnesis);
    
    console.log('\n=== MEDIDAS DO ALUNO ===');
    const [measurements] = await connection.execute(`
      SELECT id, studentId, personalId, weight, measureDate
      FROM measurements 
      WHERE studentId = ? AND deletedAt IS NULL
      ORDER BY measureDate DESC
      LIMIT 5
    `, [studentId]);
    console.table(measurements);
  }
  
  await connection.end();
}

main().catch(console.error);
