// Schritt 3: Dummy-Token minten, Distributor on-chain anlegen, Topf befüllen, Test-Wallets mit Gas versorgen.
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
    console.log('\nZU WENIG SOL. Hole Devnet-SOL für obige Adresse (faucet.solana.com) und starte erneut.');
    process.exit(2);
  }

  // 1) Dummy-Token "XNDR" — steht stellvertretend für den echten Reward-Token
  let mint;
  if (s.mint) { mint = new PublicKey(s.mint); console.log('Token existiert:', s.mint); }
  else {
    mint = await createMint(c, payer, payer.publicKey, null, s.decimals);
    state({ mint: mint.toBase58() });
    console.log('Token XNDR erstellt:', mint.toBase58());
  }

  // 2) Distributor-Account anlegen: speichert Merkle-Root + Obergrenzen on-chain
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
    console.log('Distributor angelegt:', pending.distributor.toBase58());
    console.log('  Tx: https://explorer.solana.com/tx/' + rc.signature + '?cluster=devnet');
  } else console.log('Distributor existiert:', s.distributor);

  // 3) Reward-Topf befüllen
  s = state();
  if (!s.funded) {
    await mintTo(c, payer, mint, new PublicKey(s.distributorATA), payer, BigInt(s.maxTotalClaim));
    state({ funded: true });
    console.log('Topf befüllt:', Number(s.maxTotalClaim) / 10 ** s.decimals, 'XNDR');
  } else console.log('Topf bereits befüllt.');

  // 4) Test-Wallets brauchen etwas SOL für ihre Claim-Transaktion
  s = state();
  if (!s.walletsFunded) {
    const tx = new Transaction();
    for (const n of s.nodes) tx.add(SystemProgram.transfer({ fromPubkey: payer.publicKey, toPubkey: new PublicKey(n.pubkey), lamports: 0.02 * LAMPORTS_PER_SOL }));
    await sendAndConfirmTransaction(c, tx, [payer]);
    state({ walletsFunded: true });
    console.log('Test-Wallets mit je 0.02 SOL versorgt.');
  } else console.log('Test-Wallets bereits versorgt.');

  console.log('\nSETUP KOMPLETT ✓   Rest:', await c.getBalance(payer.publicKey) / LAMPORTS_PER_SOL, 'SOL');
  console.log('Distributor im Explorer: https://explorer.solana.com/address/' + state().distributor + '?cluster=devnet');
})().catch(e => { console.error('FEHLER:', e.message); process.exit(1); });
