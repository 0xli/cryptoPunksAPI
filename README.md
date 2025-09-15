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
  imageSource: 'cryptopunks.app', // Options: 'cryptopunks.app', 'larvalabs'
};
```

### Image Sources

- **cryptopunks.app** (default): Uses `https://www.cryptopunks.app/images/cryptopunks/punk{ID}.png` with 4-digit zero-padding
- **larvalabs**: Uses `https://www.larvalabs.com/cryptopunks/cryptopunk{ID}.png` without padding

The API automatically handles ID padding for the cryptopunks.app source (e.g., punk 101 becomes punk0101).

# Punks API

The REST API to the cryptopunks API is described below.

## Get list of Punks

### Request

`GET /punks/`

    http://localhost:1337/api/punks/
    https://cryptopunks.herokuapp.com/api/punks
    return:
    [{"id":"9687","type":"Male","image":"https://www.cryptopunks.app/images/cryptopunks/punk9687.png","accessories":["Cap","Horned Rim Glasses","Normal Beard"]},{"id":"7902","type":"Male","image":"https://www.cryptopunks.app/images/cryptopunks/punk7902.png","accessories":["Shadow Beard","Horned Rim Glasses","Pipe","Mohawk Dark"]},{"id":"6974","type":"Male","image":"https://www.cryptopunks.app/images/cryptopunks/punk6974.png","accessories":["Cap Forward","Horned Rim Glasses","Big Beard"]},{"id":"6172","type":"Male","image":"https://www.cryptopunks.app/images/cryptopunks/punk6172.png","accessories":["Normal Beard Black","Earring","Nerd Glasses","Mohawk"]},{"id":"6380","type":"Male","image":"https://www.cryptopunks.app/images/cryptopunks/punk6380.png","accessories":["Front Beard Dark","Earring","Nerd Glasses","Do-rag"]}]

`GET /punks/filter/any/beard,glasses?limit=5`

`GET /punks/filter/male/beard,glasses?limit=5`
## Find punk by number (000-9999)

### Request

`GET /punks/:id`

    http://localhost:1337/api/punks/:id
    https://cryptopunks.herokuapp.com/api/punks/:id
    return:
    {"type":"Female","image":"https://www.cryptopunks.app/images/cryptopunks/punk0100.png","accessories":["Tassle Hat"]}

## Get all Types and Accessories

### Request
Get all types: 
`GET /punks/types`

Get all accessories: 
`GET /punks/accessories`
## Data

The cryptoPunkData.json contains a complete 10,000 entry object including every CryptoPunk.

### Thanks to

Github User: [cryptopunksnotdead](https://github.com/cryptopunksnotdead/punks) for the csv data

Larva Labs: [Where](https://www.larvalabs.com/cryptopunks) it all started!
