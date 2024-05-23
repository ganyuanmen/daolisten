// const fs = require('fs');
 
// // 假设您有一个base64编码的图片字符串
// const base64Str = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...';
 
// // 将base64字符串转换为二进制数据
// const binaryData = base64Str.split(',')[1];
 
// // 解码base64数据
// const buffer = Buffer.from(binaryData, 'base64');
 
// // 指定保存图片的文件名和路径
// const filePath = './output.png';
 
// // 写入文件
// fs.writeFile(filePath, buffer, (err) => {
//   if (err) {
//     console.log('保存图片失败:', err);
//   } else {
//     console.log('图片保存成功:', filePath);
//   }
// });
const abi=require('./src/abi/_IADD_abi.json');

// import { Web3 } from "web3";
const { Web3 } = require('web3');
// set a provider - MUST be a WebSocket(WSS) provider
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
