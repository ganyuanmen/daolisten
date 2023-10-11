const iadd_abi=require('../abi/_IADD_abi');
const utils = require("../utils");
const ethers=require('ethers')
/**
 * IADD 兑换事件
 */
class IADD
{
    get eventIface()
    {
        if(!this.iface) this.iface = new  ethers.Interface(iadd_abi.abi)
        return this.iface
    }
        //utoken 兑换 token事件 
    utokenTotokenEvent(maxBlockNumber,callbackFun) {
        const _this = this;
        if (!this.contract) this.contract = new this.web3.eth.Contract(this.abi, this.address, {from: this.account});
        this.u2tObj=this.contract.events.UnitTokenToDaoToken({filter: {},fromBlock: maxBlockNumber+1},
            async function (_error, data) {
                if(!data || !data.returnValues) {utils.log("utokenTotokenEvent error");throw _error;}
                
                let eventData=await utils.getCheckEvent(_this.ethersProvider,_this.eventIface,'ETHToDaoToken', data.transactionHash)    
                if(!eventData.isOk) eventData=await utils.getCheckEvent(_this.ethersProvider,_this.eventIface,'DaoTokenToDaoToken', data.transactionHash)    
                if(!eventData.isOk)
                callbackFun.call(null,utils.valueFactory(data,{
                        "from": data.returnValues.spender, //兑换人
                        "to": data.returnValues.to, //目标人
                        "swap_time":await utils.getTime(_this.web3,data.blockNumber), //兑换时间戳
                        "tokenId":data.returnValues.id,
                        "utokenWei":data.returnValues.input_amount,
                        "tokenWei":data.returnValues.output_amount,
                        "utoken":(parseFloat(_this.web3.utils.fromWei(data.returnValues.input_amount,'ether'))/(998/1000)).toFixed(6),
                        "gas":await utils.gas(_this.web3,data.transactionHash),
                        "token":parseFloat(_this.web3.utils.fromWei(data.returnValues.output_amount,'ether')).toFixed(6)
                    },
                    "utokenTotokenEvent")
                )
            }
        )
    }

    //token 兑换 utoken
    tokenToUtokenEvent(maxBlockNumber,callbackFun) {
        const _this = this;
        if (!this.contract) this.contract = new this.web3.eth.Contract(this.abi, this.address, {from: this.account});
        this.t2uObj=this.contract.events.DaoTokenToUnitToken({filter: {}, fromBlock: maxBlockNumber+1}, 
            async function (_error, data) {  
                if(!data || !data.returnValues) {utils.log("tokenToUtokenEvent error");throw _error;}   
                let eventData=await utils.getCheckEvent(_this.ethersProvider,_this.eventIface,'DaoTokenToDaoToken', data.transactionHash)    
                if(!eventData.isOk)
                    callbackFun.call(null,utils.valueFactory(data,
                        {
                            "from": data.returnValues.spender,
                            "to": data.returnValues.to,
                            "swap_time":await utils.getTime(_this.web3,data.blockNumber),
                            "tokenId":data.returnValues.id,
                            "utokenWei":data.returnValues.output_amount,
                            "tokenWei":data.returnValues.input_amount,
                            "utoken":parseFloat(_this.web3.utils.fromWei(data.returnValues.output_amount,'ether')).toFixed(6),
                            "token":parseFloat(_this.web3.utils.fromWei(data.returnValues.input_amount,'ether')).toFixed(6),
                            "gas":eventData.gasUsed
                        },
                        "tokenToUtokenEvent")
                    )
            }
        )
    }

     //token 兑换 token
     tokenTotokenEvent(maxBlockNumber,callbackFun) {
        const _this = this;
        if (!this.contract) this.contract = new this.web3.eth.Contract(this.abi, this.address, {from: this.account});
        this.t2uObj=this.contract.events.DaoTokenToDaoToken({filter: {}, fromBlock: maxBlockNumber+1}, 
            async function (_error, data) {  
                if(!data || !data.returnValues) {utils.log("tokenTotokenEvent error");throw _error;}   
            
                callbackFun.call(null,utils.valueFactory(data,
                    {
                        "from": data.returnValues.spender,
                        "to": data.returnValues.to,
                        "swap_time":await utils.getTime(_this.web3,data.blockNumber),
                        "fromTokenId":data.returnValues.id_A,
                        "toTokenId":data.returnValues.id_B,
                        "fromtokenWei":data.returnValues.input_amount,
                        "toTokenWei":data.returnValues.output_amount,
                        "fromToken":parseFloat(_this.web3.utils.fromWei(data.returnValues.input_amount,'ether')).toFixed(6),
                        "toToken":parseFloat(_this.web3.utils.fromWei(data.returnValues.output_amount,'ether')).toFixed(6),
                        "gas":await utils.gas(_this.web3,data.transactionHash)
                    },
                    "tokenTotokenEvent")
                )
            }
        )
    }

    //eth 兑换 token 同时触发eth to utoken  和utoken to token 事件
    ETHToDaoToken(maxBlockNumber,callbackFun) {
        const _this = this;
        if (!this.contract) this.contract = new this.web3.eth.Contract(this.abi, this.address, {from: this.account});
        this.t2tObj=this.ethtotokenObj=this.contract.events.ETHToDaoToken({filter: {}, fromBlock: maxBlockNumber+1},
            async function (_error, data) {  
                if(!data || !data.returnValues) {utils.log("ETHToDaoToken error");throw _error;}   
                callbackFun.call(null,utils.valueFactory(data, 
                    {
                        "from": data.returnValues.spender,
                        "to": data.returnValues.to,
                        "tokenId":data.returnValues.id,
                        "swap_time":await utils.getTime(_this.web3,data.blockNumber),
                        "input_amount":parseFloat(_this.web3.utils.fromWei(data.returnValues.input_amount,'ether')).toFixed(6),
                        "output_amount":parseFloat(_this.web3.utils.fromWei(data.returnValues.output_amount,'ether')).toFixed(6),
                        "gas":await utils.gas(_this.web3,data.transactionHash)
                    },
                    "ETHToDaoToken")
                )
            }
        )
    }

    // //取消后置0
    // getReal(v){
    //     var b=v.split('');
    //     for(var i=1;i<b.length;i++)
    //          {
    //              if(b[i]!='0')
    //              break               
    //          }
    //     return v.substr(i);

    // }

    //获dao流动池中的币值(utoken)
    async getPool(_id) {
        if(!this.contract)  this.contract=new this.web3.eth.Contract(this.abi,this.address , {from: this.account});
        let result= await this.contract.methods.pools(_id).call({from: this.account});
        let utoken= this.web3.utils.fromWei(result.unit_token_supply,'ether')
        let token= this.web3.utils.fromWei(result.eip3712_supply,'ether')
        let u=(parseFloat(utoken)/parseFloat(token)-0.01).toFixed(6)
        return u
    
    }
       
    //取消订阅
    unsub()
    {
        try{
            if(this.u2tObj && this.u2tObj.unsubscribe){this.u2tObj.unsubscribe();}
            if(this.t2uObj && this.t2uObj.unsubscribe){this.t2uObj.unsubscribe();}
            if(this.t2tObj && this.t2tObj.unsubscribe){this.t2tObj.unsubscribe();}
            if(this.ethtotokenObj && this.ethtotokenObj.unsubscribe){this.ethtotokenObj.unsubscribe();}
            
            this.u2tObj=null;this.t2uObj=null;this.t2tObj=null;
        }catch(e){console.error(e);}
    }

    constructor(_web3,_account,_address,_ethersProvider) {
        this.web3=_web3;
        this.account=_account;
        this.address=_address;
        this.abi=iadd_abi.abi
        this.ethersProvider=_ethersProvider
       }
   }
   
   module.exports=IADD