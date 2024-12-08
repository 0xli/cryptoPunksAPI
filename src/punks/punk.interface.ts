export interface BasePunk {
  type: string;
  image: string;
  accessories: string[];
}

export interface Punk extends BasePunk {
  id: string;
}

export interface CryptoPunkData {
  [key: string]: BasePunk;
}
