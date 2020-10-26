const MultiSigWallet = artifacts.require("MultiSig")

//  testnet accounts
module.exports = function(deployer, network, accounts) {
  if (network === "main") {
    return
  }

  console.log("-----------------------------")
  console.log(accounts)
  console.log("-----------------------------")

  const owners = accounts.slice(0, 3)
  const minimumConformations = 2

  return deployer.deploy(MultiSigWallet, owners, minimumConformations)
}
