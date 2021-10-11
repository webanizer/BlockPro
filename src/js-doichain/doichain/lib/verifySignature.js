const bitcoinMessage = require('bitcoinjs-message')
const verifySignature = (message, address, signature) => {
        return bitcoinMessage.verify(message, address, signature)
}
export default verifySignature
