
import {myAddresses} from './constants.js'

export const isOurChangeAddress = (address) => {
    const newMyAddresses = myAddresses.filter(ourAddress => {
       return ourAddress.address===address && ourAddress.changeAddress===true
    })
    return newMyAddresses.length > 0?true:false
  }

  export default isOurChangeAddress