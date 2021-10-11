export const hashRateFormat = (number) => {
  
    let localhashRate = number;

    if (number === undefined || localhashRate === 0) {
      return "0 H/s";
    }

    if (number.toFixed() / 1000000000000 >= 1) {
      return (
        ((100 * number.toFixed()) / 1000000000000 / 100).toFixed(2) + " TH/s"
      );
    }

    if (number.toFixed() / 1000000000 >= 1) {
      return ((100 * number.toFixed()) / 1000000000 / 100).toFixed(2) + " GH/s"
    }

    return ((100 * number.toFixed()) / 100).toFixed(2) + " H/s"  
}

export default hashRateFormat
