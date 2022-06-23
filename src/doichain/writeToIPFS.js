import  { s } from "../p2p/sharedState.js"

const writeToIPFS = async (data) => {
    const { cid } = await s.node.add(data)
    return cid 
}
export default writeToIPFS