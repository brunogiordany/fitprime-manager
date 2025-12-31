import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'gateway01.us-east-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '3Yx2LUbwKPVHwqT.root',
  password: '2b6eiZKPLlVvTdWL',
  database: 'fitprime_manager',
  ssl: {
    rejectUnauthorized: true
  }
});

console.log('=== ALUNOS ===');
const [students] = await connection.execute('SELECT id, name, email, userId, personalId, status FROM students');
console.table(students);

console.log('\n=== USERS ===');
const [users] = await connection.execute('SELECT id, openId, name, email, role FROM users');
console.table(users);

console.log('\n=== STUDENT_USERS (para login de aluno) ===');
const [studentUsers] = await connection.execute('SELECT * FROM student_users');
console.table(studentUsers);

await connection.end();
