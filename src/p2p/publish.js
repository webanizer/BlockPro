import uint8ArrayFromString from 'uint8arrays/from-string.js'
import { createRequire } from "module";
import { s } from './sharedState.js';
const require = createRequire(import.meta.url);
const bitcoin = require("bitcoinjs-lib")


export async function publish(publishString, topic) {
        console.log("publish message: ", publishString)
        s.node.pubsub.publish(topic, uint8ArrayFromString(publishString))
}

export function getKeyPair (derivationPath){
        // Get PubKey
        let keyPair = s.hdkey.derive(derivationPath)
        return keyPair
}



