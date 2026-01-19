import { useEffect } from 'react';

/**
 * Componente de proteção global
 * Bloqueia ferramentas de desenvolvedor mas PERMITE copiar/colar em inputs
 */
export function ProtectionLayer() {
  useEffect(() => {
    // ============================================
    // 1. BLOQUEAR CONTEXTO (BOTÃO DIREITO) - exceto em inputs
    // ============================================
    const contextMenuHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Permitir menu de contexto em inputs, textareas e contenteditable
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('input, textarea, [contenteditable="true"]')
      ) {
        return; // Permitir
      }
      
      if (e.button === 2 || e.type === 'contextmenu') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener('contextmenu', contextMenuHandler, { capture: true, passive: false });
    window.addEventListener('contextmenu', contextMenuHandler, { capture: true, passive: false });

    // ============================================
    // 2. BLOQUEAR TECLADO (F12, CTRL+U, ETC) - PERMITIR CTRL+C/V/X em inputs
    // ============================================
    const keyboardHandler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField = 
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('input, textarea, [contenteditable="true"]');

      // Se estiver em um campo de input, permitir CTRL+C, CTRL+V, CTRL+X, CTRL+A
      if (isInputField) {
        const isCopyPasteKey = 
          (e.ctrlKey || e.metaKey) && 
          (e.key === 'c' || e.key === 'C' || 
           e.key === 'v' || e.key === 'V' || 
           e.key === 'x' || e.key === 'X' ||
           e.key === 'a' || e.key === 'A');
        
        if (isCopyPasteKey) {
          return; // Permitir copiar/colar/recortar/selecionar tudo em inputs
        }
      }

      // Lista de combinações bloqueadas (apenas DevTools)
      const isBlocked =
        e.key === 'F12' ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'K' || e.key === 'k')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'M' || e.key === 'm')) ||
        (e.metaKey && e.altKey && (e.key === 'i' || e.key === 'I')) ||
        (e.metaKey && e.altKey && (e.key === 'u' || e.key === 'U')) ||
        (e.metaKey && e.altKey && (e.key === 'j' || e.key === 'J')) ||
        (e.metaKey && (e.key === 'u' || e.key === 'U'));

      if (isBlocked) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener('keydown', keyboardHandler, { capture: true, passive: false });
    window.addEventListener('keydown', keyboardHandler, { capture: true, passive: false });

    // ============================================
    // 3. CLIPBOARD - PERMITIR em inputs, bloquear fora
    // ============================================
    const clipboardHandler = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      // Permitir clipboard em inputs, textareas e contenteditable
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('input, textarea, [contenteditable="true"]')
      ) {
        return; // Permitir copiar/colar em campos de input
      }
      
      // Bloquear fora de inputs (proteção de conteúdo)
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    document.addEventListener('copy', clipboardHandler, { capture: true, passive: false });
    document.addEventListener('cut', clipboardHandler, { capture: true, passive: false });
    document.addEventListener('paste', clipboardHandler, { capture: true, passive: false });

    // ============================================
    // 4. SELEÇÃO - PERMITIR em inputs
    // ============================================
    const selectionHandler = (e: Event) => {
      const target = e.target as HTMLElement;
      // Permitir seleção em inputs, textareas e contenteditable
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('input, textarea, [contenteditable="true"]')
      ) {
        return; // Permitir seleção em campos de input
      }
      
      e.preventDefault();
      return false;
    };

    document.addEventListener('selectstart', selectionHandler, { capture: true, passive: false });

    // ============================================
    // 5. CSS - USER-SELECT (inputs já permitidos)
    // ============================================
    const style = document.createElement('style');
    style.id = 'protection-layer-styles';
    style.textContent = `
      /* Bloquear seleção geral, mas permitir em inputs */
      body {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      
      /* Permitir seleção e interação em campos de formulário */
      input, 
      textarea, 
      select,
      [contenteditable="true"], 
      [contenteditable="plaintext-only"],
      .allow-select {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
        cursor: text;
      }
      
      /* Garantir que botões e links funcionem */
      button, a, [role="button"] {
        cursor: pointer;
      }
    `;
    
    // Remover estilo antigo se existir
    const oldStyle = document.getElementById('protection-layer-styles');
    if (oldStyle) {
      oldStyle.remove();
    }
    document.head.appendChild(style);

    // ============================================
    // 6. BLOQUEAR DEVTOOLS (apenas detecção)
    // ============================================
    let devtoolsDetected = false;
    const devtoolsInterval = setInterval(() => {
      const threshold = 160;
      const isOpen =
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold;

      if (isOpen && !devtoolsDetected) {
        devtoolsDetected = true;
      }
    }, 500);

    // ============================================
    // CLEANUP
    // ============================================
    return () => {
      clearInterval(devtoolsInterval);
      document.removeEventListener('contextmenu', contextMenuHandler, true as any);
      window.removeEventListener('contextmenu', contextMenuHandler, true as any);
      document.removeEventListener('keydown', keyboardHandler, true as any);
      window.removeEventListener('keydown', keyboardHandler, true as any);
      document.removeEventListener('copy', clipboardHandler, true as any);
      document.removeEventListener('cut', clipboardHandler, true as any);
      document.removeEventListener('paste', clipboardHandler, true as any);
      document.removeEventListener('selectstart', selectionHandler, true as any);
      style.remove();
    };
  }, []);

  return null;
}
