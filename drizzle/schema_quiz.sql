-- Tabela de Quiz de Qualificação
CREATE TABLE IF NOT EXISTS qualification_quiz (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sessionId VARCHAR(255) UNIQUE NOT NULL,
  
  -- Respostas do Quiz
  studentCount INT,
  mainChallenge VARCHAR(100), -- 'organization', 'billing', 'growth', 'time'
  monthlyRevenue VARCHAR(50), -- 'under_2k', '2k_5k', '5k_10k', 'over_10k'
  
  -- Resultado
  recommendedProfile VARCHAR(50), -- 'beginner', 'starter', 'pro', 'business'
  recommendedPlan VARCHAR(100),
  recommendedPrice DECIMAL(10, 2),
  
  -- Metadata
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_sessionId (sessionId),
  INDEX idx_createdAt (createdAt)
);

-- Tabela de Conversão (rastrear quem converteu após quiz)
CREATE TABLE IF NOT EXISTS quiz_conversions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  quizSessionId VARCHAR(255) NOT NULL,
  personalId INT,
  
  -- Dados da Conversão
  convertedToPersonal BOOLEAN DEFAULT FALSE,
  checkoutUrl VARCHAR(500),
  planPurchased VARCHAR(100),
  
  -- Metadata
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (quizSessionId) REFERENCES qualification_quiz(sessionId),
  INDEX idx_quizSessionId (quizSessionId),
  INDEX idx_personalId (personalId)
);
