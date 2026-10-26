// Previews are deterministic, derivatives (new letterboxed photos retain the entire frame) of the real files.
// The main viewer always retains item.src / item.poster at original quality.
export function thumbnailSource(item) {
  return (item.poster || item.src).replace('assets/projects/', 'assets/previews/').replace(/\.(?:webp|jpe?g|png)$/, '-thumb.webp');
}
