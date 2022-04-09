async function main() {
  const Marketplace = await ethers.getContractFactory("Marketplace")

  // Start deployment, returning a promise that resolves to a contract object
  const MarketplaceDeploy = await Marketplace.deploy()
  await MarketplaceDeploy.deployed()
  console.log("Contract deployed to address:", MarketplaceDeploy.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
