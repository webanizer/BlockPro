
const writeToIPFS = async (ipfs: any, data: any) => {
    const { cid } = await ipfs.add(data)
    return cid 
}
export default writeToIPFS