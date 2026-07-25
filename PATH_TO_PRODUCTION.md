# From prototype to production — an outline

*Written by the author of this prototype, as a starting point for discussion. Nothing here is decided; every step needs the foundation, the DAO, or both.*

---

## What already works

A payout round is live on devnet: rewards for five pNodes sealed into a Merkle tree, all five claimed successfully. The mechanism is not in question — it is the standard approach for token distribution on Solana and the program used has handled airdrops orders of magnitude larger.

## What is missing, and who owns it

The prototype is an empty machine. Three things have to come from outside, and none of them is a coding problem:

**1. The authoritative reward list.** Someone has to state, with authority, which wallet earned how much for a given period. That calculation lives in Xandeum's backend (pod credits) and rests on a policy decision — does uptime count, stored bytes, boost NFTs, stake? A volunteer cannot invent this list; it has to come from the foundation or be defined by the DAO.

**2. The tokens.** A distributor is funded up front with the full amount for that round. Those XAND sit in the foundation/DAO treasury. Moving them requires whoever controls that treasury.

**3. A mandate.** Even a technically perfect payout system is meaningless if operators have no reason to trust that the list and the funding are legitimate.

## A possible sequence

**Step 1 — Show it, gather objections.** Post the prototype, let people click through it, collect criticism. If the approach is wrong, better to learn that now. *(This is where the project stands today.)*

**Step 2 — Agree on the reward formula.** Not code: a written rule that anyone can recompute from public data. Ideally the credits API stays the source, so any operator can reproduce the list and verify the Merkle root independently. Without reproducibility, this is just a different opaque process.

**Step 3 — Decide the custody model.** A payout round must be funded, and nobody should be able to do that alone — least of all a volunteer. The usual answer on Solana is a **multisig** (Squads is the common choice): the foundation and a few trusted signers approve funding together. My own position: I am happy to prepare rounds, publish trees and roots, and maintain the tooling — but I do not want, and should not have, sole access to treasury funds.

**Step 4 — Run one real round, small.** One period, real XAND, a limited group of operators, mainnet. Publish the list and root beforehand so people can verify before anything moves. A small failure is recoverable; a big one is not.

**Step 5 — Make it routine.** Once a round works end to end, it is a monthly script run plus one multisig approval, and the claim page stays up permanently. Old rounds remain claimable — that alone would fix the "approved but never executed" problem that started this.

## What I am offering

I am a cameraman, not a Solana developer. What I can realistically carry:

- maintaining and documenting the tooling, keeping it runnable by others
- preparing payout rounds: generating trees, publishing lists and roots, hosting the claim page
- testing on devnet before anything touches mainnet
- answering operator questions and keeping the community informed

What should **not** rest on me alone:

- the reward formula (foundation/DAO)
- custody of treasury funds (multisig, several signers)
- a security review before real value moves — ideally someone who actually writes Rust looks at this

If someone with more Solana experience wants to take it over entirely, that is a good outcome too. The point was never to own this.

## Open questions for the foundation

1. Is the credits API a suitable and stable source for reward calculation?
2. Who controls the treasury today, and would a multisig for payout rounds be acceptable?
3. Is there an existing internal effort along these lines that this should defer to?
4. What would the foundation need to see before a first real round?

---

*Prototype: https://github.com/oliverbrosenbauer-cloud/pnode-merkle-distributor · devnet only, play money.*
