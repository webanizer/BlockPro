import getUrl from "./getUrl";

export async function getServerStatus() {
    const url = getUrl()+"/api/v1/status";
    let response
    if(typeof fetch === "function") response = await fetch(url);
    else{
        const fetch = require('node-fetch');
        response = await fetch(url);
    }
    const text = await response.text()
    let json
    try {
        json = JSON.parse(text)
        json.data.version.url = getUrl()
        if(json.status!=='success') throw "Cannot get transactions from dApp-Url "+url
    }catch(e){
        console.log(e)
        console.log('response from server was:', text)
      //  throw "Error while getting transactions from dApp url "+url
    }

    return json
}
