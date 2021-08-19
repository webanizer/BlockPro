const { isMainThread, parentPort } = require('worker_threads');


( () =>  {
        console.log(`Starting wait 15 mins`);
        setTimeout(() => {
            console.log(`Timeout over`);

            // generate a random number 
            solutionNumber = Math.floor(Math.random() * 100).toString();
            solution = 'Solution ' + solutionNumber
            console.log('Random number: ' + solution)
            parentPort.postMessage(`${solution}`);

            process.exit();
        }, 30000);
})();

