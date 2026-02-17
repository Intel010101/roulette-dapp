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
const iface = new ethers.Interface(ABI);

const connectBtn = document.getElementById('connectBtn');
const statusEl = document.getElementById('status');
const betForm = document.getElementById('betForm');
const betButton = betForm.querySelector('button[type="submit"]');
const spinBtn = document.getElementById('spinBtn');
const logEl = document.getElementById('log');
const contractLink = document.getElementById('contractLink');
const resultEl = document.getElementById('resultText');
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
contractLink.href = `https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`;
contractLink.textContent = CONTRACT_ADDRESS;

let provider, signer, contract;
let pendingBet = false;

const wheelColors = {
  red: '#ff5f6d',
  black: '#1b222f',
  green: '#43f5a3'
};

function drawWheel(highlight = null) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = cx - 10;
  const slice = (Math.PI * 2) / 37;

  for (let i = 0; i < 37; i++) {
    const start = i * slice;
    const end = start + slice;
    let color;
    if (i === 0) color = wheelColors.green;
    else color = i % 2 === 0 ? wheelColors.red : wheelColors.black;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  if (highlight !== null) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius + 5, highlight * slice, (highlight + 1) * slice);
    ctx.closePath();
    ctx.strokeStyle = '#ffd66c';
    ctx.lineWidth = 6;
    ctx.stroke();
  }

  ctx.fillStyle = '#ffd66c';
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius - 20);
  ctx.lineTo(cx - 12, cy - radius - 5);
  ctx.lineTo(cx + 12, cy - radius - 5);
  ctx.closePath();
  ctx.fill();
}

drawWheel();

function appendLog(message) {
  const time = new Date().toLocaleTimeString();
  logEl.textContent = `[${time}] ${message}\n` + logEl.textContent;
}

function setButtons() {
  betButton.disabled = !signer || pendingBet;
  spinBtn.disabled = !pendingBet;
}

function describeResult(landing, won, payout) {
  const color = landing === 0 ? 'Green' : landing % 2 === 0 ? 'Red' : 'Black';
  resultEl.textContent = `Landed ${landing} (${color}). ${won ? 'You won ' + payout + ' ETH!' : 'House wins.'}`;
}

async function refreshPendingState() {
  if (!contract || !signer) return;
  try {
    const address = await signer.getAddress();
    const bet = await contract.bets(address);
    pendingBet = bet.amount > 0n;
    if (pendingBet) {
      appendLog('Pending bet detected. Spin to resolve.');
    }
  } catch (err) {
    console.error('refresh state error', err);
  } finally {
    setButtons();
  }
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
    await refreshPendingState();
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
    betButton.disabled = true;
    const tx = await contract.placeBet(choice, { value: ethers.parseEther(amount) });
    appendLog('Bet pending...');
    await tx.wait();
    appendLog('Bet placed. Spin when ready.');
    pendingBet = true;
  } catch (err) {
    console.error(err);
    appendLog(`Bet error: ${err.shortMessage || err.message}`);
  } finally {
    setButtons();
  }
});

spinBtn.addEventListener('click', async () => {
  if (!contract) return alert('Connect wallet first.');
  if (!pendingBet) return alert('Place a bet first.');
  try {
    spinBtn.disabled = true;
    const tx = await contract.spinWheel();
    appendLog('Spin pending...');
    const receipt = await tx.wait();
    const log = receipt.logs.find((l) => l.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase());
    if (log) {
      const parsed = iface.parseLog(log);
      const landing = Number(parsed.args.landing);
      const won = parsed.args.won;
      const payout = ethers.formatEther(parsed.args.payout);
      drawWheel(landing);
      describeResult(landing, won, payout);
    }
    appendLog('Spin complete.');
    pendingBet = false;
  } catch (err) {
    console.error(err);
    appendLog(`Spin error: ${err.shortMessage || err.message}`);
  } finally {
    await refreshPendingState();
  }
});

setButtons();
