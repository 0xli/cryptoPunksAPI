const fs = require('fs');
require('dotenv/config');

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

if (!ALCHEMY_API_KEY) {
  console.error('❌ ALCHEMY_API_KEY environment variable is required');
  process.exit(1);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchSvgUrl = async (id, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const alchemyUrl = `https://eth-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}/getNFTMetadata?contractAddress=0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb&tokenId=${id}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(alchemyUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.image?.cachedUrl) {
          console.log(`✅ Found SVG URL for punk ${id}`);
          return data.image.cachedUrl;
        }
      }
      
      if (attempt < retries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⚠️  Failed for punk ${id} (attempt ${attempt}/${retries}), retrying in ${waitTime}ms...`);
        await sleep(waitTime);
      }
    } catch (error) {
      console.log(`❌ Error fetching punk ${id} (attempt ${attempt}/${retries}): ${error.message}`);
      if (attempt < retries) {
        await sleep(1000 * Math.pow(2, attempt - 1));
      }
    }
  }
  return null;
};

const updateMappingToSvg = async () => {
  console.log('🔄 Updating mapping file to use SVG URLs...');
  
  // Load existing mapping
  const mapping = JSON.parse(fs.readFileSync('openseaCdnMapping.json', 'utf8'));
  
  // Load original data to get all punk IDs
  const originalData = JSON.parse(fs.readFileSync('cryptoPunkData.json', 'utf8'));
  const allIds = Object.keys(originalData);
  
  console.log(`📊 Total punks to process: ${allIds.length}`);
  
  let updatedCount = 0;
  let svgCount = 0;
  let pngCount = 0;
  let otherCount = 0;
  
  // Process in batches
  const batchSize = 50;
  for (let i = 0; i < allIds.length; i += batchSize) {
    const batch = allIds.slice(i, i + batchSize);
    console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allIds.length / batchSize)} (${batch.length} punks)...`);
    
    await Promise.all(batch.map(async (id) => {
      const currentUrl = mapping[id];
      
      // Check if it's already SVG
      if (currentUrl && currentUrl.includes('nft-cdn.alchemy.com') && !currentUrl.includes('convert-png')) {
        svgCount++;
        return;
      }
      
      // Fetch fresh SVG URL
      const svgUrl = await fetchSvgUrl(id);
      if (svgUrl) {
        mapping[id] = svgUrl;
        updatedCount++;
        console.log(`✅ Updated punk ${id} to SVG`);
      } else {
        console.log(`❌ Failed to get SVG for punk ${id}`);
      }
      
      // Rate limiting
      await sleep(100);
    }));
    
    // Save progress
    fs.writeFileSync('openseaCdnMapping.json', JSON.stringify(mapping, null, 2));
    console.log(`💾 Progress saved: ${updatedCount} URLs updated`);
    
    // Delay between batches
    await sleep(1000);
  }
  
  console.log('\n🎉 Mapping update completed!');
  console.log(`📊 Results:`);
  console.log(`   - Updated to SVG: ${updatedCount}`);
  console.log(`   - Already SVG: ${svgCount}`);
  console.log(`   - Total processed: ${updatedCount + svgCount}`);
  
  // Regenerate data file
  console.log('\n🔄 Regenerating cryptoPunkData-Alchemy.json...');
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
  
  fs.writeFileSync('cryptoPunkData-Alchemy.json', JSON.stringify(alchemyData, null, 2));
  console.log('✅ cryptoPunkData-Alchemy.json regenerated');
  
  // Check sample URLs
  console.log('\n🔍 Sample URLs:');
  const sampleIds = ['100', '101', '102', '103', '104'];
  sampleIds.forEach(id => {
    const url = alchemyData[id].image;
    const isSvg = url.includes('nft-cdn.alchemy.com') && !url.includes('convert-png');
    const isPng = url.includes('convert-png');
    console.log(`Punk ${id}: ${isSvg ? '✅ SVG' : isPng ? '❌ PNG' : '⚠️ Other'} - ${url}`);
  });
};

updateMappingToSvg().catch(console.error);
