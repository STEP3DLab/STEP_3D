// Previews are deterministic, centre-cropped derivatives of the real files.
// The main viewer always retains item.src / item.poster at original quality.
export function thumbnailSource(item) {
  return (item.poster || item.src).replace('assets/projects/', 'assets/previews/').replace(/\.webp$/, '-thumb.webp');
}
