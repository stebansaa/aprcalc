const Web3 = require('web3');
const web3 = new Web3('https://api.evm.eosnetwork.com');

const erc20TokenAddressA = '0xf8c36fcDaf58B077d102400B88d1b7B1917e0987';
const erc20TokenAddressB = '0xc00592aa41d32d137dc480d9f6d0df19b860104f';
const lpAddress = '0xa977efdb6dd8818274215ca172772d3297c253c0';
const targetContractAddress = '0x4541c5502e6D1b66edF515950A2c6a96331e575E';
const farm = '0x4541c5502e6D1b66edF515950A2c6a96331e575E';

// is 10k in 14 days. not 9K unless we change it. 
// 714.285714286
const yieldPerDay = 714.28; 
const ercAprice = 1;
const ercBprice = 0.36;

const ercABI = [
  // standard ERC20 ABI
  {
    "inputs": [],
    "name": "name",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];


const LP_CONTRACT_ABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "getReserves",
    "outputs": [
      {
        "internalType": "uint112",
        "name": "_reserve0",
        "type": "uint112"
      },
      {
        "internalType": "uint112",
        "name": "_reserve1",
        "type": "uint112"
      },
      {
        "internalType": "uint32",
        "name": "_blockTimestampLast",
        "type": "uint32"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];


async function getERC20TokenBalanceInContract(tokenAddress) {
  const erc20Contract = new web3.eth.Contract(ercABI, tokenAddress);
  const balance = await erc20Contract.methods.balanceOf(lpAddress).call();
  const balanceInEther = web3.utils.fromWei(balance, 'ether');
  //console.log(`ERC20 Balance: ${balanceInEther}`);
  return balanceInEther;
}

async function main() {
  try {
    
    //const lpContractAddress = ;
    const pricefrge = await getTokenPriceFromLP('0xa977efdb6dd8818274215ca172772d3297c253c0')
    const priceeos = await getTokenPriceFromEOSUSDTLP('0x112bb3C75544813E79c8E5F07c124956FCFF3410')


  //  await price = getTokenPriceFromLP(`0xa977efdb6dd8818274215ca172772d3297c253c0`);
  
    console.log("pricefrge", pricefrge)
    console.log("priceeos", priceeos)

// used these names because it will be other tokens as well,not only FRGE or EOS. 
    
    const erc20BalanceA = await getERC20TokenBalanceInContract(erc20TokenAddressA);
    const erc20BalanceB = await getERC20TokenBalanceInContract(erc20TokenAddressB);

    console.log(`The Token A balance is: ${erc20BalanceA} FRGE.`);
    console.log(`The Token B balance is: ${erc20BalanceB} EOS.`);

    const tokenAValue = parseFloat(erc20BalanceA) * pricefrge;
    // token A is FRGE, should use pricefrge
    console.log(`The value locked on token A is: ${tokenAValue} USD.`);

    const tokenBValue = parseFloat(erc20BalanceB) * priceeos ;
    // token B is EOS should use priceeos
    console.log(`The value locked on token B is: ${tokenBValue} USD.`);
    
    const totalValue = tokenAValue + tokenBValue;
    console.log(`The total value is: ${totalValue} USD.`);

  //https://explorer.evm.eosnetwork.com/address/0x4541c5502e6D1b66edF515950A2c6a96331e575E/tokens#address-tabs

    //ok so just need to fix these 2:
    const LpOwnedByFarm = 7148 //await getERC20TokenBalanceInContract(farm);
    
    const totalLpTokens =  10888 // UNI-V2  // await getERC20TokenBalanceInContract(farm);

    
    
    
    // Total investment = (LP Token Owned by Farm ÷ total LP token) × totalValue
    const totalInvestment = (LpOwnedByFarm / totalLpTokens) * totalValue ;
    console.log("totalInvestment:", totalInvestment)
    
  
    // APRX = ((Yield per day x priceFrge / Total investment) * 365) * 100
    
    const aprX = (((yieldPerDay * pricefrge) / totalInvestment ) * 365) * 100;
    console.log(`The APRX is: ${aprX.toFixed(2)}%`);






    
    // APR = ((Yield per day / Total investment) * 365) * 100
    const apr = ((yieldPerDay / totalValue) * 365) * 100;
    console.log(`The APR is: ${apr.toFixed(2)}%`);


  
  } catch (error) {
    console.error(error);
  }
}

// Call the main function to start the program
main();






// dont worry about these:

async function getTokenPriceFromLP(lpContractAddress) {
  //this nice code, calculates price with only a few lines of code.
  const web3 = new Web3('https://api.evm.eosnetwork.com');
  const lpContract = new web3.eth.Contract(LP_CONTRACT_ABI, lpContractAddress);
  const { _reserve0, _reserve1 } = await lpContract.methods.getReserves().call();
  const token0Price = _reserve1 / _reserve0;
  const token1Price = _reserve0 / _reserve1;
  //console.log(`Token0 price in terms of Token1: ${token0Price}`);
  //console.log(`Token1 price in terms of Token0: ${token1Price}`);
  return token1Price
}

async function getTokenPriceFromEOSUSDTLP(lpContractAddress) {
  const web3 = new Web3('https://api.evm.eosnetwork.com');
  const lpContract = new web3.eth.Contract(LP_CONTRACT_ABI, lpContractAddress);
  const { _reserve0, _reserve1 } = await lpContract.methods.getReserves().call();

  const reserve1String = _reserve1.toString();
  const reserve0String = _reserve0.toString();
  
  const decimalIndexReserve1 = reserve1String.indexOf('.');
  const decimalIndexReserve0 = reserve0String.indexOf('.');
  
  const reserve1ThreeDecimals = parseFloat(reserve1String.slice(0, decimalIndexReserve1 + 4));
  const reserve0ThreeDecimals = parseFloat(reserve0String.slice(0, decimalIndexReserve0 + 4));

  const token0Price = reserve1ThreeDecimals / reserve0ThreeDecimals;

  return token0Price;
}


