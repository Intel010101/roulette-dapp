const ABI = [
  {"inputs":[{"internalType":"address","name":"initialOwner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":true,"internalType":"uint8","name":"choice","type":"uint8"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"BetPlaced","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":true,"internalType":"bool","name":"won","type":"bool"},{"indexed":false,"internalType":"uint8","name":"landing","type":"uint8"},{"indexed":false,"internalType":"uint256","name":"payout","type":"uint256"}],"name":"BetSettled","type":"event"},
  {"inputs":[],"name":"fundHouse","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint8","name":"choice","type":"uint8"}],"name":"placeBet","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[],"name":"spinWheel","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"bets","outputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint8","name":"choice","type":"uint8"},{"internalType":"bool","name":"settled","type":"bool"},{"internalType":"bool","name":"won","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}
];

const CONTRACT_ADDRESS = "0x53d358d2114b20C4cECBE411Fb1e9eF8F89F4705";
const connectBtn = document.getElementById('connectBtn');
const statusEl = document.getElementById('status');
const betForm = document.getElementById('betForm');
const spinBtn = document.getElementById('spinBtn');
const logEl = document.getElementById('log');
const contractLink = document.getElementById('contractLink');
contractLink.href = `https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`;
contractLink.textContent = CONTRACT_ADDRESS;

let provider, signer, contract;

function appendLog(message) {
  const time = new Date().toLocaleTimeString();
  logEl.textContent = `[${time}] ${message}\n` + logEl.textContent;
}

connectBtn.addEventListener('click', async () => {
  if (!window.ethereum) {
    alert('Install MetaMask to play.');
    return;
  }
  try {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    const address = await signer.getAddress();
    statusEl.textContent = `Connected as ${address}`;
    appendLog('Wallet connected.');
  } catch (err) {
    console.error(err);
    appendLog(`Connect failed: ${err.message}`);
  }
});

betForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!contract) return alert('Connect wallet first.');
  try {
    const amount = document.getElementById('betAmount').value;
    const choice = Number(document.getElementById('betChoice').value);
    const tx = await contract.placeBet(choice, { value: ethers.parseEther(amount) });
    appendLog('Bet pending...');
    await tx.wait();
    appendLog('Bet placed. Spin when ready.');
  } catch (err) {
    console.error(err);
    appendLog(`Bet error: ${err.shortMessage || err.message}`);
  }
});

spinBtn.addEventListener('click', async () => {
  if (!contract) return alert('Connect wallet first.');
  try {
    const tx = await contract.spinWheel();
    appendLog('Spin pending...');
    await tx.wait();
    appendLog('Spin complete. Check payout in wallet / logs.');
  } catch (err) {
    console.error(err);
    appendLog(`Spin error: ${err.shortMessage || err.message}`);
  }
});
