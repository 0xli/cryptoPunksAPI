#!/usr/bin/env node

/**
 * Alchemy Data Update Script
 * 
 * This script fetches high-quality image URLs from Alchemy API and updates
 * the local data files for the CryptoPunks API.
 * 
 * Usage:
 *   npm run update-alchemy-data
 *   yarn update-alchemy-data
 *   node scripts/update-alchemy-data.js
 */

const fs = require('fs');
const path = require('path');
require('dotenv/config');

// Configuration
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const RATE_LIMIT_DELAY = 100; // 100ms between requests (10 requests per second)
const MAX_RETRIES = 3;
const BATCH_SIZE = 50;
const TIMEOUT_MS = 10000; // 10 seconds

// File paths
const ORIGINAL_DATA_PATH = path.join(__dirname, '../cryptoPunkData.json');
const MAPPING_PATH = path.join(__dirname, '../openseaCdnMapping.json');
const ALCHEMY_DATA_PATH = path.join(__dirname, '../cryptoPunkData-Alchemy.json');

let lastRequestTime = 0;

/**
 * Sleep utility for rate limiting
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch high-quality image URL with retry logic
 */
const fetchHighQualityImageUrl = async (id, retries = MAX_RETRIES) => {
  if (!ALCHEMY_API_KEY) {
    throw new Error('ALCHEMY_API_KEY environment variable is required');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
        await sleep(RATE_LIMIT_DELAY - timeSinceLastRequest);
      }
      lastRequestTime = Date.now();

      // Try Alchemy API
      const alchemyUrl = `https://eth-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}/getNFTMetadata?contractAddress=0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb&tokenId=${id}`;
      
      // Add timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      
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
          console.log(`✅ Found high-quality image for punk ${id} (attempt ${attempt})`);
          return data.image.cachedUrl;
        }
      }
      
      // If not successful and not the last attempt, wait before retrying
      if (attempt < retries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⚠️  Alchemy API failed for punk ${id} (attempt ${attempt}/${retries}): ${response.status}. Retrying in ${waitTime}ms...`);
        await sleep(waitTime);
      } else {
        console.log(`❌ Alchemy API failed for punk ${id} after ${retries} attempts: ${response.status}`);
      }
    } catch (error) {
      if (attempt < retries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⚠️  Error fetching high-quality image for punk ${id} (attempt ${attempt}/${retries}):`, error.message);
        console.log(`Retrying in ${waitTime}ms...`);
        await sleep(waitTime);
      } else {
        console.log(`❌ Error fetching high-quality image for punk ${id} after ${retries} attempts:`, error.message);
      }
    }
  }
  
  return null;
};

/**
 * Process punks in batches
 */
const processBatch = async (batch, updatedMapping) => {
  let successCount = 0;
  
  for (const id of batch) {
    // Skip if we already have an Alchemy URL
    if (updatedMapping[id]) {
      console.log(`⏭️  Skipping punk ${id} (already has Alchemy URL)`);
      continue;
    }
    
    console.log(`🔍 Fetching high-quality image URL for punk ${id}...`);
    const imageUrl = await fetchHighQualityImageUrl(id);
    
    if (imageUrl) {
      updatedMapping[id] = imageUrl;
      successCount++;
    }
    
    // Small delay between individual requests
    await sleep(50);
  }
  
  return successCount;
};

/**
 * Generate Alchemy data file
 */
const generateAlchemyDataFile = (originalData, mapping) => {
  console.log('\n🔄 Generating updated cryptoPunkData-Alchemy.json...');
  
  const alchemyData = {};
  
  Object.keys(originalData).forEach(id => {
    const punk = originalData[id];
    const imageUrl = mapping[id] || `https://www.cryptopunks.app/images/cryptopunks/punk${id.padStart(4, '0')}.png`;
    
    alchemyData[id] = {
      type: punk.type,
      accessories: punk.accessories,
      image: imageUrl
    };
  });
  
  fs.writeFileSync(ALCHEMY_DATA_PATH, JSON.stringify(alchemyData, null, 2));
  console.log('✅ Updated cryptoPunkData-Alchemy.json generated');
};

/**
 * Main function
 */
const main = async () => {
  try {
    console.log('🚀 Starting Alchemy data update...');
    
    if (!ALCHEMY_API_KEY) {
      throw new Error('ALCHEMY_API_KEY environment variable is required. Please set it in your .env.local file.');
    }
    
    console.log(`Using Alchemy API key: ${ALCHEMY_API_KEY.substring(0, 8)}...`);
    
    // Load existing data
    const originalData = JSON.parse(fs.readFileSync(ORIGINAL_DATA_PATH, 'utf8'));
    const existingMapping = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));
    
    console.log(`📊 Total punks: ${Object.keys(originalData).length}`);
    console.log(`📊 Already have Alchemy URLs: ${Object.keys(existingMapping).length}`);
    
    // Get all punk IDs that don't have Alchemy URLs yet
    const allIds = Object.keys(originalData);
    const missingIds = allIds.filter(id => !existingMapping[id]);
    
    console.log(`📊 Need to fetch: ${missingIds.length}`);
    
    if (missingIds.length === 0) {
      console.log('🎉 All punks already have Alchemy URLs!');
      generateAlchemyDataFile(originalData, existingMapping);
      return;
    }
    
    // Process in batches
    const updatedMapping = { ...existingMapping };
    const totalBatches = Math.ceil(missingIds.length / BATCH_SIZE);
    let totalSuccessCount = 0;
    
    for (let i = 0; i < missingIds.length; i += BATCH_SIZE) {
      const batch = missingIds.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      
      console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (punks ${i + 1}-${Math.min(i + BATCH_SIZE, missingIds.length)})...`);
      
      const batchSuccessCount = await processBatch(batch, updatedMapping);
      totalSuccessCount += batchSuccessCount;
      
      console.log(`✅ Batch ${batchNumber} completed: ${batchSuccessCount}/${batch.length} successful`);
      
      // Save progress after each batch
      fs.writeFileSync(MAPPING_PATH, JSON.stringify(updatedMapping, null, 2));
      console.log(`💾 Progress saved: ${Object.keys(updatedMapping).length} total Alchemy URLs`);
      
      // Delay between batches
      if (i + BATCH_SIZE < missingIds.length) {
        console.log('⏳ Waiting 2 seconds before next batch...');
        await sleep(2000);
      }
    }
    
    console.log(`\n🎉 Completed! Successfully fetched ${totalSuccessCount} new high-quality images`);
    console.log(`📊 Total Alchemy URLs: ${Object.keys(updatedMapping).length}`);
    console.log(`📊 Fallback URLs needed: ${allIds.length - Object.keys(updatedMapping).length}`);
    
    // Generate updated Alchemy data file
    generateAlchemyDataFile(originalData, updatedMapping);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
