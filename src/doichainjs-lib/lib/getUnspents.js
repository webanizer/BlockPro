export const getUnspents = (wallet) => {
    const inputs = []

    //check which still have money
    wallet.addresses.forEach((addr) => {
        let amount = 0
        console.log('checking addr',addr)
        addr.transactions.forEach(tx => {
            amount = amount + tx.amount
            console.log('amount',amount)
        })
        if(amount>0) {
            console.log('amount >0 ',amount)
            const tx = addr.transactions[0]
            console.log('preselecting tx',tx)
            if(Number(tx.amount)>0 && tx.type==='out' && tx.category==='receive'){
                inputs.push(tx)
                console.info('added tx',tx.txid)
            }
                //if the first of the transaction is the receiving its fine... but is this sure?
        }  
    })

  /*  wallet.addresses.forEach((addr) => addr.transactions.forEach(tx => {
        console.log('checking tx',tx)
        
        _.find(addr.transactions, function(o) { return o.address ==== tx.address && o.amount+tx.amount!==0; });
        tempInputs.push({address:tx.address, amount: tx.amount})
        
        if(tx.type==='out' && tx.category==='receive' && tx.spent===undefined)
        {
            console.log('using as input ',tx)
            inputs.push(tx)
        }
    })) */
    return inputs
}
export default getUnspents
