import getUrl from "./getUrl";

const verify = async (recipient_mail,sender_mail,name_id,recipient_public_key) => {
    return await verifyEntry(recipient_mail,sender_mail,name_id,recipient_public_key)
};

const verifyEntry = async (recipient_mail,sender_mail,name_id,recipient_public_key) => {

    const url = getUrl()+"/api/v1/opt-in/verify?recipient_mail="+recipient_mail+"&sender_mail="+sender_mail+"&name_id="+name_id+"&recipient_public_key="+recipient_public_key

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });

    const json = await response.json();
    return await json.data
}

export default verify;