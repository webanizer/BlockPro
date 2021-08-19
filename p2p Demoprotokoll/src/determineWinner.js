
  var diff
  var id

async function determineWinner(receivedNumbers, solutionNumber, id) {
  return new Promise(resolve => {

  console.log("Array is in determine Winner ", JSON.stringify(receivedNumbers))
  console.log("Solution number in determine Winner: ", solutionNumber)

  if (receivedNumbers !== undefined && receivedNumbers.length > 1  ) {
    winnerPeerId = undefined
    for (var i = 0; i < receivedNumbers.length ; i++) {
      if (!receivedNumbers[i].includes('Solution')) {
        let number = receivedNumbers[i].split(' ')[1]

        diffNeu = Math.abs(solutionNumber - number)
        if (diff == undefined || diffNeu < diff) {
          diff = diffNeu
          winnerPeerId = receivedNumbers[i].split(',')[0]
        }
      }
    }
  }
  console.log("From Determine Winner WinnerId ", winnerPeerId)
  receivedNumbers = []
  diff = undefined
  resolve(winnerPeerId)
  })
}

module.exports.determineWinner = determineWinner;