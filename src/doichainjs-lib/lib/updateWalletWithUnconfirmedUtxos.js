export const updateWalletWithUnconfirmedUtxos = async (selectedInputs, wallet) => {
    //1. take the spend input from response and mark it in our wallet as spent
 
    const ourOldInputs = selectedInputs
    wallet.addresses.forEach( addr => addr.transactions.forEach( atx => {
        ourOldInputs.forEach(oldInputTx => {
            if(atx.txid===oldInputTx.txid){
                atx.category = 'spent'
                console.log('found tx - setting it as spent',atx)
            }
        })
    }))
}
export default updateWalletWithUnconfirmedUtxos
