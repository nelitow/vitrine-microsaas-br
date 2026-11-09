// Shared by the build (initial server-rendered order) and the browser (re-sorting).
// The build inlines this file into the page with the `export` keywords stripped.
export function hotness(p, now) {
  if (p.status === 'morto') return -1;
  const ageHours = Math.max(0, now - p.lastUpdate) / 3600;
  return (p.score + p.comments * 0.5 + 1) / Math.pow(ageHours + 2, 1.5);
}
