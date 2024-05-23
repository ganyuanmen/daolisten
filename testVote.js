const ethers=require('ethers')
const Vote=require('./Vote.json')

const contractAddress ='0xf4bB5f91674E44BC895A2Ebc23c589549702A18C';
const infu_url="https://sepolia.infura.io/v3/2e68e4d6017344cd89bab57981783954"
const privatKey='f15b477480d870dc65e3b9ac56c5339fa6c1ab96e8b6cfe09bcb3e74f492d3b5'

async function main_ethers()
{
    const provider=new ethers.JsonRpcProvider(infu_url)
    const wallet = new ethers.Wallet(privatKey,provider);
    const myContract = new ethers.Contract(contractAddress,Vote.abi,wallet);
    await myContract.addListener('voteSuccess',(message)=>{console.log("vote status:",message);})
    const res=await myContract.vote.send(1)
    console.log(res)
}
main_ethers()





async function main(){
const privider = new ethers.InfuraProvider('sepolia',privatKey);
const wallet = new ethers.Wallet(privatKey,privider);
const contract = new ethers.Contract(contractAddress,Vote.abi,wallet);
// await contract.addListener('voteSuccess',(message)=>{console.log("vote status:",message);})
await contract.vote(1);
}

// main()