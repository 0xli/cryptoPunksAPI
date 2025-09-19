require('dotenv/config');

module.exports = {
  imageSource: process.env.IMAGE_SOURCE || 'alchemy', // Options: 'cryptopunks.app', 'larvalabs', 'opensea', 'opensea-cdn', 'alchemy'
};
