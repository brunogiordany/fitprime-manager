/**
 * Utilitário robusto para copiar texto para área de transferência
 * Funciona em todos os dispositivos incluindo iOS Safari
 */

export async function copyToClipboard(text: string): Promise<boolean> {
  // Método 1: API moderna do Clipboard (preferido)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Clipboard API falhou, tentando fallback:', err);
    }
  }

  // Método 2: Fallback usando execCommand (funciona em mais dispositivos)
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Evitar scroll para o elemento
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    
    document.body.appendChild(textArea);
    
    // Para iOS Safari
    if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
      textArea.contentEditable = 'true';
      textArea.readOnly = false;
      
      const range = document.createRange();
      range.selectNodeContents(textArea);
      
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      textArea.setSelectionRange(0, 999999);
    } else {
      textArea.focus();
      textArea.select();
    }
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      return true;
    }
  } catch (err) {
    console.warn('Fallback de clipboard também falhou:', err);
  }

  // Método 3: Último recurso - mostrar modal para copiar manualmente
  return false;
}

/**
 * Copia texto e mostra toast de sucesso/erro
 */
export async function copyWithToast(
  text: string, 
  successMessage = 'Copiado para a área de transferência!',
  errorMessage = 'Não foi possível copiar. Por favor, copie manualmente:'
): Promise<boolean> {
  const success = await copyToClipboard(text);
  
  if (!success) {
    // Se falhar, podemos mostrar um prompt com o texto
    window.prompt(errorMessage, text);
  }
  
  return success;
}
