const { ethers } = require('hardhat')
const { BigNumber } = ethers

const fs = require('fs')
const path = require('path')

const zeroAddress = '0x0000000000000000000000000000000000000000'
const DOVE_Address = ''
const USDC_Address = ''
const Treasury_Address = ''
const Staking_Address = ''
const LP_Address = ''

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying contracts with the account: ' + deployer.address)
  const IDO = await ethers.getContractFactory('DoveIDO')
  const ido = await IDO.deploy(
    DOVE_Address, // DOVE
    USDC_Address, // USDC
    Treasury_Address, // Treasury
    Staking_Address, // Staking
    LP_Address // DOVE-USDC LP
  )
  console.log('Deploy tx: ' + ido.deployTransaction.hash)
  console.log('Deploy nonce: ' + ido.deployTransaction.nonce)
  await ido.deployTransaction.wait()
  console.log('IDO deployed at: ' + ido.address)
  await ido.initialize(
    BigNumber.from(10000).mul(BigNumber.from(10).pow(9)),
    BigNumber.from(100).mul(BigNumber.from(10).pow(18)),
    72 * 60 * 60, // 72 hours
    1637780400 // GMT: Wednesday, November 24, 2021 7:00:00 PM
  )

  const Treasury = await ethers.getContractFactory('DoveTreasury')
  const treasury = Treasury.attach(Treasury_Address)

  let whitelist = fs
    .readFileSync(path.resolve(__dirname, './whitelist.txt'))
    .toString()
    .split('\n')
    .filter(Boolean)
  console.log('count before whitelisting: ' + whitelist.length)
  const listMap = {}
  for (let w of whitelist) {
    if (listMap[w.toLowerCase()]) {
      console.log('duplicate address: ' + w)
    }
    listMap[w.toLowerCase()] = true
  }
  console.log('count before whitelisting: ' + whitelist.length)
  await (await ido.whiteListBuyers(whitelist, { nonce: 68 })).wait()

  await treasury.toggle('0', ido.address, zeroAddress)
  await treasury.toggle('4', ido.address, zeroAddress)
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })