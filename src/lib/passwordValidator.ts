/**
 * Validador de força de senha
 * Requer: mínimo 8 caracteres, letra maiúscula, letra minúscula, número
 */

export interface PasswordValidation {
  valid: boolean;
  message: string;
}

export function validatePassword(password: string): PasswordValidation {
  if (!password) {
    return {
      valid: false,
      message: 'Senha é obrigatória',
    };
  }

  if (password.length < 8) {
    return {
      valid: false,
      message: 'Senha deve ter no mínimo 8 caracteres',
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: 'Senha deve conter pelo menos uma letra maiúscula',
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: 'Senha deve conter pelo menos uma letra minúscula',
    };
  }

  if (!/\d/.test(password)) {
    return {
      valid: false,
      message: 'Senha deve conter pelo menos um número',
    };
  }

  return {
    valid: true,
    message: 'Senha válida',
  };
}
