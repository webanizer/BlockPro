import fs from 'fs';
import PeerId from 'peer-id'
// @ts-expect-error ts-migrate(2305) FIXME: Module '"module"' has no exported member 'createRe... Remove this comment to see the full error message
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
// @ts-expect-error ts-migrate(2441) FIXME: Duplicate identifier 'require'. Compiler reserves ... Remove this comment to see the full error message
const require = createRequire(import.meta.url); // construct the require method


const createOrReadPeerId = async (peerIdConf: any) => {

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
export default createOrReadPeerId;


