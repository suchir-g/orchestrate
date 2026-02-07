const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying EventTicketNFT contract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", hre.ethers.utils.formatEther(balance), "ETH");

  const baseURI = process.env.METADATA_BASE_URI || "https://api.orchestrate.com/nft/metadata/";

  const EventTicketNFT = await hre.ethers.getContractFactory("EventTicketNFT");
  const contract = await EventTicketNFT.deploy(baseURI);

  await contract.deployed();

  console.log("✅ EventTicketNFT deployed to:", contract.address);
  console.log("📋 Base URI:", baseURI);

  const deploymentInfo = {
    contractAddress: contract.address,
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    baseURI: baseURI,
    deployedAt: new Date().toISOString(),
    blockNumber: contract.deployTransaction.blockNumber,
    transactionHash: contract.deployTransaction.hash,
  };

  const deploymentPath = path.join(__dirname, "../deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("💾 Deployment info saved to deployment.json");

  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/EventTicketNFT.sol/EventTicketNFT.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abiPath = path.join(__dirname, "../src/contracts/EventTicketNFT.json");

  const contractsDir = path.join(__dirname, "../src/contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  fs.writeFileSync(
    abiPath,
    JSON.stringify(
      {
        address: contract.address,
        abi: artifact.abi,
      },
      null,
      2
    )
  );

  console.log("💾 Contract ABI saved to src/contracts/EventTicketNFT.json");

  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("⏳ Waiting for block confirmations...");
    await contract.deployTransaction.wait(5);
    console.log("✅ Contract confirmed");

    if (process.env.POLYGONSCAN_API_KEY) {
      console.log("🔍 Verifying contract on Polygonscan...");
      try {
        await hre.run("verify:verify", {
          address: contract.address,
          constructorArguments: [baseURI],
        });
        console.log("✅ Contract verified on Polygonscan");
      } catch (error) {
        console.log("⚠️  Verification failed:", error.message);
      }
    }
  }

  console.log("\n🎉 Deployment complete!");
  console.log("\n📋 Next steps:");
  console.log("1. Update .env with CONTRACT_ADDRESS=" + contract.address);
  console.log("2. Add contract address to Firebase config");
  console.log("3. Test minting tickets on the frontend");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
