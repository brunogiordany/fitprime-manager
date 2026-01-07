import { useEffect } from 'react';

/**
 * Componente de proteção global contra espionagem, cópia de código e acesso a ferramentas de desenvolvedor
 * Bloqueia:
 * - Botão direito do mouse
 * - Atalhos de teclado (F12, Ctrl+U, Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+Shift+J, Ctrl+Shift+K)
 * - Copiar/Colar/Cortar (Ctrl+C, Ctrl+X, Ctrl+V)
 * - Seleção de texto
 * - Drag & drop
 * - DevTools detection
 */
export function ProtectionLayer() {
  useEffect(() => {
    // Bloquear botão direito
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Bloquear atalhos de teclado perigosos
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 - DevTools
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Ctrl+U - View Source
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+I - Inspect Element
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+C - Inspect Element (Chrome)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+J - Console
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+K - Console (Firefox)
      if (e.ctrlKey && e.shiftKey && e.key === 'K') {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+M - DevTools (Edge)
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        return false;
      }

      // Cmd+Option+I - DevTools (Mac)
      if (e.metaKey && e.altKey && e.key === 'i') {
        e.preventDefault();
        return false;
      }

      // Cmd+Option+U - View Source (Mac)
      if (e.metaKey && e.altKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }

      // Cmd+Option+J - Console (Mac)
      if (e.metaKey && e.altKey && e.key === 'j') {
        e.preventDefault();
        return false;
      }

      // Ctrl+C - Copiar
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        return false;
      }

      // Ctrl+X - Cortar
      if (e.ctrlKey && e.key === 'x') {
        e.preventDefault();
        return false;
      }

      // Ctrl+V - Colar
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        return false;
      }

      // Cmd+C - Copiar (Mac)
      if (e.metaKey && e.key === 'c') {
        e.preventDefault();
        return false;
      }

      // Cmd+X - Cortar (Mac)
      if (e.metaKey && e.key === 'x') {
        e.preventDefault();
        return false;
      }

      // Cmd+V - Colar (Mac)
      if (e.metaKey && e.key === 'v') {
        e.preventDefault();
        return false;
      }

      // Cmd+U - View Source (Mac)
      if (e.metaKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }

      return true;
    };

    // Bloquear seleção de texto
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Bloquear drag & drop
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // Bloquear copy event
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    // Bloquear cut event
    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    // Bloquear paste event
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    // Aplicar estilos de proteção ao documento
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
      }
      
      input, textarea {
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
        user-select: text;
      }
      
      body {
        -webkit-user-drag: none;
        -webkit-app-region: no-drag;
      }
    `;
    document.head.appendChild(style);

    // Adicionar listeners
    document.addEventListener('contextmenu', handleContextMenu, false);
    document.addEventListener('keydown', handleKeyDown, false);
    document.addEventListener('selectstart', handleSelectStart, false);
    document.addEventListener('dragstart', handleDragStart, false);
    document.addEventListener('copy', handleCopy, false);
    document.addEventListener('cut', handleCut, false);
    document.addEventListener('paste', handlePaste, false);

    // Detectar DevTools aberto
    const detectDevTools = () => {
      const threshold = 160;
      if (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      ) {
        // DevTools detectado - você pode adicionar lógica aqui
        console.log('⚠️ Proteção ativa');
      }
    };

    const devToolsInterval = setInterval(detectDevTools, 500);

    // Cleanup
    return () => {
      clearInterval(devToolsInterval);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      style.remove();
    };
  }, []);

  return null;
}
