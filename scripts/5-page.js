// Schritt 5: Claim-Seite bauen — Bundle + Konfiguration in eine einzelne HTML-Datei.
const fs = require('fs');
const path = require('path');
const { loadKp, state, ROOT } = require('./common.js');

const s = state();
if (!s.distributor) { console.error('Kein Distributor — erst "npm run setup".'); process.exit(1); }

const cfg = {
  rpc: process.env.RPC_URL || 'https://api.devnet.solana.com',
  distributor: s.distributor, mint: s.mint, decimals: s.decimals, period: s.period,
  proofs: s.proofs,
  amounts: s.nodes.map(n => (BigInt(n.reward) * 10n ** BigInt(s.decimals)).toString()),
  nodes: s.nodes.map(n => ({
    name: n.name, credits: n.credits, reward: n.reward, pubkey: n.pubkey,
    secret: Array.from(loadKp(n.name).secretKey)   // nur Devnet-Spielgeld, Demo-Zweck
  }))
};

const bundlePath = path.join(ROOT, 'web', 'mdk.bundle.js');
if (!fs.existsSync(bundlePath)) { console.error('Bundle fehlt — erst "npm run bundle".'); process.exit(1); }

let h = fs.readFileSync(path.join(ROOT, 'web', 'claim-shell.html'), 'utf8');
h = h.replace('<script>/*BUNDLE*/</script>', '<script>\n' + fs.readFileSync(bundlePath, 'utf8') + '\n</script>');
h = h.replace('/*CONFIG*/', 'const CFG = ' + JSON.stringify(cfg) + ';');
fs.writeFileSync(path.join(ROOT, 'web', 'claim-demo.html'), h);
console.log('web/claim-demo.html gebaut (' + (h.length / 1024 | 0) + ' KB) — im Browser öffnen.');
