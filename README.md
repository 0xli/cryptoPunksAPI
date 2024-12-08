# CryptoPunks API Please leave a ⭐️ if found useful!

## Install

    yarn install

## Run the app

    yarn run dev

# Punks API

The REST API to the cryptopunks API is described below.

## Get list of Punks

### Request

`GET /punks/`

    http://localhost:1337/api/punks/
    https://cryptopunks.herokuapp.com/api/punks

`GET /punks/filter/any/beard,glasses?limit=5`

`GET /punks/filter/male/beard,glasses?limit=5`
## Find punk by number (000-9999)

### Request

`GET /punks/:id`

    http://localhost:1337/api/punks/:id
    https://cryptopunks.herokuapp.com/api/punks/:id

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
