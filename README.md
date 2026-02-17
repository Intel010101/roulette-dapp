# Roulette Dapp

On-chain roulette demo for Sepolia. Players place a red/black bet, spin the wheel, and immediate winnings are transferred if the guess is right.

- **Deployed contract:** `0x53d358d2114b20C4cECBE411Fb1e9eF8F89F4705` (Sepolia)
- **Frontend:** static client under `frontend/` (hosted via GitHub Pages)

## Contracts

`contracts/RouletteGame.sol` — houses bankroll, tracks one pending bet per player, pseudo-random wheel based on blockhash.

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

Serve `frontend/` locally (or visit the hosted link) to interact with the contract via MetaMask.
```
npx serve frontend
```
