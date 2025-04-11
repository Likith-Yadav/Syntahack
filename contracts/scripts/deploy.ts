import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const EduChain = await ethers.getContractFactory("EduChain");
  const eduChain = await EduChain.deploy();

  await eduChain.waitForDeployment();

  console.log("EduChain deployed to:", await eduChain.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 