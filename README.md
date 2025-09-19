# CryptoPunks API Please leave a ⭐️ if found useful!

## Install

    yarn install

## Run the app

    yarn run dev

## Run the app with SSL

    PORT=1337
    SSL_KEY=ssl/server.key
    SSL_CERT=ssl/server.cert
    yarn run dev

## Configuration

### Environment Variables

Create a `.env.local` file in the project root to configure your API keys and settings:

```bash
# Alchemy API Configuration
# Get your API key from: https://dashboard.alchemy.com/
ALCHEMY_API_KEY=your_alchemy_api_key_here

# Image Source Configuration
# Options: 'cryptopunks.app', 'larvalabs', 'opensea', 'opensea-cdn', 'alchemy'
IMAGE_SOURCE=alchemy
```

**Note:** The `.env.local` file is already included in `.gitignore` and will not be committed to version control.

### Image Source Configuration

The API supports multiple image sources for CryptoPunk images. You can configure the default image source via environment variable or in `config.js`:

```javascript
module.exports = {
  imageSource: process.env.IMAGE_SOURCE || 'alchemy', // Options: 'cryptopunks.app', 'larvalabs', 'opensea', 'opensea-cdn', 'alchemy'
};
```

### Image Sources

- **alchemy** (default): Uses Alchemy API to fetch high-quality images with automatic caching (best quality, free)
- **opensea-cdn**: Uses high-quality OpenSea CDN images (requires API key)
- **cryptopunks.app**: Uses `https://www.cryptopunks.app/images/cryptopunks/punk{ID}.png` with 4-digit zero-padding
- **larvalabs**: Uses `https://www.larvalabs.com/cryptopunks/cryptopunk{ID}.png` without padding
- **opensea**: Uses OpenSea marketplace URLs (returns HTML pages)

The API automatically handles ID padding for sources that require it (cryptopunks.app) and caches high-quality images for future use.

# Punks API

The REST API to the cryptopunks API is described below.

## Get All Punks

### Request

`GET /api/punks`

    http://localhost:1337/api/punks
    https://cryptopunks.herokuapp.com/api/punks

**Response:** Returns all 10,008 CryptoPunks (0-9999) with their metadata and image URLs.

```json
[
  {
    "id": "9687",
    "type": "Male", 
    "image": "https://nft-cdn.alchemy.com/eth-mainnet/...",
    "accessories": ["Cap", "Horned Rim Glasses", "Normal Beard"]
  },
  ...
]
```

## Get Punk by ID

### Request

`GET /api/punks/:id`

    http://localhost:1337/api/punks/100
    https://cryptopunks.herokuapp.com/api/punks/100

**Response:** Returns a single CryptoPunk by ID (000-9999).

```json
{
  "id": "100",
  "type": "Female",
  "image": "https://nft-cdn.alchemy.com/eth-mainnet/...",
  "accessories": ["Tassle Hat"]
}
```

## Filter Punks

### Request

`GET /api/punks/filter/:type/:accessories?limit=:number`

**Parameters:**
- `type`: `male`, `female`, `zombie`, `ape`, `alien`, or `any`
- `accessories`: Comma-separated accessories or `any`
- `limit`: Number of results (optional, defaults to 10)

**Examples:**

```bash
# Get 5 random male punks
GET /api/punks/filter/male/any?limit=5

# Get 3 male punks with beard
GET /api/punks/filter/male/beard?limit=3

# Get 5 male punks with beard AND glasses
GET /api/punks/filter/male/beard,glasses?limit=5

# Get 10 female punks with any accessories
GET /api/punks/filter/female/any?limit=10

# Get 5 zombie punks
GET /api/punks/filter/zombie/any?limit=5
```

**Response:** Returns random punks matching the filter criteria.

```json
[
  {
    "id": "205",
    "type": "Male",
    "image": "https://nft-cdn.alchemy.com/eth-mainnet/...",
    "accessories": ["Normal Beard Black", "Big Shades", "Mohawk Dark"]
  },
  ...
]
```

## Get All Types

### Request

`GET /api/punks/types`

    http://localhost:1337/api/punks/types

**Response:** Returns all available CryptoPunk types.

```json
["Male", "Female", "Zombie", "Ape", "Alien"]
```

## Get All Accessories

### Request

`GET /api/punks/accessories`

    http://localhost:1337/api/punks/accessories

**Response:** Returns all available CryptoPunk accessories.

```json
[
  "Bandana", "Big Shades", "Blonde Bob", "Blonde Short", "Cap", 
  "Cap Forward", "Chinstrap", "Clown Eyes Blue", "Clown Eyes Green",
  "Clown Hair Green", "Clown Nose", "Cowboy Hat", "Crazy Hair",
  "Do-rag", "Earring", "Eye Mask", "Eye Patch", "Fedora",
  "Front Beard", "Front Beard Dark", "Frumpy Hair", "Goat",
  "Gold Chain", "Green Eye Shadow", "Handlebars", "Headband",
  "Horned Rim Glasses", "Hot Lipstick", "Knitted Cap", "Luxurious Beard",
  "Medical Mask", "Messy Hair", "Mohawk", "Mohawk Dark", "Mohawk Thin",
  "Mole", "Muttonchops", "Nerd Glasses", "Normal Beard", "Normal Beard Black",
  "Peak Spike", "Pigtails", "Pilot Helmet", "Pink With Hat", "Pipe",
  "Police Cap", "Purple Eye Shadow", "Purple Hair", "Purple Lipstick",
  "Red Mohawk", "Regular Shades", "Rosy Cheeks", "Shadow Beard",
  "Shaved Head", "Silver Chain", "Small Shades", "Smile", "Spots",
  "Straight Hair", "Straight Hair Blonde", "Straight Hair Dark", "Stringy Hair",
  "Tassle Hat", "Tiara", "Top Hat", "Vampire Hair", "Vape", "VR",
  "Welding Goggles", "Wild Blonde", "Wild Hair", "Wild White Hair"
]
```

## Updating Alchemy Data

The API uses pre-fetched high-quality image URLs from Alchemy to ensure fast response times. The data is stored in `cryptoPunkData-Alchemy.json` and `openseaCdnMapping.json`.

### Current Status
- **Total Alchemy URLs:** 10,000 (100% coverage)
- **Data File:** `cryptoPunkData-Alchemy.json` contains all punks with Alchemy URLs
- **Mapping File:** `openseaCdnMapping.json` contains the URL mappings

### Updating the Data

Use the provided TypeScript script to update Alchemy image URLs:

```bash
# Using npm
npm run update-alchemy-data

# Using yarn
yarn update-alchemy-data

# Using node directly
node scripts/update-alchemy-data.js
```

#### Prerequisites
- Set `ALCHEMY_API_KEY` in your `.env.local` file
- Ensure you have the required dependencies installed (`yarn install`)

#### What the Script Does
- ✅ Fetches missing high-quality image URLs from Alchemy API
- ✅ Implements proper rate limiting (10 requests/second)
- ✅ Includes retry logic with exponential backoff
- ✅ Saves progress after each batch (50 punks)
- ✅ Updates both `openseaCdnMapping.json` and `cryptoPunkData-Alchemy.json`
- ✅ Provides detailed progress logging

#### Script Features
- **Batch Processing**: Processes punks in batches of 50
- **Rate Limiting**: 100ms delay between requests (respects API limits)
- **Retry Logic**: Up to 3 attempts with exponential backoff
- **Progress Saving**: Saves progress after each batch to prevent data loss
- **Error Handling**: Comprehensive error handling and logging
- **TypeScript**: Fully typed for better development experience

### Rate Limiting
- The Alchemy API has rate limits (typically 10 requests/second for free tier)
- Always implement proper rate limiting and retry logic
- Use exponential backoff for failed requests
- Save progress frequently to avoid losing work

### Data Files
- **`cryptoPunkData-Alchemy.json`**: Complete dataset with Alchemy PNG URLs (used when `IMAGE_SOURCE=alchemy`)
- **`openseaCdnMapping.json`**: URL mapping cache (used for fallback and updates)
- **`cryptoPunkData.json`**: Original dataset (used for other image sources)

## PNG Conversion Process

The API automatically converts Alchemy SVG images to PNG format for better compatibility with applications that don't support SVG.

### Conversion Details

- **Source Format**: SVG (from Alchemy API)
- **Target Format**: PNG (via Cloudinary conversion)
- **Resolution**: 24x24 pixels (original CryptoPunks resolution)
- **File Size**: ~226 bytes (optimized)
- **Quality**: High-quality pixel art with crisp edges
- **Transparency**: Supported

### Quality Comparison

| Source | Format | Size | Resolution | Quality | Compatibility |
|--------|--------|------|------------|---------|---------------|
| **Alchemy PNG** | PNG | 226 bytes | 24x24 | ⭐⭐⭐⭐⭐ Excellent | ✅ Universal |
| **cryptopunks.app** | PNG | 235 bytes | 24x24 | ⭐⭐⭐⭐ Good | ✅ Universal |
| **Alchemy SVG** | SVG | 17KB | 24x24 | ⭐⭐⭐⭐⭐ Excellent | ⚠️ Limited |

**Alchemy PNG advantages:**
- ✅ **Better compression** (226 vs 235 bytes - 4% smaller)
- ✅ **Direct from blockchain** (authentic source)
- ✅ **CDN delivery** (faster loading)
- ✅ **Automatic conversion** (no manual processing)
- ✅ **Higher reliability** (enterprise-grade infrastructure)
- ⚠️ **Same resolution** (24x24 pixels - no improvement)

### Conversion Process

1. **Fetch SVG** from Alchemy API (`cachedUrl`)
2. **Convert to PNG** via Cloudinary (`pngUrl`)
3. **Validate** PNG URL accessibility
4. **Cache** PNG URL in mapping file
5. **Fallback** to SVG if PNG conversion fails

### Technical Implementation

```javascript
// Alchemy API response structure
{
  "image": {
    "cachedUrl": "https://nft-cdn.alchemy.com/eth-mainnet/...", // SVG
    "pngUrl": "https://res.cloudinary.com/alchemyapi/image/upload/convert-png/eth-mainnet/...", // PNG
    "contentType": "image/svg+xml",
    "size": 17824
  }
}
```

### Cost Analysis

- **Alchemy API**: Free tier (10 requests/second)
- **Cloudinary Conversion**: Free (included with Alchemy)
- **CDN Delivery**: Free (included with Alchemy)
- **Storage**: Free (handled by Alchemy infrastructure)

**Total Cost: $0** - No additional charges for PNG conversion or delivery.

### Converting Existing Data to PNG

If you have existing SVG URLs and want to convert them to PNG format:

```bash
# Convert existing SVG URLs to PNG URLs
ALCHEMY_API_KEY=your_key node scripts/convert-to-png.js
```

This script will:
- ✅ Test each PNG URL for accessibility
- ✅ Convert SVG URLs to PNG format
- ✅ Keep SVG URLs as fallback if PNG fails
- ✅ Update both mapping and data files
- ✅ Provide detailed progress reporting

**Results**: 9,886 PNG URLs + 114 SVG fallbacks = 100% coverage

### Higher Resolution Limitations

**⚠️ Important Finding**: Higher resolution conversions (96x96, 128x128, etc.) are **not recommended** because:

- **CryptoPunks are 24x24 pixel art** - each pixel is a separate SVG rectangle
- **Upscaling creates blurry results** - no quality improvement
- **Wastes bandwidth** - 22x-82x larger file sizes for no benefit
- **Same visual quality** as 24x24 original

**Recommendation**: Stick with 24x24 resolution for optimal quality and efficiency.

## Data

The cryptoPunkData.json contains a complete 10,000 entry object including every CryptoPunk.

### Thanks to

Github User: [cryptopunksnotdead](https://github.com/cryptopunksnotdead/punks) for the csv data

Larva Labs: [Where](https://www.larvalabs.com/cryptopunks) it all started!
