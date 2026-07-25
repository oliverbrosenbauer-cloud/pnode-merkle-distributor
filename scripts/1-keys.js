// Schritt 1: Projekt-Wallet (Payer) und Test-Wallets für die 5 pNodes erzeugen.
// Schlüssel landen in .keys/ und sind per .gitignore vom Repo ausgeschlossen.
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

  console.log('Projekt-Wallet (braucht Devnet-SOL):\n  ' + payer.publicKey.toBase58() + '\n');
  nodes.forEach(n => console.log('  [' + n.index + '] ' + n.name.padEnd(8) + n.pubkey + '  ' + n.reward + ' XNDR'));
  console.log('\nGesamt-Topf: ' + nodes.reduce((s, n) => s + n.reward, 0) + ' XNDR');
  const bal = await conn().getBalance(payer.publicKey);
  console.log('Payer-Balance: ' + bal / LAMPORTS_PER_SOL + ' SOL' + (bal === 0 ? '  → Devnet-SOL nötig (faucet.solana.com)' : ''));
})();
