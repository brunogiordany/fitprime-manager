import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const migrations = [
  // Adicionar novos campos na tabela photos
  `ALTER TABLE photos ADD COLUMN IF NOT EXISTS poseId VARCHAR(100)`,
  `ALTER TABLE photos ADD COLUMN IF NOT EXISTS aiAnalysis TEXT`,
  `ALTER TABLE photos ADD COLUMN IF NOT EXISTS aiAnalyzedAt TIMESTAMP`,
  `ALTER TABLE photos ADD COLUMN IF NOT EXISTS bodyFatEstimate DECIMAL(5,2)`,
  `ALTER TABLE photos ADD COLUMN IF NOT EXISTS muscleScore INT`,
  `ALTER TABLE photos ADD COLUMN IF NOT EXISTS postureScore INT`,
  
  // Criar tabela photo_analyses
  `CREATE TABLE IF NOT EXISTS photo_analyses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    studentId INT NOT NULL,
    personalId INT NOT NULL,
    beforePhotoId INT NOT NULL,
    afterPhotoId INT NOT NULL,
    analysisType ENUM('evolution', 'single', 'comprehensive') DEFAULT 'evolution',
    analysis TEXT NOT NULL,
    analysisJson TEXT,
    overallProgress INT,
    muscleGain INT,
    fatLoss INT,
    postureImprovement INT,
    measurementId INT,
    daysBetween INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    createdBy ENUM('student', 'personal', 'system') DEFAULT 'system',
    FOREIGN KEY (studentId) REFERENCES students(id),
    FOREIGN KEY (personalId) REFERENCES personals(id),
    FOREIGN KEY (beforePhotoId) REFERENCES photos(id),
    FOREIGN KEY (afterPhotoId) REFERENCES photos(id),
    FOREIGN KEY (measurementId) REFERENCES measurements(id)
  )`
];

console.log('Iniciando migração...');

for (const sql of migrations) {
  try {
    await connection.execute(sql);
    console.log('✓', sql.substring(0, 60) + '...');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('⊘ Já existe:', sql.substring(0, 60) + '...');
    } else {
      console.error('✗ Erro:', error.message);
    }
  }
}

await connection.end();
console.log('Migração concluída!');
