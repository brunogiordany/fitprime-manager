import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await connection.execute(`
  SELECT DISTINCT muscleGroup, COUNT(*) as count 
  FROM workout_log_exercises 
  WHERE muscleGroup IS NOT NULL
  GROUP BY muscleGroup 
  ORDER BY count DESC
`);
console.log('Grupos musculares encontrados:');
rows.forEach(r => console.log(`- ${r.muscleGroup}: ${r.count} exercícios`));
await connection.end();
