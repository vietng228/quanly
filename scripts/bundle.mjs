import { readFile, writeFile } from 'node:fs/promises';

let html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
for (const match of [...html.matchAll(/<link rel="stylesheet" href="([^"?]+)(?:\?[^"]*)?"\s*\/>/g)]) {
  const css = await readFile(new URL('../' + match[1], import.meta.url), 'utf8');
  html = html.replace(match[0], () => `<style>\n${css}\n</style>`);
}
for (const match of [...html.matchAll(/<script src="([^"?]+)(?:\?[^"]*)?"><\/script>/g)]) {
  const js = await readFile(new URL('../' + match[1], import.meta.url), 'utf8');
  html = html.replace(match[0], () => `<script>\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`);
}
// Embed local fonts so the single-file build keeps the same typography offline.
for (const match of [...html.matchAll(/url\((\.\.\/fonts\/[^)]+\.woff2)\)/g)]) {
  const font = await readFile(new URL(match[1], import.meta.url));
  html = html.replace(match[0], () => `url(data:font/woff2;base64,${font.toString('base64')})`);
}
await writeFile(new URL('../QuanLyThuChi.html', import.meta.url), html);
console.log('Đã cập nhật QuanLyThuChi.html; có thể đưa thẳng lên GitHub Pages.');
