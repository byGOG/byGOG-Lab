const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [150, 192, 512];
const svgPath = path.join(__dirname, '../icon/bygog-lab-icon.svg');
const outputDir = path.join(__dirname, '../icon');

async function generateIcons() {
  const svgBuffer = fs.readFileSync(svgPath);
  
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `bygog-lab-icon-${size}.png`);
    
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Generated: bygog-lab-icon-${size}.png`);
  }
  
  console.log('\n🎉 All icons generated successfully!');
}

generateIcons().catch(console.error);
