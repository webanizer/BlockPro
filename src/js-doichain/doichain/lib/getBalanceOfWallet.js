const bitcoin = require('bitcoinjs-lib')
import {network as defaultNetwork} from "./network";
import {getAddress} from "./getAddress";
import {listTransactions} from "./listTransactions"
import {getBalanceOfAddresses} from "./getBalanceOfAddresses";


export const getBalanceOfWallet = async (xpub, derivationPath, o_options) => {
    let options = {}
    if(o_options===undefined || o_options.network===undefined)
        options.network=global.DEFAULT_NETWORK
    else options=o_options
    const derivationElements = derivationPath.split('/')

    let checkVisibleAddresses = true
    let checkUnvisibleAddresses = false
    let walletNo
    let chainsNo
    let addressNo
    if(derivationElements.length===2){
        chainsNo = Number(derivationElements[0])
        addressNo = Number(derivationElements[1])
    }else{
        walletNo = Number(derivationElements[1])
        chainsNo = Number(derivationElements[2])
        addressNo = Number(derivationElements[3])
    }

    let gathering = (checkVisibleAddresses || checkUnvisibleAddresses)
    let balance = Number(0)
    let addresses = []
    let transactionCount = 0
    while(gathering){

        let newDerivationPath
        if(derivationElements.length===2) newDerivationPath = chainsNo+'/'+addressNo
        else newDerivationPath = 'm/'+walletNo+'/'+chainsNo+'/'+addressNo

        let address = getAddress((derivationElements.length!==2)?xpub.derivePath(newDerivationPath).publicKey:xpub.publicKey)
        const addressesRet = await getBalanceOfAddresses([address],options)
        addresses.push(
            {
                address:address,
                balance: addressesRet.transactionCount>0?Number(addressesRet.balance).toFixed(8):0,
                transactions: addressesRet.transactionCount>0?addressesRet.addresses[0].transactions:[],
                derivationPath:newDerivationPath
            }
        )

        if(addressesRet && addressesRet.transactionCount>0){
            addressNo++ //incrementing to next address in this wallet
            transactionCount+=addressesRet.transactionCount
            balance += parseFloat(Number(addressesRet.balance).toFixed(8))
        }else{
            if(checkVisibleAddresses){
                checkVisibleAddresses=false
                checkUnvisibleAddresses=true
                chainsNo=1
                addressNo=0
            }
            else{  //unvisible (change addresses)
                checkUnvisibleAddresses=false
                chainsNo=0
                addressNo=0
            }
        }
        gathering = (checkVisibleAddresses || checkUnvisibleAddresses)
    }
    
    return {balance:balance, addresses: addresses, transactionCount:transactionCount}
}
