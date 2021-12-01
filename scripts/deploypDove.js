const { ethers } = require('hardhat')

async function main() {
  const [deployer] = await ethers.getSigners()
  const DOVE_ADDRESS = '0xdD0AaC997D8a704C37b13f51981f62Df5476C3E9';
  const USDC_ADDRESS = '0x44575d9D850081C55526EAdB9448c1331C42543c';
  const TREASURY_ADDRESS = '0x8FEdc0ebe8dbed8C34Bf6CFF713f25ec37cfb1B1';

  console.log('Deploying contracts with the account: ' + deployer.address)

  const PreDoveToken = await ethers.getContractFactory('PreDoveToken')
  const pDove = await PreDoveToken.deploy()
  await pDove.deployTransaction.wait()
  console.log('pDOVE deployed at: ' + pDove.address)

  const ExercisePreDove = await ethers.getContractFactory('ExercisePreDove')
  const exercisePreDove = await ExercisePreDove.deploy(
    pDove.address,
    DOVE_ADDRESS,
    USDC_ADDRESS,
    TREASURY_ADDRESS
  )
  await exercisePreDove.deployTransaction.wait()
  console.log('exercisePreDove deployed at: ' + exercisePreDove.address)

  await (
    await exercisePreDove.setTerms(
      deployer.address,
      '15000000000000000000000000',
      '50000'
    )
  ).wait()

  const Treasury = await ethers.getContractFactory('DoveTreasury')
  const treasury = Treasury.attach(TREASURY_ADDRESS)
  await (await treasury.queue('0', exercisePreDove.address)).wait()
  await (await treasury.toggle('0', exercisePreDove.address, '0x0000000000000000000000000000000000000000')).wait()
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })