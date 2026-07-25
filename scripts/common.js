const { Connection, Keypair, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const KEYDIR = path.join(ROOT, '.keys');
const STATE = path.join(ROOT, 'state.json');
const RPC = process.env.RPC_URL || 'https://api.devnet.solana.com';

function conn() { return new Connection(RPC, 'confirmed'); }
function keyPath(name) { return path.join(KEYDIR, name + '.json'); }
function loadKp(name) { return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(keyPath(name))))); }
function saveKp(name, kp) {
  if (!fs.existsSync(KEYDIR)) fs.mkdirSync(KEYDIR, { recursive: true });
  fs.writeFileSync(keyPath(name), JSON.stringify(Array.from(kp.secretKey)));
}
function hasKp(name) { return fs.existsSync(keyPath(name)); }
function state(upd) {
  let s = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE)) : {};
  if (upd) { s = { ...s, ...upd }; fs.writeFileSync(STATE, JSON.stringify(s, null, 1)); }
  return s;
}
module.exports = { conn, loadKp, saveKp, hasKp, state, RPC, ROOT, LAMPORTS_PER_SOL };
