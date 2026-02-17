// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RouletteGame
 * @dev Lightweight on-chain roulette demo. Only supports red/black bets for simplicity.
 */
contract RouletteGame extends Ownable {
    enum BetChoice { Red, Black }

    struct Bet {
        uint256 amount;
        BetChoice choice;
        bool settled;
        bool won;
    }

    mapping(address => Bet) public bets;

    event BetPlaced(address indexed player, BetChoice indexed choice, uint256 amount);
    event BetSettled(address indexed player, bool indexed won, uint8 landing, uint256 payout);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function fundHouse() external payable onlyOwner {}

    function withdraw(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "insufficient balance");
        payable(owner()).transfer(amount);
    }

    function placeBet(BetChoice choice) external payable {
        Bet storage bet = bets[msg.sender];
        require(msg.value > 0, "bet required");
        require(!betSettlePending(bet), "existing bet pending");

        bets[msg.sender] = Bet({ amount: msg.value, choice: choice, settled: false, won: false });
        emit BetPlaced(msg.sender, choice, msg.value);
    }

    function spinWheel() external {
        Bet storage bet = bets[msg.sender];
        require(bet.amount > 0, "no bet");
        require(!bet.settled, "already settled");

        uint8 landing = _randomWheel();
        BetChoice outcome = landing % 2 == 0 ? BetChoice.Red : BetChoice.Black;

        bet.settled = true;
        bet.won = (outcome == bet.choice);

        uint256 payout = 0;
        if (bet.won) {
            payout = bet.amount * 2;
            require(address(this).balance >= payout, "house underfunded");
            payable(msg.sender).transfer(payout);
        }

        emit BetSettled(msg.sender, bet.won, landing, payout);
        delete bets[msg.sender];
    }

    function betSettlePending(Bet storage bet) internal view returns (bool) {
        return bet.amount > 0 && !bet.settled;
    }

    function _randomWheel() private view returns (uint8) {
        return uint8(uint256(keccak256(
            abi.encodePacked(blockhash(block.number - 1), block.timestamp, msg.sender)
        )) % 37);
    }
}
