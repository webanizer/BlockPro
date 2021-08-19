const writeToIPFS = async (ipfs, data) => {
    const { cid } = await ipfs.add(data);
    return cid;
};
export default writeToIPFS;
