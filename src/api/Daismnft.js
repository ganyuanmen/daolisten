const utils = require("../utils");
const abi=require('../abi/DAismNFT_abi.json');

class Daismnft
{
    mintWithSvgTemplateAndTips(maxBlockNumber,callbackFun) {
        const _this = this;
        if (!this.contract) this.contract = new this.web3.eth.Contract(this.abi, this.address);
        this.installobj1=this.contract.events.MintWithSvgTemplateAndTips({filter: {},fromBlock: maxBlockNumber});
        this.installobj1
        .on('data', async function (data,_error) {
                if(!data || !data.returnValues) {utils.log("MintWithSvgTemplateAndTips error:"+_error);throw _error;}
                _this.daotoken.har.push({fn:callbackFun,data:utils.valueFactory(data,{
                    "daoId": data.returnValues._scId,
                    "to": data.returnValues.to,
                    "tokenId": data.returnValues.tokenId,
                    "templateId": data.returnValues.templateId,
                    "isPublic": data.returnValues.isPublic,
                    "isTemplate": data.returnValues.isTemplate
                    })
                 })
            }
        )
    }

    mintWithSvgTemplateId(maxBlockNumber,callbackFun) {
        const _this = this;
        if (!this.contract) this.contract = new this.web3.eth.Contract(this.abi, this.address);
        this.installobj2=this.contract.events.MintWithSvgTemplateId({filter: {},fromBlock: maxBlockNumber});
        this.installobj2
        .on('data', async function (data,_error) {
                if(!data || !data.returnValues) {utils.log("MintWithSvgTemplateId error:"+_error);throw _error;}
                _this.daotoken.har.push({fn:callbackFun,data:utils.valueFactory(data,{
                    "daoId": data.returnValues._scId,
                        "to": data.returnValues.to,
                        "tokenId": data.returnValues.tokenId,
                        "templateId": data.returnValues.templateId
                    })
                 })

            }
        )
    }
    
    mintWithSvgTokenId(maxBlockNumber,callbackFun) {
        const _this = this;
        if (!this.contract) this.contract = new this.web3.eth.Contract(this.abi, this.address);
        this.installobj3=this.contract.events.MintWithSvgTokenId({filter: {},fromBlock: maxBlockNumber});
        this.installobj3
        .on('data', async function (data,_error) {
                if(!data || !data.returnValues) {utils.log("MintWithSvgTokenId error:"+_error);throw _error;}
                _this.daotoken.har.push({fn:callbackFun,data:utils.valueFactory(data,{
                    "daoId": data.returnValues._scId,
                    "to": data.returnValues.to,
                    "tokenId": data.returnValues.tokenId
                    })
                 })

            
            }
        )
    }
    mintWithSvgTips(maxBlockNumber,callbackFun) {
        const _this = this;
        if (!this.contract) this.contract = new this.web3.eth.Contract(this.abi, this.address);
        this.installobj4=this.contract.events.MintWithSvgTips({filter: {},fromBlock: maxBlockNumber});
        this.installobj4
        .on('data', async function (data,_error) {
                if(!data || !data.returnValues) {utils.log("MintWithSvgTips error:"+_error);throw _error;}
                _this.daotoken.har.push({fn:callbackFun,data:utils.valueFactory(data,{
                    "tokenId": data.returnValues.tokenId,
                    "templateId": data.returnValues.templateId
                    })
                 })
            }
        )
    }

    async getTokenImageSvg(_id) {
        if (!this.contract) this.contract = new this.web3.eth.Contract(this.abi, this.address);
        let res= await this.contract.methods.getTokenImageSvg(_id).call({ from: this.account })
       return res
    }

    async getSvgTemplate(_id) {
        if (!this.contract) this.contract = new this.web3.eth.Contract(this.abi, this.address);
        let res= await this.contract.methods.getSvgTemplate(_id).call({ from: this.account })
       return res
    }

   unsub()
   {
       try{
           if(this.installobj1 && this.installobj1.unsubscribe) {this.installobj1.unsubscribe();}
           this.installobj1=null;
           if(this.installobj2 && this.installobj2.unsubscribe) {this.installobj2.unsubscribe();}
           this.installobj2=null;
           if(this.installobj3 && this.installobj3.unsubscribe) {this.installobj3.unsubscribe();}
           this.installobj3=null;
           if(this.installobj4 && this.installobj4.unsubscribe) {this.installobj4.unsubscribe();}
           this.installobj4=null;

       } catch(e){console.error(e);}
   }

    constructor(_web3,_account,_address,_daotoken) {
        this.web3=_web3;
        this.account=_account;     
        this.address=_address;
        this.abi=abi
        this.daotoken=_daotoken
    }
}
module.exports=Daismnft