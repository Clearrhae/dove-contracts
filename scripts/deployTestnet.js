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
  const firstEpochTimestamp = (await provider.getBlock()).timestamp + 60 * 60; // 60 minutes from now
  const epochDuration = 28800; // 8 hours
  const initalRewardRate = "5000";
  const deadAddress = "0x0000000000000000000000000000000000000000";
  const largeApproval = "100000000000000000000000000000000";
  const usdcBondBCV = "369";
  const bondVestingLength = 5 * 24 * 3600; // 5 days
  const minBondPrice = "100"; //TBC: Launch Price
  const maxBondPayout = "1000";
  const bondFee = "10000";
  const maxBondDebt = "1000000000000000";
  const initialBondDebt = "0";
  const warmupPeriod = "3";
  const initialMint = "10000000000000000000000000";

  // Deploy the mock usdc token and mint some tokens to the deployer
  const USDC = await ethers.getContractFactory("MockUSDC");
  // const usdc = await USDC.deploy(0);
  // await usdc.mint( deployer.address, initialMint );
  const usdc = await USDC.attach("0x44575d9D850081C55526EAdB9448c1331C42543c");
  const usdcAddress = usdc.address;
  console.log("USDC deployed at: " + usdcAddress);

  // Deploy the Dove contract
  const DOVE = await ethers.getContractFactory("DoveERC20Token");
  // const dove = await DOVE.deploy();
  const dove = await DOVE.attach('0xdD0AaC997D8a704C37b13f51981f62Df5476C3E9');
  console.log("Dove deployed at: " + dove.address);

  // Deploy the sDOVE contract
  const sDOVE = await ethers.getContractFactory("sDove");
  // const sdove = await sDOVE.deploy();
  const sdove = await sDOVE.attach('0x1Ff53A83E8F14D48470b27aE8C21fC005278b5Ef');
  console.log("sDove deployed at: " + sdove.address);

  // Deploy the Treasury contract
  const Treasury = await ethers.getContractFactory("DoveTreasury");
  // const treasury = await Treasury.deploy(dove.address, usdcAddress, 0);
  const treasury = await Treasury.attach('0x8FEdc0ebe8dbed8C34Bf6CFF713f25ec37cfb1B1');
  console.log("Treasury deployed at: " + treasury.address);

  // Deploy the BondingCalculator contract
  const BondingCalculator = await ethers.getContractFactory(
    "DoveBondingCalculator"
  );
  // const bondingCalculator = await BondingCalculator.deploy(dove.address);
  const bondingCalculator = await BondingCalculator.attach('0x26DAF47DD85986143fCD1EA4896c72EddB498622');
  console.log("BondingCalculator deployed at: " + bondingCalculator.address);

  // Deploy the staking distributor contract
  const StakingDistributor = await ethers.getContractFactory("Distributor");
  // const stakingDistributor = await StakingDistributor.deploy(
  //   treasury.address,
  //   dove.address,
  //   epochDuration,
  //   firstEpochTimestamp
  // );
  const stakingDistributor = await StakingDistributor.attach('0x85af7a56c96af8d83d056B36b31d0D03f7dbD33a');
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
  const staking = await Staking.attach('0xee36BfF8c2C201E9Ea4841a04233734e465bca0c');
  console.log("Staking deployed at: " + staking.address);

  // Deploy staking warmup contract
  const StakingWarmup = await ethers.getContractFactory("StakingWarmup");
  // const stakingWarmup = await StakingWarmup.deploy(
  //   staking.address,
  //   sdove.address
  // );
  const stakingWarmup = await StakingWarmup.attach('0x5Cb46dd0Ba561F8BADBe21056B177B8d0dBeb8c1');
  console.log("StakingWarmup deployed at: " + stakingWarmup.address);

  // Deploy staking helper contract
  const StakingHelper = await ethers.getContractFactory("StakingHelper");
  // const stakingHelper = await StakingHelper.deploy(
  //   staking.address,
  //   dove.address
  // );
  const stakingHelper = await StakingHelper.attach('0xF40Aa42b3540201046De236CAa88F4aCbc0cFAb6');
  console.log("StakingHelper deployed at: " + stakingHelper.address);

  const { router: quickswapRouterAddr, factory: quickswapFactoryAddr } = {
    factory: "0x6725F303b657a9451d8BA641348b6761A6CC7a17",
    router: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
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
  const usdcBond = await Bonding.attach('0xB31A40d593DE854846e1c312FB0c84f970Fd5ECb');
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
  const doveUsdcBond = await DoveUsdcBonding.attach('0x2199a9E5036Df3F018A54517bd0008010Ba27C7d');
  console.log("DOVE-USDC LP Bonding deployed at: " + doveUsdcBond.address);

  /*
  // queue and toggle USDC reserve depositor
  await (await treasury.queue("0", usdcBond.address)).wait();
  await treasury.toggle("0", usdcBond.address, deadAddress);

  await (await treasury.queue("5", usdcBond.address)).wait();
  await treasury.toggle("5", usdcBond.address, bondingCalculator.address);

  // queue and toggle deployer reserve depositor
  await (await treasury.queue("0", deployer.address)).wait();
  await treasury.toggle("0", deployer.address, deadAddress);

  // queue and toggle deployer liquidity depositor
  await (await treasury.queue("4", deployer.address)).wait();
  await treasury.toggle("4", deployer.address, deadAddress);

  // queue and toggle DOVE-USDC liquidity depositor
  await (await treasury.queue("4", doveUsdcBond.address)).wait();
  await treasury.toggle("4", doveUsdcBond.address, deadAddress);

  // queue and toggle reward manager
  await (await treasury.queue("8", stakingDistributor.address)).wait();
  await treasury.toggle("8", stakingDistributor.address, deadAddress);

  await usdcBond.initializeBondTerms(
    usdcBondBCV,
    minBondPrice,
    maxBondPayout,
    bondFee,
    maxBondDebt,
    initialBondDebt,
    bondVestingLength
  );

  await doveUsdcBond.initializeBondTerms(
    "100",
    minBondPrice,
    maxBondPayout,
    bondFee,
    maxBondDebt,
    initialBondDebt,
    bondVestingLength
  );

  
  await usdcBond.setStaking(staking.address, stakingHelper.address);
  await doveUsdcBond.setStaking(staking.address, stakingHelper.address);

  // Initialize sDOVE and set the index
  await sdove.initialize(staking.address);
  await sdove.setIndex(initialIndex);

  // set distributor contract and warmup contract
  await staking.setContract("0", stakingDistributor.address);
  await staking.setContract("1", stakingWarmup.address);
  await staking.setWarmup(warmupPeriod);

  // Set treasury for DOVE token
  await dove.setVault(treasury.address);

  // Add staking contract as distributor recipient
  await stakingDistributor.addRecipient(staking.address, initalRewardRate);

  const lp = new ethers.Contract(lpAddress, UniswapV2PairABI, deployer);

  await Promise.all([
    (await usdc.approve(treasury.address, largeApproval)).wait(),
    (await usdc.approve(usdcBond.address, largeApproval)).wait(),
    (await usdc.approve(quickRouter.address, largeApproval)).wait(),
    (await dove.approve(staking.address, largeApproval)).wait(),
    (await dove.approve(stakingHelper.address, largeApproval)).wait(),
    (await dove.approve(quickRouter.address, largeApproval)).wait(),
    (await lp.approve(treasury.address, largeApproval)).wait(),
  ]);
*/
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
      IDO: ido.address,
    })
  );
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
