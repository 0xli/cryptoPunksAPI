/**
 * Required External Modules and Interfaces
 */

import express, { Request, Response } from 'express';
import * as PunkService from './punks.service';
import { BasePunk, Punk, CryptoPunkData } from './punk.interface';
import cryptoPunkData from '../../cryptoPunkData.json';

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
    const randomPunks = filteredPunks
      .sort(() => Math.random() - 0.5) // Shuffle array
      .slice(0, limit)
      .map(([id, punk]) => ({
        id,
        ...punk
      }));

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
