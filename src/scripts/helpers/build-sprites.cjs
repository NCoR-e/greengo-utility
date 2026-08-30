const fs = require('fs');
const path = require('path');
const { optimize } = require('svgo');

// 4x3 - прямоугольные, 1x1 = квадратные
const SRC = 'node_modules/flag-icons/flags/4x3';

const symbols = fs.readdirSync(SRC)
  .filter(f => f.endsWith('.svg'))
  .map(file => {
    const code = path.basename(file, '.svg'); // "ru", "us", "gb" (ISO 3166-1)
    const raw = fs.readFileSync(path.join(SRC, file), 'utf8');

    const { data } = optimize(raw, {
      plugins: [
        'preset-default',
        { name: 'prefixIds', params: { prefix: `f-${code}` } },
      ],
    });

    const viewBox = data.match(/viewBox="([^"]+)"/)[1];
    const inner = data
      .replace(/^<svg[^>]*>/, '')
      .replace(/<\/svg>\s*$/, '');

    return `<symbol id="flag-${code}" viewBox="${viewBox}">${inner}</symbol>`;
  });

fs.writeFileSync(
  'flags-sprite.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true">\n${symbols.join('\n')}\n</svg>`
);

console.log(`Готово: ${symbols.length} флагов`);