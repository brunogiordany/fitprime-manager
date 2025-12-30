import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'gateway01.us-west-2.prod.aws.tidbcloud.com',
  port: 4000,
  user: '2RWvMKqwQZZJHJH.root',
  password: 'vdMNIILGHJYsEVCN',
  database: 'fitprime_manager',
  ssl: { rejectUnauthorized: true }
});

const [rows] = await connection.execute(`
  SELECT 
    s.id as session_id, 
    s.status, 
    DATE(s.scheduledAt) as session_date,
    s.studentId,
    wl.id as workout_log_id,
    wl.sessionId as log_session_id
  FROM sessions s
  LEFT JOIN workout_logs wl ON wl.sessionId = s.id
  WHERE s.status = 'completed'
  ORDER BY s.scheduledAt DESC
  LIMIT 10
`);

console.log('Sessões concluídas:');
console.log(JSON.stringify(rows, null, 2));

await connection.end();
