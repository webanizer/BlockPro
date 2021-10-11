import CryptoJS from 'crypto-js';

const getDataHash = (data) => {
    try {
        const hash = CryptoJS.SHA256(data).toString();
        return hash;
    } catch(exception) {
        throw {error:"Error during creating data hash over optional data inside doichain entry", exception: exception};
    }
};

export default getDataHash
