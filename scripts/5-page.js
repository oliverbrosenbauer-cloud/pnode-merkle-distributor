// Step 5: assemble the claim page — bundle plus configuration in one standalone HTML file.
const fs = require('fs');
const path = require('path');
const { loadKp, state, ROOT } = require('./common.js');

const s = state();
if (!s.distributor) { console.error('No distributor — run "npm run setup" first.'); process.exit(1); }

const cfg = {
  rpc: process.env.RPC_URL || 'https://api.devnet.solana.com',
  distributor: s.distributor, mint: s.mint, decimals: s.decimals, period: s.period, root: s.root,
  proofs: s.proofs,
  amounts: s.nodes.map(n => (BigInt(n.reward) * 10n ** BigInt(s.decimals)).toString()),
  nodes: s.nodes.map(n => ({
    name: n.name, credits: n.credits, reward: n.reward, pubkey: n.pubkey,
    secret: Array.from(loadKp(n.name).secretKey)   // devnet play money, for the click-through demo only
  }))
};

const bundlePath = path.join(ROOT, 'web', 'mdk.bundle.js');
if (!fs.existsSync(bundlePath)) { console.error('Bundle missing — run "npm run bundle" first.'); process.exit(1); }

let h = fs.readFileSync(path.join(ROOT, 'web', 'claim-shell.html'), 'utf8');
// Pass a replacement FUNCTION: otherwise replace() would interpret $-sequences in the bundle
h = h.replace('<script>/*BUNDLE*/</script>', () => '<script>\n' + fs.readFileSync(bundlePath, 'utf8') + '\n</script>');
h = h.replace('/*CONFIG*/', () => 'const CFG = ' + JSON.stringify(cfg) + ';');

fs.writeFileSync(path.join(ROOT, 'web', 'claim-demo.html'), h);

// Same page under docs/ so GitHub Pages can serve it as a public link
const docs = path.join(ROOT, 'docs');
if (!fs.existsSync(docs)) fs.mkdirSync(docs);
fs.writeFileSync(path.join(docs, 'index.html'), h);

console.log('built (' + (h.length / 1024 | 0) + ' KB):');
console.log('  web/claim-demo.html   → open locally in a browser');
console.log('  docs/index.html       → published by GitHub Pages');
