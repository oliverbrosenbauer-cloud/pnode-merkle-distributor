// Step 3: mint the dummy token, create the distributor on-chain, fund the pool,
// and give each test wallet a little SOL for its claim transaction.
const { PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const { createMint, mintTo } = require('@solana/spl-token');
const { MerkleDistributorSDK } = require('@saberhq/merkle-distributor');
const { SolanaProvider, SignerWallet } = require('@saberhq/solana-contrib');
const { u64 } = require('@saberhq/token-utils');
const { conn, loadKp, state } = require('./common.js');

(async () => {
  const c = conn();
  const payer = loadKp('payer');
  let s = state();

  const bal = await c.getBalance(payer.publicKey);
  console.log('Payer:', payer.publicKey.toBase58(), '|', bal / LAMPORTS_PER_SOL, 'SOL');
  if (bal < 0.3 * LAMPORTS_PER_SOL) {
    console.log('\nNOT ENOUGH SOL. Fund the address above at faucet.solana.com and run again.');
    process.exit(2);
  }

  // 1) Dummy token "XNDR" — stands in for the real reward token
  let mint;
  if (s.mint) { mint = new PublicKey(s.mint); console.log('Token exists:', s.mint); }
  else {
    mint = await createMint(c, payer, payer.publicKey, null, s.decimals);
    state({ mint: mint.toBase58() });
    console.log('Token XNDR created:', mint.toBase58());
  }

  // 2) Create the distributor account: stores the Merkle root and the limits on-chain
  s = state();
  if (!s.distributor) {
    const provider = SolanaProvider.init({ connection: c, wallet: new SignerWallet(payer) });
    const sdk = MerkleDistributorSDK.load({ provider });
    const pending = await sdk.createDistributor({
      root: Buffer.from(s.root, 'hex'),
      maxTotalClaim: new u64(s.maxTotalClaim),
      maxNumNodes: new u64(s.maxNumNodes),
      tokenMint: mint
    });
    const rc = await pending.tx.confirm();
    state({ distributor: pending.distributor.toBase58(), distributorATA: pending.distributorATA.toBase58(), createTx: rc.signature });
    console.log('Distributor created:', pending.distributor.toBase58());
    console.log('  tx: https://explorer.solana.com/tx/' + rc.signature + '?cluster=devnet');
  } else console.log('Distributor exists:', s.distributor);

  // 3) Fund the reward pool
  s = state();
  if (!s.funded) {
    await mintTo(c, payer, mint, new PublicKey(s.distributorATA), payer, BigInt(s.maxTotalClaim));
    state({ funded: true });
    console.log('Pool funded:', Number(s.maxTotalClaim) / 10 ** s.decimals, 'XNDR');
  } else console.log('Pool already funded.');

  // 4) Test wallets need a little SOL to pay for their own claim transaction
  s = state();
  if (!s.walletsFunded) {
    const tx = new Transaction();
    for (const n of s.nodes) tx.add(SystemProgram.transfer({ fromPubkey: payer.publicKey, toPubkey: new PublicKey(n.pubkey), lamports: 0.02 * LAMPORTS_PER_SOL }));
    await sendAndConfirmTransaction(c, tx, [payer]);
    state({ walletsFunded: true });
    console.log('Test wallets funded with 0.02 SOL each.');
  } else console.log('Test wallets already funded.');

  console.log('\nSETUP COMPLETE ✓   remaining:', await c.getBalance(payer.publicKey) / LAMPORTS_PER_SOL, 'SOL');
  console.log('Distributor in the explorer: https://explorer.solana.com/address/' + state().distributor + '?cluster=devnet');
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
