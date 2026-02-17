# Roulette Dapp

On-chain roulette demo for Sepolia. Players place a red/black bet, spin the wheel, and winnings accrue to a claimable balance when you guess correctly; claim them via the UI.

- **Deployed contract:** `0xD1c5470EF2690a724f318c3f41bDBEC37D6DFC72` (Sepolia)
- **Frontend:** static client under `frontend/` (hosted via GitHub Pages)

## Contracts

`contracts/RouletteGame.sol` — houses bankroll, tracks one pending bet per player, stores claimable winnings instead of auto-sending, pseudo-random wheel based on blockhash.

## Setup

```bash
npm install --legacy-peer-deps
cp .env.example .env  # fill PRIVATE_KEY + RPC
```

`.env` example:
```
PRIVATE_KEY=0x...
SEPOLIA_RPC_URL=https://rpc.sentio.xyz/sepolia
```

## Deploy

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Fund the contract as owner via `fundHouse()` to ensure payouts.

## Frontend

Serve `docs/` locally (or visit the hosted link) to interact with the contract via MetaMask.
```
npx serve docs
```
