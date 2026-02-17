const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with", deployer.address);

  const RouletteGame = await hre.ethers.getContractFactory("RouletteGame");
  const game = await RouletteGame.deploy(deployer.address);
  await game.waitForDeployment();
  console.log("RouletteGame deployed to:", await game.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
