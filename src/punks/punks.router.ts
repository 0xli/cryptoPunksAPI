/**
 * Required External Modules and Interfaces
 */

import express, { Request, Response } from 'express';
import * as PunkService from './punks.service';
import { BasePunk, Punk, CryptoPunkData } from './punk.interface';
import cryptoPunkData from '../../cryptoPunkData.json';
import openseaCdnMapping from '../../openseaCdnMapping.json';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Configuration
 */
const config = require('../../config.js');
const openseaCdnMappingPath = path.join(__dirname, '../../openseaCdnMapping.json');

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
 * Router Definition
 */

export const punksRouter = express.Router();

/**
 * Controller Definitions
 */

// GET punks
punksRouter.get('/', async (req: Request, res: Response) => {
  try {
    const punks: Punk[] = await PunkService.findAll();
    res.status(200).send(punks);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// GET all available types
punksRouter.get('/types', async (req: Request, res: Response) => {
  try {
    const types = new Set(
      Object.values(cryptoPunkData as CryptoPunkData).map(punk => punk.type)
    );
    res.status(200).json(Array.from(types));
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// GET all available accessories
punksRouter.get('/accessories', async (req: Request, res: Response) => {
  try {
    const accessories = new Set(
      Object.values(cryptoPunkData as CryptoPunkData)
        .flatMap(punk => punk.accessories)
        .filter(acc => acc) // Remove empty accessories
    );
    res.status(200).json(Array.from(accessories));
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// GET punks by type and accessories
punksRouter.get('/filter/:type/:accessories', async (req: Request, res: Response) => {
  const { type, accessories } = req.params;
  const limit = parseInt(req.query.limit as string) || 10;

  try {
    // Handle "any" type case
    const normalizedType = type.toLowerCase() === 'any' 
      ? null 
      : type.charAt(0).toUpperCase() + type.toLowerCase().slice(1);
    
    // Handle "any" accessories case
    const requestedAccessories = accessories.toLowerCase() === 'any'
      ? []
      : accessories.split(',').map(a => a.trim().toLowerCase());

    // First filter the punks
    const filteredPunks = Object.entries(cryptoPunkData as CryptoPunkData)
      .filter(([_, punk]) => {
        if (normalizedType && punk.type !== normalizedType) return false;
        if (requestedAccessories.length === 0) return true;
        
        return requestedAccessories.every(reqAcc =>
          punk.accessories.some(punkAcc => 
            punkAcc.toLowerCase().includes(reqAcc)
          )
        );
      });

    // Randomly select 'limit' number of punks
    const selectedPunks = filteredPunks
      .sort(() => Math.random() - 0.5) // Shuffle array
      .slice(0, limit);

    // Generate image URLs for all selected punks
    const randomPunks = await Promise.all(
      selectedPunks.map(async ([id, punk]) => ({
        id,
        ...punk,
        image: await generateImageUrl(id)
      }))
    );

    res.status(200).json(randomPunks);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// GET punks/:id
punksRouter.get('/:id', async (req: Request, res: Response) => {
  const id: string = req.params.id;

  try {
    const punk: Punk = await PunkService.find(id);
    if (punk) {
      return res.status(200).send(punk);
    }
    res.status(404).send('punk not found');
  } catch (e) {
    res.status(500).send(e.message);
  }
});
