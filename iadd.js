const abi=require('./src/abi/_IADD_abi.json');


const { Web3 } = require('web3');
const web3 = new Web3("wss://sepolia.infura.io/ws/v3/982d49c829f4428db93d5a077085d995");

var subscription

async function subscribe() {
  // create a new contract object, providing the ABI and address
  const contract = new web3.eth.Contract(abi, '0xFA5D188664545b07eAb1b1946f3b0FA995b7bE15');

  // subscribe to the smart contract event
  subscription = contract.events.UnitTokenToSCToken({filter: {},fromBlock: 0n})
  // new value every time the event is emitted
  subscription.on("data", function(data,err){
    console.log(data)
  });
}

// function to unsubscribe from a subscription
async function unsubscribe(subscription) {
    await subscription.unsubscribe();
}

subscribe();
unsubscribe(subscription);
