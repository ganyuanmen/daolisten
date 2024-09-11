const { ethers } = require('ethers');

// 连接到一个以太坊节点
const provider = new ethers.JsonRpcProvider('https://holesky.infura.io/v3/982d49c829f4428db93d5a077085d995');

// 创建一个钱包实例
const wallet = new ethers.Wallet('86052468765597c797daff2d28c80378e01a38dc371a6817c2ef458a5a213183', provider);

async function transfer() {
    const tx = {
        to: '0xE305eE6dc9E7fF21aDb2e204ffDEE7d05036C1a6',
        value: ethers.parseEther('1.0') // 转账金额，以以太为单位
    };

    const txResponse = await wallet.sendTransaction(tx);
    await txResponse.wait(); // 等待交易确认

    console.log('Transaction hash:', txResponse.hash);
}

transfer();
