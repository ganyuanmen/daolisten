const utils = require("../utils");
const eventSum_abi=require('../abi/EventHappenAddress_abi');

 //执行提案事件
class EventSum
{
   //执行提案事件
    async  execEvent(maxBlockNumber,callbackFun) {
        const _this = this;
        if (!this.contract) this.contract = new this.web3.eth.Contract(this.abi, this.address, {from: this.account});
        this.execobj=this.contract.events.Exec({filter: {}, fromBlock: maxBlockNumber+1}, 
            async function (_error, data) {
                if(!data || !data.returnValues) {utils.log("execEvent error");throw _error;}
                callbackFun.call(null,utils.valueFactory(data,
                    {
                        "proHash": data.returnValues['_hash'], //提案hash
                        "voteDel":data.returnValues['system_delegator'], //代理地址
                        "address":await utils.getAccount(_this.web3,data.transactionHash), //执行人
                        "time":await utils.getTime(_this.web3,data.blockNumber) //时间戳
                    },
                    "execEvent")
                )
            }
        )
    }

     //执行提案事件
     async  setAccount(maxBlockNumber,callbackFun) {
        const _this = this;
        if (!this.contract) this.contract = new this.web3.eth.Contract(this.abi, this.address, {from: this.account});
        this.execobj=this.contract.events.SetAccount({filter: {}, fromBlock: maxBlockNumber+1}, 
            async function (_error, data) {
                if(!data || !data.returnValues) {utils.log("execEvent error");throw _error;}
                callbackFun.call(null,utils.valueFactory(data,
                    {
                        "delegator": data.returnValues['system_delegator'], 
                        "index":data.returnValues['index'], 
                        "account":data.returnValues['_account'], 
                        "vote":data.returnValues['_vote'], 
                        "time":await utils.getTime(_this.web3,data.blockNumber) //时间戳
                    },
                    "SetAccount")
                )
            }
        )
    }


    //取消订阅
    unsub()
    {
        try{
            if(this.execobj && this.execobj.unsubscribe){this.execobj.unsubscribe();}
            this.execobj=null;
        } catch(e){console.error(e);}
    }
    constructor(_web3,_account,_address) {
        this.web3=_web3;
        this.account=_account;
        this.address=_address;
        this.abi=eventSum_abi.abi
    }
}

module.exports=EventSum