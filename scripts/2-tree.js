// Schritt 2: Merkle-Tree über alle Reward-Empfänger bauen.
// Der Root ist der einzige Wert, der on-chain landet — er "versiegelt" die komplette Auszahlungsliste.
const { utils } = require('@saberhq/merkle-distributor');
const { u64 } = require('@saberhq/token-utils');
const { PublicKey } = require('@solana/web3.js');
const { state } = require('./common.js');

const s = state();
const balances = s.nodes.map(n => ({
  account: new PublicKey(n.pubkey),
  amount: new u64(BigInt(n.reward) * 10n ** BigInt(s.decimals))
}));

const tree = new utils.BalanceTree(balances);
const root = tree.getRoot();
const proofs = s.nodes.map((n, i) =>
  tree.getProof(i, balances[i].account, balances[i].amount).map(b => Buffer.from(b).toString('hex'))
);
const maxTotalClaim = balances.reduce((acc, b) => acc.add(b.amount), new u64(0));

state({ root: Buffer.from(root).toString('hex'), proofs, maxTotalClaim: maxTotalClaim.toString(), maxNumNodes: s.nodes.length });

console.log('Merkle-Root:   ' + Buffer.from(root).toString('hex'));
console.log('maxTotalClaim: ' + maxTotalClaim.toString());
console.log('Empfänger:     ' + s.nodes.length);
console.log('\nJeder Empfänger bekommt einen "Proof" (Pfad im Baum) — damit beweist er beim Claim,');
console.log('dass sein Betrag Teil des versiegelten Roots ist. Proof-Längen: ' + proofs.map(p => p.length).join(', '));
