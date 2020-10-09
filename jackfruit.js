// Make connection
var socket = io.connect("http://98.110.30.150/");

// Query DOM
var createJoinText = document.getElementById("createJoinText"),
    roomCode = document.getElementById("roomCode"),
    btn = document.getElementById("enter"),
    howToPlay = document.getElementById("howToPlay"),
    handRankingPoints = document.getElementById("handRankingPoints"),
    waitingText = document.getElementById("waitingText"),
    gameText = document.getElementById("gameText"),
    infoText = document.getElementById("info"),
    setHandButton = document.getElementById("10"),
    p1pointsText = document.getElementById("16"),
    p2pointsText = document.getElementById("18"),
    turnText = document.getElementById("9"),
    riverText = document.getElementById("11"),
    bottomText = document.getElementById("22");

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
    opponentHand,
    handOver = false,
    dealCardsData,
    firstGame = true,
    madeHands = [],
    handWinners = [],
    handNames = [],
    defaultText = "",
    turn = "",
    river = "",
    p1points = 0,
    p2points = 0,
    selectTurn = false,
    selectRiver = false;

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
    howToPlay.classList.add("hidden");
    handRankingPoints.classList.add("hidden");
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
        if (playerNum !== 1) {
            playerNum = 2;
        }
        startGame();
    }
});

function checkMarks() {
    if (playerNum === 1) {
        gridArray[5].innerHTML = "✔";
        gridArray[6].innerHTML = "✔";
        gridArray[12].innerHTML = "✔";
        gridArray[13].innerHTML = "✔";
        gridArray[19].innerHTML = "✔";
        gridArray[20].innerHTML = "✔";
        gridArray[5].classList.add("check");
        gridArray[6].classList.add("check");
        gridArray[12].classList.add("check");
        gridArray[13].classList.add("check");
        gridArray[19].classList.add("check");
        gridArray[20].classList.add("check");
    } else {
        gridArray[0].innerHTML = "✔";
        gridArray[1].innerHTML = "✔";
        gridArray[7].innerHTML = "✔";
        gridArray[8].innerHTML = "✔";
        gridArray[14].innerHTML = "✔";
        gridArray[15].innerHTML = "✔";
        gridArray[0].classList.add("check");
        gridArray[1].classList.add("check");
        gridArray[7].classList.add("check");
        gridArray[8].classList.add("check");
        gridArray[14].classList.add("check");
        gridArray[15].classList.add("check");
    }
}

socket.on("setHand", function(data) {
    if (data.roomCode === currentRoom) {
        opponentReady = true;
        opponentHand = data.cards;
        // If your hand is set
        if (handSet) {
            showHand();
        // If your hand is not set yet make opponent's cards check marks
        } else {
            if (!handOver) {
                checkMarks();
            }
        }
    }
});

socket.on("turn", function(data) {
    if (data.roomCode === currentRoom) {
        infoText.innerHTML = data.info.replace(/\n/g, "<br>");
        turn = data.turn;
    }
})

socket.on("river", function(data) {
    if (data.roomCode === currentRoom) {
        infoText.innerHTML = infoText.innerHTML + data.info.replace(/\n/g, "<br>");
        river = data.river;
    }
})

socket.on("endGame", function(data) {
    if (data.roomCode === currentRoom) {
        infoText.innerHTML = infoText.innerHTML + data.info.replace(/\n/g, "<br>");
        madeHands = data.madeHands;
        handWinners = data.handWinners;
        handNames = data.handNames;
        defaultText = data.defaultText;
        p1points = data.p1points;
        p2points = data.p2points;
    }
})

// Game functions
function startGame() {
    console.log("Game started as player", playerNum);
    waitingText.classList.add("hidden");
    gameText.classList.remove("hidden");
}

function resetDisplay() {
    // Reset cards from last round
    for (var i = 0; i < gridArray.length; i++) {
        if (i !== 10 && i !== 16 && i !== 17 && i !== 18) {
            gridArray[i].innerHTML = "";
        }
    }
    // Reset set hand button
    setHandButton.classList.remove("cyan");
    setHandButton.classList.add("setHand");
    setHandButton.classList.remove("handSet");
    setHandButton.classList.remove("nextHand");
    setHandButton.classList.remove("hover");
    setHandButton.innerHTML = "Set Hand";
    // Reset bottom text
    bottomText.classList.remove("bottomText");
    document.getElementById("23").classList.remove("hidden");
    document.getElementById("24").classList.remove("hidden");
    document.getElementById("25").classList.remove("hidden");
    document.getElementById("26").classList.remove("hidden");
}

function displayCards(data) {
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

        selectable = [0, 1, 7, 8, 14, 15, 21, 22, 23, 24, 25, 26, 27];
        allowSelectable();
        allowClickable();
    } else {
        // Switch green/red backgrounds
        gridArray[5].classList.add("green");
        gridArray[6].classList.add("green");
        gridArray[12].classList.add("green");
        gridArray[13].classList.add("green");
        gridArray[19].classList.add("green");
        gridArray[20].classList.add("green");
        gridArray[5].classList.remove("red");
        gridArray[6].classList.remove("red");
        gridArray[12].classList.remove("red");
        gridArray[13].classList.remove("red");
        gridArray[19].classList.remove("red");
        gridArray[20].classList.remove("red");

        gridArray[0].classList.remove("green");
        gridArray[1].classList.remove("green");
        gridArray[7].classList.remove("green");
        gridArray[8].classList.remove("green");
        gridArray[14].classList.remove("green");
        gridArray[15].classList.remove("green");
        gridArray[0].classList.add("red");
        gridArray[1].classList.add("red");
        gridArray[7].classList.add("red");
        gridArray[8].classList.add("red");
        gridArray[14].classList.add("red");
        gridArray[15].classList.add("red");

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

        selectable = [5, 6, 12, 13, 19, 20, 21, 22, 23, 24, 25, 26, 27];
        allowSelectable();
        allowClickable();
    }
}

socket.on("dealCards", function(data){
    console.log(data);
    // Store data for later, player can still look at hand before starting next hand
    dealCardsData = data;
    // Reset variables
    handSet = false;
    opponentReady = false;
    // Change set hand button to next hand
    if (firstGame) {
        nextHand();
        firstGame = false;
    } else {
        setHandButton.classList.remove("setHand");
        setHandButton.classList.remove("handSet");
        setHandButton.classList.add("nextHand");
        setHandButton.innerHTML = "Next Hand";
        selectable = [10];
        allowSelectable();
        allowClickable();
    }
});

function nextHand() {
    resetDisplay();
    displayCards(dealCardsData);
    if (opponentReady) {
        checkMarks();
    }
    allowSelectable();
    allowClickable();
}

// Updates the text color of each card based on its suit
function colorSuits() {
    gridArray.forEach(function(element) {
        if (element.innerHTML.charAt(1) === "♥") {
            element.classList.add("heart");
            element.classList.remove("club");
            element.classList.remove("diamond");
            element.classList.remove("spade");
        } else if (element.innerHTML.charAt(1) === "♣") {
            element.classList.remove("heart");
            element.classList.add("club");
            element.classList.remove("diamond");
            element.classList.remove("spade");
        } else if (element.innerHTML.charAt(1) === "♦") {
            element.classList.remove("heart");
            element.classList.remove("club");
            element.classList.add("diamond");
            element.classList.remove("spade");
        } else if (element.innerHTML.charAt(1) === "♠") {
            element.classList.remove("heart");
            element.classList.remove("club");
            element.classList.remove("diamond");
            element.classList.add("spade");
        } else {
            element.classList.remove("heart");
            element.classList.remove("club");
            element.classList.remove("diamond");
            element.classList.remove("spade");
        }
    });
}

function allowSelectable() {
    if (selectTurn) {
        gridArray.forEach(function(element) {
            if (element.id === "9") { // Turn card
                element.onmouseover = function() {
                    this.classList.add("hover");
                };
                element.onmouseout = function() {
                    this.classList.remove("hover");
                };
            } else {
                // Make unselectable
                element.onmouseover = function(){};
                element.onmouseout = function(){};
            }
        });
    } else if (selectRiver) {
        gridArray.forEach(function(element) {
            if (element.id === "11") { // River card
                element.onmouseover = function() {
                    this.classList.add("hover");
                };
                element.onmouseout = function() {
                    this.classList.remove("hover");
                };
            } else {
                // Make unselectable
                element.onmouseover = function(){};
                element.onmouseout = function(){};
            }
        });
    } else if (handOver) {
        selectable = [0, 1, 5, 6, 7, 8, 12, 13, 14, 15, 19, 20]; // Both player's cards
        gridArray.forEach(function(element) {
            if (element.id === "10") { // next hand button
                element.onmouseover = function() {
                    this.classList.add("hover");
                };
                element.onmouseout = function() {
                    this.classList.remove("hover");
                };
            } else if (selectable.includes(parseInt(element.id))) {
                // Find which hand to display
                var handID;
                if (element.id === "0" || element.id === "1") {
                    handID = 0;
                } else if (element.id === "5" || element.id === "6") {
                    handID = 1;
                } else if (element.id === "7" || element.id === "8") {
                    handID = 2;
                } else if (element.id === "12" || element.id === "13") {
                    handID = 3;
                } else if (element.id === "14" || element.id === "15") {
                    handID = 4;
                } else {
                    handID = 5;
                }
                element.onmouseover = function() {
                    // Find all boxes with cards in fullHand
                    gridArray.forEach(function(card) {
                        if (madeHands[handID].includes(card.innerHTML)) {
                            // If winning hand
                            if (handID === 0 && handWinners[0] === 1 || handID === 1 && handWinners[0] === 2
                                    || handID === 2 && handWinners[1] === 1 || handID === 3 && handWinners[1] === 2
                                    || handID === 4 && handWinners[2] === 1 || handID === 5 && handWinners[2] === 2) {
                                card.classList.add("selected");
                                bottomText.innerHTML = handNames[handID];
                                bottomText.classList.add("yellowText");
                            } else { // If losing hand
                                card.classList.add("selectedOrange");
                                bottomText.innerHTML = handNames[handID];
                                bottomText.classList.add("orangeText");
                            }
                        }
                    });
                };
                element.onmouseout = function() {
                    gridArray.forEach(function(card) {
                        if (madeHands[handID].includes(card.innerHTML)) {
                            if (handID === 0 && handWinners[0] === 1 || handID === 1 && handWinners[0] === 2
                                    || handID === 2 && handWinners[1] === 1 || handID === 3 && handWinners[1] === 2
                                    || handID === 4 && handWinners[2] === 1 || handID === 5 && handWinners[2] === 2) {
                                card.classList.remove("selected");
                                bottomText.innerHTML = defaultText;
                                bottomText.classList.remove("yellowText");
                            } else {
                                card.classList.remove("selectedOrange");
                                bottomText.innerHTML = defaultText;
                                bottomText.classList.remove("orangeText");
                            }
                        }
                    });
                };
            } else {
                // Make unselectable
                element.onmouseover = function(){};
                element.onmouseout = function(){};
            }
        });
    } else if (!handSet) {
        gridArray.forEach(function(element) {
            if (selectable.includes(parseInt(element.id))) {
                element.onmouseover = function() {
                    this.classList.add("hover");
                };
                element.onmouseout = function() {
                    this.classList.remove("hover");
                };
            } else {
                // Make unselectable
                element.onmouseover = function(){};
                element.onmouseout = function(){};
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
    if (selectTurn) { // Click on turn card
        gridArray.forEach(function(element) {
            if (element.id === "9") {
                element.style.cursor = "pointer";
                element.onclick = function() {
                    turnText.innerHTML = turn;
                    turnText.classList.remove("cyan");
                    turnText.classList.remove("hover");
                    riverText.innerHTML = "?";
                    riverText.classList.add("cyan");
                    colorSuits();
                    selectTurn = false;
                    selectRiver = true;
                    allowSelectable();
                    allowClickable();
                }
            } else {
                element.style.cursor = "default";
                element.onclick = function(){};
            }
        });
    } else if (selectRiver) { // Click on river card
        gridArray.forEach(function(element) {
            if (element.id === "11") {
                element.style.cursor = "pointer";
                element.onclick = function() {
                    riverText.innerHTML = river;
                    riverText.classList.remove("cyan");
                    riverText.classList.remove("hover");
                    setHandButton.classList.add("cyan");
                    colorSuits();
                    selectRiver = false;
                    allowSelectable();
                    allowClickable();
                    // Display points once river is revealed
                    p1pointsText.innerHTML = p1points;
                    p2pointsText.innerHTML = p2points;
                    // Display bottom text
                    bottomText.classList.add("bottomText");
                    bottomText.innerHTML = defaultText;
                    document.getElementById("23").classList.add("hidden");
                    document.getElementById("24").classList.add("hidden");
                    document.getElementById("25").classList.add("hidden");
                    document.getElementById("26").classList.add("hidden");
                }
            } else {
                element.style.cursor = "default";
                element.onclick = function(){};
            }
        });
    } else if (handOver) { // Only allow next hand button to be clicked when hand is over
        gridArray.forEach(function(element) {
            if (element.id === "10") {
                element.style.cursor = "pointer";
                element.onclick = function() {
                    handOver = false;
                    nextHand();
                }
            } else {
                element.style.cursor = "default";
                element.onclick = function(){};
            }
        });
    } else if (!handSet) {
        gridArray.forEach(function(element) {
            if (selectable.includes(parseInt(element.id))) {
                element.style.cursor = "pointer";
                element.onclick = function() {
                    if (element.id === "10") {
                        setHand();
                        handOver = true;
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
                            // Allow set hand button to be clicked if all six cards are set
                            var cards = [];
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
                            if (!cards.includes("")) { // Allow selection of set hand button
                                if (selectable.indexOf(10) === -1) {
                                    selectable.push(10);
                                    allowSelectable();
                                    allowClickable();
                                    setHandButton.classList.add("cyan");
                                }
                            } else if (selectable.indexOf(10) !== -1) { // Unallow selection of set hand button
                                selectable.splice(selectable.indexOf(10), 1);
                                allowSelectable();
                                allowClickable();
                                setHandButton.classList.remove("cyan");
                            }
                        }
                    }
                };
            } else {
                element.style.cursor = "default";
                element.onclick = function(){};
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
            playerNum: playerNum,
            cards: cards
        });
        // Change set hand button to black and change text
        setHandButton.classList.remove("cyan");
        setHandButton.classList.remove("setHand");
        setHandButton.classList.add("handSet");
        setHandButton.classList.remove("nextHand");
        setHandButton.classList.remove("hover");
        setHandButton.innerHTML = "Hand Set";
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
        gridArray[5].classList.remove("check");
        gridArray[6].classList.remove("check");
        gridArray[12].classList.remove("check");
        gridArray[13].classList.remove("check");
        gridArray[19].classList.remove("check");
        gridArray[20].classList.remove("check");
    } else {
        gridArray[0].innerHTML = opponentHand[0];
        gridArray[1].innerHTML = opponentHand[1];
        gridArray[7].innerHTML = opponentHand[2];
        gridArray[8].innerHTML = opponentHand[3];
        gridArray[14].innerHTML = opponentHand[4];
        gridArray[15].innerHTML = opponentHand[5];
        gridArray[21].innerHTML = opponentHand[6];
        gridArray[0].classList.remove("check");
        gridArray[1].classList.remove("check");
        gridArray[7].classList.remove("check");
        gridArray[8].classList.remove("check");
        gridArray[14].classList.remove("check");
        gridArray[15].classList.remove("check");
    }
    colorSuits();

    // Make turn card a ? and clickable to reveal
    turnText.innerHTML = "?";
    turnText.classList.add("cyan");
    selectTurn = true;
    allowSelectable();
    allowClickable();
}
