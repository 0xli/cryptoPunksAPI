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

The API supports multiple image sources for CryptoPunk images. You can configure the default image source in `config.js`:

```javascript
module.exports = {
  imageSource: 'alchemy', // Options: 'cryptopunks.app', 'larvalabs', 'opensea', 'opensea-cdn', 'alchemy'
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
## Data

The cryptoPunkData.json contains a complete 10,000 entry object including every CryptoPunk.

### Thanks to

Github User: [cryptopunksnotdead](https://github.com/cryptopunksnotdead/punks) for the csv data

Larva Labs: [Where](https://www.larvalabs.com/cryptopunks) it all started!
