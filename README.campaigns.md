# Campaign & CampaignFactory(TENTATIVE TO BE EDITED)
This repository contains a minimal crowdfunding-style system with two contracts:

- **`Campaign.sol`** — a single fundraising campaign with:
  - `owner` (the organizer) and a set of `verifiers` (addresses allowed to verify milestones or proposals).
  - Public metadata: `name`, `deadline`, and `milestones` (an array of target checkpoints).
  - Contribution flow via `donate()` (payable), tracking `totalRaised` and per-address contributions.
  - Verifier management: `isVerifier(address)`, `addVerifier(address)`, `removeVerifier(address)` (owner-only).
  - (Optional in your version) proposal/milestone progression and refund logic; events such as `FundsReturned` are emitted when refunds occur.

- **`CampaignFactory.sol`** — a factory that deploys new `Campaign` instances and indexes them:
  - `create(string name, address[] verifiers, uint256 deadline, uint256[] milestones)` to launch a new campaign.
  - Query helpers: `getAllCampaigns()`, `campaignsCount()`, and `getCampaign(uint256 index)`.

> **Note:** The exact behavior depends on your current `Campaign.sol` version. The tests below focus on behaviors that are visible in the public interface (owner/verifier management, metadata, donations) and the factory registry functions.

## Development

This project assumes **Hardhat** and **ethers.js** (via Hardhat) with Node 18+.

```bash
npm install
npx hardhat compile
```

If the contracts import OpenZeppelin contracts (e.g. `ReentrancyGuard`), install OZ:

```bash
npm install @openzeppelin/contracts
```

## Tests

- Your original tests live in `CampaignTest.js`.
- **Additional tests** are provided in `CampaignTest.extra.js` and **do not overwrite** your existing suite.
- They cover:
  - Factory registry integrity (`campaignsCount`, `getAllCampaigns`, and revert on invalid index).
  - Initial verifier set by the factory; `addVerifier`/`removeVerifier` flows; only-owner access control; duplicate add/remove reverts.
  - Donation edge cases (revert on zero-value) and on-chain balance effect.
  - Field storage checks for names, deadlines, and milestone array values across multiple campaigns.
  - Ownership expectation for newly created campaigns.

Run all tests:

```bash
npx hardhat test
```

Run only the additional suite:

```bash
npx hardhat test test/CampaignTest.extra.js
```

> If your repository places tests under a `test/` folder, move `CampaignTest.extra.js` there. The file is self-contained and re-deploys a fresh `CampaignFactory` to avoid cross-test interference.

## Notes on Expectations

- The donation/balance test asserts that the contract balance increases by the donated amount. If your `Campaign` forwards funds immediately (e.g., to an escrow or vault), you can adjust that assertion to match actual flow.
- The only-owner tests use generic `.to.be.reverted` because revert strings for access control may vary by implementation. If your `onlyOwner` modifier uses a specific revert message, you can switch to `.to.be.revertedWith("<message>")` for stronger guarantees.
- If you expose additional governance/proposal methods, consider adding tests for:
  - Proposal creation by verifiers/owner,
  - Milestone approvals and state transitions,
  - Refund triggers and `FundsReturned` events,
  - Guardrails (deadline checks, reentrancy, double-claim prevention).