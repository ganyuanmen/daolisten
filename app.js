const Web3 = require('web3')
const Daoapi = require("./src/index")
var mysql = require('mysql');
const schedule =require("node-schedule");
const configObj = require('./config/mysql_config.json');
const {host,user,password,port,network,database,debugger_level} = configObj;
console.log([host,user,password,port,network,database,debugger_level])

const start_block=4009975
var monitor = 0; //每10分钟重启一次
var web3; 
var selectAcouunt = '0x43Bf444eDBcA3d95656f0c11b4174b95A82B98AE'; //启动者钱包地址
var daoapi;   //api 包
var pool; // 连接池
var maxData = []; // 记录已监听的最区块号

async function daoListenStart() {
  try{
    monitor = 0;
    if (daoapi && daoapi.unsub) {daoapi.unsub()}
    if (web3 && web3.currentProvider && web3.currentProvider.close) {await web3.currentProvider.close();}
    delete daoapi
    delete web3
    web3 = await new Web3(`wss://${network}.infura.io/ws/v3/9676a35d629d488fb90d7eac1348c838`);
    daoapi = new Daoapi(web3, selectAcouunt,network);
    daoListen();
  }catch(e){console.error('运行错误',e);
    monitor=1000; 
  }
}

//处理监听
function hand() {
  //创建mysql连接池
     pool = mysql.createPool({connectionLimit:1,host,user,password,database,port});
    //从数据库获取需要监听的最大区块号
    let sql = 'SELECT IFNULL(MAX(block_num),0) s FROM t_dao'  //0 
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_setlogo'  //1
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_changelogo' //2
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_token'  //3
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_u2t'  //4
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_t2u'  //5
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_e2t'  //6
        + ' union all SELECT IFNULL(MAX(block_num),0) FROM t_eth_utoken' //7
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_gastoken_utoken'  //8
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_proexcu'  //9
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_app'  //10
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_appversion'  //11
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_appinstall'  //12
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_daoversion'  //13
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_setaccount'  //14
        + ' UNION ALL SELECT IFNULL(MAX(block_num),0) FROM t_t2t' ; //15

    pool.getConnection(function(err, conn){
        if(err) throw err;
        conn.query(sql, function (error, results) {
            if(debugger_level==='0') console.log(results);
            if (error) throw error;
            maxData = [];
            //缓存最大区块号
            results.forEach(element => {maxData.push(element.s>start_block?element.s:start_block)});
            console.log(maxData)
            p("start...........")
            daoListenStart();  //监听
            
            //1分钟循环执行
            schedule.scheduleJob("5 * * * * *",async() => {
                        if (monitor > 10) daoListenStart();
                        monitor++;  
                });
        });
        conn.release();
    }); 
}


//监听
function daoListen() {

  daoCreate() //创建dao事件处理
  publishTolen()  // dao发布token事件
  //以下的监听需要dao条件下才能处理，所以延迟监听
  setTimeout(() => listen_attach(), 5000);     //5
  //延迟监听兑换，需要处理前期事件
  setTimeout(() => listen_swap(),8000);  //8
  updateVersion()  //升级
  // transfer()  // 转帐
}

function listen_swap()
{
  utoken2token()  //u2t token 兑换 token 事件
  token2utoken()  //t2u token 兑换 utoken 事件
  token2token() //t2t token 兑换 token 
  eth2token() //eth to token eth 兑换 token
  eth2utoken() //eth to utoken eth 兑换 utoken
  gastoken2utoken() //GasToken to utoken 
}

function listen_attach()
{
  setLogo()   //setlogo 创建dao logo 事件
  changeLogo() //chanelogo 修改 dao logo 事件
  appInstall()  //app install 事件处理
  execEvent()   //execEvent 执行提案事件
  setAccount()  //添加/删除成员
  appAdd()  //appadd 登记app 地址事件
  //appUpdateVersion() // 登记app 版本事件
}


// 开始监听
hand();

//统计个人当前的token 值
function token_cost(id, address) {
    daoapi.DaoToken.balanceOf(id, address).then(e => {
        let sql = "CALL excuteToken(?,?,?)";
        let params = [id, address, e];
        executeSql(sql, params);
    })
  }


  //mysql 处理
  function executeSql(addSql, addSqlParams) {
    pool.getConnection(function(err, conn){
      if(err){console.error("getConnection error"); return;}
      conn.query(addSql, addSqlParams, function (err, result) {
          if (err) {console.error('[INSERT ERROR] - ', err.message);return;}
      });
      conn.release();
   });

}

//屏幕打印
function p(str) {
  let myDate = new Date();
  console.log(myDate.getFullYear() + '-' + (myDate.getMonth() + 1) + '-' + myDate.getDate() + ' ' + myDate.getHours() + ":" + myDate.getMinutes() + ":" + myDate.getSeconds() + "-->" + str)
}

 
//----------------------------------------------------------------------------

function updateVersion()
{
   daoapi.ProxyAdmin.updateVersion(maxData[13], (obj) => {
        const {data}=obj
        if(debugger_level==='0') console.log(obj);
        let sql = "INSERT INTO t_daoversion(block_num,version_num,version_time) VALUES(?,?,?)";
        try {
            let params = [obj.blockNumber,data['version'],data['time']];
            maxData[13] = obj.blockNumber ; //缓存最后区块号
            executeSql(sql, params);
        } catch (e) {console.error(e);}
   });
}

function daoCreate()
{
   daoapi.DaoRegistrar.daoCreateEvent(maxData[0], (obj) => {
       if(debugger_level==='0') console.log(obj)
       const {data}=obj
       let sql ="call i_dao(?,?,?,?,?,?,?,?,?,?)";
       try {
           let params = [data['daoId'],obj.blockNumber,data['name'],data['symbol'],data['describe'],data['manager']
           ,data['time'],data['address'],data['creator'],data['delegator']];
           maxData[0] = obj.blockNumber;  //缓存最后区块号
           executeSql(sql, params); //dao 信息
           for(let i=0;i<data['accounts_votes'].length;i++)
           {
               sql="call i_daodetail(?,?,?,?)"
               params=[data['daoId'],data['accounts_votes'][i]['account'],data['accounts_votes'][i]['vote'],data['accounts_votes'][i]['memberIndex']]
               executeSql(sql, params); //成员及票权信息
           }
       } catch (e) {console.error(e);}
   });
}

function publishTolen()
{
   daoapi.DaoToken.publishTokenEvent(maxData[3], obj => {
       const {data}=obj
       if(debugger_level==='0') console.log(obj);
       let sql = "call i_token(?,?,?,?)";
       try {
           let params = [data['daoId'],data['tokenId'],obj.blockNumber, data['timestamp']];
           maxData[3] = obj.blockNumber ; //缓存最后区块号
           executeSql(sql, params);
       } catch (e) {console.error(e);}
   })
}

function utoken2token()
{
   daoapi.IADD.utokenTotokenEvent(maxData[4], async obj => {
       if(debugger_level==='0') console.log(obj);
       const {data}=obj
       let sql = "call i_u2t(?,?,?,?,?,?,?,?,?,?)";
       try{
         let cost = await daoapi.IADD.getPool(data.tokenId); // 流动池中 dao 的当前币值（utoken）
         let params = [obj.blockNumber, data['tokenId'], cost, data['from'], data['to'], data['utoken'], data['token'], data['swap_time'],obj.transactionHash,data['gas']];
         maxData[4] = obj.blockNumber; //缓存最后区块号
         executeSql(sql, params);
         token_cost(data.tokenId, data.to); //统计个人当前的token 值
       }catch(e){console.error(e)}
   })
}

function token2utoken()
{
   daoapi.IADD.tokenToUtokenEvent(maxData[5], async obj => {
       if(debugger_level==='0') console.log(obj);
       const {data}=obj
       let sql = "call i_t2u(?,?,?,?,?,?,?,?,?,?)";
       try{
        let cost = await daoapi.IADD.getPool(data.tokenId);// 流动池中 dao 的当前币值（utoken）
         let params = [obj.blockNumber, data['tokenId'], cost, data['from'], data['to'], data['utoken'], data['token'], data['swap_time'],obj.transactionHash,data['gas']];
         maxData[5] = obj.blockNumber; //缓存最后区块号
         executeSql(sql, params);
         token_cost(data.tokenId, data.from);  //统计个人当前的token 值
       }catch(e){console.error(e)}
   })
}

function token2token()
{
   daoapi.IADD.tokenTotokenEvent(maxData[15], async obj => {
      if(debugger_level==='0') console.log(obj);
      const {data}=obj
      let sql = "call i_t2t(?,?,?,?,?,?,?,?,?,?,?,?)";
      try{
         let cost1 = await daoapi.IADD.getPool(data.fromTokenId); // 流动池中 dao 的当前币值（utoken）
         let cost2 = await daoapi.IADD.getPool(data.toTokenId);// 流动池中 dao 的当前币值（utoken）
         let params = [obj.blockNumber, data.fromTokenId, data.toTokenId, cost1, cost2, data.from, data.to, data.fromToken, data.toToken, data.swap_time,obj.transactionHash,data.gas];
         maxData[15] = obj.blockNumber; //缓存最后区块号
         executeSql(sql, params);
         token_cost(data.toTokenId, data.to); //统计个人当前的token 值
         token_cost(data.fromTokenId, data.from); //统计个人当前的token 值
      }catch(e){console.log(e)}

   })
}

function eth2token()
{
   daoapi.IADD.ETHToDaoToken(maxData[6],async obj => {
       if(debugger_level==='0') console.log(obj);
       const {data}=obj
       let sql = "INSERT INTO t_e2t (block_num,from_address,to_address,in_amount,out_amount,swap_time,tran_hash,token_id,utoken_cost,swap_gas) VALUES(?,?,?,?,?,?,?,?,?,?)";
       try{
           let cost = await daoapi.IADD.getPool(data.tokenId); // 流动池中 dao 的当前币值（utoken）
           let params = [obj.blockNumber, data['from'],  data['to'], data['input_amount'],data['output_amount'],data['swap_time'],obj.transactionHash,data.tokenId,cost,data['gas']];
           maxData[6] = obj.blockNumber; //缓存最后区块号
           executeSql(sql, params);
           token_cost(data.tokenId, data.from); //统计个人当前的token 值
       }catch(e){console.error(e)}
   })
}

function eth2utoken()
{
   daoapi.UnitToken.swapEvent(maxData[7], obj => {
       if(debugger_level==='0') console.log(obj);
       const {data}=obj
       let sql = "call i_swap(?,?,?,?,?,?,?)";
       try{
           let params = [obj.blockNumber, data['address'], data['swapTime'], data['ethAmount'], data['utokenAmount'],obj.transactionHash,data['gas']];
           maxData[7] = obj.blockNumber; //缓存最后区块号
           executeSql(sql, params);
       }catch(e){console.error(e)}
   })
}

function gastoken2utoken()
{
   daoapi.UnitToken.swapByGasToken(maxData[8], obj => {
       if(debugger_level==='0') console.log(obj);
       const {data}=obj
       let sql = "call i_swapdeth(?,?,?,?,?,?,?)";
       try{
           let params = [obj.blockNumber, data['fromAddress'], data['swapTime'], data['ethAmount'], data['utokenAmount'], data['toAddress'],obj.transactionHash];
           maxData[8] = obj.blockNumber; //缓存最后区块号
           executeSql(sql, params);
       }catch(e){console.error(e)}
   })      
}

function setLogo()
{
   daoapi.DaoLogo.setLogoEvent(maxData[1], obj => {
       const {data}=obj
       if(debugger_level==='0') console.log(obj)
       let sql = "call i_setlogo(?,?,?,?)";
       try {
         let params = [data['daoId'], obj.blockNumber, data['timestamp'], data['src']];
         maxData[1] = obj.blockNumber; //缓存最后区块号
         executeSql(sql, params);
      } catch (e) {console.error(e);}
   })
}

function changeLogo()
{
   daoapi.DaoLogo.changeLogoEvent(maxData[2], obj => {
       if(debugger_level==='0') console.log(obj)
     const {data}=obj
       let sql = "call i_changelogo(?,?,?,?)";
       try {
         let params = [data['daoId'], obj.blockNumber, data['timestamp'], data['src']];
         maxData[2] = obj.blockNumber ;//缓存最后区块号
         executeSql(sql, params);
     } catch (e) {console.error(e);}
   })
}

function appInstall()
{
   daoapi.DaoPluginManage.installEvent(maxData[12], (obj) => {
       if(debugger_level==='0') console.log(obj)
     const {data}=obj
     let sql ="INSERT INTO t_appinstall(block_num,dao_id,delegate_id,app_type,app_id,app_version,install_address,install_time) VALUES(?,?,?,?,?,?,?,?)";
     try {
         let params = [obj.blockNumber,data['dao_id'],data['delegate_id'],1,data['app_id'],data['app_version'],data['install_address'],data['install_time']];
         maxData[12] = obj.blockNumber;  //缓存最后区块号
         executeSql(sql, params); //dao 信息
     } catch (e) {console.error(e);}
   });
}

function execEvent()
{
   daoapi.EventSum.execEvent(maxData[9],obj => {
       if(debugger_level==='0') console.log(obj);
       const {data}=obj
       let sql = "CALL excu_pro(?,?,?,?)";
       try{
         
         let params = [obj.blockNumber, data['proHash'],data['address'], data['time']];
         maxData[9] = obj.blockNumber; //缓存最后区块号
         executeSql(sql, params);
      }catch(e){console.error(e)}
   })
}


function setAccount()
{
   daoapi.EventSum.setAccount(maxData[14],obj => {
       if(debugger_level==='0') console.log(obj);
       const {data}=obj
       let sql = "INSERT INTO t_setaccount(block_num,set_time,set_address,set_vote,set_index,set_delegate) VALUES(?,?,?,?,?,?)";
       try{
         let params = [obj.blockNumber, data['time'],data['account'],data['vote'],data['index'],data['delegator']];
         maxData[14] = obj.blockNumber; //缓存最后区块号
         executeSql(sql, params);
      }catch(e){console.error(e)}
   })
}

function appAdd()
{
   daoapi.App.addAppEvent(maxData[10], async (obj) => {
       if(debugger_level==='0') console.log(obj);
     const {data}=obj
     let sql ="call i_app(?,?,?,?,?,?,?,?,?,?)";
     try {
         let params = [obj.blockNumber,data['name'],data['app_id'],data['version'],data['desc'],data['appAddress']
         ,data['manager'],data['time'],data['ver_desc'],data['software_type']];
         maxData[10] = obj.blockNumber; //缓存最后区块号
         executeSql(sql, params);
     } catch (e) {console.error(e);}
   });
}

function appUpdateVersion()
{
   daoapi.App.addVersionEvent(maxData[11], async (obj) => {
       console.log(obj);
       const {data}=obj
       let sql ="call i_app(?,?,?,?,?,?,?,?,?,?)";
       try {
           let params = [obj.blockNumber,data['name'],data['index'],data['version'],data['desc'],data['appAddress']
           ,data['manager'],data['time'],data['ver_desc'],data['software_type']];
           maxData[10] = obj.blockNumber; //缓存最后区块号
           executeSql(sql, params);
       } catch (e) {console.error(e);}
   });
}



function transfer()
{
   daoapi.UnitToken.transfer(0, async (obj) => {
      //  console.log(obj);
      //  const {data}=obj
      //  let sql ="call i_app(?,?,?,?,?,?,?,?,?,?)";
      //  try {
      //      let params = [obj.blockNumber,data['name'],data['index'],data['version'],data['desc'],data['appAddress']
      //      ,data['manager'],data['time'],data['ver_desc'],data['software_type']];
      //      maxData[10] = obj.blockNumber; //缓存最后区块号
      //      executeSql(sql, params);
      //  } catch (e) {console.error(e);}
   });
}



