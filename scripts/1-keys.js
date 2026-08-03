// Step 1: create the project wallet (payer) and one test wallet per pNode.
// Keys land in .keys/ and are excluded from the repo via .gitignore.
const { Keypair } = require('@solana/web3.js');
const { saveKp, loadKp, hasKp, state, conn, LAMPORTS_PER_SOL } = require('./common.js');
const fs = require('fs');
const path = require('path');

(async () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'rewards.example.json')));

  if (!hasKp('payer')) saveKp('payer', Keypair.generate());
  const payer = loadKp('payer');

  const nodes = cfg.nodes.map((n, i) => {
    if (!hasKp(n.name)) saveKp(n.name, Keypair.generate());
    return { ...n, index: i, pubkey: loadKp(n.name).publicKey.toBase58() };
  });
  state({ decimals: cfg.decimals, period: cfg.period, nodes });

  console.log('Project wallet (needs devnet SOL):\n  ' + payer.publicKey.toBase58() + '\n');
  nodes.forEach(n => console.log('  [' + n.index + '] ' + n.name.padEnd(8) + n.pubkey + '  ' + n.reward + ' XNDR'));
  console.log('\nTotal pool: ' + nodes.reduce((s, n) => s + n.reward, 0) + ' XNDR');
  const bal = await conn().getBalance(payer.publicKey);
  console.log('Payer balance: ' + bal / LAMPORTS_PER_SOL + ' SOL' + (bal === 0 ? '  → needs devnet SOL (faucet.solana.com)' : ''));
})();
