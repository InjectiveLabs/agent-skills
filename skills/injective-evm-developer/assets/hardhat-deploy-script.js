const constructorArgs = require('./constructor-args.js');

async function deploy(name, constructorArgs, deployTxOptions) {
    const smartContractFactory =
        await ethers.getContractFactory(name);
    const smartContractInstance =
        await smartContractFactory.deploy(...constructorArgs, deployTxOptions);
    await smartContractInstance.waitForDeployment();
    const smartContractAddress =
        await smartContractInstance.getAddress();

    console.log(
        `Smart contract deployed: ${smartContractAddress} - ${name}\n    https://testnet.blockscout.injective.network/address/${smartContractAddress}?tab=contract`,
    );
}

async function main() {
    await deploy('MySmartContractName',
        constructorArgs,
        {
            // Pay 1INJ (1e18inj) to the constructor
            value: 1_000_000_000_000_000_000n,
            gasPrice: 160e6,
            gasLimit: 2e6,
        },
    );
}

main()
    .then(() => {
        console.log('Deployment script executed successfully.');
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
