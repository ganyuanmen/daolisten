const utils = require("../utils");
const abi=require('../abi/DAismDomain_abi.json');

class Domain
{
    RecordEvent(maxBlockNumber,callbackFun) {
        const _this = this;
        if (!this.contract) this.contract = new this.web3.eth.Contract(this.abi, this.address, { from: this.account });
        this.installobj=this.contract.events.Record({filter: {},fromBlock: maxBlockNumber});
        this.installobj.on('data', async function (data,_error) {
                if(!data || !data.returnValues) {utils.log("RecordEvent error:"+_error);throw _error;}
                callbackFun.call(null,utils.valueFactory(data,
                    {
                        "domain": data.returnValues.domain,
                        "daoId": data.returnValues._scId
                    })
                )
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

    constructor(_web3,_account,_address) {
        this.web3=_web3;
        this.account=_account;     
        this.address=_address;
        this.abi=abi
    }
}
module.exports=Domain