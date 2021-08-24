import { parentPort }from 'worker_threads'


( () =>  {
        console.log(`Starting wait 15 mins`);
        setTimeout(() => {
            console.log(`Timeout over`);

            // generate a random number 
            let solutionNumber = Math.floor(Math.random() * 300).toString();
            let solution = 'Solution ' + solutionNumber
            console.log('Random number: ' + solution)
            parentPort.postMessage(`${solution}`);

            process.exit();
        }, 30000);
})();

