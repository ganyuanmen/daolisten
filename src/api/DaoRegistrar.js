const utils = require("../utils");
const abi=require('../abi/SCRegistrar_abi.json');

//dao注册事件
class DaoRegistrar
{
    //dao 注册事件
    daoCreateEvent(maxBlockNumber,callbackFun) {
        const _this = this;
        if (!this.contract) this.contract = new this.web3.eth.Contract(this.abi, this.address);
        this.installobj=this.contract.events.CreateSC({filter: {},fromBlock: maxBlockNumber});
        this.installobj.on('data', async function (data,_error) {
                if(!data || !data.returnValues) {utils.log("daoCreateEvent error:"+_error);throw _error;}
                _this.har.push({fn:callbackFun,data:utils.valueFactory(data,{
                    "daoId": data['returnValues']['SC_id'],
                    })
                })
            }
        )
    }

     //dao 注册事件
     updateSCEvent(maxBlockNumber,callbackFun) {
        const _this = this;
        if (!this.contract) this.contract = new this.web3.eth.Contract(this.abi, this.address);
        this.installobj=this.contract.events.UpdateSC({filter: {},fromBlock: maxBlockNumber});
        this.installobj.on('data', async function (data,_error) {
                if(!data || !data.returnValues) {utils.log("daoCreateEvent error:"+_error);throw _error;}
                _this.daotoken.har.push({fn:callbackFun,data:utils.valueFactory(data,{
                    "daoId": data['returnValues']['SC_id'],
                    "newCreator": data['returnValues']['newCreator']
                    })
                 })
            }
        )
    }


   unsub()
   {
       try{
           if(this.installobj && this.installobj.unsubscribe) {this.installobj.unsubscribe();}
           this.installobj=null;
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