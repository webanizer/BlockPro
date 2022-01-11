// @ts-expect-error ts-migrate(2305) FIXME: Module '"module"' has no exported member 'createRe... Remove this comment to see the full error message
import { createRequire } from "module";
// @ts-expect-error ts-migrate(2441) FIXME: Duplicate identifier 'require'. Compiler reserves ... Remove this comment to see the full error message
const require = createRequire(import.meta.url);
import { getPathsOfAddresses, getAddr } from "./getAddress.js";
import { saveAddress} from "./getOrSaveDerivationPath.js"
import { getBalanceOfAddresses } from "./getBalanceOfAddresses.js";


export const getBalanceOfWallet = async (xpub: any, purpose: any, coinType: any, account: any, o_options: any, addrType: any, id: any) => {
    let options = {}
    if (o_options === undefined || o_options.network === undefined)
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'network' does not exist on type '{}'.
        options.network = global.DEFAULT_NETWORK
    else options = o_options


    let balance = Number(0)
    let addressesReturned = []

    addressesReturned = await getPathsOfAddresses(options, addrType, purpose, coinType, account,xpub, id)
    let addresses = addressesReturned[0]

    // if all receiving addresses and all change addresses have transactions, create a new address for each type
    let unusedReceivingAddresses = []
    let unusedChangeAddresses = []
    let lastChangeDerivationPath
    let lastReceiveDerivationPath 

    // check if there are still unused receiving or change addresses
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'length' does not exist on type 'any[] | ... Remove this comment to see the full error message
    for (let i = 0; i < addresses.length; i++) {
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        let address = addresses[i]
        let derivationPath = address.derivationPath
        let change = (derivationPath.split("/")[4] == 1)
        if (!change  && address.transactions.length == 0){
            // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
            unusedReceivingAddresses.push(addresses[i])
        }else if (change && address.transactions.length == 0){
            // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
            unusedChangeAddresses.push(addresses[i])
        }
        change ? lastChangeDerivationPath = derivationPath : lastReceiveDerivationPath = derivationPath
    }

    // if there are no unused addresses left create new ones
    if (unusedReceivingAddresses.length == 0){
        let previousIndex  = lastReceiveDerivationPath.split("/")[5] 
        var lastIndex = lastReceiveDerivationPath.lastIndexOf('/');
        let newDerivationPath = lastReceiveDerivationPath.substr(0, lastIndex) + "/" + ++previousIndex      
        let newAddress = getAddr(xpub.derivePath(newDerivationPath).publicKey, options, addrType)
        await saveAddress(purpose, newDerivationPath, newAddress, id)
        let address = {}
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        address["address"] = newAddress
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        address["balance"] = 0
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        address["derivationPath"] = newDerivationPath
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        address["transactions"] = []
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'push' does not exist on type 'any[] | { ... Remove this comment to see the full error message
        addresses.push(address)

    } else if (unusedChangeAddresses.length == 0){
        let previousIndex  = lastChangeDerivationPath.split("/")[5] 
        var lastIndex = lastChangeDerivationPath.lastIndexOf('/');
        let newDerivationPath = lastChangeDerivationPath.substr(0, lastIndex) + "/" + ++previousIndex      
        let newAddress = getAddr(xpub.derivePath(newDerivationPath).publicKey, options, addrType)
        await saveAddress(purpose, newDerivationPath, newAddress, id)
        let address = {}
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        address["address"] = newAddress
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        address["balance"] = 0
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        address["derivationPath"] = newDerivationPath
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        address["transactions"] = []
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'push' does not exist on type 'any[] | { ... Remove this comment to see the full error message
        addresses.push(address)
    }

    // @ts-expect-error ts-migrate(2322) FIXME: Type 'string | 0' is not assignable to type 'numbe... Remove this comment to see the full error message
    balance = addressesReturned[1].transactionCount > 0 ? Number(addressesReturned[1].balance).toFixed(8) : 0

    // @ts-expect-error ts-migrate(2339) FIXME: Property 'transactionCount' does not exist on type... Remove this comment to see the full error message
    return { balance: balance, addresses: addresses, transactionCount: addressesReturned[1].transactionCount }
    }
