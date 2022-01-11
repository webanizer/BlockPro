import getUrl from "./getUrl.js";
// @ts-expect-error ts-migrate(2305) FIXME: Module '"module"' has no exported member 'createRe... Remove this comment to see the full error message
import { createRequire } from "module"; 
// @ts-expect-error ts-migrate(2441) FIXME: Duplicate identifier 'require'. Compiler reserves ... Remove this comment to see the full error message
const require = createRequire(import.meta.url); 

const broadcastTransaction = async (nameId: any,tx: any, templateDataEncrypted: any,validatorPublicKey: any,address: any) => {
    return await broadcast(nameId,tx,templateDataEncrypted,validatorPublicKey,address)
}

const broadcast = async (nameId: any,tx: any,templateDataEncrypted: any,validatorPublicKey: any,address: any) => {

    const url = getUrl() + "/api/v1/sendrawtransaction";
    let response
    if(typeof fetch === "function") response = await fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body:JSON.stringify({
            nameId:nameId,
            tx:tx,
            templateDataEncrypted:templateDataEncrypted,
            validatorPublicKey: validatorPublicKey,
            address:address
        })
    })
    else{
        const fetch = require('node-fetch');
        response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body:JSON.stringify({
                nameId:nameId,
                tx:tx,
                templateDataEncrypted:templateDataEncrypted,
                validatorPublicKey: validatorPublicKey,
                address:address
            })
        })
    }

    const json = await response.json()
    if(json.status==='fail') throw 'Error broadcasting transaction '+json.error
    return json
}

export default broadcastTransaction
