/**
 * Data Model Interfaces
 */

import { BasePunk, Punk } from './punk.interface';
import { Punks } from './punks.interface';

/**
 * Configuration
 */
const config = require('../../config.js');

/**
 * In-Memory Store
 */
const punks = require('../../cryptoPunkData.json');

/**
 * Image URL Generation
 */
const generateImageUrl = (id: string): string => {
  const paddedId = id.padStart(4, '0');
  
  switch (config.imageSource) {
    case 'cryptopunks.app':
      return `https://www.cryptopunks.app/images/cryptopunks/punk${paddedId}.png`;
    case 'larvalabs':
    default:
      return `https://www.larvalabs.com/cryptopunks/cryptopunk${id}.png`;
  }
};

/**
 * Transform punk data with dynamic image URL
 */
const transformPunk = (id: string, punk: BasePunk): Punk => ({
  id,
  ...punk,
  image: generateImageUrl(id)
});

/**
 * Service Methods
 */

export const findAll = async (): Promise<Punk[]> => {
  return Object.entries(punks).map(([id, punk]) => 
    transformPunk(id, punk as BasePunk)
  );
};

export const find = async (id: string): Promise<Punk> => {
  const punk = punks[id];
  if (!punk) return null;
  return transformPunk(id, punk as BasePunk);
};
