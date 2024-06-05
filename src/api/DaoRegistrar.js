const utils = require("../utils");
const abi=require('../abi/SCRegistrar_abi.json');

//dao注册事件
class DaoRegistrar
{
    //dao 注册事件
    daoCreateEvent(maxBlockNumber,callbackFun) {
        const _this = this;
        if (!this.contract) this.contract = new this.web3.eth.Contract(this.abi, this.address);
        this.installobj1=this.contract.events.CreateSC({filter: {},fromBlock: maxBlockNumber});
        this.installobj1.on('data', async function (data,_error) {
                if(!data || !data.returnValues) {utils.log("daoCreateEvent error:"+_error);throw _error;}
                _this.har.push({fn:callbackFun,data:utils.valueFactory(data,{
                    "daoId": data['returnValues']['SC_id'],
                    })
                })
            }
        )
    }

     //dao 修改dapp 地址
     updateSCEvent(maxBlockNumber,callbackFun) {
        const _this = this;
        if (!this.contract) this.contract = new this.web3.eth.Contract(this.abi, this.address);
        this.installobj2=this.contract.events.UpdateSC({filter: {},fromBlock: maxBlockNumber});
        this.installobj2.on('data', async function (data,_error) {
                if(!data || !data.returnValues) {utils.log("daoCreateEvent error:"+_error);throw _error;}
                _this.daotoken.har.push({fn:callbackFun,data:utils.valueFactory(data,{
                    "daoId": data['returnValues']['SC_id'],
                    "newCreator": data['returnValues']['newCreator']
                    })
                 })
            }
        )
    }

     //dapp 地址对应 版本号
     addCreatorCEvent(maxBlockNumber,callbackFun) {
        const _this = this;
        if (!this.contract) this.contract = new this.web3.eth.Contract(this.abi, this.address);
        this.installobj3=this.contract.events.AddCreator({filter: {},fromBlock: maxBlockNumber});
        this.installobj3.on('data', async function (data,_error) {
                if(!data || !data.returnValues) {utils.log("daoCreateEvent error:"+_error);throw _error;}
                _this.daotoken.har.push({fn:callbackFun,data:utils.valueFactory(data,{
                    "daoId": data['returnValues']['SC_id'],
                    "SC_Version": data['returnValues']['SC_Version'],
                    "newCreator": data['returnValues']['newCreator']
                    })
                 })
            }
        )
    }


   unsub()
   {
       try{
           if(this.installobj1 && this.installobj1.unsubscribe) {this.installobj1.unsubscribe();}
           if(this.installobj2 && this.installobj2.unsubscribe) {this.installobj2.unsubscribe();}
           if(this.installobj3 && this.installobj3.unsubscribe) {this.installobj3.unsubscribe();}
           this.installobj1=null;this.installobj2=null;this.installobj3=null;
       } catch(e){console.error(e);}
   }

    constructor(_web3,_address,_daotoken) {
        this.web3=_web3;
        this.address=_address;
        this.abi=abi
        this.har=[]
        this.daotoken=_daotoken
    }
}
module.exports=DaoRegistrar