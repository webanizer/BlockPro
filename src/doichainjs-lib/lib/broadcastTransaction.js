import getUrl from "./getUrl.js";
import { createRequire } from "module"; 
const require = createRequire(import.meta.url); 

const broadcastTransaction = async (nameId,tx, templateDataEncrypted,validatorPublicKey,address) => {
    return await broadcast(nameId,tx,templateDataEncrypted,validatorPublicKey,address)
}

const broadcast = async (nameId,tx,templateDataEncrypted,validatorPublicKey,address) => {

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
