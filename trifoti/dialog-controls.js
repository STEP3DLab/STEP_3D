// Keep a visible keyboard target at both ends of a native modal dialog.
// Native <dialog> still owns modality, Escape, and focus restoration on close.
export function keepDialogFocus(dialog) {
  dialog.addEventListener('keydown', event => {
    if (!dialog.open || event.defaultPrevented || event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
    const controls = [...dialog.querySelectorAll('a[href],button,input,select,textarea,video[controls],audio[controls],[tabindex]')]
      .filter(element => element.tabIndex >= 0 && !element.matches(':disabled') && !element.closest('[hidden],[inert]') && element.getClientRects().length && getComputedStyle(element).visibility === 'visible');
    if (!controls.length) return;
    const first = controls[0], last = controls[controls.length - 1], active = document.activeElement;
    if (active === dialog || !dialog.contains(active) || (event.shiftKey ? active === first : active === last)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  });
}

// Do not consume browser/assistive shortcuts or native editing/media keys.
export function galleryArrow(event) {
  if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.target.isContentEditable || event.target.closest('video,audio,input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]')) return 0;
  return event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
}
