import getUrl from "./getUrl";

export const fundWallet = async (address,amount) => {
    const url = getUrl()+"/api/v1/funding?address="+address+"&amount="+amount;
    let response
    if(typeof fetch === "function") response = await fetch(url);
    else{
        const fetch = require('node-fetch');
        response = await fetch(url);
    }
    const text = await response.text()
    const json = JSON.parse(text)
    console.log("json",json)
    return json
}
