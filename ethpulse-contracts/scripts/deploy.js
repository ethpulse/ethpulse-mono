const hre = require("hardhat");

async function main() {
  console.log("Deploying ETHPulse contract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy ETHPulse contract
  const ETHPulse = await hre.ethers.getContractFactory("ETHPulse");
  const ethPulse = await ETHPulse.deploy();

  await ethPulse.waitForDeployment();

  const address = await ethPulse.getAddress();
  console.log("ETHPulse deployed to:", address);

  // Verify contract on Etherscan (if not localhost)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await ethPulse.deploymentTransaction().wait(6);

    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [],
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.error("Verification failed:", error);
    }
  }

  // Get initial contract state
  const platformFee = await ethPulse.platformFeePercent();
  const pollCounter = await ethPulse.pollCounter();

  console.log("\nContract State:");
  console.log("- Platform Fee:", platformFee.toString() + "%");
  console.log("- Poll Counter:", pollCounter.toString());

  console.log("\nDeployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
