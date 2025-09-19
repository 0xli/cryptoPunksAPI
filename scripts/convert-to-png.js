#!/usr/bin/env node

/**
 * Convert existing Alchemy SVG URLs to PNG URLs
 */

const fs = require('fs');
const path = require('path');
require('dotenv/config');

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

if (!ALCHEMY_API_KEY) {
  console.error('❌ ALCHEMY_API_KEY environment variable is required');
  process.exit(1);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const convertSvgToPng = async (id, svgUrl) => {
  try {
    // Extract the hash from the SVG URL
    const hash = svgUrl.split('/').pop();
    
    // Convert to PNG URL format
    const pngUrl = `https://res.cloudinary.com/alchemyapi/image/upload/convert-png/eth-mainnet/${hash}`;
    
    // Test if the PNG URL works
    const response = await fetch(pngUrl, { method: 'HEAD' });
    if (response.ok) {
      console.log(`✅ Converted punk ${id} to PNG URL`);
      return pngUrl;
    } else {
      console.log(`⚠️  PNG URL failed for punk ${id}, keeping SVG`);
      return svgUrl;
    }
  } catch (error) {
    console.log(`❌ Error converting punk ${id}: ${error.message}`);
    return svgUrl;
  }
};

const main = async () => {
  console.log('🔄 Converting SVG URLs to PNG URLs...');
  
  // Load existing mapping
  const mappingPath = path.join(__dirname, '../openseaCdnMapping.json');
  const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
  
  console.log(`📊 Found ${Object.keys(mapping).length} existing URLs`);
  
  const updatedMapping = {};
  let convertedCount = 0;
  
  // Process in batches
  const ids = Object.keys(mapping);
  const batchSize = 50;
  
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(ids.length / batchSize);
    
    console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches}...`);
    
    for (const id of batch) {
      const svgUrl = mapping[id];
      const pngUrl = await convertSvgToPng(id, svgUrl);
      
      updatedMapping[id] = pngUrl;
      
      if (pngUrl !== svgUrl) {
        convertedCount++;
      }
      
      // Small delay to be respectful
      await sleep(50);
    }
    
    // Save progress
    fs.writeFileSync(mappingPath, JSON.stringify(updatedMapping, null, 2));
    console.log(`💾 Progress saved: ${Object.keys(updatedMapping).length} URLs processed`);
  }
  
  console.log(`\n🎉 Conversion completed!`);
  console.log(`📊 Total URLs: ${Object.keys(updatedMapping).length}`);
  console.log(`📊 Converted to PNG: ${convertedCount}`);
  console.log(`📊 Kept as SVG: ${Object.keys(updatedMapping).length - convertedCount}`);
  
  // Generate updated Alchemy data file
  console.log('\n🔄 Generating updated cryptoPunkData-Alchemy.json...');
  const originalData = JSON.parse(fs.readFileSync(path.join(__dirname, '../cryptoPunkData.json'), 'utf8'));
  
  const alchemyData = {};
  Object.keys(originalData).forEach(id => {
    const punk = originalData[id];
    const imageUrl = updatedMapping[id] || `https://www.cryptopunks.app/images/cryptopunks/punk${id.padStart(4, '0')}.png`;
    
    alchemyData[id] = {
      type: punk.type,
      accessories: punk.accessories,
      image: imageUrl
    };
  });
  
  fs.writeFileSync(path.join(__dirname, '../cryptoPunkData-Alchemy.json'), JSON.stringify(alchemyData, null, 2));
  console.log('✅ Updated cryptoPunkData-Alchemy.json generated');
};

main().catch(console.error);
