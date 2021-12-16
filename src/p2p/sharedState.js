// To Do: Create setters/getters für receivedPubKey und receivedSignatures

export let receivedPubKeys = []
export let receivedSignatures = []
export let nextMultiSigAddress = ""

// s is sharedObject
export const s = {}

export const clearPubKeys = () => {
    receivedPubKeys = [];
}

export const clearSignatures = () => {
    receivedSignatures = [];
}