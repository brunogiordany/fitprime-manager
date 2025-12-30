import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await connection.execute('SELECT muscleGroup, COUNT(*) as count FROM workout_log_exercises GROUP BY muscleGroup ORDER BY count DESC');
console.log('Grupos musculares salvos:');
rows.forEach(r => console.log(`  ${r.muscleGroup}: ${r.count}`));
await connection.end();
