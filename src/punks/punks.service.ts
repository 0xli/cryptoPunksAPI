/**
 * Data Model Interfaces
 */

import { BasePunk, Punk } from './punk.interface';
import { Punks } from './punks.interface';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Configuration
 */
const config = require('../../config.js');

/**
 * In-Memory Store
 */
const punks = require('../../cryptoPunkData.json');
const openseaCdnMappingPath = path.join(__dirname, '../../openseaCdnMapping.json');
let openseaCdnMapping = require('../../openseaCdnMapping.json');

/**
 * Fetch OpenSea CDN URL for a specific punk ID
 */
const fetchHighQualityImageUrl = async (id: string): Promise<string | null> => {
  try {
    // Try Alchemy API first (free, no auth required)
    const alchemyUrl = `https://eth-mainnet.g.alchemy.com/nft/v3/demo/getNFTMetadata?contractAddress=0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb&tokenId=${id}`;
    const response = await fetch(alchemyUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.image?.cachedUrl) {
        console.log(`Found high-quality image for punk ${id} via Alchemy`);
        return data.image.cachedUrl;
      }
    }
    
    console.log(`Alchemy API failed for punk ${id}: ${response.status}`);
    return null;
  } catch (error) {
    console.log(`Error fetching high-quality image for punk ${id}:`, error);
    return null;
  }
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
 * Generate OpenSea CDN URL dynamically for any punk ID
 */
const generateHighQualityImageUrl = async (id: string): Promise<string> => {
  // Check if we have a mapping for this ID
  if (openseaCdnMapping[id]) {
    return openseaCdnMapping[id];
  }
  
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
const transformPunk = async (id: string, punk: BasePunk): Promise<Punk> => {
  const imageUrl = await generateImageUrl(id);
  return {
    id,
    ...punk,
    image: imageUrl
  };
};

/**
 * Service Methods
 */

export const findAll = async (): Promise<Punk[]> => {
  const punkEntries = Object.entries(punks);
  const transformedPunks = await Promise.all(
    punkEntries.map(([id, punk]) => transformPunk(id, punk as BasePunk))
  );
  return transformedPunks;
};

export const find = async (id: string): Promise<Punk> => {
  const punk = punks[id];
  if (!punk) return null;
  return await transformPunk(id, punk as BasePunk);
};
