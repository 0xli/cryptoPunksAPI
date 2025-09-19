const fs = require('fs');

console.log('🔄 Regenerating cryptoPunkData-Alchemy.json with SVG URLs...');

// Load the original data
const originalData = JSON.parse(fs.readFileSync('cryptoPunkData.json', 'utf8'));

// Load the mapping with SVG URLs
const mapping = JSON.parse(fs.readFileSync('openseaCdnMapping.json', 'utf8'));

// Create new data file with SVG URLs
const alchemyData = {};

Object.keys(originalData).forEach(id => {
  const punk = originalData[id];
  const imageUrl = mapping[id] || `https://www.cryptopunks.app/images/cryptopunks/punk${id.padStart(4, '0')}.png`;
  
  alchemyData[id] = {
    type: punk.type,
    image: imageUrl,
    accessories: punk.accessories
  };
});

// Write the updated file
fs.writeFileSync('cryptoPunkData-Alchemy.json', JSON.stringify(alchemyData, null, 2));

console.log('✅ cryptoPunkData-Alchemy.json regenerated with SVG URLs');
console.log(`📊 Total entries: ${Object.keys(alchemyData).length}`);

// Check a few sample URLs
const sampleIds = ['100', '101', '102'];
console.log('\n🔍 Sample URLs:');
sampleIds.forEach(id => {
  const url = alchemyData[id].image;
  const isSvg = url.includes('nft-cdn.alchemy.com');
  const isPng = url.includes('convert-png');
  console.log(`Punk ${id}: ${isSvg ? '✅ SVG' : isPng ? '❌ PNG' : '⚠️ Other'} - ${url}`);
});
