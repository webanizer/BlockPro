
import {myAddresses} from './constants.js'

export const isOurAddress = (address) => {
    const newMyAddresses = myAddresses.filter(ourAddress => {
       return ourAddress.address===address
    })
    return newMyAddresses.length > 0?true:false
  }

  export default isOurAddress