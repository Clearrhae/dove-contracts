const { ethers } = require('hardhat')
// const { BigNumber } = ethers

const UniswapV2FactoryABI =
  require("../contracts/abi/IUniswapV2Factory.json").abi;
const UniswapV2PairABI = require("../contracts/abi/IUniswapV2Pair.json").abi;
const UniswapV2RouterABI =
  require("../contracts/abi/UniswapV2Router02.json").abi;

const fs = require('fs')
const path = require('path')

const zeroAddress = '0x0000000000000000000000000000000000000000'
const DOVE_Address = '0x310bB270109F9b90fd9fF4fc7215c9e00Eea83a9'
const USDC_Address = '0xb09d57d62CD00d74aFA68F48cBABf00Af16569Ce'
const Treasury_Address = '0x1DDF3AA8e98fd14a49d9a44c3B9131af687Af04a'
const Staking_Address = '0x8F7e583583D644B3983B45223Bb772Cc8E59fB98'
const LP_Address = '0x6473d74c5F59841105031285b384d7758c4b33d8'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying contracts with the account: ' + deployer.address)
  const IDO = await ethers.getContractFactory('DoveIDO')
  
  // const ido = await IDO.deploy(
  //   DOVE_Address, // DOVE
  //   USDC_Address, // USDC
  //   Treasury_Address, // Treasury
  //   Staking_Address, // Staking
  //   LP_Address // DOVE-USDC LP
  // )
  // console.log('Deploy tx: ' + ido.deployTransaction.hash)
  // console.log('Deploy nonce: ' + ido.deployTransaction.nonce)
  // await ido.deployTransaction.wait()
  // console.log('IDO deployed at: ' + ido.address)
  
 const ido = await IDO.attach('0x3274bb828aD4cc677dC819F0885caa59A0a3BD13')

  const Treasury = await ethers.getContractFactory('DoveTreasury')
  const treasury = Treasury.attach(Treasury_Address)

 const { router: quickswapRouterAddr, factory: quickswapFactoryAddr } = {
  factory: "0xF9db97007782ae35051a97790766531684C4943c",
  router: "0x2fFAa0794bf59cA14F268A7511cB6565D55ed40b",
};

// const quickRouter = UniswapV2Router.attach(quickswapRouterAddr);

const uniswapFactory = new ethers.Contract(
  quickswapFactoryAddr,
  UniswapV2FactoryABI,
  deployer
);

//  await (await uniswapFactory.createPair(DOVE_Address, USDC_Address)).wait();
 const lpAddress = await uniswapFactory.getPair(DOVE_Address, USDC_Address);
 console.log("DOVE-USDC LP deployed at: " + lpAddress);

 const DoveUsdcBonding = await ethers.getContractFactory("DoveBondDepository");
 const doveUsdcBond = await DoveUsdcBonding.attach('0xf4eff537d4ea78967dd1339eb2ab05e509be6bf0')
 const usdcBond = await DoveUsdcBonding.attach('0x139B340389ea811Ca81Ed991A3c95fe866368664')

   // queue and toggle DOVE-USDC liquidity depositor
  //  await (await treasury.queue("4", doveUsdcBond.address)).wait();
  //  await treasury.toggle("4", doveUsdcBond.address, zeroAddress);


  const epochDuration = 28800; // 8 hours
  const initalRewardRate = "5000";
  const deadAddress = "0x0000000000000000000000000000000000000000";
  const largeApproval = "100000000000000000000000000000000";
  const usdcBondBCV = "300";
  const bondVestingLength = 5 * 24 * 3600; // 5 days
  const minBondPrice = "1"; //TBC: Launch Price
  const maxBondPayout = "1000";
  const bondFee = "10000";
  const maxBondDebt = "1000000000000000";
  const initialBondDebt = "0";
  const warmupPeriod = "0";
  const initialMint = "10000000000000000000000000";

  //  await doveUsdcBond.initializeBondTerms(
  //   "40",
  //   minBondPrice,
  //   maxBondPayout,
  //   bondFee,
  //   maxBondDebt,
  //   initialBondDebt,
  //   bondVestingLength
  // );

  // await doveUsdcBond.setStaking('0x8F7e583583D644B3983B45223Bb772Cc8E59fB98', '0xBe4649E7C776Ce3542Dd912b1a80E2E12A65bcC5');


  // const lp = new ethers.Contract(lpAddress, UniswapV2PairABI, deployer);

  // await lp.approve(treasury.address, largeApproval)


  await ido.finalize('0xa4AE49F9624fD37f9EBf22B49A9644a7C8Bf99f2')

 
//   await ido.initialize(
//     BigNumber.from(10000).mul(BigNumber.from(10).pow(9)),
//     BigNumber.from(100).mul(BigNumber.from(10).pow(18)),
//     4 * 60 * 60, // 4 hours
//     1638653183 // GMT: Wednesday, November 24, 2021 7:00:00 PM
//   )
  
//   // const ido = await IDO.attach('0x3274bb828aD4cc677dC819F0885caa59A0a3BD13')

  

//   let whitelist = fs
//     .readFileSync(path.resolve(__dirname, './whitelist.txt'))
//     .toString()
//     .split('\n')
//     .filter(Boolean)
//   console.log('count before whitelisting: ' + whitelist.length)
//   const list = []
//   for (let w of whitelist) {
//     const wcleaned = w
//     if (list[wcleaned.toLowerCase()] || wcleaned.length > 42) {
//       console.log('duplicate address: ' + wcleaned)
//     } else {
//       list.push(wcleaned.toLowerCase())
//     }
//   }
//   console.log('count after cleanup: ' + list.length)
//   await (await ido.whiteListBuyers(list)).wait()
//   console.log('finished whitelisting')
  
//   await (await treasury.queue('0', ido.address)).wait()
//   await (await treasury.queue('4', ido.address)).wait()
//   await treasury.toggle('0', ido.address, zeroAddress)
//   await treasury.toggle('4', ido.address, zeroAddress)
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })