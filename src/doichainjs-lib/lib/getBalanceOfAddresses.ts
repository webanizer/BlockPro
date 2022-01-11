import {listTransactions} from "./listTransactions.js"

export const getBalanceOfAddresses = async (addressList: any, o_options: any) => {
    let options = {}
    if(o_options===undefined || o_options.network===undefined)
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'network' does not exist on type '{}'.
        options.network=global.DEFAULT_NETWORK
    else options=o_options

    let transactionCount = 0
    let addressObjectList = []
    let balance = 0
    for (const addr of addressList) {
        const transactions = await listTransactions(addr,options, addressList)
        let addressBalance = 0
        let txs: any = []
        if(transactions.length>0){
            transactionCount+=transactions.length
            transactions.forEach((tx: any) => {
                if(tx.category==='received'){
                    addressBalance = addressBalance + Number(tx.value)
                    balance = balance + Number(tx.value?tx.value:0)
                }
                if(tx.category==='sent') {
                    addressBalance = addressBalance + Number(tx.value) + Number(tx.fee)
                    balance = balance + Number(tx.value?tx.value:0) + Number(tx.fee?tx.fee:0)
                }
                txs.unshift(tx)
            })
        }
        addressObjectList.push({
            address: addr,
            balance: addressBalance,
            transactions: txs
        })
    }

    const retValue = {
        transactionCount: transactionCount,
        addresses:addressObjectList,
        balance:balance}
    return retValue
}
