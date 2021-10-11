import getKeyPair from "./getKeyPair"

const generateNameId = () => {
    try {
        const nameId = getKeyPair().privateKey
        return "e/"+nameId
    } catch(exception) {
        throw {error:"Error during generating doichain nameId", exception: exception};
    }
};

export default generateNameId