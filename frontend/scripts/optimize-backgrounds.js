import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.join(__dirname, '../../');
const OUTPUT_DIR = path.join(__dirname, '../public/backgrounds');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const themes = [
  'adventure',
  'discover',
  'indulge',
  'nature',
  'vibe'
];

async function optimizeImage(theme) {
  const inputPath = path.join(SOURCE_DIR, `${theme}-background.jpg`);
  const outputWebP = path.join(OUTPUT_DIR, `${theme}-background.webp`);
  const outputJpg = path.join(OUTPUT_DIR, `${theme}-background.jpg`);

  if (!fs.existsSync(inputPath)) {
    console.log(`❌ ${theme}-background.jpg not found in root directory`);
    return;
  }

  try {
    // Get original file size
    const originalSize = fs.statSync(inputPath).size / 1024 / 1024;

    // Generate optimized WebP (modern browsers)
    await sharp(inputPath)
      .resize(1920, 1080, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 80 })
      .toFile(outputWebP);

    // Generate optimized JPG (fallback)
    await sharp(inputPath)
      .resize(1920, 1080, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80, progressive: true })
      .toFile(outputJpg);

    const webpSize = fs.statSync(outputWebP).size / 1024 / 1024;
    const jpgSize = fs.statSync(outputJpg).size / 1024 / 1024;

    console.log(`✅ ${theme}:`);
    console.log(`   Original: ${originalSize.toFixed(2)}MB`);
    console.log(`   WebP: ${webpSize.toFixed(2)}MB (${((1 - webpSize/originalSize) * 100).toFixed(1)}% smaller)`);
    console.log(`   JPG: ${jpgSize.toFixed(2)}MB (${((1 - jpgSize/originalSize) * 100).toFixed(1)}% smaller)`);
  } catch (error) {
    console.error(`❌ Error optimizing ${theme}:`, error.message);
  }
}

async function optimizeAll() {
  console.log('🎨 Optimizing theme backgrounds...\n');

  for (const theme of themes) {
    await optimizeImage(theme);
  }

  console.log('\n✨ Optimization complete!');
  console.log(`📁 Optimized images saved to: ${OUTPUT_DIR}`);
}

optimizeAll();
