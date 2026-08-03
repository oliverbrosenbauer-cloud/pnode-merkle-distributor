// Step 2: build the Merkle tree over all reward recipients.
// The root is the only value that goes on-chain — it seals the entire payout list.
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

console.log('Merkle root:   ' + Buffer.from(root).toString('hex'));
console.log('maxTotalClaim: ' + maxTotalClaim.toString());
console.log('Recipients:    ' + s.nodes.length);
console.log('\nEach recipient gets a proof — the path through the tree — which proves at claim time');
console.log('that their amount is part of the sealed root. Proof lengths: ' + proofs.map(p => p.length).join(', '));
