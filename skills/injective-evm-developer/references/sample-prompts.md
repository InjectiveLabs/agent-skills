# Sample prompts for the Injective EVM Developer skill

Sample prompts categorised based on user stories.
See `./user-stories.md`.

## For US-001

Sample prompt 1: Help me to generate a new account (show me the private key, public key, and address). Then guide me how to fund it with a small amount of INJ and USDT on Testnet from a faucet.

Sample prompt 2: Recommend a wallet that I can use with Injective EVM. Then guide me how to fund it with a larg amount of INJ on Testnet from a faucet (I need at least 2 INJ).

## For US-002

Sample prompt 1: This project currently deploys on Ethereum, with the smart contracts within `./block/` as a hardhat project. Please make the necessary changes such that these same smart contracts can be cross-deployed on Injective Testnet or Mainnet.

Sample prompt 2: This project currently deploys on Ethereum, with the dApp code within `./front`. Please make the necessary changes such that the same dApp can cotninue working on both the existing Ethereum deployed smart contracts and  the freshly cross-deployed smart contracts on Injective Testnet or Mainnet.

## For US-003

Sample prompt 1: Please set up a hardhat project that can deploy smart contracts onto Injective Testnet and Mainnet. Populate the README.md file of this project with the commands needs to compile, test, deploy, verify, and interact with the smart contract from the command line.

Sample prompt 2: Please set up a project that can deploy a MultiVM Token Standard token on Injective Testnet. My token name is "Agent Coin" and token symbol is "ABCD", and it has a fixed supply of 1 million with 2 decimal places.

## For US-004

Sample prompt 1: Please create a dApp for me that interacts with the smart contract that I have just deployed on EVM Testnet. I should be able to invoke all of the functions exposed by the smart contract, and allow the user to input all parameter values for each function.

Sample prompt 2: Please update the dApp for me to interacts with function "foobar" in the smart contract that I have just deployed on EVM Testnet.

## For US-005

Sample prompt 1: I have deployed the smart contracts in this project to Injective Testnet. I would now also like to deploy them on Injective Mainnet. Please modify my project config and scripts to allow this to happen (but do not actually perform the deployment yourself). Please also provide me with a list of security best practices and gotchas to anticipate and avoid when doing so.

Sample prompt 2: My project's smart contracts interacts with my own MTS token USDT_TEST on Injective Testnet. However when I deploy this project on Injective Mainnet, these smart contracts should interact with the actual USDT on Injective Mainnet. Please make the required changes to the script, commands, and config necessary for this to happen - but do not actually perform any deployment.
