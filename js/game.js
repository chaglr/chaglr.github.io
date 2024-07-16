let peer;
let conn;
let myColor;
let gameState = {
    points: Array(24).fill().map(() => ({ player: null, count: 0 })),
    dice: [],
    currentPlayer: 'white'
};

const createGameButton = document.getElementById('create-game');
const joinGameSection = document.getElementById('join-game-section');
const joinGameButton = document.getElementById('join-game');
const peerIdInput = document.getElementById('peer-id-input');
const gameIdDisplay = document.getElementById('game-id-display');
const connectionContainer = document.getElementById('connection-container');
const gameContainer = document.getElementById('game-container');
const loadingDisplay = document.getElementById('loading');
const rollDiceButton = document.getElementById('roll-dice');
const diceDisplay = document.getElementById('dice');
const messageDisplay = document.getElementById('message');
const board = document.getElementById('board');

function initializePeer() {
    loadingDisplay.classList.remove('hidden');
    peer = new Peer();
    peer.on('open', (id) => {
        createGameButton.disabled = false;
        loadingDisplay.classList.add('hidden');
    });
    peer.on('error', (error) => {
        console.error('PeerJS error:', error);
        loadingDisplay.textContent = 'Error initializing. Please refresh the page.';
    });
}

initializePeer();

createGameButton.addEventListener('click', () => {
    if (peer && peer.id) {
        myColor = 'white';
        gameIdDisplay.textContent = `Game ID: ${peer.id}`;
        gameIdDisplay.classList.remove('hidden');
        createGameButton.classList.add('hidden');
        joinGameSection.classList.remove('hidden');
    } else {
        console.error('Peer ID is not available');
        loadingDisplay.textContent = 'Error creating game. Please try again.';
        loadingDisplay.classList.remove('hidden');
    }
});

joinGameButton.addEventListener('click', () => {
    const peerId = peerIdInput.value.trim();
    if (peerId) {
        conn = peer.connect(peerId);
        setupConnection();
        myColor = 'black';
    } else {
        alert('Please enter a valid Game ID');
    }
});

peer.on('connection', (connection) => {
    conn = connection;
    setupConnection();
});

function setupConnection() {
    conn.on('open', () => {
        connectionContainer.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        initializeBoard();
        updateBoard();
        updateTurnDisplay();
    });

    conn.on('data', (data) => {
        if (data.type === 'gameState') {
            gameState = data.state;
            updateBoard();
            updateTurnDisplay();
        }
    });

    conn.on('error', (error) => {
        console.error('Connection error:', error);
        alert('Connection error. Please try again.');
    });
}

function initializeBoard() {
    gameState.points[0] = { player: 'white', count: 2 };
    gameState.points[5] = { player: 'black', count: 5 };
    gameState.points[7] = { player: 'black', count: 3 };
    gameState.points[11] = { player: 'white', count: 5 };
    gameState.points[12] = { player: 'black', count: 5 };
    gameState.points[16] = { player: 'white', count: 3 };
    gameState.points[18] = { player: 'white', count: 5 };
    gameState.points[23] = { player: 'black', count: 2 };
}

function updateBoard() {
    board.innerHTML = '';
    for (let i = 0; i < 24; i++) {
        const point = document.createElement('div');
        point.className = `point ${i < 12 ? 'point-bottom' : 'point-top'}`;
        point.style.left = `${(i % 12) * 58 + (i < 12 ? 0 : 350)}px`;
        point.style.borderColor = i % 2 === 0 ? '#8B4513' : '#D2691E';
        point.onclick = () => handlePointClick(i);

        const { player, count } = gameState.points[i];
        for (let j = 0; j < count; j++) {
            const checker = document.createElement('div');
            checker.className = 'checker';
            checker.style.backgroundColor = player === 'white' ? 'white' : 'black';
            checker.style.bottom = i < 12 ? `${j * 50}px` : 'auto';
            checker.style.top = i >= 12 ? `${j * 50}px` : 'auto';
            point.appendChild(checker);
        }

        board.appendChild(point);
    }
}

rollDiceButton.addEventListener('click', () => {
    if (gameState.currentPlayer === myColor && gameState.dice.length === 0) {
        gameState.dice = [rollDie(), rollDie()];
        diceDisplay.textContent = `Dice: ${gameState.dice.join(', ')}`;
        sendGameState();
    }
});

function rollDie() {
    return Math.floor(Math.random() * 6) + 1;
}

function handlePointClick(pointIndex) {
    // Implement move logic here
    console.log(`Clicked point: ${pointIndex}`);
}

function updateTurnDisplay() {
    const isMyTurn = gameState.currentPlayer === myColor;
    rollDiceButton.disabled = !isMyTurn || gameState.dice.length > 0;
    messageDisplay.textContent = isMyTurn ? "Your turn" : "Opponent's turn";
}

function sendGameState() {
    if (conn && conn.open) {
        conn.send({ type: 'gameState', state: gameState });
    }
}
