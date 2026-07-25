// Schritt 4: Claim per CLI ausführen — Beweis, dass der Ablauf ohne UI funktioniert.
// Aufruf: npm run claim -- 0     (Index des Empfängers)
const { PublicKey } = require('@solana/web3.js');
const { MerkleDistributorSDK } = require('@saberhq/merkle-distributor');
const { SolanaProvider, SignerWallet } = require('@saberhq/solana-contrib');
const { u64 } = require('@saberhq/token-utils');
const { getAccount, getAssociatedTokenAddressSync } = require('@solana/spl-token');
const { conn, loadKp, state } = require('./common.js');

(async () => {
  const idx = parseInt(process.argv[2] ?? '0');
  const s = state();
  const n = s.nodes[idx];
  if (!n) { console.error('Kein Empfänger mit Index', idx); process.exit(1); }

  const claimant = loadKp(n.name);
  const c = conn();
  const provider = SolanaProvider.init({ connection: c, wallet: new SignerWallet(claimant) });
  const sdk = MerkleDistributorSDK.load({ provider });
  const w = await sdk.loadDistributor(new PublicKey(s.distributor));

  const amount = new u64(BigInt(n.reward) * 10n ** BigInt(s.decimals));
  const proof = s.proofs[idx].map(h => Buffer.from(h, 'hex'));

  console.log(n.name, 'claimt', n.reward, 'XNDR (Index ' + idx + ') …');
  const rc = await (await w.claim({ index: new u64(idx), amount, proof, claimant: claimant.publicKey })).confirm();
  console.log('Tx: https://explorer.solana.com/tx/' + rc.signature + '?cluster=devnet');

  const acc = await getAccount(c, getAssociatedTokenAddressSync(new PublicKey(s.mint), claimant.publicKey));
  console.log('Guthaben ' + n.name + ':', Number(acc.amount) / 10 ** s.decimals, 'XNDR ✓');
})().catch(e => { console.error('FEHLER:', e.message); process.exit(1); });
