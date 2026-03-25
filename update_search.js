const fs = require('fs');

const util = `const removeAccents = (str: string) => {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
};
`;

function fixFile(file, isFlight) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('removeAccents')) {
    content = content.replace('export default function', util + '\nexport default function');
  }

  if (isFlight) {
    content = content.replace(
      'const fromLower = from.toLowerCase();\n      filtered = filtered.filter(f => f.name.toLowerCase().includes(fromLower));',
      'const fromLower = removeAccents(from);\n      filtered = filtered.filter(f => removeAccents(f.name).includes(fromLower));'
    );
    content = content.replace(
      'const toLower = to.toLowerCase();\n      filtered = filtered.filter(f => \n        (f.location && f.location.toLowerCase().includes(toLower)) || \n        f.name.toLowerCase().includes(toLower)\n      );',
      'const toLower = removeAccents(to);\n      filtered = filtered.filter(f => \n        (f.location && removeAccents(f.location).includes(toLower)) || \n        removeAccents(f.name).includes(toLower)\n      );'
    );
  } else {
    const varName = file.includes('hotels') ? 'h' : 't';
    content = content.replace(
      `const term = searchTerm.toLowerCase();\n      filtered = filtered.filter(${varName} => \n        (${varName}.location && ${varName}.location.toLowerCase().includes(term)) ||\n        ${varName}.name.toLowerCase().includes(term)\n      );`,
      `const term = removeAccents(searchTerm);\n      filtered = filtered.filter(${varName} => \n        (${varName}.location && removeAccents(${varName}.location).includes(term)) ||\n        removeAccents(${varName}.name).includes(term)\n      );`
    );
  }
  
  fs.writeFileSync(file, content);
}

fixFile('web/src/app/flights/page.tsx', true);
fixFile('web/src/app/hotels/page.tsx', false);
fixFile('web/src/app/tours/page.tsx', false);
console.log('Search enhanced on all 3 pages');
