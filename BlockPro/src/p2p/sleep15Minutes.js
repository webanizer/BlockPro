import { parentPort } from 'worker_threads'
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method

(() => {
    console.log(`Starting wait for next Block`);
    new Promise((resolve, reject) => {

    var blockhash

    // subber.js
    var zmq = require("zeromq"),
        sock = zmq.socket("sub");

    while(blockhash = undefined){

    sock.connect("tcp://172.22.0.5:28332");
    sock.subscribe("kitty cats");
    console.log("Subscriber connected to port 28332");

    sock.on("message", function (topic, message) {
        console.log(
            "received a message related to:",
            topic, 
            "containing message:",
            message);
        blockhash = message
        
        // to do substring letzte 4 Stellen und von hex zu dez = solution

        let solution = 'Solution ' + blockhash
        console.log('Random number: ' + solution)
        parentPort.postMessage(`${solution}`);
        resolve()
    });
}
})

})();

