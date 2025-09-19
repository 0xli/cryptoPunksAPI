/**
 * Data Model Interfaces
 */

import { BasePunk, Punk } from './punk.interface';
import { Punks } from './punks.interface';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

/**
 * Configuration
 */
const config = require('../../config.js');

/**
 * In-Memory Store
 */
// Load appropriate data based on config
const punks = config.imageSource === 'alchemy' 
  ? require('../../cryptoPunkData-Alchemy.json')
  : require('../../cryptoPunkData.json');

const openseaCdnMappingPath = path.join(__dirname, '../../openseaCdnMapping.json');
let openseaCdnMapping = require('../../openseaCdnMapping.json');

/**
 * Sleep utility for rate limiting
 */
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch OpenSea CDN URL for a specific punk ID with retry logic
 */
const fetchHighQualityImageUrl = async (id: string, retries: number = 3): Promise<string | null> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Try Alchemy API first (free, no auth required)
      const alchemyUrl = `https://eth-mainnet.g.alchemy.com/nft/v3/${process.env.ALCHEMY_API_KEY}/getNFTMetadata?contractAddress=0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb&tokenId=${id}`;
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
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
                 console.log(`Found high-quality SVG image for punk ${id} via Alchemy (attempt ${attempt})`);
                 return data.image.cachedUrl;
               }
             }
      
      // If not successful and not the last attempt, wait before retrying
      if (attempt < retries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
        console.log(`Alchemy API failed for punk ${id} (attempt ${attempt}/${retries}): ${response.status}. Retrying in ${waitTime}ms...`);
        await sleep(waitTime);
      } else {
        console.log(`Alchemy API failed for punk ${id} after ${retries} attempts: ${response.status}`);
      }
    } catch (error) {
      if (attempt < retries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Error fetching high-quality image for punk ${id} (attempt ${attempt}/${retries}):`, error.message || error);
        console.log(`Retrying in ${waitTime}ms...`);
        await sleep(waitTime);
      } else {
        console.log(`Error fetching high-quality image for punk ${id} after ${retries} attempts:`, error.message || error);
      }
    }
  }
  
  return null;
};

/**
 * Save CDN URL to mapping file
 */
const saveCdnUrlToMapping = (id: string, cdnUrl: string): void => {
  try {
    openseaCdnMapping[id] = cdnUrl;
    fs.writeFileSync(openseaCdnMappingPath, JSON.stringify(openseaCdnMapping, null, 2));
    console.log(`Saved CDN URL for punk ${id} to mapping file`);
  } catch (error) {
    console.error(`Error saving CDN URL for punk ${id}:`, error);
  }
};

/**
 * Rate limiting configuration
 */
const RATE_LIMIT_DELAY = 100; // 100ms between requests (10 requests per second)
let lastRequestTime = 0;

/**
 * Generate OpenSea CDN URL dynamically for any punk ID with rate limiting
 */
const generateHighQualityImageUrl = async (id: string): Promise<string> => {
  // Check if we have a mapping for this ID
  if (openseaCdnMapping[id]) {
    return openseaCdnMapping[id];
  }
  
  // Rate limiting: ensure we don't exceed 10 requests per second
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await sleep(RATE_LIMIT_DELAY - timeSinceLastRequest);
  }
  lastRequestTime = Date.now();
  
  // For unmapped IDs, fetch from Alchemy API
  console.log(`Fetching high-quality image URL for punk ${id}...`);
  const imageUrl = await fetchHighQualityImageUrl(id);
  
  if (imageUrl) {
    // Save the new URL to the mapping file
    saveCdnUrlToMapping(id, imageUrl);
    return imageUrl;
  }
  
  // Fallback to cryptopunks.app if Alchemy fails
  const paddedId = id.padStart(4, '0');
  return `https://www.cryptopunks.app/images/cryptopunks/punk${paddedId}.png`;
};

/**
 * Image URL Generation
 */
const generateImageUrl = async (id: string): Promise<string> => {
  const paddedId = id.padStart(4, '0');
  
  console.log(`Generating image URL for punk ${id}, config.imageSource: ${config.imageSource}`);
  
  switch (config.imageSource) {
    case 'cryptopunks.app':
      return `https://www.cryptopunks.app/images/cryptopunks/punk${paddedId}.png`;
    case 'larvalabs':
      return `https://www.larvalabs.com/cryptopunks/cryptopunk${id}.png`;
    case 'opensea':
      return `https://opensea.io/assets/ethereum/0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb/${id}`;
    case 'opensea-cdn':
      console.log(`Using high-quality image source for punk ${id}`);
      return await generateHighQualityImageUrl(id);
    case 'alchemy':
      console.log(`Using Alchemy API for punk ${id}`);
      return await generateHighQualityImageUrl(id);
    default:
      return `https://www.cryptopunks.app/images/cryptopunks/punk${paddedId}.png`;
  }
};

/**
 * Transform punk data with dynamic image URL
 */
export const transformPunk = async (id: string, punk: BasePunk): Promise<Punk> => {
  // If using alchemy data, the image URL is already correct
  if (config.imageSource === 'alchemy') {
    return {
      id,
      ...punk,
      image: punk.image // Use the image URL directly from the data
    };
  }
  
  // For other configs, generate the image URL
  const imageUrl = await generateImageUrl(id);
  return {
    id,
    ...punk,
    image: imageUrl
  };
};

/**
 * Process punks in batches to avoid overwhelming the API
 */
const processBatch = async (batch: [string, BasePunk][]): Promise<Punk[]> => {
  const results: Punk[] = [];
  
  for (const [id, punk] of batch) {
    try {
      const transformedPunk = await transformPunk(id, punk);
      results.push(transformedPunk);
    } catch (error) {
      console.error(`Error processing punk ${id}:`, error);
      // Add punk with fallback image URL
      const paddedId = id.padStart(4, '0');
      results.push({
        id,
        ...punk,
        image: `https://www.cryptopunks.app/images/cryptopunks/punk${paddedId}.png`
      });
    }
  }
  
  return results;
};

/**
 * Service Methods
 */

export const findAll = async (): Promise<Punk[]> => {
  // If using Alchemy data, the images are already processed - no need to transform
  if (config.imageSource === 'alchemy') {
    console.log('Using pre-processed Alchemy data - skipping transformation');
    return Object.entries(punks).map(([id, punk]) => ({
      id,
      ...punk
    })) as Punk[];
  }
  
  // For other configs, process in batches
  const punkEntries = Object.entries(punks);
  const batchSize = 50; // Process 50 punks at a time
  const allTransformedPunks: Punk[] = [];
  
  console.log(`Processing ${punkEntries.length} punks in batches of ${batchSize}...`);
  
  for (let i = 0; i < punkEntries.length; i += batchSize) {
    const batch = punkEntries.slice(i, i + batchSize) as [string, BasePunk][];
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(punkEntries.length / batchSize)} (punks ${i + 1}-${Math.min(i + batchSize, punkEntries.length)})...`);
    
    const batchResults = await processBatch(batch);
    allTransformedPunks.push(...batchResults);
    
    // Small delay between batches to be respectful to the API
    if (i + batchSize < punkEntries.length) {
      await sleep(1000); // 1 second between batches
    }
  }
  
  console.log(`Successfully processed ${allTransformedPunks.length} punks`);
  return allTransformedPunks;
};

export const find = async (id: string): Promise<Punk> => {
  const punk = punks[id];
  if (!punk) return null;
  
  // If using Alchemy data, the image is already processed - no need to transform
  if (config.imageSource === 'alchemy') {
    return {
      id,
      ...punk
    } as Punk;
  }
  
  return await transformPunk(id, punk as BasePunk);
};
