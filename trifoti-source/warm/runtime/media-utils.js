// Previews are deterministic, derivatives (new letterboxed photos retain the entire frame) of the real files.
// The main viewer always retains item.src / item.poster at original quality.
export function thumbnailSource(item) {
  const source = item.poster || item.src;
  // Warm-only photos have no generated thumbnail set. Keep their real source.
  if (!source.includes('/STEP_3D/trifoti/assets/projects/')) return source;
  return source.replace('/STEP_3D/trifoti/assets/projects/', '/STEP_3D/trifoti/assets/previews/').replace(/\.(?:webp|jpe?g|png)$/, '-thumb.webp');
}
