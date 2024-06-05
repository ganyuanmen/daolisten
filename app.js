const Server = require("./src/server")
const schedule =require("node-schedule");
const daoabi=require('./src/abi/SC_abi.json')
const mysql = require('mysql2');
const dotenv=require('dotenv');
const crypto = require('crypto');


dotenv.config();

const start_block=5867571n  //Start listening for block numbers
var monitor = 0; //Restart every 10 minutes 

//A websocket connection will report an error: 429 Too Many Requests, so there are three servers to listen to
var server1=new Server();
// var server2=new Server('9676a35d629d488fb90d7eac1348c838','0x227c5Bb32cB5b62908005EAEA3Aef65B6cDD7f8f');

var maxData = []; // Record the maximum block number that has been listened to

const pool = mysql.createPool({
   host: process.env.MYSQL_HOST,
   user: process.env.MYSQL_USER,
   password:process.env.MYSQL_PASSWORD,
   database: process.env.MYSQL_DATABASE,
   port:process.env.MYSQL_PORT,
   waitForConnections: true,
   connectionLimit: 1,
   queueLimit: 0,
   enableKeepAlive: true,
   keepAliveInitialDelay: 0
 });

var promisePool = pool.promise();

async function daoListenStart() {

   monitor = 0;
   await server1.restart();
   daoListen();

}


function hand() {
    //Obtain the maximum block number that needs to be monitored from the database
   let sql = 'SELECT IFNULL(MAX(block_num),0)+1 s FROM t_dao'  //0 
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0)+1 FROM t_createversion'  //1 
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0)+1 FROM t_changelogo' //2
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0)+1 FROM t_token'  //3
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0)+1 FROM t_u2t'  //4
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0)+1 FROM t_t2u'  //5
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0)+1 FROM t_e2t'  //6
        + ' union all SELECT IFNULL(MAX(block_num),0)+1 FROM t_eth_utoken' //7
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0)+1 FROM t_proexcu'  //8
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0)+1 FROM t_pro'  //9
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0)+1 FROM t_provote'  //10
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0)+1 FROM t_t2t'  //11
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0)+1 FROM t_domain'  //12
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0)+1 FROM t_getdaoutoken'  //13 分红
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0)+1 FROM t_daoaccount'  //14 dao 成员
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0)+1 FROM t_domain'  //15 domain 
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0)+1 FROM t_mintwithsvgtemplateandtips'  //16 
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0)+1 FROM t_mintwithsvgtemplateid'  //17
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0)+1 FROM t_mintwithsvgtokenid'  //18 
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0)+1 FROM t_mintwithsvgtips'  //19 
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0)+1 FROM t_transfernft'  //20
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0)+1 FROM t_updatedaocreator';  //21

        
        


   promisePool.query(sql,[]).then((rows)=>{
         rows[0].forEach(element => {maxData.push(element.s>start_block?element.s:start_block)});
         console.log(maxData)
         p("start...........")
        daoListenStart(); 
         //1分钟循环执行
         schedule.scheduleJob("*/5 * * * * *",async() => {
            // const d = new Date().toLocaleString();
            // console.log(d);
           if(!server1.daoapi.running)  server1.daoapi.run()

            if (monitor > 15*12 && !server1.daoapi.running) daoListenStart();
            monitor++;  
         });
      })
}


//监听
function daoListen() {
   p('begin listent...')
   
   // addLogoEvent()  
  // hayek()
  // daofund()
  daoCreate() //创建dao事件处理

  publishTolen()  // dao发布token事件
  // //以下的监听需要dao条件下才能处理，所以延迟监听
  setTimeout(() => listen_attach(), 10000);     //5
  //延迟监听兑换，需要处理前期事件
  setTimeout(() => listen_swap(),16000);  //8
  // updateVersion()  //升级
  // transfer()  // 转帐

  mintWithSvgTemplateAndTips();
  mintWithSvgTemplateId();
//   mintWithSvgTokenId();
  mintWithSvgTips();
  nfttransfer()

}

function listen_swap()
{
   execEvent()
   utoken2token()  //u2t token 兑换 token 事件
   token2utoken()  //t2u token 兑换 utoken 事件
   token2token() //t2t token 兑换 token 
   eth2token() //eth to token eth 兑换 token
   eth2utoken() //eth to utoken eth 兑换 utoken
   domain()
   changeLogo() //chanelogo 修改 dao logo 事件

}

function listen_attach()
{
   // setLogo()   //setlogo 创建dao logo 事件
   updateSCEvent()
   addCreatorCEvent()
   addProEvent()   //addProEvent 创建提案事件
   voteEvent()
   getDividendEvent() //提取分红
   accountDividendRight()  //增加成员

}


// 开始监听
hand();

// function hayek()
// {
//   daoapi.HayekFund.addRuleEvent(0, undefined);
//   daoapi.HayekFund.deleteRuleEvent(0, undefined);
//   daoapi.HayekFund.useRuleEvent(0, undefined);
//   daoapi.HayekFund.approveEvent(0, undefined);

// }



//统计个人当前的token 值
function token_cost(id, address) {
   server1.daoapi.DaoToken.balanceOf(id, address).then(e => {
        let sql = "CALL excuteToken(?,?,?)";
        let params = [id, address, e];
        executeSql(sql, params);
    })
  }


  //mysql 处理
function executeSql(addSql, addSqlParams) {
   promisePool.execute(addSql,addSqlParams).catch(err=>{
     console.error('[INSERT ERROR] - ', err.message)
  })
  
}

//屏幕打印
function p(str) {
  let myDate = new Date();
  console.log(myDate.getFullYear() + '-' + (myDate.getMonth() + 1) + '-' + myDate.getDate() + ' ' + myDate.getHours() + ":" + myDate.getMinutes() + ":" + myDate.getSeconds() + "-->" + str)
}

 
//----------------------------------------------------------------------------


function domain()
{
  server1.daoapi.Domain.RecordEvent(maxData[15], (obj) => {
       if(process.env.IS_DEBUGGER==='1') console.log(obj)
       const {data}=obj
       let sql ="INSERT INTO t_domain(dao_id,block_num,domain,pubkey,privkey) VALUES(?,?,?,?,?)";
       crypto.generateKeyPair('rsa', {
         modulusLength: 512,
         publicKeyEncoding: {
         type: 'spki',
         format: 'pem'
         },
         privateKeyEncoding: {
         type: 'pkcs8',
         format: 'pem'
         }
     }, async (err, publicKey, privateKey) => {
         try {
            let params = [data['daoId'],obj.blockNumber,data['domain'].toLowerCase(),publicKey,privateKey];
            maxData[15] = obj.blockNumber+1n;  //Cache last block number
            executeSql(sql, params); 
      } catch (e) {console.error(e);}
     });

     
   });
}


function mintWithSvgTemplateAndTips()
{
  server1.daoapi.DaismNft.mintWithSvgTemplateAndTips(maxData[16], async (obj) => {
       if(process.env.IS_DEBUGGER==='1') console.log(obj)
       const {data}=obj
       let templateSvg=await server1.daoapi.DaismNft.getSvgTemplate(data['templateId'])
       let tokenSvg=''
       if(!data['isTemplate'])
         tokenSvg=await server1.daoapi.DaismNft.getTokenImageSvg(data['tokenId'])
         
       let sql ="INSERT INTO dao_db.t_mintwithsvgtemplateandtips(block_num,daoId,to_address,tokenId,templateId,isPublic,isTemplate,_time,templatesvg,tokensvg) VALUES(?,?,?,?,?,?,?,?,?,?)";
       try {
           let params = [obj.blockNumber,data['daoId'],data['to'],data['tokenId'],data['templateId'],data['isPublic']?1:0,data['isTemplate']?1:0,data['timestamp']
           ,JSON.stringify(templateSvg),tokenSvg];
           maxData[16] = obj.blockNumber+1n;  //Cache last block number
           executeSql(sql, params); //dao 信息
         // let _svg= [
         //    '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" fill="#605a1c" r="50"/>',
         //    '</svg>'
         //  ];
         //   sql='INSERT into t_template(template_id,template_svg,is_public) values(?,?,1)';
         //   params=[1,JSON.stringify(_svg)];
         //   executeSql(sql, params); //dao 信息
       } catch (e) {console.error(e);}
   });
}


function mintWithSvgTemplateId()
{
  server1.daoapi.DaismNft.mintWithSvgTemplateId(maxData[17], async (obj) => {
       if(process.env.IS_DEBUGGER==='1') console.log(obj)
       const {data}=obj
       let tokenSvg=await server1.daoapi.DaismNft.getTokenImageSvg(data['tokenId'])
       let sql ="INSERT INTO dao_db.t_mintwithsvgtemplateid(block_num,daoId,to_address,tokenId,templateId,_time,tokensvg) VALUES (?,?,?,?,?,?,?)";
       try {
           let params = [obj.blockNumber,data['daoId'],data['to'],data['tokenId'],data['templateId'],data['timestamp'],tokenSvg];
           maxData[17] = obj.blockNumber+1n;  //Cache last block number
           executeSql(sql, params); //dao 信息
       } catch (e) {console.error(e);}
   });
}

function mintWithSvgTokenId()
{
  server1.daoapi.DaismNft.mintWithSvgTokenId(maxData[18], async (obj) => {
       if(process.env.IS_DEBUGGER==='1') console.log(obj)
       const {data}=obj
       let tokenSvg=await server1.daoapi.DaismNft.getTokenImageSvg(data['tokenId'])
       let sql ="INSERT INTO t_mintwithsvgtokenid(block_num,daoId,to_address,tokenId,_time,tokensvg) VALUES(?,?,?,?,?,?)";
       try {
           let params = [obj.blockNumber,data['daoId'],data['to'],data['tokenId'],data['timestamp'],tokenSvg];
           maxData[19] = obj.blockNumber+1n;  //Cache last block number
           executeSql(sql, params); //dao 信息
       } catch (e) {console.error(e);}
   });
}

function mintWithSvgTips()
{
  server1.daoapi.DaismNft.mintWithSvgTips(maxData[19],async (obj) => {
       if(process.env.IS_DEBUGGER==='1') console.log(obj)
       const {data}=obj
       let tokenSvg=await server1.daoapi.DaismNft.getTokenImageSvg(data['tokenId'])
       let sql ="INSERT INTO dao_db.t_mintwithsvgtips(block_num,tokenId,templateId,_time,tokensvg) VALUES (?,?,?,?,?)";
       try {
          let params = [obj.blockNumber,data['tokenId'],data['templateId'],data['timestamp'],tokenSvg];
           maxData[19] = obj.blockNumber+1n;  //Cache last block number
           executeSql(sql, params); //dao 信息
       } catch (e) {console.error(e);}

   });
}



function daoCreate()
{
  server1.daoapi.DaoRegistrar.daoCreateEvent(maxData[0], (obj) => {
       if(process.env.IS_DEBUGGER==='1') console.log(obj)
       const {data}=obj
       let sql ="INSERT INTO t_dao(dao_id,block_num,dao_name,dao_symbol,dao_desc,dao_manager,dao_time,dao_exec,creator,delegator,strategy,lifetime,cool_time,dao_logo,dapp_owner) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
       try {
           let params = [data['daoId'],obj.blockNumber,data['name'],data['symbol'],data['describe'],data['manager']
           ,data['time'],data['address'],data['creator'],data['delegator'],data['strategy'],data['lifetime'],data['cool_time'],data['src'],data['dapp_owner']];
           maxData[0] = obj.blockNumber+1n;  //Cache last block number
           executeSql(sql, params); //dao 信息
       } catch (e) {console.error(e);}
   });
}

function publishTolen()
{
   server1.daoapi.DaoToken.publishTokenEvent(maxData[3], obj => {
       const {data}=obj
       if(process.env.IS_DEBUGGER==='1') console.log(obj);
       let sql = "call i_token(?,?,?,?)";
       try {
           let params = [data['daoId'],data['tokenId'],obj.blockNumber, data['timestamp']];
           maxData[3] = obj.blockNumber+1n ; //Cache last block number
           executeSql(sql, params);
       } catch (e) {console.error(e);}
   })
}

function utoken2token()
{
   server1.daoapi.IADD.utokenTotokenEvent(maxData[4], async obj => {
       if(process.env.IS_DEBUGGER==='1') console.log(obj);
       const {data}=obj
       let sql = "call i_u2t(?,?,?,?,?,?,?,?,?,?)";
       try{
         let cost = await server1.daoapi.IADD.getPool(data.tokenId); // 流动池中 dao 的当前币值（utoken）
         let params = [obj.blockNumber, data['tokenId'], cost, data['from'], data['to'], data['utoken'], data['token'], data['swap_time'],obj.transactionHash,data['gas']];
         maxData[4] = obj.blockNumber+1n; //Cache last block number
         executeSql(sql, params);
         token_cost(data.tokenId, data.to); //统计个人当前的token 值
       }catch(e){console.error(e)}
   })
}

function token2utoken()
{
   server1.daoapi.IADD.tokenToUtokenEvent(maxData[5], async obj => {
       if(process.env.IS_DEBUGGER==='1') console.log(obj);
       const {data}=obj
       let sql = "call i_t2u(?,?,?,?,?,?,?,?,?,?)";
       try{
        let cost = await server1.daoapi.IADD.getPool(data.tokenId);// 流动池中 dao 的当前币值（utoken）
         let params = [obj.blockNumber, data['tokenId'], cost, data['from'], data['to'], data['utoken'], data['token'], data['swap_time'],obj.transactionHash,data['gas']];
         maxData[5] = obj.blockNumber+1n; //Cache last block number
         executeSql(sql, params);
         token_cost(data.tokenId, data.from);  //统计个人当前的token 值
       }catch(e){console.error(e)}
   })
}

function token2token()
{
   server1.daoapi.IADD.tokenTotokenEvent(maxData[11], async obj => {
      if(process.env.IS_DEBUGGER==='1') console.log(obj);
      const {data}=obj
      let sql = "call i_t2t(?,?,?,?,?,?,?,?,?,?,?,?)";
      try{
         let cost1 = await server1.daoapi.IADD.getPool(data.fromTokenId); // 流动池中 dao 的当前币值（utoken）
         let cost2 = await server1.daoapi.IADD.getPool(data.toTokenId);// 流动池中 dao 的当前币值（utoken）
         let params = [obj.blockNumber, data.fromTokenId, data.toTokenId, cost1, cost2, data.from, data.to, data.fromToken, data.toToken, data.swap_time,obj.transactionHash,data.gas];
         maxData[11] = obj.blockNumber+1n; //Cache last block number
         executeSql(sql, params);
         token_cost(data.toTokenId, data.to); //统计个人当前的token 值
         token_cost(data.fromTokenId, data.from); //统计个人当前的token 值
      }catch(e){console.log(e)}

   })
}

function eth2token()
{
   server1.daoapi.IADD.ETHToDaoToken(maxData[6],async obj => {
       if(process.env.IS_DEBUGGER==='1') console.log(obj);
       const {data}=obj
       let sql = "INSERT INTO t_e2t (block_num,from_address,to_address,in_amount,out_amount,swap_time,tran_hash,token_id,utoken_cost,swap_gas) VALUES(?,?,?,?,?,?,?,?,?,?)";
       try{
           let cost = await server1.daoapi.IADD.getPool(data.tokenId); // 流动池中 dao 的当前币值（utoken）
           let params = [obj.blockNumber, data['from'],  data['to'], data['input_amount'],data['output_amount'],data['swap_time'],obj.transactionHash,data.tokenId,cost,data['gas']];
           maxData[6] = obj.blockNumber+1n; //Cache last block number
           executeSql(sql, params);
           token_cost(data.tokenId, data.from); //统计个人当前的token 值
       }catch(e){console.error(e)}
   })
}

function eth2utoken()
{
   server1.daoapi.UnitToken.swapEvent(maxData[7], obj => {
       if(process.env.IS_DEBUGGER==='1') console.log(obj);
       const {data}=obj
       let sql = "call i_swap(?,?,?,?,?,?,?)";
       try{
           let params = [obj.blockNumber, data['address'], data['swap_time'], data['ethAmount'], data['utokenAmount'],obj.transactionHash,data['gas']];
           maxData[7] = obj.blockNumber+1n; //Cache last block number
           executeSql(sql, params);
       }catch(e){console.error(e)}
   })
}

// function setLogo()
// {
//    server1.daoapi.DaoLogo.setLogoEvent(maxData[1], obj => {
//        const {data}=obj
//        if(process.env.IS_DEBUGGER==='1') console.log(obj)
//        let sql = "call i_setlogo(?,?,?,?)";
//        try {
//          let params = [data['daoId'], obj.blockNumber, data['timestamp'], data['src']];
//          maxData[1] = obj.blockNumber+1n; //Cache last block number
//          executeSql(sql, params);
//       } catch (e) {console.error(e);}
//    })
// }

function changeLogo()
{
   server1.daoapi.DaoLogo.changeLogoEvent(maxData[2], obj => {
       if(process.env.IS_DEBUGGER==='1') console.log(obj)
     const {data}=obj
       let sql = "call i_changelogo(?,?,?,?,?)";
       try {
         let params = [data['daoId'], obj.blockNumber, data['_time'],data['logo_id'],data['src']];
         maxData[2] = obj.blockNumber+1n ;//Cache last block number
         executeSql(sql, params);
     } catch (e) {console.error(e);}
   })
}

function addLogoEvent()
{
   server1.daoapi.DaoLogo.addLogoEvent(maxData[12], (obj) => {
       if(process.env.IS_DEBUGGER==='1') console.log(obj)
     const {data}=obj
     let sql ="INSERT INTO t_addlogo(block_num,img_id,dao_id,_time,dao_logo) VALUES(?,?,?,?,?)";
     try {
         let params = [obj.blockNumber,data['img_id'],data['dao_id'],data['_time'],data['src']];
         maxData[12] = obj.blockNumber+1n;  //Cache last block number
         executeSql(sql, params); 
     } catch (e) {console.error(e);}
   });
}

function updateSCEvent()
{
   server1.daoapi.DaoRegistrar.updateSCEvent(maxData[21], (obj) => {
       if(process.env.IS_DEBUGGER==='1') console.log(obj)
     const {data}=obj
     let sql ="INSERT INTO t_updatedaocreator(block_num,dao_id,creator,_time) VALUES(?,?,?,?) ";
     try {
         let params = [obj.blockNumber,data['daoId'],data['newCreator'],data['timestamp']];
         maxData[21] = obj.blockNumber+1n;  //Cache last block number
         executeSql(sql, params); 
     } catch (e) {console.error(e);}
   });
}

function addCreatorCEvent()
{
   server1.daoapi.DaoRegistrar.addCreatorCEvent(maxData[1], (obj) => {
       if(process.env.IS_DEBUGGER==='1') console.log(obj)
     const {data}=obj
     let sql ="INSERT INTO t_createversion(block_num,dao_id,creator,dao_version,_time) VALUES(?,?,?,?,?) ";
     try {
         let params = [obj.blockNumber,data['daoId'],data['newCreator'],data['SC_Version'],data['timestamp']];
         maxData[1] = obj.blockNumber+1n;  //Cache last block number
         executeSql(sql, params); 
     } catch (e) {console.error(e);}
   });
}



function addProEvent()
{
   server1.daoapi.EventSum.addProposal(maxData[9],obj => {
       if(process.env.IS_DEBUGGER==='1') console.log(obj);
       const {data}=obj
       let sql = "call i_pro(?,?,?,?,?,?,?)";
       try{
         let params = [obj.blockNumber, data['delegator'],data['creator'],data['account'],data['dividendRights']
         ,data['_time'],data['dao_desc']]; //_time 是block 操作时间戳=createTime
         maxData[9] = obj.blockNumber+1n; //Cache last block number
         executeSql(sql, params);
      }catch(e){console.error(e)}
   })
}


function voteEvent()
{
   server1.daoapi.EventSum.voteEvent(maxData[10],obj => {
       if(process.env.IS_DEBUGGER==='1') console.log(obj);
       const {data}=obj
       let sql = "INSERT INTO t_provote(block_num,delegator,createTime,creator,antirights,rights,_time) VALUES(?,?,?,?,?,?,?)";
       try{
         let params = [obj.blockNumber, data['delegator'],data['createTime'],data['creator'],data['antirights'],data['rights'],data['_time']];
         maxData[10] = obj.blockNumber+1n; //Cache last block number
         executeSql(sql, params);
         let contract= new server1.web3.eth.Contract(daoabi, data['delegator'], { from: server1.account });
         contract.methods.proposal().call({ from: server1.account }).then(res=>{
            if(parseInt(res.createTime)===0) //Completed
               executeSql('update t_pro set is_end=1,rights=?,antirights=? where delegator=? and createTime=?',[res.rights,res.antirights,data['delegator'],data['createTime']])
            else
               executeSql('update t_pro set rights=?,antirights=? where delegator=? and createTime=?',[res.rights,res.antirights,data['delegator'],data['createTime']]);
         })
      }catch(e){console.error(e)}
   })
}


function execEvent()
{
   server1.daoapi.EventSum.execEvent(maxData[8], obj => {
       if(process.env.IS_DEBUGGER==='1') console.log(obj);
       const {data}=obj
       let sql = "INSERT INTO t_proexcu(block_num,delegator,account,dividendRights,_time) VALUES(?,?,?,?,?)";
       try{
         
         let params = [obj.blockNumber, data['delegator'],data['account'],data['dividendRights'],data['_time']];
         maxData[8] = obj.blockNumber+1n; //Cache last block number
         executeSql(sql, params);
         const flag=parseInt(data['dividendRights']);
         //Modify dao description / Modify dao manager
         if(flag===2 || flag===3 || data['account']==='0x0000000000000000000000000000000000000000')  
         {
            promisePool.query("select dao_id from t_dao where delegator=?",[data['delegator']]).then(rows=>{
                  if(rows.length && rows[0].length) {
                  const dao_id=rows[0][0].dao_id;
                  server1.daoapi.GetInfos.getDaoInfo(dao_id).then(res=>{
                  if(data['account']==='0x0000000000000000000000000000000000000000')
                     promisePool.execute('update t_dao set strategy=? where dao_id=?',[res[3],dao_id]).catch(err=>{console.error('[update t_dao ERROR] - ', err.message)});
                  else if(flag===2)
                     promisePool.execute('update t_dao set dao_desc=? where dao_id=?',[res[0]['desc'],dao_id]).catch(err=>{console.error('[update t_dao ERROR] - ', err.message)});
                  else if(flag===3 )
                     promisePool.execute('update t_dao set dao_manager=? where dao_id=?',[res[0]['manager'],dao_id]).catch(err=>{console.error('[update t_dao ERROR] - ', err.message)});
                  })  
               }
            }).catch(err=>{console.error('[select t_dao ERROR] - ', err.message)})         
         }
      }catch(e){console.error(e)}
   })
}


function getDividendEvent()
{
   server1.daoapi.EventSum.getDividendEvent(maxData[13],obj => {
       if(process.env.IS_DEBUGGER==='1') console.log(obj);
       const {data}=obj
       let sql = "INSERT INTO t_getdaoutoken(block_num,delegator,account,utoken_amount,_time,dao_owner,pre_time) VALUES(?,?,?,?,?,?,?)";
       try{
         let params = [obj.blockNumber, data['delegator'],data['account'],data['utoken_amount'],data['_time'],data['dao_owner'],data['pre_time']];
         maxData[13] = obj.blockNumber+1n; //Cache last block number
         executeSql(sql, params);
      }catch(e){console.error(e)}
   })
}


function accountDividendRight()
{
   server1.daoapi.EventSum.accountDividendRight(maxData[14],obj => {
       if(process.env.IS_DEBUGGER==='1') console.log(obj);
       const {data}=obj
       let sql = "call i_daoaccount(?,?,?,?)";
       try{
         let params = [obj.blockNumber, data['delegator'],data['account'],data['dividendRights']];
         maxData[14] = obj.blockNumber+1n; //Cache last block number
         executeSql(sql, params);
      }catch(e){console.error(e)}
   })
}


function nfttransfer()
{
   server1.daoapi.UnitNFT.transfer(maxData[20],async obj => {
       if(process.env.IS_DEBUGGER==='1') console.log(obj);
       const {data}=obj
       let tokenSvg=await server1.daoapi.UnitNFT.getTokenImageSvg(data['tokenId'])

       let sql = "INSERT INTO t_transfernft(block_num,token_id,token_to,tokensvg,_time) VALUES(?,?,?,?,?)";
       try{
         let params = [obj.blockNumber, data['tokenId'],data['to'],tokenSvg,data['timestamp']];
         maxData[20] = obj.blockNumber+1n; //Cache last block number
         executeSql(sql, params);
      }catch(e){console.error(e)}
   })
}


