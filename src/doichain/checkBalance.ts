import { getBalance, getNewAddress } from "./rpcCalls.js"
import sendNotification from "./sendNotification.js"

const checkBalance = async (url) => {

    const rawBalance = await getBalance(url)
    let balance = parseFloat(rawBalance.toFixed(2))

    console.log("Current Balance: " + balance)

    if (balance == 0.01) {
        console.log("Insufficient funds for Proof of Existence. Please buy more Dois to continue writing to Blockchain.")
        throw new Error("Insufficient funds");
    }
    else if (balance == 10.00) {
        const newAddress = await getNewAddress(url);
        await sendNotification(balance, newAddress);
    }
    else if (balance == 5.00) {
        const newAddress = await getNewAddress(url);
        await sendNotification(balance, newAddress);
    }
}

export default checkBalance