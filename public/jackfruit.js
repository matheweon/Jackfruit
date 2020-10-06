// Make connection
var socket = io.connect("http://98.110.30.150/");

// Query DOM
var createJoinText = document.getElementById("createJoinText"),
    roomCode = document.getElementById("roomCode"),
    btn = document.getElementById("enter"),
    waitingText = document.getElementById("waitingText"),
    gameText = document.getElementById("gameText");

var gridArray = [];
for (var i = 0; i < 28; i++) {
    gridArray.push(document.getElementById(i));
}

var currentRoom,
    playerNum,
    selectable = [],
    selected,
    handSet = false,
    opponentReady = false,
    opponentHand;

// Focus on text box
roomCode.focus();
roomCode.select();

// Emit events
btn.addEventListener("click", function(){
    socket.emit("enterRoom", {
        roomCode: roomCode.value
    });
    currentRoom = roomCode.value;
    roomCode.value = "";
    // Waiting for player screen
    createJoinText.classList.add("hidden");
    roomCode.classList.add("hidden");
    btn.classList.add("hidden");
    waitingText.classList.remove("hidden");
});

// Enter room on Enter keydown
roomCode.addEventListener("keydown", function(event) {
  // Number 13 is the "Enter" key on the keyboard
  if (event.keyCode === 13) {
    // Cancel the default action, if needed
    event.preventDefault();
    // Trigger the button element with a click
    document.getElementById("enter").click();
  }
});

// Listen for events
socket.on("enterRoom", function(data) {
    if (data.roomCode === currentRoom) {
        socket.emit("startGame", {
            roomCode: currentRoom
        });
        playerNum = 1;
        startGame();
    }
});

socket.on("startGame", function(data) {
    if (data.roomCode === currentRoom) {
        playerNum = 2;
        startGame();
    }
});

socket.on("setHand", function(data) {
    if (data.roomCode === currentRoom) {
        opponentReady = true;
        opponentHand = data.cards;
        // If your hand is set
        if (handSet) {
            if (playerNum === 1) {
                showHand()
            } else {
                showHand()
            }
        // If your hand is not set yet make opponent's cards check marks
        } else {
            if (playerNum === 1) {
                gridArray[5].innerHTML = "✓";
                gridArray[6].innerHTML = "✓";
                gridArray[12].innerHTML = "✓";
                gridArray[13].innerHTML = "✓";
                gridArray[19].innerHTML = "✓";
                gridArray[20].innerHTML = "✓";
            } else {
                gridArray[0].innerHTML = "✓";
                gridArray[1].innerHTML = "✓";
                gridArray[7].innerHTML = "✓";
                gridArray[8].innerHTML = "✓";
                gridArray[14].innerHTML = "✓";
                gridArray[15].innerHTML = "✓";
            }
        }
    }
});

// Game functions
function startGame() {
    console.log("Game started as player", playerNum);
    waitingText.classList.add("hidden");
    gameText.classList.remove("hidden");
}

socket.on("dealCards", function(data){
    console.log(data);
    if (playerNum === 1) {
        // Make opponent's cards question marks
        gridArray[5].innerHTML = "?";
        gridArray[6].innerHTML = "?";
        gridArray[12].innerHTML = "?";
        gridArray[13].innerHTML = "?";
        gridArray[19].innerHTML = "?";
        gridArray[20].innerHTML = "?";

        // Your seven cards
        gridArray[21].innerHTML = data.hand1[0];
        gridArray[22].innerHTML = data.hand1[1];
        gridArray[23].innerHTML = data.hand1[2];
        gridArray[24].innerHTML = data.hand1[3];
        gridArray[25].innerHTML = data.hand1[4];
        gridArray[26].innerHTML = data.hand1[5];
        gridArray[27].innerHTML = data.hand1[6];

        // Flop
        gridArray[2].innerHTML = data.flop[0];
        gridArray[3].innerHTML = data.flop[1];
        gridArray[4].innerHTML = data.flop[2];

        colorSuits();

        selectable = [0, 1, 7, 8, 14, 15, 21, 22, 23, 24, 25, 26, 27, 10];
        allowSelectable();
        allowClickable();
    } else {
        // Switch green/red backgrounds
        gridArray[5].classList.toggle("green");
        gridArray[6].classList.toggle("green");
        gridArray[12].classList.toggle("green");
        gridArray[13].classList.toggle("green");
        gridArray[19].classList.toggle("green");
        gridArray[20].classList.toggle("green");
        gridArray[5].classList.toggle("red");
        gridArray[6].classList.toggle("red");
        gridArray[12].classList.toggle("red");
        gridArray[13].classList.toggle("red");
        gridArray[19].classList.toggle("red");
        gridArray[20].classList.toggle("red");

        gridArray[0].classList.toggle("green");
        gridArray[1].classList.toggle("green");
        gridArray[7].classList.toggle("green");
        gridArray[8].classList.toggle("green");
        gridArray[14].classList.toggle("green");
        gridArray[15].classList.toggle("green");
        gridArray[0].classList.toggle("red");
        gridArray[1].classList.toggle("red");
        gridArray[7].classList.toggle("red");
        gridArray[8].classList.toggle("red");
        gridArray[14].classList.toggle("red");
        gridArray[15].classList.toggle("red");

        // Make opponent's cards question marks
        gridArray[0].innerHTML = "?";
        gridArray[1].innerHTML = "?";
        gridArray[7].innerHTML = "?";
        gridArray[8].innerHTML = "?";
        gridArray[14].innerHTML = "?";
        gridArray[15].innerHTML = "?";

        // Your seven cards
        gridArray[21].innerHTML = data.hand2[0];
        gridArray[22].innerHTML = data.hand2[1];
        gridArray[23].innerHTML = data.hand2[2];
        gridArray[24].innerHTML = data.hand2[3];
        gridArray[25].innerHTML = data.hand2[4];
        gridArray[26].innerHTML = data.hand2[5];
        gridArray[27].innerHTML = data.hand2[6];

        // Flop
        gridArray[2].innerHTML = data.flop[0];
        gridArray[3].innerHTML = data.flop[1];
        gridArray[4].innerHTML = data.flop[2];

        colorSuits();

        selectable = [5, 6, 12, 13, 19, 20, 21, 22, 23, 24, 25, 26, 27, 10];
        allowSelectable();
        allowClickable();
    }
});

// Updates the text color of each card based on its suit
function colorSuits() {
    gridArray.forEach(function(element) {
        if (element.innerHTML.charAt(1) === "♥") {
            element.classList.add("heart");
            element.classList.remove("club");
            element.classList.remove("diamond");
            element.classList.remove("spade");
        }
        if (element.innerHTML.charAt(1) === "♣") {
            element.classList.remove("heart");
            element.classList.add("club");
            element.classList.remove("diamond");
            element.classList.remove("spade");
        }
        if (element.innerHTML.charAt(1) === "♦") {
            element.classList.remove("heart");
            element.classList.remove("club");
            element.classList.add("diamond");
            element.classList.remove("spade");
        }
        if (element.innerHTML.charAt(1) === "♠") {
            element.classList.remove("heart");
            element.classList.remove("club");
            element.classList.remove("diamond");
            element.classList.add("spade");
        }
    });
}

function allowSelectable() {
    if (!handSet) {
        gridArray.forEach(function(element) {
            if (selectable.includes(parseInt(element.id))) {
                element.onmouseover = function() {
                    this.classList.add("hover");
                };
                element.onmouseout = function() {
                    this.classList.remove("hover");
                };
            }
        });
    } else {
        gridArray.forEach(function(element) {
            element.onmouseover = function(){};
            element.onmouseout = function(){};
        });
    }
}

function allowClickable() {
    if (!handSet) {
        gridArray.forEach(function(element) {
            if (selectable.includes(parseInt(element.id))) {
                element.style.cursor = "pointer";
                element.onclick = function() {
                    if (element.id === "10") {
                        setHand();
                    } else {
                        if (selected === undefined) {
                            // Select first element
                            element.classList.add("selected");
                            selected = element;
                        } else {
                            // Swap elements
                            temp = element.innerHTML;
                            element.innerHTML = selected.innerHTML;
                            selected.innerHTML = temp;
                            selected.classList.remove("selected");
                            selected = undefined;
                            colorSuits();
                        }
                    }
                };
            }
        });
    } else {
        gridArray.forEach(function(element) {
            element.style.cursor = "default";
            element.onclick = function(){};
        });
    }
}

function setHand() {
    var cards = [];
    var discard;
    if (playerNum === 1) {
        cards.push(gridArray[0].innerHTML);
        cards.push(gridArray[1].innerHTML);
        cards.push(gridArray[7].innerHTML);
        cards.push(gridArray[8].innerHTML);
        cards.push(gridArray[14].innerHTML);
        cards.push(gridArray[15].innerHTML);
    } else {
        cards.push(gridArray[5].innerHTML);
        cards.push(gridArray[6].innerHTML);
        cards.push(gridArray[12].innerHTML);
        cards.push(gridArray[13].innerHTML);
        cards.push(gridArray[19].innerHTML);
        cards.push(gridArray[20].innerHTML);
    }
    // If all 6 cards are put in the hand
    if (!cards.includes("") && !handSet) {
        // Find last discarded card and move it to your player's side
        for (var i = 21; i <= 27; i++) {
            if (gridArray[i].innerHTML !== "") {
                discard = gridArray[i].innerHTML;
                if (playerNum === 1) {
                    // If discarded card is not in the right spot
                    if (i !== 21) {
                        gridArray[i].innerHTML = "";
                        gridArray[21].innerHTML = discard;
                    }
                } else {
                    // If discarded card is not in the right spot
                    if (i !== 27) {
                        gridArray[i].innerHTML = "";
                        gridArray[27].innerHTML = discard;
                    }
                }
                colorSuits();
                break;
            }
        }
        cards.push(discard);
        // Send to server
        socket.emit("setHand", {
            roomCode: currentRoom,
            cards: cards
        });
        // Change button to black
        gridArray[10].classList.toggle("setHand");
        gridArray[10].classList.toggle("handSet");
        gridArray[10].classList.remove("hover");
        gridArray[10].innerHTML = "Hand Set";
        // Display opponent's hand
        if (opponentReady) {
            showHand()
        }
        // Update interactivity
        handSet = true;
        allowSelectable();
        allowClickable();
    }
}

function showHand() {
    if (playerNum === 1) {
        gridArray[5].innerHTML = opponentHand[0];
        gridArray[6].innerHTML = opponentHand[1];
        gridArray[12].innerHTML = opponentHand[2];
        gridArray[13].innerHTML = opponentHand[3];
        gridArray[19].innerHTML = opponentHand[4];
        gridArray[20].innerHTML = opponentHand[5];
        gridArray[27].innerHTML = opponentHand[6];
    } else {
        gridArray[0].innerHTML = opponentHand[0];
        gridArray[1].innerHTML = opponentHand[1];
        gridArray[7].innerHTML = opponentHand[2];
        gridArray[8].innerHTML = opponentHand[3];
        gridArray[14].innerHTML = opponentHand[4];
        gridArray[15].innerHTML = opponentHand[5];
        gridArray[21].innerHTML = opponentHand[6];
    }
    colorSuits();
}