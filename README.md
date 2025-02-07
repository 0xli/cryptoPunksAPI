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
    return:
    [{"id":"9687","type":"Male","image":"https://www.larvalabs.com/cryptopunks/cryptopunk9687.png","accessories":["Cap","Horned Rim Glasses","Normal Beard"]},{"id":"7902","type":"Male","image":"https://www.larvalabs.com/cryptopunks/cryptopunk7902.png","accessories":["Shadow Beard","Horned Rim Glasses","Pipe","Mohawk Dark"]},{"id":"6974","type":"Male","image":"https://www.larvalabs.com/cryptopunks/cryptopunk6974.png","accessories":["Cap Forward","Horned Rim Glasses","Big Beard"]},{"id":"6172","type":"Male","image":"https://www.larvalabs.com/cryptopunks/cryptopunk6172.png","accessories":["Normal Beard Black","Earring","Nerd Glasses","Mohawk"]},{"id":"6380","type":"Male","image":"https://www.larvalabs.com/cryptopunks/cryptopunk6380.png","accessories":["Front Beard Dark","Earring","Nerd Glasses","Do-rag"]}]

`GET /punks/filter/any/beard,glasses?limit=5`

`GET /punks/filter/male/beard,glasses?limit=5`
## Find punk by number (000-9999)

### Request

`GET /punks/:id`

    http://localhost:1337/api/punks/:id
    https://cryptopunks.herokuapp.com/api/punks/:id
    return:
    {"type":"Female","image":"https://www.larvalabs.com/cryptopunks/cryptopunk100.png","accessories":["Tassle Hat"]}

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
