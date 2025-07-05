document.addEventListener('DOMContentLoaded', function() {
    let boxes = document.querySelectorAll(".box");
    let resetBtn = document.querySelector("#resetBtn");
    let game = document.querySelector("#game");
    let msgtext = document.querySelector("#msg-text");
    let msg = document.querySelector("#msg");
    
    
    // Scoreboard variables
    let playerScore = 0;
    let computerScore = 0;
    let drawScore = 0;
    
    // Game mode: true = vs computer, false = 2 players
    let vsComputer = true;
    
    // Add a toggle button for game mode
    let modeBtn = document.querySelector('#modeBtn');
    modeBtn.onclick = () => {
        vsComputer = !vsComputer;
        modeBtn.innerText = vsComputer ? 'Switch to 2 Player Mode' : 'Switch to Computer Mode';
        document.getElementById('player2Name').innerText = vsComputer ? "Computer" : userName2;
        updateModeUI();
        resetGame();
    };
    
    // Add hard mode toggle
    let hardMode = false;
    let hardBtn = document.querySelector('#hardBtn');
    hardBtn.onclick = () => {
        hardMode = !hardMode;
        hardBtn.innerText = hardMode ? 'Switch to Easy Mode' : 'Switch to Hard Mode';
        if (vsComputer) {
            resetGame();
        }
    };
    
    // Add user name input
    let userName = "Player 1";
    let userName2 = "Player 2";
    let setNameBtn = document.querySelector('#setNameBtn');
    let userNameInput = document.querySelector('#userNameInput');
    let userNameInput2 = document.querySelector('#userNameInput2');

    function speakWelcome(name) {
        if ('speechSynthesis' in window) {
            const msg = new SpeechSynthesisUtterance(`Welcome ${name} on tic tac toe game`);
            msg.rate = 0.8; // Slightly slower for clarity
            msg.pitch = 1.1; // Slightly higher pitch for clarity
            // Try to select an Indian English voice if available
            const voices = window.speechSynthesis.getVoices();
            const indianVoice = voices.find(v => v.lang === 'en-IN');
            if (indianVoice) {
                msg.voice = indianVoice;
            }
            window.speechSynthesis.speak(msg);
        }
    }

    setNameBtn.onclick = function() {
        const val1 = userNameInput.value.trim();
        const val2 = userNameInput2.value.trim();
        userName = val1 ? val1 : "Player 1";
        userName2 = val2 ? val2 : "Player 2";
        document.getElementById('player1Name').innerText = userName;
        document.getElementById('player2Name').innerText = vsComputer ? "Computer" : userName2;
        if (userName !== "Player 1") {
            speakWelcome(userName); // Speak welcome for player 1 if custom name entered
        }
        if (!vsComputer && userName2 !== "Player 2") {
            speakWelcome(userName2); // Speak welcome for player 2 if custom name entered and 2 player mode
        }
        // Do not call resetGame here, just update names
    };
    
    let turnO = true;
    let count = 0;
    
    const winPatterns = [
        [0,1,2],
        [3,4,5],
        [6,7,8],
        [0,3,6],
        [1,4,7],
        [2,5,8], 
        [0,4,8],
        [2,4,6] 
    ];
    
    const resetGame= () => {
        turnO = true;
        count = 0;
        enableBoxes();
        msgtext.classList.add("hide");
        // Do NOT reset names or scores here
    };
    
    // Add a function to reset only the scores
    function resetScores() {
        playerScore = 0;
        computerScore = 0;
        drawScore = 0;
        updateScoreboard();
    }
    
    function resetScoresAndNames() {
        playerScore = 0;
        computerScore = 0;
        drawScore = 0;
        userName = "Player 1";
        userName2 = "Player 2";
        userNameInput.value = "";
        userNameInput2.value = "";
        updateScoreboard();
    }
    
    function resetScoresAndNamesAndBoard() {
        playerScore = 0;
        computerScore = 0;
        drawScore = 0;
        userName = "Player 1";
        userName2 = "Player 2";
        userNameInput.value = "";
        userNameInput2.value = "";
        updateScoreboard();
        enableBoxes(); // This will clear all X and O from the board
        msgtext.classList.add("hide");
        turnO = true;
        count = 0;
    }
    
    boxes.forEach((box, idx) => {
        box.addEventListener("click", () => {
            if (box.innerText !== "") return;
            document.getElementById('clickSound').play(); // Play click sound
            if (turnO) {
                box.innerText = "O";
                turnO = false;
            } else {
                box.innerText = "X";
                turnO = true;
            }
            box.disabled = true;
            count++;
            if (checkWinner()) {
                // Winner found, do nothing
            } else if (count === 9) {
                gameDraw();
            } else if (vsComputer && !turnO) {
                if (hardMode) {
                    setTimeout(computerMove, 400);
                } else {
                    computerMove();
                }
            }
        });
    });
    
    function computerMove() {
        if (!vsComputer) return; // Prevent computer move in 2 Player mode
        let move;
        if (hardMode) {
            // Always use Minimax for hard mode (optimal)
            move = getBestMove();
        } else {
            // Easy mode: random, but still block if player is about to win
            move = getBlockingOrRandomMove();
        }
        if (move === undefined) return;
        boxes[move].innerText = "X";
        boxes[move].disabled = true;
        turnO = true;
        count++;
        if (checkWinner()) {
            // Winner found
        } else if (count === 9) {
            gameDraw();
        }
    }
    
    function getBlockingOrRandomMove() {
        // 1. Try to win
        for (let pattern of winPatterns) {
            let [a, b, c] = pattern;
            let vals = [boxes[a].innerText, boxes[b].innerText, boxes[c].innerText];
            // If computer has 2 in a row and third is empty, win
            if (vals.filter(v => v === "X").length === 2 && vals.includes("")) {
                return pattern[vals.indexOf("")];
            }
        }
        // 2. Try to block player
        for (let pattern of winPatterns) {
            let [a, b, c] = pattern;
            let vals = [boxes[a].innerText, boxes[b].innerText, boxes[c].innerText];
            // If player has 2 in a row and third is empty, block it
            if (vals.filter(v => v === "O").length === 2 && vals.includes("")) {
                return pattern[vals.indexOf("")];
            }
        }
        // 3. Otherwise, pick random
        let empty = [];
        boxes.forEach((box, i) => {
            if (box.innerText === "") empty.push(i);
        });
        if (empty.length === 0) return undefined;
        return empty[Math.floor(Math.random() * empty.length)];
    }
    
    function getBestMove() {
        // Minimax algorithm for hard mode
        let bestScore = -Infinity;
        let move;
        for (let i = 0; i < boxes.length; i++) {
            if (boxes[i].innerText === "") {
                boxes[i].innerText = "X";
                let score = minimax(0, false);
                boxes[i].innerText = "";
                if (score > bestScore) {
                    bestScore = score;
                    move = i;
                }
            }
        }
        return move;
    }
    
    function minimax(depth, isMaximizing) {
        let winner = getWinnerForMinimax();
        if (winner !== null) {
            if (winner === "X") return 10 - depth;
            if (winner === "O") return depth - 10;
            if (winner === "draw") return 0;
        }
        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < boxes.length; i++) {
                if (boxes[i].innerText === "") {
                    boxes[i].innerText = "X";
                    let score = minimax(depth + 1, false);
                    boxes[i].innerText = "";
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < boxes.length; i++) {
                if (boxes[i].innerText === "") {
                    boxes[i].innerText = "O";
                    let score = minimax(depth + 1, true);
                    boxes[i].innerText = "";
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }
    
    function getWinnerForMinimax() {
        for (let pattern of winPatterns) {
            let a = boxes[pattern[0]].innerText;
            let b = boxes[pattern[1]].innerText;
            let c = boxes[pattern[2]].innerText;
            if (a !== "" && a === b && b === c) return a;
        }
        let isDraw = true;
        for (let i = 0; i < boxes.length; i++) {
            if (boxes[i].innerText === "") isDraw = false;
        }
        if (isDraw) return "draw";
        return null;
    }
    
    const disableBoxes = () =>{
        for(let box of boxes){
            box.disabled = true;
        }
    };
    
    const enableBoxes = () => {
        for(let box of boxes){
            box.disabled = false;
            box.innerText = "";
        }
    };
    
    const showWinner= (Winner) => {
        let winnerDisplay = Winner;
        if (vsComputer) {
            if (Winner === "O") winnerDisplay = userName;
            else if (Winner === "X") winnerDisplay = "Computer";
        } else {
            if (Winner === "O") winnerDisplay = userName;
            else if (Winner === "X") winnerDisplay = userName2;
        }
        msg.innerText = `Congratulation, Winner is ${winnerDisplay}`;
        msgtext.classList.remove("hide");
        disableBoxes();
        document.getElementById('winSound').play(); // Play win sound
        if (vsComputer) {
            if (Winner === "O") playerScore++;
            else if (Winner === "X") computerScore++;
        } else {
            if (Winner === "O") playerScore++;
            else if (Winner === "X") computerScore++;
        }
        updateScoreboard();
    };
    
    const gameDraw = () => {
        msg.innerText = "Game Draw!";
        msgtext.classList.remove("hide");
        disableBoxes();
        drawScore++;
        document.getElementById('drawSound').play(); // Play draw sound
        updateScoreboard();
    };
    
    function updateScoreboard() {
        document.getElementById('playerScore').innerText = playerScore;
        document.getElementById('computerScore').innerText = computerScore;
        document.getElementById('drawScore').innerText = drawScore;
    }
    
    const checkWinner = () => {
        for(let pattern of winPatterns){
            let pos1Val = boxes[pattern[0]].innerText;
            let pos2Val = boxes[pattern[1]].innerText;
            let pos3Val = boxes[pattern[2]].innerText; 
    
            if(pos1Val !== "" && pos2Val !== "" && pos3Val !== ""){
                if(pos1Val === pos2Val && pos2Val === pos3Val) {
                   showWinner(pos1Val);
                    return true;
                }
            }
        }
        return false;
    };
    
    // Show/hide hardBtn based on mode
    function updateModeUI() {
        if (vsComputer) {
            hardBtn.style.display = 'inline-block';
        } else {
            hardBtn.style.display = 'none';
        }
    }
    
    game.addEventListener("click", resetGame);
    resetBtn.removeEventListener("click", resetScores);
    resetBtn.addEventListener("click", resetScoresAndNamesAndBoard);
    
    // On page load, set correct visibility
    updateModeUI();
});