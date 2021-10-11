import getUrl from "./getUrl";

const getValidatorPublicKeyOfEmail = async (email) => {
    const parts = email.split("@");
    const domain = parts[parts.length-1];
    const url = getUrl()+"/api/v1/getpublickeybypublicdns?domain="+domain
    let response
    if(typeof fetch === "function") response = await fetch(url);
    else{
        const fetch = require('node-fetch');
        response = await fetch(url);
    }
    const json = await response.json();
    return json
}

export default getValidatorPublicKeyOfEmail
