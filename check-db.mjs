import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  console.log('\n=== Últimos workout_logs ===');
  const [logs] = await connection.execute(
    'SELECT id, sessionId, studentId, trainingDate, status, createdAt FROM workout_logs ORDER BY createdAt DESC LIMIT 5'
  );
  console.table(logs);
  
  console.log('\n=== Sessões de 31/12 ===');
  const [sessions] = await connection.execute(
    `SELECT s.id, s.status, s.scheduledAt, st.name as student_name 
     FROM sessions s 
     JOIN students st ON st.id = s.studentId 
     WHERE DATE(s.scheduledAt) = '2025-12-31'
     ORDER BY s.scheduledAt`
  );
  console.table(sessions);
  
  console.log('\n=== Sessões com workout_logs ===');
  const [joined] = await connection.execute(
    `SELECT s.id as session_id, s.status as session_status, wl.id as workout_log_id, wl.sessionId as log_session_id
     FROM sessions s
     LEFT JOIN workout_logs wl ON wl.sessionId = s.id
     WHERE s.status = 'completed' OR wl.id IS NOT NULL
     ORDER BY s.scheduledAt DESC
     LIMIT 10`
  );
  console.table(joined);
  
  await connection.end();
}

main().catch(console.error);
