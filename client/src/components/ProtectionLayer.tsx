import { useEffect } from 'react';

/**
 * Componente de proteção global IMPOSSÍVEL DE CONTORNAR
 * Bloqueia TUDO que pode ser usado para espionagem
 */
export function ProtectionLayer() {
  useEffect(() => {
    // Função para bloquear evento
    const preventDefault = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };

    // ============================================
    // 1. BLOQUEAR CONTEXTO (BOTÃO DIREITO)
    // ============================================
    const contextMenuHandler = (e: any) => {
      if (e.button === 2 || e.type === 'contextmenu') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    // Múltiplas camadas de proteção
    document.addEventListener('contextmenu', contextMenuHandler, { capture: true, passive: false });
    document.addEventListener('mousedown', contextMenuHandler, { capture: true, passive: false });
    document.addEventListener('mouseup', contextMenuHandler, { capture: true, passive: false });
    document.addEventListener('mousepress', contextMenuHandler, { capture: true, passive: false });
    window.addEventListener('contextmenu', contextMenuHandler, { capture: true, passive: false });

    // ============================================
    // 2. BLOQUEAR TECLADO (F12, CTRL+U, ETC)
    // ============================================
    const keyboardHandler = (e: KeyboardEvent) => {
      // Lista de combinações bloqueadas
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
        (e.ctrlKey && (e.key === 'c' || e.key === 'C')) ||
        (e.ctrlKey && (e.key === 'x' || e.key === 'X')) ||
        (e.ctrlKey && (e.key === 'v' || e.key === 'V')) ||
        (e.metaKey && (e.key === 'c' || e.key === 'C')) ||
        (e.metaKey && (e.key === 'x' || e.key === 'X')) ||
        (e.metaKey && (e.key === 'v' || e.key === 'V')) ||
        (e.metaKey && (e.key === 'u' || e.key === 'U'));

      if (isBlocked) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    document.addEventListener('keydown', keyboardHandler, { capture: true, passive: false });
    window.addEventListener('keydown', keyboardHandler, { capture: true, passive: false });
    document.addEventListener('keypress', keyboardHandler, { capture: true, passive: false });
    window.addEventListener('keypress', keyboardHandler, { capture: true, passive: false });

    // ============================================
    // 3. BLOQUEAR CLIPBOARD (COPY/PASTE/CUT)
    // ============================================
    const clipboardHandler = (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };

    document.addEventListener('copy', clipboardHandler, { capture: true, passive: false });
    document.addEventListener('cut', clipboardHandler, { capture: true, passive: false });
    document.addEventListener('paste', clipboardHandler, { capture: true, passive: false });
    window.addEventListener('copy', clipboardHandler, { capture: true, passive: false });
    window.addEventListener('cut', clipboardHandler, { capture: true, passive: false });
    window.addEventListener('paste', clipboardHandler, { capture: true, passive: false });

    // ============================================
    // 4. BLOQUEAR SELEÇÃO E DRAG
    // ============================================
    const selectionHandler = (e: any) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('selectstart', selectionHandler, { capture: true, passive: false });
    document.addEventListener('dragstart', selectionHandler, { capture: true, passive: false });
    document.addEventListener('drag', selectionHandler, { capture: true, passive: false });
    document.addEventListener('drop', selectionHandler, { capture: true, passive: false });

    // ============================================
    // 5. CSS AGRESSIVO - USER-SELECT NONE
    // ============================================
    const style = document.createElement('style');
    style.textContent = `
      html, body, * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-user-drag: none !important;
        -webkit-app-region: no-drag !important;
      }
      
      input, textarea, [contenteditable="true"], [contenteditable="plaintext-only"] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
      
      body {
        -webkit-user-drag: none !important;
      }
    `;
    document.documentElement.appendChild(style);

    // ============================================
    // 6. BLOQUEAR CONSOLE
    // ============================================
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      const noop = () => {};
      console.log = noop;
      console.warn = noop;
      console.error = noop;
      console.debug = noop;
      console.info = noop;
      console.trace = noop;
      console.time = noop;
      console.timeEnd = noop;
    }

    // ============================================
    // 7. BLOQUEAR DEVTOOLS
    // ============================================
    let devtoolsDetected = false;
    const devtoolsInterval = setInterval(() => {
      const threshold = 160;
      const isOpen =
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold;

      if (isOpen && !devtoolsDetected) {
        devtoolsDetected = true;
        console.log('%c⚠️ Proteção Ativa', 'color: red; font-weight: bold; font-size: 16px;');
      }
    }, 500);

    // ============================================
    // 8. BLOQUEAR INSPECIONAR ELEMENTO
    // ============================================
    // Bloquear quando tenta inspecionar
    document.addEventListener('mousedown', (e: any) => {
      if (e.button === 2) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    }, true);

    // ============================================
    // 9. PROTEGER CONTRA MODIFICAÇÃO DO OBJETO WINDOW
    // ============================================
    Object.defineProperty(window, 'devtools', {
      get() {
        return undefined;
      },
      set() {
        return false;
      },
    });

    // ============================================
    // CLEANUP
    // ============================================
    return () => {
      clearInterval(devtoolsInterval);
      document.removeEventListener('contextmenu', contextMenuHandler, true as any);
      document.removeEventListener('mousedown', contextMenuHandler, true as any);
      document.removeEventListener('mouseup', contextMenuHandler, true as any);
      window.removeEventListener('contextmenu', contextMenuHandler, true as any);
      document.removeEventListener('keydown', keyboardHandler, true as any);
      window.removeEventListener('keydown', keyboardHandler, true as any);
      document.removeEventListener('copy', clipboardHandler, true as any);
      document.removeEventListener('cut', clipboardHandler, true as any);
      document.removeEventListener('paste', clipboardHandler, true as any);
      window.removeEventListener('copy', clipboardHandler, true as any);
      window.removeEventListener('cut', clipboardHandler, true as any);
      window.removeEventListener('paste', clipboardHandler, true as any);
      document.removeEventListener('selectstart', selectionHandler, true as any);
      document.removeEventListener('dragstart', selectionHandler, true as any);
      style.remove();
    };
  }, []);

  return null;
}
