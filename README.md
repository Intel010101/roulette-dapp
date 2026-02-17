# Roulette Dapp

On-chain roulette demo for Sepolia. Players place a red/black bet, spin the wheel, and immediate winnings are transferred if the guess is right.

## Contracts

- `RouletteGame.sol` – houses bankroll, tracks a single pending bet per player, pseudo-random wheel using blockhash.

## Setup

```bash
npm install --legacy-peer-deps
cp .env.example .env # then fill private key + RPC
```

`.env`:
```
PRIVATE_KEY=0x...
SEPOLIA_RPC_URL=https://rpc.sentio.xyz/sepolia
```

## Deploy

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Fund the contract as owner via `fundHouse()` to ensure payouts.

## Frontend (coming later)

This repo currently focuses on the Solidity contract + deployment tooling so it can be wired into a roulette UI. Add your preferred stack (Next.js, Vite, etc.) and hook into the contract with wagmi/ethers.
