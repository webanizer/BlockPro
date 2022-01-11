import uint8ArrayFromString from 'uint8arrays/from-string.js'
import { multiSigAddress } from '../doichainjs-lib/lib/createMultiSig.js'
// @ts-expect-error ts-migrate(2305) FIXME: Module '"module"' has no exported member 'createRe... Remove this comment to see the full error message
import { createRequire } from "module";
import { s, receivedPubKeys } from './sharedState.js';
// @ts-expect-error ts-migrate(2441) FIXME: Duplicate identifier 'require'. Compiler reserves ... Remove this comment to see the full error message
const require = createRequire(import.meta.url);
const bitcoin = require("bitcoinjs-lib")

export async function publish(publishString: any, topic: any) {
        console.log("publish message: ", publishString)
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'node' does not exist on type '{}'.
        s.node.pubsub.publish(topic, uint8ArrayFromString(publishString))
}

export function getKeyPair (derivationPath: any){
        // Get PubKey
        let newDerivationPath = derivationPath
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'xpub' does not exist on type '{}'.
        s.xpub = bitcoin.bip32.fromBase58(s.hdkey.publicExtendedKey, s.network)
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'xpub' does not exist on type '{}'.
        let keyPair = s.xpub.derivePath(newDerivationPath)
        return keyPair
}

export async function publishMultiSigAddress(topic2: any, multiSigAddr: any) {
        if (multiSigAddr == undefined) {
                if( receivedPubKeys.length > 0){
                        // @ts-expect-error ts-migrate(2339) FIXME: Property 'ohnePeers' does not exist on type '{}'.
                        s.ohnePeers = false
                }

                // Get PubKey 
                // @ts-expect-error ts-migrate(2339) FIXME: Property 'basePath' does not exist on type '{}'.
                let keyPair = getKeyPair(`${s.basePath}/0/1`)
                // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
                receivedPubKeys.push(keyPair.publicKey)

                if (receivedPubKeys.length == 1) {
                        // @ts-expect-error ts-migrate(2339) FIXME: Property 'purpose' does not exist on type '{}'.
                        let keyPair = getKeyPair(`${s.purpose}/${s.coinType}/0/2`)
                        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
                        receivedPubKeys.push(keyPair.publicKey)
                }

                // generate multiSigAddress
                // @ts-expect-error ts-migrate(2339) FIXME: Property 'network' does not exist on type '{}'.
                let p2sh = await multiSigAddress(s.network, receivedPubKeys)
                let multiSigAddr = 'multiSigAddress ' + p2sh.payment.address
                console.log('multiSigAddress' + multiSigAddr)
                // @ts-expect-error ts-migrate(2339) FIXME: Property 'node' does not exist on type '{}'.
                await s.node.pubsub.publish(topic2, uint8ArrayFromString(multiSigAddr))
                return p2sh
        }
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'node' does not exist on type '{}'.
        await s.node.pubsub.publish(topic2, uint8ArrayFromString(multiSigAddr))
}


