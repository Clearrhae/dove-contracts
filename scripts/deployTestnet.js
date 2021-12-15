// @dev. This script will deploy this V1.1 of Dove. It will deploy the whole ecosystem except for the LP tokens and their bonds.
// This should be enough of a test environment to learn about and test implementations with the Dove as of V1.1.
// Not that the every instance of the Treasury's function 'valueOf' has been changed to 'valueOfToken'...
// This solidity function was conflicting w js object property name

const { ethers } = require("hardhat");
const { BigNumber } = ethers;
const fs = require('fs')
const path = require('path')

const UniswapV2FactoryABI =
  require("../contracts/abi/IUniswapV2Factory.json").abi;
const UniswapV2PairABI = require("../contracts/abi/IUniswapV2Pair.json").abi;
const UniswapV2RouterABI =
  require("../contracts/abi/UniswapV2Router02.json").abi;

async function main() {
  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log("DOVE Testnet Deployment with Address: " + deployer.address);

  // Define variables
  const initialIndex = 1000000000; // 1.0
  const { provider } = deployer;
  const firstEpochTimestamp = (await provider.getBlock()).timestamp + 180 * 60; // 60 minutes from now
  const epochDuration = 28800; // 8 hours
  const initalRewardRate = "5000";
  const deadAddress = "0x0000000000000000000000000000000000000000";
  const largeApproval = "100000000000000000000000000000000";
  const usdcBondBCV = "300";
  const bondVestingLength = 5 * 24 * 3600; // 5 days
  const minBondPrice = "14000"; //TBC: Launch Price
  const maxBondPayout = "1000";
  const bondFee = "10000";
  const maxBondDebt = "1000000000000000";
  const initialBondDebt = "0";
  const warmupPeriod = "0";
  const initialMint = "10000000000000000000000000";

  // Deploy the mock usdc token and mint some tokens to the deployer
  const USDC = await ethers.getContractFactory("MockUSDC");
  // const usdc = await USDC.deploy(0);
  // await usdc.deployTransaction.wait()

  // await usdc.mint( deployer.address, initialMint );
  const usdc = await USDC.attach("0xb09d57d62CD00d74aFA68F48cBABf00Af16569Ce");
  const usdcAddress = usdc.address;
  console.log("USDC deployed at: " + usdcAddress);

  // Deploy the Dove contract
  const DOVE = await ethers.getContractFactory("DoveERC20Token");
  // const dove = await DOVE.deploy();
  // await dove.deployTransaction.wait()

  const dove = await DOVE.attach('0x91603d283e8616E453575F1a936aAf28fA7E0669');
  console.log("Dove deployed at: " + dove.address);

  // Deploy the sDOVE contract
  const sDOVE = await ethers.getContractFactory("sDove");
  // const sdove = await sDOVE.deploy();
  // await sdove.deployTransaction.wait()
  const sdove = await sDOVE.attach('0x42EF53d7750cFc1b4B33c78d7B70776943f07Ac7');
  console.log("sDove deployed at: " + sdove.address);

  // Deploy the Treasury contract
  const Treasury = await ethers.getContractFactory("DoveTreasury");
  // const treasury = await Treasury.deploy(dove.address, usdcAddress, 0);
  // await treasury.deployTransaction.wait()
  const treasury = await Treasury.attach('0x3381821F50D9992f0810cFb029D64da2A1515a33');
  console.log("Treasury deployed at: " + treasury.address);

  // Deploy the BondingCalculator contract
  const BondingCalculator = await ethers.getContractFactory(
    "DoveBondingCalculator"
  );
  // const bondingCalculator = await BondingCalculator.deploy(dove.address);
  // await bondingCalculator.deployTransaction.wait()
  const bondingCalculator = await BondingCalculator.attach('0x59f59CE140426F6dA018575870146aF40BA34178');
  console.log("BondingCalculator deployed at: " + bondingCalculator.address);

  // Deploy the staking distributor contract
  const StakingDistributor = await ethers.getContractFactory("Distributor");
  // const stakingDistributor = await StakingDistributor.deploy(
  //   treasury.address,
  //   dove.address,
  //   epochDuration,
  //   firstEpochTimestamp
  // );
  // await stakingDistributor.deployTransaction.wait()
  const stakingDistributor = await StakingDistributor.attach('0xEdb0AeA72B1A29fCC8890250Af2b8722610b02A8');
  console.log("StakingDistributor deployed at: " + stakingDistributor.address);

  // Deploy the staking contract
  const Staking = await ethers.getContractFactory("DoveStaking");
  // const staking = await Staking.deploy(
  //   dove.address,
  //   sdove.address,
  //   epochDuration,
  //   1,
  //   firstEpochTimestamp
  // );
  // await staking.deployTransaction.wait()
  const staking = await Staking.attach('0x5adE54D4c4E12814cd05DC2BfEa5B8f4a831afFe');
  console.log("Staking deployed at: " + staking.address);

  // Deploy staking warmup contract
  const StakingWarmup = await ethers.getContractFactory("StakingWarmup");
  // const stakingWarmup = await StakingWarmup.deploy(
  //   staking.address,
  //   sdove.address
  // );
  // await stakingWarmup.deployTransaction.wait()
  const stakingWarmup = await StakingWarmup.attach('0x5b967A18804A3f4095d5bd176b090fB737F3f486');
  console.log("StakingWarmup deployed at: " + stakingWarmup.address);

  // Deploy staking helper contract
  const StakingHelper = await ethers.getContractFactory("StakingHelper");
  // const stakingHelper = await StakingHelper.deploy(
  //   staking.address,
  //   dove.address
  // );
  // await stakingHelper.deployTransaction.wait()
  const stakingHelper = await StakingHelper.attach('0x66C207fFAC11dBCCeAb8a3548C6b052A7F4Bf16A');
  console.log("StakingHelper deployed at: " + stakingHelper.address);

  const { router: quickswapRouterAddr, factory: quickswapFactoryAddr } = {
    factory: "0xF9db97007782ae35051a97790766531684C4943c",
    router: "0x2fFAa0794bf59cA14F268A7511cB6565D55ed40b",
  };

  const UniswapV2Router = new ethers.Contract(
    quickswapRouterAddr,
    UniswapV2RouterABI,
    deployer
  );

  const quickRouter = UniswapV2Router.attach(quickswapRouterAddr);

  const uniswapFactory = new ethers.Contract(
    quickswapFactoryAddr,
    UniswapV2FactoryABI,
    deployer
  );

  // await (await uniswapFactory.createPair(dove.address, usdcAddress)).wait();
  const lpAddress = await uniswapFactory.getPair(dove.address, usdcAddress);
  // const lpAddress = await uniswapFactory.getPair('0xc1117E8c40027F4BF2664eFc8c7acC8c9E3752bf')
  console.log("DOVE-USDC LP deployed at: " + lpAddress);

  // Deploy the Bonding contract
  const Bonding = await ethers.getContractFactory("DoveBondDepository");
  // const usdcBond = await Bonding.deploy(
  //   dove.address,
  //   usdcAddress,
  //   treasury.address,
  //   deployer.address,
  //   deadAddress
  // );
  // await usdcBond.deployTransaction.wait()
  const usdcBond = await Bonding.attach('0x5957683484A78C0417f8010dA66D8b55C4745D66');
  console.log("USDC Bonding deployed at: " + usdcBond.address);

  // Deploy the DOVE-USDC Bonding contract
  const DoveUsdcBonding = await ethers.getContractFactory("DoveBondDepository");
  // const doveUsdcBond = await DoveUsdcBonding.deploy(
  //   dove.address,
  //   lpAddress,
  //   treasury.address,
  //   deployer.address,
  //   bondingCalculator.address
  // );
  // await doveUsdcBond.deployTransaction.wait()
  const doveUsdcBond = await DoveUsdcBonding.attach('0x6677cE2649fD2ba092969758189F17765E4a1798');
  console.log("DOVE-USDC LP Bonding deployed at: " + doveUsdcBond.address);

  // // // queue and toggle USDC reserve depositor
  // await (await treasury.queue("0", usdcBond.address)).wait();
  // await treasury.toggle("0", usdcBond.address, bondingCalculator.address);

  // await (await treasury.queue("5", usdcBond.address)).wait();
  // await treasury.toggle("5", usdcBond.address, bondingCalculator.address);

  // // queue and toggle deployer reserve depositor
  // await (await treasury.queue("0", deployer.address)).wait();
  // await treasury.toggle("0", deployer.address, deadAddress);

  // queue and toggle deployer liquidity depositor
  // await (await treasury.queue("4", deployer.address)).wait();
  // await treasury.toggle("4", deployer.address, deadAddress);

  // // queue and toggle DOVE-USDC liquidity depositor
  // await (await treasury.queue("4", doveUsdcBond.address)).wait();
  // await treasury.toggle("4", doveUsdcBond.address, bondingCalculator.address);

  // // queue and toggle reward manager
  // await (await treasury.queue("8", stakingDistributor.address)).wait();
  // await treasury.toggle("8", stakingDistributor.address, bondingCalculator.address);

  // await usdcBond.initializeBondTerms(
  //   usdcBondBCV,
  //   minBondPrice,
  //   maxBondPayout,
  //   bondFee,
  //   maxBondDebt,
  //   initialBondDebt,
  //   bondVestingLength
  // );

  // await doveUsdcBond.initializeBondTerms(
  //   "40",
  //   "1",
  //   maxBondPayout,
  //   bondFee,
  //   maxBondDebt,
  //   initialBondDebt,
  //   bondVestingLength
  // );

  
  // await usdcBond.setStaking(staking.address, stakingHelper.address);
  // await doveUsdcBond.setStaking(staking.address, stakingHelper.address);

  // Initialize sDOVE and set the index
  // await sdove.initialize(staking.address);
  // await sdove.setIndex(initialIndex);

  // // set distributor contract and warmup contract
  // await staking.setContract("0", stakingDistributor.address);
  // await staking.setContract("1", stakingWarmup.address);
  // await staking.setWarmup(warmupPeriod);

  // // Set treasury for DOVE token
  // await dove.setVault(treasury.address);

  // // Add staking contract as distributor recipient
  // await stakingDistributor.addRecipient(staking.address, initalRewardRate);

  // const lp = new ethers.Contract(lpAddress, UniswapV2PairABI, deployer);

  // await Promise.all([
  //   (await usdc.approve(treasury.address, largeApproval)).wait(),
  //   (await usdc.approve(usdcBond.address, largeApproval)).wait(),
  //   (await usdc.approve(doveUsdcBond.address, largeApproval)).wait(),
  //   (await usdc.approve(quickRouter.address, largeApproval)).wait(),
  //   (await dove.approve(staking.address, largeApproval)).wait(),
  //   (await dove.approve(stakingHelper.address, largeApproval)).wait(),
  //   (await dove.approve(quickRouter.address, largeApproval)).wait(),
  //   (await lp.approve(treasury.address, largeApproval)).wait(),
  // ]);

  //@dev just for testnet
  await treasury.deposit('8667500000000000000000', usdc.address, '0');
  // await stakingHelper.stake('10000000000', deployer.address);
  // await usdcBond.deposit('1000000000000000000000', '60000', deployer.address );
  // await doveUsdcBond.deposit('1000000000000000000000', '60000', deployer.address );

  /*
  const IDO = await ethers.getContractFactory("DoveIDO");

  const ido = await IDO.deploy(
    dove.address, // DOVE
    usdc.address, // USDC
    treasury.address, // Treasury
    staking.address, // Staking
    lpAddress // DOVE-USDC LP
  );

  await (await treasury.queue("0", ido.address)).wait();
  await (await treasury.queue("4", ido.address)).wait();
  await treasury.toggle("0", ido.address, deadAddress);
  await treasury.toggle("4", ido.address, deadAddress);

  await ido.initialize(
    BigNumber.from(20).mul(BigNumber.from(10).pow(9)),
    BigNumber.from(100).mul(BigNumber.from(10).pow(18)),
    1 * 60 * 60, // 72 hours
    1638238372 // GMT: Wednesday, November 24, 2021 7:00:00 PM
  );

  let whitelist = fs
    .readFileSync(path.resolve(__dirname, "./whitelist.txt"))
    .toString()
    .split("\n")
    .filter(Boolean);
  const listMap = {};
  for (let w of whitelist) {
    if (listMap[w.toLowerCase()]) {
      console.log("duplicate address: " + w);
    }
    listMap[w.toLowerCase()] = true;
  }
  await (await ido.whiteListBuyers(whitelist)).wait();
  */

  console.log(
    JSON.stringify({
      DOVE: dove.address,
      sDOVE: sdove.address,
      Treasury: treasury.address,
      BondingCalculator: bondingCalculator.address,
      StakingDistributor: stakingDistributor.address,
      Staking: staking.address,
      StakingWarmpup: stakingWarmup.address,
      StakingHelper: stakingHelper.address,
      RESERVES: {
        USDC: usdcAddress,
        DOVEUSDC: lpAddress,
      },
      BONDS: {
        USDC: usdcBond.address,
        DOVEUSDC: doveUsdcBond.address,
      },
      // IDO: ido.address,
    })
  );
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
