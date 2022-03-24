import uint8ArrayFromString from 'uint8arrays/from-string.js'
import { multiSigAddress } from '../doichainjs-lib/lib/createMultiSig.js'
import { createRequire } from "module";
import { s, receivedPubKeys } from './sharedState.js';
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

export async function publishMultiSigAddress(topic2, multiSigAddr) {
        if (multiSigAddr == undefined) {

                // Get PubKey 
                let keyPair = getKeyPair(`${s.basePath}/0/1`)
                receivedPubKeys.push(keyPair.publicKey)

                if (receivedPubKeys.length == 1) {
                        let keyPair = getKeyPair(`${s.basePath}/0/2`)
                        receivedPubKeys.push(keyPair.publicKey)
                }

                // generate multiSigAddress
                let p2sh = await multiSigAddress(s.network, receivedPubKeys)
                let multiSigAddr = 'multiSigAddress ' + p2sh.payment.address
                console.log('multiSigAddress' + multiSigAddr)
                await s.node.pubsub.publish(topic2, uint8ArrayFromString(multiSigAddr))
                return p2sh
        }
        await s.node.pubsub.publish(topic2, uint8ArrayFromString(multiSigAddr))
}


