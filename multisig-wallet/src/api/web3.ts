import Web3 from "web3";

export async function unlockAccount(){
    // @ts-ignore
    const { ethereum } = window;

    if (!ethereum){
        throw new Error("Web3 not found");
    }

    const web3 = new Web3(ethereum);
    
    await ethereum.enable();
    const accounts = await web3.eth.getAccounts();
    
    return { web3, account: accounts[0] || "" };
}