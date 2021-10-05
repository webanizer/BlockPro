import chai from 'chai'
const bitcoin = require('bitcoinjs-lib')
import { PrivateKey } from 'eciesjs'
chai.Assertion.addProperty('uppercase', function () {
    var obj = this._obj;
    new chai.Assertion(obj).to.be.a('string');

    this.assert(
        obj === obj.toUpperCase() // adapt as needed
        , 'expected #{this} to be all uppercase'    // error message when fail for normal
        , 'expected #{this} to not be all uppercase'  // error message when fail for negated
    );
});

import {generateMnemonic} from '../lib/generateMnemonic'
import {validateMnemonic} from "../lib/validateMnemonic";
import {createHdKeyFromMnemonic} from "../lib/createHdKeyFromMnemonic"
import {restoreDoichainWalletFromHdKey, noEmailError} from "../lib/restoreDoichainWalletFromHdKey"
import {getAddress} from "../lib/getAddress"
import {fundWallet} from "../lib/fundWallet";
import {listTransactions} from "../lib/listTransactions"
import {listUnspent} from "../lib/listUnspent";
import {getBalanceOfWallet} from "../lib/getBalanceOfWallet";
import {getBalanceOfAddresses} from "../lib/getBalanceOfAddresses"
import {createNewWallet} from "../lib/createNewWallet";
import {encryptAES} from "../lib/encryptAES";
import {decryptAES} from "../lib/decryptAES";
import {generateNewAddress} from '../lib/generateNewAddress';
import {sendToAddress} from "../lib/sendToAddress"
import {getUnspents} from "../lib/getUnspents"
import {updateWalletWithUnconfirmedUtxos} from "../lib/updateWalletWithUnconfirmedUtxos"
import decryptStandardECIES from "../lib/decryptStandardECIES"
import encryptStandardECIES from "../lib/encryptStandardECIES"
import getPrivateKeyFromWif from "../lib/getPrivateKeyFromWif"
import getSignature from "../lib/getSignature"
import verifySignature from "../lib/verifySignature"
import createAndSendTransaction from "../lib/createAndSendTransaction"
import { listTransactionsElectrum } from '../lib/listTransactionsElectrum';
import { DOICHAIN } from '../lib/network';

const MNEMONIC = "refuse brush romance together undo document tortoise life equal trash sun ask"
const MNEMONIC2 = "balance blanket camp festival party robot social stairs noodle piano copy drastic"
const PASSWORD = "julianAssange2020"

describe('js-doichain', function () {
    this.timeout(0);
    describe('basic doichain functions', function () {

    /*    it.only('should log listtransactions content', async function () {
            changeNetwork('mainnet')
            const address = "NJHArPJUknmNBL42ns6k61XApnAYzrRkow"
            let listTransaction = await listTransactions(address)
            console.log(listTransaction)
        }) */

        it('should get a transactions input', async function () {

            const address = "NHxC3bjnmYE4HGwJCL2D56KuuCCpvtHUKZ" //NHxC3bjnmYE4HGwJCL2D56KuuCCpvtHUKZ
            const settings = {
                electrumHost: "demo30122020.doi.works",
                electrumPort: "50002",
                electrumSSL: "tls"
            }
            const options = { network: DOICHAIN, settings }
            let listDOITransactionElectrum = await listTransactionsElectrum(address,options)
            console.log("listDOITransactionElectrum", listDOITransactionElectrum)
            chai.assert.equal(listDOITransactionElectrum.length, 3, 'in the past we had here always 3 output '+address) 

            //contains name_doi transactions!
           /* const address2 = "NHxC3bjnmYE4HGwJCL2D56KuuCCpvtHUKZ" ; 
            const options2 = { network: DOICHAIN, settings }
            let listDOITransactionElectrum2 = await listTransactionsElectrum(address2,options2)
            console.log("listDOITransactionElectrum", listDOITransactionElectrum2)
            chai.assert.equal(listDOITransactionElectrum2.length, 3, 'in the past we had here always 3 outputs '+address2)*/
            
        })

        it.only('should log listtransactionsElectrum content', async function () {
         
            const address = "bc1q7vtcp3gas4k54y5xtmg2dl7dw599s4wdqha78y"
            let listBTCTransactionElectrum = await listTransactionsElectrum(address,{network:bitcoin.networks.bitcoin})
            //console.log(listTransactionElectrum[0])
            chai.assert.equal(listBTCTransactionElectrum.length, 1, 'in the past we had here always 1 output')
            //chai.assert.equal(listTransactionElectrum[0].satoshi, 16393033, 'that is the change money')
            chai.assert.equal(listBTCTransactionElectrum[0].satoshi, 88134, 'this is a btcpay server payment for a p2pool node')
        })

        it('should create a new mnemonic seed phrase', function () {
            const mnemonic = generateMnemonic()
            chai.assert.equal(mnemonic.split(' ').length, 12, 'mnemonic doesn´t contain 12 words')
        })

        it('should validate a mnemonic seed phrase', function () {
            const valid = validateMnemonic(MNEMONIC)
            chai.assert.equal(valid, true, "mnomnic seed phrase not valid")
        })

        it('should create a hdkey from a mnemonic without password', function () {
            const hdKey = createHdKeyFromMnemonic(MNEMONIC)
            chai.expect(hdKey).to.have.own.property('_privateKey');
            chai.expect(hdKey).to.have.own.property('_publicKey');
        })

        //TODO this doesn't create a wallet
        it('should restore new Doichain wallet from a seed in mainnet', async function () {
            changeNetwork('mainnet')
            const hdKey = createHdKeyFromMnemonic(MNEMONIC)
            // chai.expect(() => createDoichainWalletFromHdKey(hdKey)).to.throw();
            // chai.expect(() => createDoichainWalletFromHdKey(hdKey,'alice@ci-doichain.org')).to.not.throw();
            //const xpubMaster = bitcoin.bip32.fromBase58(hdKey.publicExtendedKey)
            const wallets = await restoreDoichainWalletFromHdKey(hdKey, 'alice@ci-doichain.org')
            const newWallet = await createNewWallet(hdKey, wallets.length)
            chai.assert.strictEqual(newWallet.addresses[0].address.startsWith('M') || newWallet.addresses[0].address.startsWith('N'),true)
            chai.expect(newWallet.addresses[0].address).to.have.length(34)
            chai.expect(newWallet.addresses[0].address.substring(0,1)).to.be.uppercase
        })

        //TODO this doesn't create a wallet
        it('should create a new Doichain wallet from a seed in testnet', async function () {
            changeNetwork('testnet')
            const hdKey = createHdKeyFromMnemonic(MNEMONIC)
            const wallets = await restoreDoichainWalletFromHdKey(hdKey, 'alice@ci-doichain.org', DOICHAIN_TESTNET)
            const newWallet = await createNewWallet(hdKey, wallets.length)
            chai.assert.strictEqual(newWallet.addresses[0].address.startsWith('m') || newWallet.addresses[0].address.startsWith('n'),true)
            chai.expect(wallet.addresses[0].address).to.have.length(34)
            chai.expect(wallet.addresses[0].address.substring(0,1)).to.not.be.uppercase
        })

        it('should fund the basic regtest wallet with 10 DOI ', async () => {
            changeNetwork('regtest')
            const hdKey = createHdKeyFromMnemonic(MNEMONIC)
            const xpubMaster = bitcoin.bip32.fromBase58(hdKey.publicExtendedKey)

            console.log(global.DEFAULT_NETWORK)
            const wallets = await restoreDoichainWalletFromHdKey(hdKey, 'alice@ci-doichain.org')
            const newWallet = await createNewWallet(hdKey, wallets.length)

            chai.assert.strictEqual(newWallet.addresses[0].address.startsWith('m') || newWallet.addresses[0].address.startsWith('n'), true)
            chai.expect(newWallet.addresses[0].address).to.have.length(34)
            chai.expect(newWallet.addresses[0].address.substring(0, 1)).to.not.be.uppercase

            const balanceObj = await getBalanceOfWallet(xpubMaster, 'm/0/0/0')

            console.log('balanceObj.balance',balanceObj)
            if(balanceObj.balance<5){
                     const doi = 10
                     console.log("first address",balanceObj.addresses[0].address)
                     const funding = await fundWallet(balanceObj.addresses[0].address, doi)
                     console.log('funding',funding)
                     chai.assert.notEqual(funding.status, "fail", "blockchain problem")
                     const address = funding.data.address
                     chai.expect(address).to.have.length(34)
                     chai.expect(address.substring(0, 1)).to.not.be.uppercase
                     await setTimeout(async function () {
                         const balanceObj2 = await getBalanceOfWallet(xpubMaster, 'm/0/0/0')
                         chai.assert.isAtLeast(balanceObj2.balance, 10, "should be at least 1")
                     }, 3000)
            }
        })

        it('should check the full balance of a wallets addresses', async () => {
            changeNetwork('regtest')
            const hdKey = createHdKeyFromMnemonic(MNEMONIC)
            const wallets = await restoreDoichainWalletFromHdKey(hdKey, 'alice@ci-doichain.org')
            const addressesOfFirstWallet = wallets[0].addresses
            const firstAddressOfFirstWallet = addressesOfFirstWallet[0].address
            chai.assert.isAbove(addressesOfFirstWallet.length, 0, "wallet doesn't have any address with funding")
            const balanceRet = await getBalanceOfAddresses([firstAddressOfFirstWallet])
            chai.assert.isAtLeast(balanceRet.balance, 1, "should be at least 1")

            const addressesOfSecondWallet = wallets[0].addresses
            const firstAddressOfSecondWallet = addressesOfSecondWallet[0].address
            const balanceRet2 = await getBalanceOfAddresses([firstAddressOfSecondWallet])
            chai.assert.isAtLeast(balanceRet2.balance, 1, "should be at least 1")

            const balanceRet3 = await getBalanceOfAddresses([firstAddressOfFirstWallet, firstAddressOfSecondWallet])
            chai.assert.isAtLeast(balanceRet3.balance, 2, "should be at least 1")
        })

        it('encrypt and decrypt seed phrase', function () {
            const encryptedSeedPhrase = encryptAES(MNEMONIC2, PASSWORD)
            chai.assert.isAbove(encryptedSeedPhrase.length, 0, "seed phrase not encrypted")
            const decryptedSeedPhrase = decryptAES(encryptedSeedPhrase, PASSWORD)
            chai.assert.equal(decryptedSeedPhrase, MNEMONIC2, "seed phrase not decrypted")
            const decryptedSeedPhrase2 = decryptAES(encryptedSeedPhrase, "wrongPassword")
            chai.assert.notEqual(decryptedSeedPhrase2, MNEMONIC2, "this is completely impossible")
            chai.assert.equal(decryptedSeedPhrase2, "", "this is not empty")
        })

        it('creates a master key and generates a address from it ', async function () {
            changeNetwork('regtest')
            const hdKey = createHdKeyFromMnemonic(MNEMONIC)

            const newWallet = await createNewWallet(hdKey, 0)
            chai.expect(newWallet).to.have.own.property('publicExtendedKey')

            const address = generateNewAddress(newWallet.publicExtendedKey,
                newWallet.addresses[newWallet.addresses.length - 1].derivationPath)
            chai.expect(address).to.have.length(34)
        })

        it('should generate a new Doichain address and import it', async () => {
            changeNetwork('regtest')
            const mnemonicAlice = generateMnemonic()
            const hdKeyAlice = createHdKeyFromMnemonic(mnemonicAlice)
            const childKey = hdKeyAlice.derive("m/0/0/0")
            const address = getAddress(childKey.publicKey)
            console.log('address', address)
            chai.expect(address.substring(0, 1)).to.not.be.uppercase
        })

        it('should send Doicoins to another address', async () => {
            changeNetwork('regtest')
            const mnemonicAlice = generateMnemonic()
            const hdKeyAlice = createHdKeyFromMnemonic(mnemonicAlice)
            const newWalletAlice = await createNewWallet(hdKeyAlice, 0)
            const addressesOfAlice = newWalletAlice.addresses
            const firstAddressAlice = addressesOfAlice[0].address
            //console.log("firstAddressAlice", firstAddressAlice)
            chai.expect(firstAddressAlice.substring(0, 1)).to.not.be.uppercase

            const doi = 10
            const funding = await fundWallet(firstAddressAlice, doi)

            const mnemonicBob = generateMnemonic()
            const hdKeyBob = createHdKeyFromMnemonic(mnemonicBob)
            const newWalletBob = await createNewWallet(hdKeyBob, 0)
            const addressesOfBob = newWalletBob.addresses
            const firstAddressBob = addressesOfBob[0].address
           // console.log("firstAddressBob", firstAddressBob)
            chai.expect(firstAddressBob.substring(0, 1)).to.not.be.uppercase

            await setTimeout(async function () {

                const derivationPath = 'm/0/0/0'
                const xpubMasterAlice = bitcoin.bip32.fromBase58(hdKeyAlice.publicExtendedKey)
                const walletDataAlice = await getBalanceOfWallet(xpubMasterAlice, derivationPath)
               // console.log('walletDataAlice', walletDataAlice)
            //    console.log('walletDataAlice.addresses[0].transactions', walletDataAlice.addresses[0].transactions)
                chai.assert.isAtLeast(walletDataAlice.balance, 10, "should be at least 10")

               const xpubMasterBob = bitcoin.bip32.fromBase58(hdKeyBob.publicExtendedKey)
                const walletDataBob = await getBalanceOfWallet(xpubMasterBob, derivationPath)
                  // console.log('walletDataBob', walletDataBob)
                chai.assert.equal(walletDataBob.balance, 0, "should be at least 1")

                let selectedInputs = getUnspents(walletDataAlice)
               console.log('selectedInputs', selectedInputs)
               const amount = 10000000
               const destAddress = firstAddressBob
               const changeAddress = firstAddressAlice //TODO please implement getNewChangeAddress
               let walletKey = hdKeyAlice.derive(derivationPath)
               let txResponse = await sendToAddress(walletKey, destAddress, changeAddress, amount, selectedInputs)     //chai.expect(addressesOfBob[0].address.substring(0,1)).to.not.be.uppercase
               chai.assert.equal(txResponse.status, 'success', "problem with sending transaction to blockchain")

              // console.log('txResponse', txResponse)
                        await setTimeout(async function () {
                          //get new balance
                        const xpubMasterAlice = bitcoin.bip32.fromBase58(hdKeyAlice.publicExtendedKey)
                        const derivationPath = 'm/0/0/0'
                        const walletDataAlice2 = await getBalanceOfWallet(xpubMasterAlice, derivationPath)
                       // console.log("walletDataAlice2.transactions",walletDataAlice2.addresses[0].transactions)
                        chai.assert.equal(walletDataAlice2.balance, 9.8993182, "amount of alice is wrong")
                        updateWalletWithUnconfirmedUtxos(txResponse,walletDataAlice2)
                        //console.log("walletDataAlice2",walletDataAlice2.addresses[0].transactions)
                        selectedInputs = getUnspents(walletDataAlice2)
                        chai.assert.equal(selectedInputs.length, 1, "we should only have one input here")
                        chai.assert.equal(selectedInputs[0].amount, 9.8993182, "amount the input is incorrect")

                        const xpubMasterBob = bitcoin.bip32.fromBase58(hdKeyBob.publicExtendedKey)
                        const walletDataBob2 = await getBalanceOfWallet(xpubMasterBob, derivationPath)
                            console.log(walletDataBob2)
                        chai.assert.equal(walletDataBob2.balance, 0.1, "should be at least 0.1 DOI")


                        //send 0.2 BTC
                        const amount2 = 20000000
                        const txResponse2 = await sendToAddress(walletKey, destAddress, changeAddress, amount2, selectedInputs)     //chai.expect(addressesOfBob[0].address.substring(0,1)).to.not.be.uppercase
                        console.log('txResponse',txResponse)
                        chai.assert.equal(txResponse2.status, 'success', "problem with sending transaction to blockchain")

                        //TODO now check balance of alice & bob again
                        //TODO check usnpents one more time

                    }, 3000)
            }, 3000)

        })
    })

    it('encrypt and decrypt with ecies', async () => {

        const k1 = new PrivateKey()
        const message = "That is a simple message"
        const publicKeyOfBob = k1.publicKey.toHex()
        const privateKeyOfBob = k1.toHex()
        const encryptedMessage = encryptStandardECIES(publicKeyOfBob,message)
        const decryptedMessage = decryptStandardECIES(privateKeyOfBob,encryptedMessage)
        chai.assert.equal(decryptedMessage, message, "encryption and decryption didn't work")

        changeNetwork('regtest')
        const wif = "cP3EigkzsWuyKEmxk8cC6qXYb4ZjwUo5vzvZpAPmDQ83RCgXQruj"
        const privateKeyOfBob2 = getPrivateKeyFromWif(wif,DOICHAIN_REGTEST)

        var keyPair = bitcoin.ECPair.fromWIF(wif,DOICHAIN_REGTEST)
        var publicKey = keyPair.publicKey.toString('hex')

      /*  function rng () {
            return Buffer.from('zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz')
        } // get a much more secure random

        const keyPair = bitcoin.ECPair.makeRandom({ rng: rng })
        const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey })
        //console.log("address " + address) // 17wqX8P6kz6DrDRQfdJ9KeqUTRmgh1NzSk*/
      //  var publicKey = keyPair.publicKey.toString('hex')
        console.log("public key " + publicKey) // 0279bf075bae171835513be1056f224f94f3915f9999a3faea1194d97b54397219



        //console.log("private key WIF " + wif) // 200424e3612358db9078760d4f652a105049187c29f2d03d7d65bc9e27a007d0

        const message2 = "http://localhost:3000"
        const publicKeyOfBob2 = publicKey

        const encryptedMessage2 = encryptStandardECIES(publicKeyOfBob2,message2)
        console.log('encryptedMessage2',encryptedMessage2.toString('hex'))
        const decryptedMessage2 = decryptStandardECIES(privateKeyOfBob2,encryptedMessage2)
        console.log(decryptedMessage2)
        chai.assert.equal(decryptedMessage2, message2, "encryption and decryption didn't work")


        const encryptedMessage3 = "04f24211b7e993a8d6c822b1e3100dbdf01cad8b84ef4b7cce0fddf32418061ae8352d064c5b7b746721e6927eabef3cebcabaf2ff0cbf468fb9659367d98a9ba7171cc577bc9afdaf9ec05b88f9a7716b679e8470d68332aac276790fa38b030fb14d8914fb20b5d752c34ea69d5d3f802ba8f6c470eb"//, "hex")
        const privateKeyWif = "cP3EigkzsWuyKEmxk8cC6qXYb4ZjwUo5vzvZpAPmDQ83RCgXQruj"
        const keyPair3 = bitcoin.ECPair.fromWIF(privateKeyWif,DOICHAIN_REGTEST) //getPrivateKeyFromWif(privateKeyWif,DOICHAIN_REGTEST)
        const privateKey = "2b7d05ba4d4903ab99f5740bd0bd51a088ac077c460d67dcdafcbafed71b0195"
        chai.assert.equal(privateKey,keyPair3.privateKey.toString('hex'),"privatekeys are not the same")
        const decryptedMessage3 = decryptStandardECIES(keyPair3.privateKey.toString('hex'),encryptedMessage3)
        console.log("decryptedMessage3",decryptedMessage3)
        chai.assert.equal(decryptedMessage3, "http://localhost:3000/", "decrypting not successful")
    })

    it('create and verify a signature ', async () => {
        changeNetwork('regtest')
        function rng () {
            return Buffer.from('zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz')
        } // get a much more secure random

        const keyPair = bitcoin.ECPair.makeRandom({ rng: rng })
        const message = "a basic test message"
        const signature = getSignature(message,keyPair)
        console.log('signature',signature)
        const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey })
        console.log('address',address)
        const validSignature = verifySignature(message,address,signature)
        chai.assert.equal(true, validSignature, "signature not valid")

        console.log("---- test 2")
        const message2 = "bob@ci-doichain.orgalice@ci-doichain.org"
        const pk = "03A3E34B6675E999F76D03B2FB309D9491E08B17A55A4B48E813883D6C0F136149"
        const publicKeyBuffer = Buffer.from(pk, 'hex')
        var keyPair2 = bitcoin.ECPair.fromPublicKey(publicKeyBuffer)
        console.log(keyPair2.publicKey.toString('hex'))
       // const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair2.publicKey });
        const address2 = bitcoin.payments.p2pkh({ pubkey: keyPair2.publicKey }).address
        console.log('address2',address2)

        const signature2 = "IBXVtYtfh/WHKvhhJ77uHoTHv/MZWs0TrHak3YOrWDWWRKSe8VAMANx2lonr4zCywhOwMDhvKBZYq0hXWdISCb8="
        const validSignature2 = verifySignature(message2,address2,signature2)

        chai.assert.equal(true, validSignature2, "signature2 not valid")

        console.log("---- test 3")
        const message3 = 'IKcnDC0VTO9xi15AbXCxz71PiNXa51ptcCSx4DYkfmdNZl9jlaTyDsfD6WU+y8fxFPSTVuRM+0JTs/2eSJrJK/I='
        const signature3 = 'HwfNLlwQq6AYqK1hhAhrqy2ZLtkMq+gUHT+ELnq9+kvMTeNiDS8Q/wPzU/JQZT0OxqjoFaRQ/4997KaR0Aly4MQ='
        
        const pk3 = "0259daba8cfd6f5e404d776da61421ffbbfb6f3720bfb00ad116f6054a31aad5b8"
        const publicKeyBuffer3 = Buffer.from(pk3, 'hex')
        var keyPair3 = bitcoin.ECPair.fromPublicKey(publicKeyBuffer3)
        console.log(keyPair3.publicKey.toString('hex'))
       // const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair2.publicKey });
        const address3 = bitcoin.payments.p2pkh({ pubkey: keyPair3.publicKey,  
            network: global.DEFAULT_NETWORK}).address
        console.log('address3',address3)

        const validSignature3 = verifySignature(message3,address3,signature3)

        chai.assert.equal(true, validSignature3, "signature3 not valid")

    })

    xit('rescue money from a wallet', async () => {
        changeNetwork('mainnet')
        const MNEMONIC_OTTMAR = ""
        const MNEMONIC_OTTMAR_PASSWORD = ""

        const decryptedSeed = decryptAES('U2FsdGVkX1/W8TS0TORpjt5zmE4ex+0ALo79FbL7LQQVgzLw/ykISTyTBEX0xrKrT0oBv2ky7kY/BlLYVkG7346tGDTmrmTHmP8HuhytHncbe5mvjrqIE5RTW0hlPQtz',MNEMONIC_OTTMAR_PASSWORD)
        const hdKey = createHdKeyFromMnemonic(decryptedSeed,MNEMONIC_OTTMAR_PASSWORD)
        let childKey0FromXpub = bitcoin.bip32.fromBase58(hdKey.publicExtendedKey,global.DEFAULT_NETWORK);
        console.log(bitcoin.payments.p2pkh({ pubkey: childKey0FromXpub.derivePath('m/0/0/0').publicKey, network: global.DEFAULT_NETWORK}).address)
        console.log(bitcoin.payments.p2pkh({ pubkey: childKey0FromXpub.derivePath('m/0/0/1').publicKey, network: global.DEFAULT_NETWORK}).address)
        console.log(bitcoin.payments.p2pkh({ pubkey: childKey0FromXpub.derivePath('m/0/0/2').publicKey, network: global.DEFAULT_NETWORK}).address)

        const wrongAddressDerivationPath = 'm/1'
        const wrongAddress = bitcoin.payments.p2pkh(
            { pubkey: childKey0FromXpub.derivePath(wrongAddressDerivationPath).publicKey,
            network: global.DEFAULT_NETWORK}).address
        console.log('wrong Address', wrongAddress)
        //1. Get unspents from this address
        const unspentInputs = await listUnspent(wrongAddress)
        console.log('unspents',unspentInputs.data)
        //2. Create a transaction to a correct address with those unspents
        const destAddressDerivationPath = 'm/0/0/1'
        const destAddress = bitcoin.payments.p2pkh({ pubkey: childKey0FromXpub.derivePath(destAddressDerivationPath).publicKey,
            network: global.DEFAULT_NETWORK}).address
        console.log('destAddress',destAddress)

        const changeAddressDerivationPath = 'm/0/1/0'
        const changeAddress = bitcoin.payments.p2pkh({ pubkey: childKey0FromXpub.derivePath(changeAddressDerivationPath).publicKey,
            network: global.DEFAULT_NETWORK}).address

        console.log("changeAddress",changeAddress)
        const amount = 6000000-500462
        const keyPair = hdKey.derive(wrongAddressDerivationPath)
        sendToAddress([keyPair,keyPair],destAddress,changeAddress,amount,unspentInputs.data)
    })
});
