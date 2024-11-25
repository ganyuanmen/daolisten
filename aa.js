const Server = require("./src/server")
const schedule =require("node-schedule");
const daoabi=require('./src/abi/SC_abi.json')
const mysql = require('mysql2');
const dotenv=require('dotenv');
// const crypto = require('crypto');

dotenv.config();

// const start_block=21232473n  //Start listening for block numbers
const start_block=0n
var monitor = 0; //Restart every 10 minutes 

//A websocket connection will report an error: 429 Too Many Requests, so there are three servers to listen to
var server1=new Server();

async function ss() {


   await server1.start();
   nfttransfer() // 发布mint nft

}
 ss()

  


function nfttransfer()
{
   server1.daoapi.UnitNFT.transfer(0n,async obj => {
       console.log(obj);
       const {data}=obj
       let tokenSvg=await server1.daoapi.UnitNFT.getTokenImageSvg(data['tokenId'])

       let sql = "INSERT INTO t_nft_transfer(block_num,token_id,token_to,tokensvg,_time,contract_address) VALUES(?,?,?,?,?,?)";
       try{
         let params = [obj.blockNumber, data['tokenId'],data['to'],tokenSvg,data['timestamp'],server1.daoapi.UnitNFT.address];
         console.log(params)
         // maxData[20] = obj.blockNumber+1n; //Cache last block number
        // executeSql(sql, params);
      }catch(e){console.error(e)}
   })
}


