const ABI = [
  {"inputs":[{"internalType":"address","name":"initialOwner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":true,"internalType":"uint8","name":"choice","type":"uint8"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"BetPlaced","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":true,"internalType":"uint8","name":"landing","type":"uint8"},{"indexed":false,"internalType":"bool","name":"won","type":"bool"},{"indexed":false,"internalType":"uint256","name":"reward","type":"uint256"}],"name":"BetSettled","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Claimed","type":"event"},
  {"inputs":[],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint8","name":"choice","type":"uint8"}],"name":"placeBet","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[],"name":"spinWheel","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"bets","outputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint8","name":"choice","type":"uint8"},{"internalType":"bool","name":"settled","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"claimable","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
];

let CONTRACT_ADDRESS = "0xD1c5470EF2690a724f318c3f41bDBEC37D6DFC72";
const iface = new ethers.Interface(ABI);

const connectBtn = document.getElementById('connectBtn');
const statusEl = document.getElementById('status');
const betForm = document.getElementById('betForm');
const betButton = betForm.querySelector('button[type="submit"]');
const spinBtn = document.getElementById('spinBtn');
const claimBtn = document.getElementById('claimBtn');
const claimableEl = document.getElementById('claimable');
const logEl = document.getElementById('log');
const contractLink = document.getElementById('contractLink');
const resultEl = document.getElementById('resultText');
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const needle = document.getElementById('needle');

let provider, signer, contract;
let pendingBet = false;
let currentAngle = 0;
setContractAddress(CONTRACT_ADDRESS);

const wheelColors = { red: '#ff5f6d', black: '#1b222f', green: '#43f5a3' };

function setContractAddress(addr) {
  CONTRACT_ADDRESS = addr;
  contractLink.href = `https://sepolia.etherscan.io/address/${addr}`;
  contractLink.textContent = addr;
}

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

function describeResult(landing, won, reward) {
  const color = landing === 0 ? 'Green' : landing % 2 === 0 ? 'Red' : 'Black';
  resultEl.textContent = `Landed ${landing} (${color}). ${won ? 'You earned ' + reward + ' ETH!' : 'House wins.'}`;
}

async function refreshState() {
  if (!contract || !signer) return;
  try {
    const address = await signer.getAddress();
    const bet = await contract.bets(address);
    pendingBet = bet.amount > 0n;
    const claimableValue = await contract.claimable(address);
    claimableEl.textContent = ethers.formatEther(claimableValue);
    claimBtn.disabled = claimableValue === 0n;
    if (pendingBet) appendLog('Pending bet detected. Spin to resolve.');
  } catch (err) {
    console.error(err);
  } finally {
    setButtons();
  }
}

async function ensureContract() {
  if (!contract && signer && CONTRACT_ADDRESS) {
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
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
    await ensureContract();
    const address = await signer.getAddress();
    statusEl.textContent = `Connected as ${address}`;
    appendLog('Wallet connected.');
    await refreshState();
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
      const reward = ethers.formatEther(parsed.args.reward);
      drawWheel(landing);
      await animateNeedleTo(landing);
      describeResult(landing, won, reward);
    }
    appendLog('Spin complete.');
    pendingBet = false;
  } catch (err) {
    console.error(err);
    appendLog(`Spin error: ${err.shortMessage || err.message}`);
  } finally {
    await refreshState();
  }
});

claimBtn.addEventListener('click', async () => {
  if (!contract) return alert('Connect first.');
  try {
    claimBtn.disabled = true;
    const tx = await contract.claim();
    appendLog('Claim pending...');
    await tx.wait();
    appendLog('Winnings claimed.');
  } catch (err) {
    console.error(err);
    appendLog(`Claim error: ${err.shortMessage || err.message}`);
  } finally {
    await refreshState();
  }
});

function animateNeedleTo(landing) {
  const targetSlice = landing + 0.5;
  const slice = 360 / 37;
  const targetAngle = (4 + Math.random() * 2) * 360 + targetSlice * slice;
  const startAngle = currentAngle % 360;
  const delta = targetAngle - startAngle;
  const duration = 2400;

  return new Promise((resolve) => {
    const start = performance.now();
    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const angle = startAngle + delta * eased;
      needle.style.transform = `translateX(-50%) rotate(${angle}deg)`;
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        currentAngle = angle;
        resolve();
      }
    }
    requestAnimationFrame(frame);
  });
}

setButtons();
