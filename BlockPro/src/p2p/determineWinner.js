var diff

const determineWinner = async(receivedNumbers, solutionNumber) => {
  return new Promise(resolve => {
  var winnerPeerId

  console.log("Array is in determine Winner ", JSON.stringify(receivedNumbers))
  console.log("Solution number in determine Winner: ", solutionNumber)

  if (receivedNumbers !== undefined && receivedNumbers.length > 1  ) {
    for (var i = 0; i < receivedNumbers.length ; i++) {
      if (!receivedNumbers[i].includes('Solution')) {
        let number = receivedNumbers[i].split(' ')[1]

        let diffNeu = Math.abs(solutionNumber - number)
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

export default determineWinner;