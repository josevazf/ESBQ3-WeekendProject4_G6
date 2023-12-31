require('dotenv').config();
import { ethers } from "ethers";
import { G6Token, G6Token__factory} from "../typechain-types";

async function main() {
	// Change the url to your provider and set key on .env file
	const providerUrl = `https://eth-sepolia.g.alchemy.com/v2/${process.env.PROVIDER_KEY}`;
	const provider = new ethers.JsonRpcProvider(providerUrl);

	// Change private key on .env file
	const wallet = new ethers.Wallet(process.env.MY_WALLET_PRIVATE_KEY ?? "", provider);
	const tokenFactory = new G6Token__factory(wallet);
	const walletAddress = await wallet.getAddress();
	// Fetch arguments to run functions 
	const args = process.argv.slice(2);

	// Contract address, update with Token contract address
	// Test token address - 0xc09B35aE268db3c956f6e03CCE536fE0a29b59eF
	const tokenAddress = "0x9805944Da4F69978dffc4c02eA924911D668d81a";

	// Connect to deployed contract
	const tokenContract = tokenFactory.attach(tokenAddress) as G6Token;

	// Filter wich function to be called
	if (args[0] == "deployToken") {
		deployToken();
	} else if (args[0] == "mint") {
		mint(args[1], ethers.parseUnits(args[2]));
	} else if (args[0] == "delegate") {
		delegate(args[1]);
	} else if (args[0] == "transfer") {
		transfer(args[1], ethers.parseUnits(args[2]));
	} else if (args[0] == "balanceOf") {
		balanceOf(args[1]);
	} else if (args[0] == "getVotes") {
		getVotes(args[1]);
	} else if (args[0] == "getPastVotes") {
		getPastVotes(args[1], parseInt(args[2]));
	}

	// Deploy the Token contract first to interact with and/or pass the address to (tokenAddress)
	async function deployToken() {
		console.log("\nDeploying G6Token contract...");
		const tokenContract = await tokenFactory.deploy();
		await tokenContract.waitForDeployment();
		const tokenAddress = await tokenContract.getAddress();
		console.log(`Group 6 Token contract deployed at ${tokenAddress}\n`);
	}

	// 'mint' function
	async function mint(to: string, amount: bigint) {
		console.log("\nMinting tokens...");
		const mintTx = await tokenContract.mint(to, amount); // or contract.connect(deployer / acc1).mint...
		await mintTx.wait();
		console.log(`Minted ${ethers.formatUnits(amount).toString()} tokens to account ${to}`);
		const balanceBN = await tokenContract.balanceOf(to);
		console.log(`Account ${to} has ${ethers.formatUnits(balanceBN).toString()} tokens`);
		console.log("Tx hash:", mintTx.hash, "\n");
	}

	// 'delegate' function (delegate to self to activate voting power or delegate to another account to pass on voting power)
	async function delegate(to: string) {
		console.log("\nDelegating voting power...");
		const votesBefore = await tokenContract.balanceOf(walletAddress);
		const delegateTx = await tokenContract.delegate(to);
		await delegateTx.wait();
		console.log(`Account ${walletAddress} delegated ${ethers.formatUnits(votesBefore).toString()} units of voting power to ${to}`);
		console.log("Tx hash:", delegateTx.hash, "\n");
	}

	// 'transfer' function
	async function transfer(to: string, amount: bigint) {
		console.log("\nTransfering tokens...");
		const transferTx = await tokenContract.transfer(to, amount);
		await transferTx.wait();
		console.log(`Account ${walletAddress} transfered ${ethers.formatUnits(amount).toString()} tokens to ${to}`);
		console.log("Tx hash:", transferTx.hash, "\n");
	}
  
	// 'balanceOf' function (check balance)
	async function balanceOf(account: string) {
		const balance = await tokenContract.balanceOf(account);
		console.log(`\nAccount ${account} has ${ethers.formatUnits(balance).toString()} tokens\n`);
	}

	// 'getVotes' function (check the voting power)
	async function getVotes(account: string) {
		const votes = await tokenContract.getVotes(account);
		console.log(`\nAccount ${account} has ${ethers.formatUnits(votes).toString()} units of voting power\n`);
	}

	// 'getPastVotes' function (check voting power at target block number)
	async function getPastVotes(account: string, timepoint: number) {
		const lastBlock = await provider.getBlockNumber();
		const pastVotes = await tokenContract.getPastVotes(account, timepoint);
		const presentVotes = await tokenContract.getPastVotes(account, lastBlock - 1);
		console.log(`\nAccount ${account} had ${ethers.formatUnits(pastVotes).toString()} units of voting power at block ${timepoint}`);
		console.log(`Account ${account} has ${ethers.formatUnits(presentVotes).toString()} units of voting power at latest block ${lastBlock}\n`);
	}
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});