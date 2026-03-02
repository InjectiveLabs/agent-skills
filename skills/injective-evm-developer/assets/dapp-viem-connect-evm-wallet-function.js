
async function connectEvmWallet() {
    if (typeof window?.ethereum === 'undefined') {
        return {
            ok: false,
            error: 'no injected web3 provider detected',
        };
    }

    let client;
    try {
        client = createWalletClient({
            chain: injectiveTestnet,
            transport: custom(window.ethereum),
        }).extend(publicActions);
    } catch (ex) {
        return {
            ok: false,
            error: 'unable to initialise wallet client',
        };
    }

    let address;
    try {
        [address] = await client.requestAddresses();
    } catch (ex) {
        return {
            ok: false,
            error: 'unable to obtain account details',
        };
    }

    let chainId;
    try {
        console.log(`switching network to chain ID: ${injectiveTestnet.id}`);
        await client.switchChain({
            id: injectiveTestnet.id,
        });
    } catch (error) {
        return {
            ok: false,
            error: 'unable to switch to target network',
        };
    }
    chainId = parseInt(await client.request({ method: 'eth_chainId' }), 16);
    console.log({ chainId });

    return {
        ok: true,
        address,
        client,
    };
}
