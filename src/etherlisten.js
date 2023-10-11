const ethers = require("ethers");
const abi1=require('./abi/UnitToken_abi')



//这里是sepolia测试网， 主网需要改为mainnet
const NODE_URL = "wss://sepolia.infura.io/ws/v3/9676a35d629d488fb90d7eac1348c838";
var provider = new ethers.providers.WebSocketProvider(NODE_URL);

const utokenAddress='0x0E0E466377e34BCA94303e8ed5035c05B09F9Dc0'
// const abi=['event Transfer(address indexed from, address indexed to, unit value)']
const abi = [
    // Read-Only Functions
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",

    // Authenticated Functions
    "function transfer(address to, uint amount) returns (bool)",

    // Events
    "event Transfer(address indexed from, address indexed to, uint amount)"
];
// const utokenContract=new ethers.Contract(utokenAddress,abi,provider)

let privateKey = "86052468765597c797daff2d28c80378e01a38dc371a6817c2ef458a5a213183";
let wallet = new ethers.Wallet(privateKey,provider);
// let signer=wallet.get
// const node1 = "https://sepolia.infura.io/v3/9676a35d629d488fb90d7eac1348c838";
// const provider1 = new ethers.providers.JsonRpcProvider(node1);
// 
//var provider1 = ethers.getDefaultProvider('sepolia');
// address = "0x5aD91dCCD7b5F15A454213B36aaDa82a8FbD4ea2"
// signer = new ethers.VoidSigner(address, provider1)

const wallet1=new ethers.wallet(privateKey)
const provider1=new ethers.providers.JsonRpcProvider(NODE_URL)
const signer1=wallet.connect(provider1)

let code=this.contract.interface.encodeFunctionData('swap',[_to])
let para=  {
    // Wrapped ETH address
    to: this.address,
  
    // `function deposit() payable`
    data: code,
  
    // 1 ether
    // value: parseEther("1.0")
  }
let gas1=await this.signer.estimateGas(para )
console.log(`gas1: ${gas1.toString()}`)

let gas2=await this.contract.getFunction('swap').estimateGas(_to,{value: ethValue});
console.log(`gas2: ${gas2.toString()}`)

let gas3=await this.signer.provider.estimateGas(para)
console.log(`gas3: ${gas3.toString()}`)




async function main()
{
    const erc20 = new ethers.Contract(utokenAddress, abi, provider);

    const erc20_rw = new ethers.Contract(utokenAddress, abi, wallet);
    tokens = await erc20_rw.balanceOf(wallet.address)
    //console.log(ethers.BigNumber.from(tokens).toString())
    console.log(ethers.utils.formatEther(tokens))

    let res=await erc20_rw.transfer('0x854f2999442cd1Dfc5b52924A5692505c3759da6',ethers.utils.parseEther('1.323'))
    console.log(res.hash)
    // console.log('aaaaaaaaaa',wallet.address)

   // filterTo = erc20.filters.Transfer(wallet.address, '0x854f2999442cd1Dfc5b52924A5692505c3759da6');

    // erc20.on(filterTo,(from,to,value,obj)=>{
    //     console.log("------->"+obj.transactionHash)
    //     console.log(`${from}-->${to} : ${ethers.utils.formatUnits(ethers.BigNumber.from(value),6)}`)
    // })

    erc20.on('Transfer',(from,to,value,obj)=>{
        console.log("------->"+obj.transactionHash)
        console.log(`${from}-->${to} : ${ethers.utils.formatUnits(ethers.BigNumber.from(value),6)}`)
    })
    // erc20.on('Transfer',(from,to,value,a,b,c,d)=>{
    //     console.log(from,to,value,a,b,c,d)
    //    // console.log(`${from}-->${to} : ${ethers.utils.formatUnits(ethers.BigNumber.from(value),6)}`)
    // })
    console.log(111111111111)
}

main()