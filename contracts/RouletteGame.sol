// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract RouletteGame is Ownable {
    enum BetChoice { Red, Black }

    struct Bet {
        uint256 amount;
        BetChoice choice;
        bool settled;
    }

    mapping(address => Bet) public bets;
    mapping(address => uint256) public claimable;

    event BetPlaced(address indexed player, BetChoice indexed choice, uint256 amount);
    event BetSettled(address indexed player, uint8 landing, bool won, uint256 reward);
    event Claimed(address indexed player, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function fundHouse() external payable onlyOwner {}

    function withdraw(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "insufficient");
        payable(owner()).transfer(amount);
    }

    function placeBet(BetChoice choice) external payable {
        Bet storage bet = bets[msg.sender];
        require(msg.value > 0, "bet required");
        require(bet.amount == 0, "existing bet pending");

        bets[msg.sender] = Bet({ amount: msg.value, choice: choice, settled: false });
        emit BetPlaced(msg.sender, choice, msg.value);
    }

    function spinWheel() external {
        Bet storage bet = bets[msg.sender];
        require(bet.amount > 0, "no bet");
        require(!bet.settled, "already settled");

        uint8 landing = _randomWheel();
        BetChoice outcome = landing % 2 == 0 ? BetChoice.Red : BetChoice.Black;

        bet.settled = true;
        uint256 reward = 0;
        if (outcome == bet.choice) {
            reward = bet.amount * 2;
            claimable[msg.sender] += reward;
        }

        emit BetSettled(msg.sender, landing, outcome == bet.choice, reward);
        delete bets[msg.sender];
    }

    function claim() external {
        uint256 amount = claimable[msg.sender];
        require(amount > 0, "nothing to claim");
        require(address(this).balance >= amount, "house underfunded");
        claimable[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        emit Claimed(msg.sender, amount);
    }

    function _randomWheel() private view returns (uint8) {
        return uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), block.timestamp, msg.sender))) % 37);
    }
}
