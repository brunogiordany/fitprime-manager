/**
 * Validador de Senha Forte
 * 
 * Implementa regras de validação para garantir senhas seguras
 */

export interface PasswordValidationResult {
  valid: boolean;
  score: number; // 0-100
  errors: string[];
  suggestions: string[];
}

export interface PasswordRequirements {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonPasswords: boolean;
  preventSequentialChars: boolean;
  preventRepeatedChars: boolean;
}

// Requisitos padrão para senhas
export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false, // Opcional, mas aumenta o score
  preventCommonPasswords: true,
  preventSequentialChars: true,
  preventRepeatedChars: true,
};

// Lista de senhas comuns (expandir conforme necessário)
const COMMON_PASSWORDS = [
  '123456', '123456789', '12345678', '1234567', '12345',
  'password', 'senha', 'qwerty', 'abc123', 'password1',
  '111111', '123123', 'admin', 'letmein', 'welcome',
  'monkey', 'dragon', 'master', 'login', 'passw0rd',
  'iloveyou', 'princess', 'sunshine', 'michael', 'ashley',
  'football', 'baseball', 'soccer', 'hockey', 'batman',
  'trustno1', 'shadow', 'killer', 'superman', 'jordan',
  'harley', 'ranger', 'buster', 'tigger', 'andrea',
  // Senhas comuns em português
  'mudar123', 'senha123', 'brasil', 'flamengo', 'corinthians',
  'palmeiras', 'santos', 'amor', 'deus', 'jesus',
];

// Sequências comuns
const SEQUENTIAL_PATTERNS = [
  '012345', '123456', '234567', '345678', '456789',
  '567890', '098765', '987654', '876543', '765432',
  'abcdef', 'bcdefg', 'cdefgh', 'qwerty', 'asdfgh',
  'zxcvbn', 'fedcba', 'ytrewq', 'hgfdsa', 'nbvcxz',
];

/**
 * Valida uma senha contra os requisitos especificados
 */
export function validatePassword(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): PasswordValidationResult {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;
  
  // Verificar comprimento mínimo
  if (password.length < requirements.minLength) {
    errors.push(`A senha deve ter pelo menos ${requirements.minLength} caracteres`);
  } else {
    score += 20;
    // Bônus por comprimento extra
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
  }
  
  // Verificar comprimento máximo
  if (password.length > requirements.maxLength) {
    errors.push(`A senha não pode ter mais de ${requirements.maxLength} caracteres`);
  }
  
  // Verificar letras maiúsculas
  const hasUppercase = /[A-Z]/.test(password);
  if (requirements.requireUppercase && !hasUppercase) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula');
  } else if (hasUppercase) {
    score += 15;
  }
  
  // Verificar letras minúsculas
  const hasLowercase = /[a-z]/.test(password);
  if (requirements.requireLowercase && !hasLowercase) {
    errors.push('A senha deve conter pelo menos uma letra minúscula');
  } else if (hasLowercase) {
    score += 15;
  }
  
  // Verificar números
  const hasNumbers = /[0-9]/.test(password);
  if (requirements.requireNumbers && !hasNumbers) {
    errors.push('A senha deve conter pelo menos um número');
  } else if (hasNumbers) {
    score += 15;
  }
  
  // Verificar caracteres especiais
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  if (requirements.requireSpecialChars && !hasSpecialChars) {
    errors.push('A senha deve conter pelo menos um caractere especial (!@#$%^&*...)');
  } else if (hasSpecialChars) {
    score += 15;
    suggestions.push('Ótimo! Caracteres especiais aumentam a segurança');
  } else {
    suggestions.push('Adicionar caracteres especiais (!@#$%^&*) aumentaria a segurança');
  }
  
  // Verificar senhas comuns
  if (requirements.preventCommonPasswords) {
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.includes(lowerPassword)) {
      errors.push('Esta senha é muito comum e fácil de adivinhar');
      score = Math.max(0, score - 30);
    }
  }
  
  // Verificar sequências
  if (requirements.preventSequentialChars) {
    const lowerPassword = password.toLowerCase();
    for (const pattern of SEQUENTIAL_PATTERNS) {
      if (lowerPassword.includes(pattern)) {
        errors.push('A senha não pode conter sequências óbvias (123456, abcdef, qwerty)');
        score = Math.max(0, score - 20);
        break;
      }
    }
  }
  
  // Verificar caracteres repetidos
  if (requirements.preventRepeatedChars) {
    if (/(.)\1{2,}/.test(password)) {
      errors.push('A senha não pode ter mais de 2 caracteres iguais seguidos');
      score = Math.max(0, score - 15);
    }
  }
  
  // Sugestões adicionais
  if (password.length < 12 && errors.length === 0) {
    suggestions.push('Senhas com 12+ caracteres são mais seguras');
  }
  
  if (!hasUppercase && !hasLowercase) {
    suggestions.push('Misturar maiúsculas e minúsculas aumenta a segurança');
  }
  
  // Garantir que o score está entre 0 e 100
  score = Math.max(0, Math.min(100, score));
  
  return {
    valid: errors.length === 0,
    score,
    errors,
    suggestions,
  };
}

/**
 * Retorna uma descrição textual da força da senha
 */
export function getPasswordStrengthLabel(score: number): string {
  if (score < 30) return 'Muito fraca';
  if (score < 50) return 'Fraca';
  if (score < 70) return 'Razoável';
  if (score < 90) return 'Forte';
  return 'Muito forte';
}

/**
 * Gera uma senha aleatória segura
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=';
  
  const allChars = uppercase + lowercase + numbers + special;
  
  let password = '';
  
  // Garantir pelo menos um de cada tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Preencher o resto
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Embaralhar
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
