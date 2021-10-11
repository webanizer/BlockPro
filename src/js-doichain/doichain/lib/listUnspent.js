import getUrl from "./getUrl";

export async function listUnspent(address) {
    const url = getUrl()+"/api/v1/listunspent?address=" + address;
    console.log('calling url',url)
    let response
    if(typeof fetch === "function") response = await fetch(url);
    else{
        const fetch = require('node-fetch');
        response = await fetch(url);
    }
    const json = await response.json();
    return json
}
