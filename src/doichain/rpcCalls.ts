import axios from 'axios';


export const NAMESPACE = 'bp/';

export async function nameDoi(url: any, name: any, value: any, address: any) {
  const ourName = checkId(name);
  const ourValue = value;
  const time =  new Date();
  const parameters = [ourName, ourValue];

  try {
    const response = await axios.post(
      url,
      {
        id: time.toString(),
        method: 'name_doi',
        params: parameters,
      }
    );
    console.log("txid: ", response.data)
  } catch (error) {
    console.error(error)
  }
}

export async function getBalance(url: any) {
  const time =  new Date();

  try {
    const response = await axios.post(
      url,
      {
        id: time.toString(),
        method: 'getbalance',
      }
    );
    console.log("Balance: ", response.data)
    return response.data.result;
  } catch (error) {
    console.error(error)
  }
}

export async function getNewAddress(url: any) {
  const time =  new Date();

  try {
    const response = await axios.post(
      url,
      {
        id: time.toString(),
        method: 'getnewaddress',
      }
    );
    console.log("Neue Empfangsaddresse: ", response.data)
    return response.data.result;
  } catch (error) {
    console.error(error)
  }
}


    /**
     * 1. checks if an id starts with doi: if yes it will be removed
     * 2. checks if an id doesn't start with e/ (DOI-permission) and not with es/ (Email signature) and optionaly putting a e/ as default
     */
    function checkId(id: any) {
        const DOI_PREFIX = "doi: ";
        let ret_val = id; //default value
        if (!id.startsWith(NAMESPACE)) ret_val = NAMESPACE + id; //in case it doesn't start with e/ put it in front now.
        return ret_val;
    }
