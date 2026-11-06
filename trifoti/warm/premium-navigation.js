// Progressive enhancement: native disclosures work without this independent script.
// Direct links and same-hash clicks reveal the content before native anchor scrolling.
(() => {
  function reveal(hash) {
    if (!hash || hash === '#') return;
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target) return;
    let element = target;
    while (element) {
      if (element.tagName === 'DETAILS') element.open = true;
      element = element.parentElement;
    }
    return target;
  }
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href^="#"]');
    if (link) reveal(link.getAttribute('href'));
  });
  function route() {
    const target = reveal(location.hash);
    if (target) requestAnimationFrame(() => target.scrollIntoView({block: 'start', behavior: 'instant'}));
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('pageshow', route);
  reveal(location.hash);
})();
