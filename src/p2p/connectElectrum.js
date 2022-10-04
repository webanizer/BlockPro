import { createRequire } from "module";
const require = createRequire(import.meta.url);
const ElectrumClient = require('@codewarriorr/electrum-client-js')
import { servers } from "../doichain/backupServers.js"; 

const connectElectrum = async () => {

    var electrumHost

    switch (process.env.NETWORK_TYPE) {
        case "DOICHAIN":
            electrumHost = process.env.ELECTRUM_SERVER
            break;
        case "DOICHAIN_TESTNET":
            electrumHost = "spotty-goat-4.doi.works"
            break;
        case "DOICHAIN_REGTEST":
            electrumHost = "172.22.0.6"
            break;
    }

    global.client = new ElectrumClient(electrumHost, 50002, "ssl");

    try {
        await global.client.connect(
            "electrum-client-js", // optional client name
            "1.4.2" // optional protocol version
        )
        console.log("connected to: ", electrumHost)
    } catch (err) {
        console.error(err);
        // if connection error try other servers 
        if (process.env.NETWORK_TYPE == "DOICHAIN") {
            for (let i = 0; i < servers.length; i++) {
                electrumHost = servers[i].MAINNET
                global.client = new ElectrumClient(electrumHost, 50002, "ssl");
                try {
                    await global.client.connect(
                        "electrum-client-js", // optional client name
                        "1.4.2" // optional protocol version
                    )
                    i = servers.length
                } catch (error) {
                    if (i == (servers.length - 1)) {
                        // try connection again with server list from the beginning
                        i = 0
                    }
                }
            }
        }
    }
}

export default connectElectrum;