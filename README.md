# pNode Rewards — Merkle-Distributor Prototype

A small, working prototype of **automatic pNode reward payouts** on Solana, built as a community experiment for the [Xandeum](https://xandeum.network) network.

Everything here runs on **Solana devnet with play money**. No real funds, no real reward ledger, no claim to be the official implementation. It exists to make a discussion concrete: *this is roughly what automated payouts could look like, and here is a version you can click through today.*

---

## The problem it addresses

pNode and vNode rewards have so far been paid out through **monthly DAO proposals**. Each operator has to find their proposal, connect the exact wallet from their registration form, and hit "Execute". In practice a lot of approved payouts simply sit there unclaimed — some for months — because nobody realises they are still pending. Creating and maintaining those proposals is manual work for the foundation, every single month.

## The approach

Instead of one proposal per month per group, the reward list is **sealed into a Merkle tree**:

1. **Off-chain:** a script computes what each operator earned (in the real system: from pod credits) and builds a Merkle tree over `(index, wallet, amount)`.
2. **On-chain:** a *distributor* account stores only the **Merkle root** (32 bytes) plus the total amount and number of recipients. The whole payout list is cryptographically committed to by that one value.
3. **Claim:** each operator submits their entry plus a **proof** — the path through the tree. The program verifies the proof against the root, pays out, and marks that index as claimed so it can never be claimed twice.

What this changes:

- Payouts are **available permanently**, not tied to a proposal that expires or gets lost. Nothing goes stale.
- **One transaction** creates a payout round for any number of recipients — 5 or 5,000 makes no difference to the on-chain cost.
- Only the **registered wallet** can claim its own entry; the proof is worthless to anyone else.
- Anyone can **verify** the root and reproduce the tree from the published reward list.

The trade-off worth naming: operators still have to claim actively. A true push-payout would need the program to send funds unprompted, which costs the payer a transaction per recipient. The Merkle approach shifts that cost to whoever collects — which is exactly how the JTO, Jupiter and Wormhole airdrops handled it at scale.

## What is *not* here

- No integration with real pod credits — reward amounts come from an example file.
- The reward *calculation* is the interesting policy question (uptime? storage? boost NFTs?) and is deliberately left out.
- Not audited, not hardened, no upgrade path. It is a prototype.

---

## The program

This does **not** implement a new on-chain program. It uses [`@saberhq/merkle-distributor`](https://github.com/saber-hq/merkle-distributor) (Apache-2.0), already deployed on devnet at `MRKGLMizK9XSTaD1d1jbVkdHZbQVCSnPpYiTw9aKQv8`. It is the same design Jito forked for the JTO airdrop and is about as battle-tested as this category gets. Writing a fresh distributor from scratch would add risk without adding anything.

## Run it yourself

```bash
npm install

npm run keys      # 1) create project wallet + 5 test wallets
                  #    → fund the printed project wallet with devnet SOL
                  #      (faucet.solana.com, ~0.5 SOL is plenty)

npm run tree      # 2) build the Merkle tree, print the root
npm run setup     # 3) mint the dummy token, create + fund the distributor
npm run claim 0   # 4) claim for recipient #0 from the command line

npm run bundle    # 5) build the browser bundle
npm run page      #    → open web/claim-demo.html
```

`state.json` and `.keys/` hold generated addresses and secrets and are git-ignored.

### The claim page

`web/claim-demo.html` is a single self-contained file: five pNode cards with their credits and reward, a live progress bar reading the distributor account, and a claim button per node. Claimed entries are detected on-chain and lock themselves. Every transaction links into the Solana Explorer.

For clickability the five demo wallets are embedded in the page — devnet play money, nothing else. In a real deployment the operator connects their own wallet instead, and the program still only accepts a claim signed by the wallet recorded in the tree.

## Layout

```
rewards.example.json   input: who earned what
scripts/1-keys.js      generate project + test wallets
scripts/2-tree.js      build Merkle tree, compute root and proofs
scripts/3-setup.js     mint token, create distributor, fund it
scripts/4-claim.js     claim from the CLI
scripts/5-page.js      assemble the standalone claim page
web/claim-shell.html   UI template
```

---

Built by a pNode operator, not a professional Solana developer — corrections and pull requests are welcome. If any of this is useful to the Xandeum foundation, take it, fork it, rewrite it.

MIT licensed. Devnet only.

## How the claim page works at scale

The page has two modes:

**Operator mode (default).** Connect the wallet you registered your pNode with, or paste its address to look up your entry without connecting. You only ever see your own row — with 300 recipients nobody wants to scroll through 300 cards to find themselves. The program enforces the same thing on-chain: a claim is only valid when signed by the wallet recorded in the tree.

**Demo mode (collapsed).** Five test wallets embedded in the page so anyone can click through the full flow without a wallet or any setup. Devnet play money. A real deployment ships no keys at all.

Claim status is read with one batched `getMultipleAccounts` call per 100 recipients rather than one call per recipient — that is what keeps the page responsive as the list grows. Merkle proofs grow logarithmically: 5 recipients need 3 hashes, 300 need at most 9. Building a tree over 300 recipients and all their proofs takes under 100 ms.
