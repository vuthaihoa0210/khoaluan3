const fs = require('fs');
const path = require('path');

const files = [
  'src/app/flights/page.tsx',
  'src/app/hotels/page.tsx',
  'src/app/tours/page.tsx'
];

files.forEach(relativePath => {
  const fullPath = path.join(__dirname, relativePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Convert <Spin size="large" tip="message" /> to <Spin size="large" /><div style={{marginTop: 16}}>message</div>
    content = content.replace(/<Spin size="large" tip="([^"]+)" \/>/g, '<Spin size="large" />\n          <div style={{ marginTop: 16, color: "#666" }}>$1</div>');
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Fixed Antd Spin warning in ${relativePath}`);
  }
});
