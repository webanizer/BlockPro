const fs = require('fs');
const PeerId = require('peer-id')


async function createOrReadPeerId(peerIdConf) {

  let peerId

  try {
    // read peerId from local json if available
    peerId = await PeerId.createFromJSON(require(peerIdConf))
    console.log('Read existing peerId = ', peerId.toJSON().id)
  } catch (error) {

    // create new peerId locally if not available
    console.warn(`Couldn't read peer id from ${peerIdConf}. Create new peerId`)
    peerId = await PeerId.create({ bits: 1024, keyType: 'RSA' });
    console.log(JSON.stringify(peerId.toJSON(), null, 2))
    fs.writeFileSync(peerIdConf, JSON.stringify(peerId));
  }
  return peerId
}
module.exports.createOrReadPeerId = createOrReadPeerId;


