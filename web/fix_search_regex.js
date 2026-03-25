const fs = require('fs');

function fix(file) {
  let c = fs.readFileSync(file, 'utf8');
  
  // flights
  c = c.replace(/f\.name\.toLowerCase\(\)\.includes\(fromLower\)/g, "removeAccents(f.name).includes(fromLower)");
  c = c.replace(/f\.location\.toLowerCase\(\)\.includes\(toLower\)/g, "removeAccents(f.location).includes(toLower)");
  c = c.replace(/f\.name\.toLowerCase\(\)\.includes\(toLower\)/g, "removeAccents(f.name).includes(toLower)");
  c = c.replace(/from\.toLowerCase\(\)/g, "removeAccents(from)");
  c = c.replace(/to\.toLowerCase\(\)/g, "removeAccents(to)");
  
  // hotels
  c = c.replace(/h\.name\.toLowerCase\(\)\.includes\(term\)/g, "removeAccents(h.name).includes(term)");
  c = c.replace(/h\.location\.toLowerCase\(\)\.includes\(term\)/g, "removeAccents(h.location).includes(term)");
  c = c.replace(/searchTerm\.toLowerCase\(\)/g, "removeAccents(searchTerm)");

  // tours
  c = c.replace(/t\.name\.toLowerCase\(\)\.includes\(term\)/g, "removeAccents(t.name).includes(term)");
  c = c.replace(/t\.location\.toLowerCase\(\)\.includes\(term\)/g, "removeAccents(t.location).includes(term)");

  fs.writeFileSync(file, c);
}

fix('src/app/flights/page.tsx');
fix('src/app/hotels/page.tsx');
fix('src/app/tours/page.tsx');
console.log('Fixed via regex');
