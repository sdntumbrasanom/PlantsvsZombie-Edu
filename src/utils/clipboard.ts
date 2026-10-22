/**
 * Robust clipboard copy utility with iframe and legacy fallbacks.
 * Resolves issues where navigator.clipboard.writeText throws PermissionDenied
 * or SecurityError inside embedded iframes.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. Try modern Clipboard API first (if supported and allowed)
  if (navigator?.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard.writeText blocked or failed, using execCommand fallback:', err);
    }
  }

  // 2. Fallback: document.execCommand('copy') using hidden temporary textarea
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    // Ensure element is off-screen but visible enough to be selectable
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0.01';
    textArea.style.zIndex = '-9999';
    textArea.setAttribute('readonly', '');
    
    document.body.appendChild(textArea);
    textArea.focus({ preventScroll: true });
    textArea.select();
    textArea.setSelectionRange(0, text.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      return true;
    }
  } catch (err) {
    console.warn('document.execCommand fallback failed:', err);
  }

  return false;
}
