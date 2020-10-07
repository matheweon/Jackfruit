var express = require("express");
var socket = require("socket.io");

// App setup
var app = express();
var server = app.listen(80, function(){
    console.log("listening for requests on port 80:");
});

// Static files
app.use(express.static("public"));

// Socket setup & pass server
var io = socket(server);
io.on("connection", (socket) => {

    console.log("made socket connection", socket.id);

    /*// Handle chat event
    socket.on("chat", function(data){
        // console.log(data);
        io.sockets.emit("chat", data);
    });

    // Handle typing event
    socket.on("typing", function(data){
        socket.broadcast.emit("typing", data);
    });*/

    // Handle enterRoom event
    socket.on("enterRoom", function(data){
        console.log("Room entered with code", data.roomCode);
        socket.broadcast.emit("enterRoom", data);
    });

    // Handle startGame event
    socket.on("startGame", function(data){
        console.log("Game started with code", data.roomCode);
        socket.broadcast.emit("startGame", data);
        startGame(data.roomCode);
        if (data.roomCode in gamesDictionary) {
            gamesDictionary[data.roomCode]["p1points"] = 0;
            gamesDictionary[data.roomCode]["p2points"] = 0;
        }
    });

    // Handle setHand event
    socket.on("setHand", function(data){
        socket.broadcast.emit("setHand", data);
        if (data.playerNum === 1) {
            gamesDictionary[data.roomCode]["hand1"] = data.cards;
        } else {
            gamesDictionary[data.roomCode]["hand2"] = data.cards;
        }
        gamesDictionary[data.roomCode]["playersReady"]++;
        if (gamesDictionary[data.roomCode]["playersReady"] === 2) {
            setTimeout(() => { turn(data.roomCode); }, 100); // Change this delay
        }
    });

});

var rankingPoints = [1, 1, 2, 3, 4, 5, 6, 10, 20, 30];
var multipliers = [5, 3, 1];

var fullDeck = [
    "2♣", "3♣", "4♣", "5♣", "6♣", "7♣", "8♣", "9♣", "T♣", "J♣", "Q♣", "K♣", "A♣",
    "2♦", "3♦", "4♦", "5♦", "6♦", "7♦", "8♦", "9♦", "T♦", "J♦", "Q♦", "K♦", "A♦",
    "2♥", "3♥", "4♥", "5♥", "6♥", "7♥", "8♥", "9♥", "T♥", "J♥", "Q♥", "K♥", "A♥",
    "2♠", "3♠", "4♠", "5♠", "6♠", "7♠", "8♠", "9♠", "T♠", "J♠", "Q♠", "K♠", "A♠"
]

var shortDeck = [
    "6♣", "7♣", "8♣", "9♣", "T♣", "J♣", "Q♣", "K♣", "A♣",
    "6♦", "7♦", "8♦", "9♦", "T♦", "J♦", "Q♦", "K♦", "A♦",
    "6♥", "7♥", "8♥", "9♥", "T♥", "J♥", "Q♥", "K♥", "A♥",
    "6♠", "7♠", "8♠", "9♠", "T♠", "J♠", "Q♠", "K♠", "A♠"
]

// Prevent suits from coverting to emojis on iPhone (DOESNT EVEN WORK LOL)
fullDeck.forEach(function(element) {
    element += "&#xFE0E;";
});

var gamesDictionary = {};

function startGame(roomCode) {
    deck = fullDeck.slice();
    // Reset varaibles (does not reset p1points and p2points)
    if (!(roomCode in gamesDictionary)) {
        gamesDictionary[roomCode] = {};
    }
    if (!("p1points" in gamesDictionary[roomCode])) {
        gamesDictionary[roomCode]["p1points"] = 0;
    }
    if (!("p2points" in gamesDictionary[roomCode])) {
        gamesDictionary[roomCode]["p2points"] = 0;
    }
    gamesDictionary[roomCode]["hand1"] = [];
    gamesDictionary[roomCode]["hand2"] = [];
    gamesDictionary[roomCode]["flop"] = [];
    gamesDictionary[roomCode]["turn"] = "";
    gamesDictionary[roomCode]["river"] = "";
    gamesDictionary[roomCode]["deck"] = [];
    gamesDictionary[roomCode]["playersReady"] = 0;
    // Draws 7 cards for each player and 3 for the flop
    for (var i = 0; i < 7; i++) {
        gamesDictionary[roomCode]["hand1"].push(drawCard(deck));
    }
    for (var i = 0; i < 7; i++) {
        gamesDictionary[roomCode]["hand2"].push(drawCard(deck));
    }
    for (var i = 0; i < 3; i++) {
        gamesDictionary[roomCode]["flop"].push(drawCard(deck));
    }
    gamesDictionary[roomCode]["deck"] = deck;

    console.log(gamesDictionary);

    io.sockets.emit("dealCards", {
        roomCode: roomCode,
        hand1: gamesDictionary[roomCode]["hand1"],
        hand2: gamesDictionary[roomCode]["hand2"],
        flop: gamesDictionary[roomCode]["flop"],
    });
}

function drawCard(deck) {
    var randomIndex = Math.floor(Math.random()*deck.length);
    var card = deck[randomIndex];
    deck.splice(randomIndex, 1);
    return card;
}

/*
9 - Royal Flush
8 - Straight Flush
7 - Four of a Kind
6 - Full House
5 - Flush
4 - Straight
3 - Three of a Kind
2 - Two Pairs
1 - One Pair
0 - High Card
*/

// Edits input array of strings ["9", "T", "A"] --> [9, 10, 14]
function convertToNumbers(inputArray) {
    for (var i = 0; i < inputArray.length; i++) {
        if (inputArray[i] === "T") {
            inputArray[i] = 10;
        } else if (inputArray[i] === "J") {
            inputArray[i] = 11;
        } else if (inputArray[i] === "Q") {
            inputArray[i] = 12;
        } else if (inputArray[i] === "K") {
            inputArray[i] = 13;
        } else if (inputArray[i] === "A") {
            inputArray[i] = 14;
        } else {
            inputArray[i] = parseInt(inputArray[i]);
        }
    }
}

// Returns full hand in the form [ 'Q♣', '9♥', '8♠', '3♦', '4♠' ]
function findFullHand(ranks, lookFor) {
    var fullHand = [];
    lookFor.forEach(function(rank) {
        if (fullHand.length === 5) {
            return fullHand;
        } else {
            // Convert rank to number
            if (rank === 10) {
                rank = "T";
            } else if (rank === 11) {
                rank = "J";
            } else if (rank === 12) {
                rank = "Q";
            } else if (rank === 13) {
                rank = "K";
            } else if (rank === 14) {
                rank = "A";
            }
            ranks[rank].forEach(function(card) {
                if (fullHand.length === 5) {
                    return fullHand;
                } else {
                    fullHand.push(card);
                }
            });
        }
    });
    return fullHand;
}

function findMultipleCards(cards) {
    // Number of times each card occurs; 1 - no pair, 2 - pair, 3 - trips, 4 - quads
    var occurances = {
        1: [],
        2: [],
        3: [],
        4: []
    }
    // Stores the suited card string for each rank
    var ranks = {
        "2": [],
        "3": [],
        "4": [],
        "5": [],
        "6": [],
        "7": [],
        "8": [],
        "9": [],
        "T": [],
        "J": [],
        "Q": [],
        "K": [],
        "A": []
    }
    cards.forEach(function(card) {
        if (occurances[3].includes(card[0])) {
            occurances[3].splice(occurances[3].indexOf(card[0]), 1);
            occurances[4].push(card[0]);
        } else if (occurances[2].includes(card[0])) {
            occurances[2].splice(occurances[2].indexOf(card[0]), 1);
            occurances[3].push(card[0]);
        } else if (occurances[1].includes(card[0])) {
            occurances[1].splice(occurances[1].indexOf(card[0]), 1);
            occurances[2].push(card[0]);
        } else {
            occurances[1].push(card[0]);
        }
        ranks[card[0]].push(card);
    });
    convertToNumbers(occurances[1]);
    convertToNumbers(occurances[2]);
    convertToNumbers(occurances[3]);
    occurances[1].sort((a, b) => b - a); // Sorts in descending order
    occurances[2].sort((a, b) => b - a);
    occurances[3].sort((a, b) => b - a);

    if (occurances[4].length === 1) { // Four of a Kind
        if (occurances[3].length === 1) { // Trips acts as kicker
            return [7, occurances[4][0], occurances[3][0], findFullHand(ranks, [occurances[4][0], occurances[3][0]])];
        } else if (occurances[2].length === 1) {
            if (occurances[2][0] >= occurances[1][0]) { // Pair acts as kicker
                return [7, occurances[4][0], occurances[2][0], findFullHand(ranks, [occurances[4][0], occurances[2][0]])];
            } else { // High Card acts as kicker
                return [7, occurances[4][0], occurances[1][0], findFullHand(ranks, [occurances[4][0], occurances[1][0]])];
            }
        } else { // High Card kicker
            return [7, occurances[4][0], occurances[1][0], findFullHand(ranks, [occurances[4][0], occurances[1][0]])];
        }
    } else if (occurances[3].length === 2) { // Full House made from two trips
        return [6, occurances[3][0], occurances[3][1], findFullHand(ranks, [occurances[3][0], occurances[3][1]])];
    } else if (occurances[3].length === 1 && occurances[2].length >= 1) { // Full House made from trips and a pair
        return [6, occurances[3][0], occurances[2][0], findFullHand(ranks, [occurances[3][0], occurances[2][0]])];
    } else if (occurances[3].length === 1) { // Three of a kind
        return [3, occurances[3][0], occurances[1][0], occurances[1][1], findFullHand(ranks, [occurances[3][0], occurances[1][0], occurances[1][1]])];
    } else if (occurances[2].length === 3) { // Two pair mode from three pairs (lowest pair acts as kicker)
        return [2, occurances[2][0], occurances[2][1], occurances[2][2], findFullHand(ranks, [occurances[2][0], occurances[2][1], occurances[2][2]])];
    } else if (occurances[2].length === 2) { // Two pair mode from two pairs and a high card
        return [2, occurances[2][0], occurances[2][1], occurances[1][0], findFullHand(ranks, [occurances[2][0], occurances[2][1], occurances[1][0]])];
    } else if (occurances[2].length === 1) { // One pair
        return [1, occurances[2][0], occurances[1][0], occurances[1][1], occurances[1][2], findFullHand(ranks, [occurances[2][0], occurances[1][0], occurances[1][1], occurances[1][2]])];
    } else { // High Card
        return [0, occurances[1][0], occurances[1][1], occurances[1][2], occurances[1][3], occurances[1][4], findFullHand(ranks, [occurances[1][0], occurances[1][1], occurances[1][2], occurances[1][3], occurances[1][4]])];
    }
}

function findFlush(cards) {
    suits = {
        "♣": [],
        "♦": [],
        "♥": [],
        "♠": []
    }
    cards.forEach(function(card) {
        suits[card[1]].push(card[0]);
    });
    for (var suit in suits) {
        if (suits[suit].length >= 5) {
            convertToNumbers(suits[suit]);
            suits[suit].sort((a, b) => b - a); // Descending sort
            // Search for Straight Flush
            var straightFlush = findStraight(suits[suit]);
            if (straightFlush !== false) {
                if (straightFlush[1] === 14) {
                    var fullHand = ["A", "K", "Q", "J", "T"];
                    for (var i = 0; i < 5; i++) {
                        fullHand[i] += suit;
                    }
                    console.log("Royal Flush: " + fullHand);
                    return [9, fullHand]; // Royal Flush
                } else if (straightFlush[1] === 5) { // Wheel Flush
                    var fullHand = ["A", "2", "3", "4", "5"];
                    for (var i = 0; i < 5; i++) {
                        fullHand[i] += suit;
                    }
                    console.log("Wheel Flush: " + fullHand);
                    return [8, straightFlush[1], fullHand];
                } else {
                    var fullHand = [straightFlush[1], straightFlush[1]-1, straightFlush[1]-2, straightFlush[1]-3, straightFlush[1]-4];
                    for (var i = 0; i < 5; i++) {
                        // Convert rank to number
                        if (fullHand[i] === 10) {
                            fullHand[i] = "T";
                        } else if (fullHand[i] === 11) {
                            fullHand[i] = "J";
                        } else if (fullHand[i] === 12) {
                            fullHand[i] = "Q";
                        } else if (fullHand[i] === 13) {
                            fullHand[i] = "K";
                        } else if (fullHand[i] === 14) {
                            fullHand[i] = "A";
                        }
                        fullHand[i] += suit;
                    }
                    console.log("Straight Flush: " + fullHand);
                    return [8, straightFlush[1], fullHand];
                }
            }
            // Get top five cards in flush
            var fullHand = suits[suit].slice(0, 5);
            for (var i = 0; i < 5; i++) {
                // Convert rank to number
                if (fullHand[i] === 10) {
                    fullHand[i] = "T";
                } else if (fullHand[i] === 11) {
                    fullHand[i] = "J";
                } else if (fullHand[i] === 12) {
                    fullHand[i] = "Q";
                } else if (fullHand[i] === 13) {
                    fullHand[i] = "K";
                } else if (fullHand[i] === 14) {
                    fullHand[i] = "A";
                }
                fullHand[i] += suit;
            }
            return [5, suits[suit][0], suits[suit][1], suits[suit][2], suits[suit][3], suits[suit][4], fullHand];
        }
    }
    return false;
}

function findStraight(cards) {
    suitlessCards = [];
    cards.forEach(function(card) {
        suitlessCards.push(card[0]);
    });
    convertToNumbers(suitlessCards);
    for (var i = 14; i > 5; i--) {
        if (suitlessCards.includes(i) && suitlessCards.includes(i-1) && suitlessCards.includes(i-2) && suitlessCards.includes(i-3) && suitlessCards.includes(i-4)) {
            var fullHand = [i, i-1, i-2, i-3, i-4];
            for (var i = 0; i < 5; i++) {
                fullHand[i] = cards[suitlessCards.indexOf(fullHand[i])];
            }
            return [4, i, fullHand];
        }
    }
    // Special case for Wheel (A2345)
    if (suitlessCards.includes(14) && suitlessCards.includes(2) && suitlessCards.includes(3) && suitlessCards.includes(4) && suitlessCards.includes(5)) {
        var fullHand = [14, 2, 3, 4, 5];
        for (var i = 0; i < 5; i++) {
            fullHand[i] = cards[suitlessCards.indexOf(fullHand[i])];
        }
        return [4, 5, fullHand];
    }
    return false;
}

function findHand(cards) {
    ranking = findMultipleCards(cards);
    if (ranking[0] < 5) { // If you have a full house or quads you can't have a straight flush
        var flush = findFlush(cards);
        if (flush !== false) {
            ranking = flush;
        }
    }
    if (ranking[0] < 4) { // Same deal for a straight
        var straight = findStraight(cards);
        if (straight !== false) {
            ranking = straight;
        }
    }
    return ranking;
}

function bestHand(hand1, hand2, community) {
    hand1ranking = findHand(hand1.concat(community));
    hand2ranking = findHand(hand2.concat(community));
    if (JSON.stringify(hand1ranking) === JSON.stringify(hand2ranking)) { // JS is really stupid so this is the easiest way to compare arrays
        return 0; // Tie
    }
    /*console.log("hand1");
    console.log(hand1.concat(community));
    console.log(hand1ranking);
    console.log("hand2");
    console.log(hand2.concat(community));
    console.log(hand2ranking);*/
    // Big ass nexted if to see which ranking is higher
    if (hand1ranking[0] > hand2ranking[0]) {
        return 1;
    } else if (hand2ranking[0] > hand1ranking[0]) {
        return 2;
    } else {
        if (hand1ranking[1] > hand2ranking[1]) {
            return 1;
        } else if (hand2ranking[1] > hand1ranking[1]) {
            return 2;
        } else {
            if (hand1ranking[2] > hand2ranking[2]) {
                return 1;
            } else if (hand2ranking[2] > hand1ranking[2]) {
                return 2;
            } else {
                if (hand1ranking[3] > hand2ranking[3]) {
                    return 1;
                } else if (hand2ranking[3] > hand1ranking[3]) {
                    return 2;
                } else {
                    if (hand1ranking[4] > hand2ranking[4]) {
                        return 1;
                    } else if (hand2ranking[4] > hand1ranking[4]) {
                        return 2;
                    } else {
                        if (hand1ranking[5] > hand2ranking[5]) {
                            return 1;
                        } else {
                            return 2;
                        }
                    }
                }
            }
        }
    }
}

function turn(roomCode) {
    // Calculate equity of each hand
    var handEquities = [];
    var combinations = 35 * 34;
    var p1wins = [0, 0, 0];
    var p2wins = [0, 0, 0];
    var ties = [0, 0, 0];
    // Runs through every possible combination of turn and river
    for (var j = 0; j < 35; j++) {
        var riverDeck = gamesDictionary[roomCode]["deck"].slice();
        riverDeck.splice(j, 1);
        for (var k = 0; k < 34; k++) {
            possibleTurn = gamesDictionary[roomCode]["deck"][j];
            possibleRiver = riverDeck[k];
            community = gamesDictionary[roomCode]["flop"].slice();
            community.push(possibleTurn);
            community.push(possibleRiver);
            for (var i = 0; i < 3; i++) {
                var hand1 = gamesDictionary[roomCode]["hand1"].slice(i*2, i*2 + 2);
                var hand2 = gamesDictionary[roomCode]["hand2"].slice(i*2, i*2 + 2);
                winner = bestHand(hand1, hand2, community);
                if (winner === 1) {
                    p1wins[i]++;
                } else if (winner === 2) {
                    p2wins[i]++;
                } else {
                    ties[i]++;
                }
            }
            /*console.log("hand1");
            console.log(gamesDictionary[roomCode]["hand1"].slice(i*2, i*2 + 2));
            console.log("hand2");
            console.log(gamesDictionary[roomCode]["hand2"].slice(i*2, i*2 + 2));
            console.log("community");
            console.log(community);
            console.log(winner);*/
        }
    }
    /*console.log("p1, tie, p2");
    console.log(p1wins);
    console.log(ties);
    console.log(p2wins);*/
    // Round to nearest 0.1%
    handEquities.push([Math.round(p1wins[0]/combinations * 1000) / 10, Math.round(ties[0]/combinations * 1000) / 10, Math.round(p2wins[0]/combinations * 1000) / 10]);
    handEquities.push([Math.round(p1wins[1]/combinations * 1000) / 10, Math.round(ties[1]/combinations * 1000) / 10, Math.round(p2wins[1]/combinations * 1000) / 10]);
    handEquities.push([Math.round(p1wins[2]/combinations * 1000) / 10, Math.round(ties[2]/combinations * 1000) / 10, Math.round(p2wins[2]/combinations * 1000) / 10]);
    // String info sent to players for display
    var info = "Turn:\n"
        + "Top Hand Equities: " + handEquities[0][0] + " / " + handEquities[0][1] + " / " + handEquities[0][2] + "\n"
        + "Middle Hand Equities: " + handEquities[1][0] + " / " + handEquities[1][1] + " / " + handEquities[1][2] + "\n"
        + "Bottom Hand Equities: " + handEquities[2][0] + " / " + handEquities[2][1] + " / " + handEquities[2][2] + "\n\n";
    console.log(info);
    var turn = drawCard(gamesDictionary[roomCode]["deck"]);
    gamesDictionary[roomCode]["turn"] = turn;
    io.sockets.emit("turn", {
        roomCode: roomCode,
        info: info,
        turn: turn
    });

    river(roomCode);
}

function river(roomCode) {
    // Calculate equity of each hand
    var handEquities = [];
    var combinations = 34;
    var p1wins = [0, 0, 0];
    var p2wins = [0, 0, 0];
    var ties = [0, 0, 0];
    // Runs through every river card
    for (var k = 0; k < 34; k++) {
        possibleRiver = gamesDictionary[roomCode]["deck"][k];
        community = gamesDictionary[roomCode]["flop"].slice()
        community.push(gamesDictionary[roomCode]["turn"]);
        community.push(possibleRiver);
        for (var i = 0; i < 3; i++) {
            var hand1 = gamesDictionary[roomCode]["hand1"].slice(i*2, i*2 + 2);
            var hand2 = gamesDictionary[roomCode]["hand2"].slice(i*2, i*2 + 2);
            winner = bestHand(hand1, hand2, community);
            if (winner === 1) {
                p1wins[i]++;
            } else if (winner === 2) {
                p2wins[i]++;
            } else {
                ties[i]++;
            }
        }
    }
    handEquities.push([Math.round(p1wins[0]/combinations * 1000) / 10, Math.round(ties[0]/combinations * 1000) / 10, Math.round(p2wins[0]/combinations * 1000) / 10]);
    handEquities.push([Math.round(p1wins[1]/combinations * 1000) / 10, Math.round(ties[1]/combinations * 1000) / 10, Math.round(p2wins[1]/combinations * 1000) / 10]);
    handEquities.push([Math.round(p1wins[2]/combinations * 1000) / 10, Math.round(ties[2]/combinations * 1000) / 10, Math.round(p2wins[2]/combinations * 1000) / 10]);
    // String info sent to players for display
    var info = "River:\n"
        + "Top Hand Equities: " + handEquities[0][0] + " / " + handEquities[0][1] + " / " + handEquities[0][2] + "\n"
        + "Middle Hand Equities: " + handEquities[1][0] + " / " + handEquities[1][1] + " / " + handEquities[1][2] + "\n"
        + "Bottom Hand Equities: " + handEquities[2][0] + " / " + handEquities[2][1] + " / " + handEquities[2][2] + "\n\n";
    console.log(info);
    var river = drawCard(gamesDictionary[roomCode]["deck"]);
    gamesDictionary[roomCode]["river"] = river;
    io.sockets.emit("river", {
        roomCode: roomCode,
        info: info,
        river: river
    });

    endRound(roomCode);
}

function endRound(roomCode) {
    winningHands = [];
    madeHands = [];
    community = gamesDictionary[roomCode]["flop"].slice()
    community.push(gamesDictionary[roomCode]["turn"]);
    community.push(gamesDictionary[roomCode]["river"]);
    for (var i = 0; i < 3; i++) {
        var hand1 = gamesDictionary[roomCode]["hand1"].slice(i*2, i*2 + 2);
        var hand2 = gamesDictionary[roomCode]["hand2"].slice(i*2, i*2 + 2);
        var winner = bestHand(hand1, hand2, community);
        console.log("hand1, hand2, community");
        console.log(hand1);
        console.log(hand2);
        console.log(community);
        if (winner === 1) {
            var winningHand = findHand(hand1.concat(community));
            var points = rankingPoints[winningHand[0]] * multipliers[i];
            winningHands.push([1, winningHand, points]);
        } else if (winner === 2) {
            var winningHand = findHand(hand2.concat(community));
            var points = rankingPoints[winningHand[0]] * multipliers[i];
            winningHands.push([2, winningHand, points]);
        } else {
            // Still show the hand that they tied with
            var winningHand = findHand(hand1.concat(community));
            winningHands.push([0, winningHand]);
        }
        // Push each fullHand into madeHands
        madeHands.push(findHand(hand1.concat(community))[findHand(hand1.concat(community)).length - 1]);
        madeHands.push(findHand(hand2.concat(community))[findHand(hand2.concat(community)).length - 1]);
    }
    console.log(winningHands);
    // Calculate total score and if a player scoops
    var topInfo = "";
    var midInfo = "";
    var botInfo = "";
    var winInfo = "";
    var scores = [];
    var scoreSum = 0;
    var scoop = false;
    for (var i = 0; i < 3; i++) {
        if (winningHands[i][0] === 1) { // If player 1 wins the hand
            scores.push(winningHands[i][2]);
            scoreSum += winningHands[i][2];
        } else if (winningHands[i][0] === 2) { // If player 2 wins the hand
            scores.push(-winningHands[i][2]);
            scoreSum -= winningHands[i][2];
        } else { // If tie
            scores.push(0);
        }
    }
    if (winningHands[0][0] === winningHands[1][0] && winningHands[0][0] === winningHands[2][0] && winningHands[0][0] !== 0) {
        scoop = true;
    }
    // Write top, mid, bot info
    if (winningHands[0][0] === 0) { // If tie
        topInfo = "Top Hand is a tie with " + handName(winningHands[0][1]) + "\n";
    } else {
        topInfo = "Player " + winningHands[0][0] + " wins Top Hand with " + handName(winningHands[0][1]) + ". " + winningHands[0][2]/multipliers[0] + "x" + multipliers[0] + " = +" + winningHands[0][2] + " Points\n";
    }
    if (winningHands[1][0] === 0) { // If tie
        midInfo = "Middle Hand is a tie with " + handName(winningHands[1][1]) + "\n";
    } else {
        midInfo = "Player " + winningHands[1][0] + " wins Middle Hand with " + handName(winningHands[1][1]) + ". " + winningHands[1][2]/multipliers[1] + "x" + multipliers[1] + " = +" + winningHands[1][2] + " Points\n";
    }
    if (winningHands[2][0] === 0) { // If tie
        botInfo = "Bottom Hand is a tie with " + handName(winningHands[2][1]) + "\n";
    } else {
        botInfo = "Player " + winningHands[2][0] + " wins Bottom Hand with " + handName(winningHands[2][1]) + ". " + winningHands[2][2]/multipliers[2] + "x" + multipliers[2] + " = +" + winningHands[2][2] + " Points\n";
    }
    // Give players their points
    if (scoreSum > 0) {
        if (scoop) {
            scoreSum += 30;
            winInfo = "Player 1 scoops for a total of " + scores[0] + " + " + scores[1] + " + " + scores[2] + " + 30 (Scoop) = " + scoreSum + " Points";
        } else {
            winInfo = "Player 1 wins a total of " + scores[0] + " + " + scores[1] + " + " + scores[2] + " = " + scoreSum + " Points";
            winInfo = winInfo.split("+ -").join("- ");
        }
        gamesDictionary[roomCode]["p1points"] += scoreSum;
    } else if (scoreSum < 0) {
        if (scoop) {
            scoreSum -= 30;
            winInfo = "Player 2 scoops for a total of " + -scores[0] + " + " + -scores[1] + " + " + -scores[2] + " + 30 (Scoop) = " + -scoreSum + " Points";
        } else {
            winInfo = "Player 2 wins a total of " + -scores[0] + " + " + -scores[1] + " + " + -scores[2] + " = " + -scoreSum + " Points";
            winInfo = winInfo.split("+ -").join("- ");
        }
        gamesDictionary[roomCode]["p2points"] -= scoreSum;
    } else {
        winInfo = "It's a tie! Neither player wins any points."
    }
    var info = topInfo + midInfo + botInfo + winInfo;
    console.log(info);
    console.log("Made Hands: " + madeHands);
    io.sockets.emit("endGame", {
        roomCode: roomCode,
        info: info,
        p1points: gamesDictionary[roomCode]["p1points"],
        p2points: gamesDictionary[roomCode]["p2points"],
        madeHands: madeHands
    });

    io.sockets.emit("startGame", {
        roomCode: roomCode
    });
    startGame(roomCode);
}

function numToText(num, plural) {
   textArraySingular = ["Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Jack", "Queen", "King", "Ace"];
   textArrayPlural = ["Twos", "Threes", "Fours", "Fives", "Sixes", "Sevens", "Eights", "Nines", "Tens", "Jacks", "Queens", "Kings", "Aces"];
   if (plural) {
       return textArrayPlural[num - 2];
   } else {
       return textArraySingular[num - 2];
   }
}

function handName(hand) {
    text = "";
    if (hand[0] === 9) {
        text = "a Royal Flush";
    } else if (hand[0] === 8) {
        text = "a Straight Flush, " + hand[1] + " High";
    } else if (hand[0] === 7) {
        text = "Four of a Kind, " + numToText(hand[1], true);
    } else if (hand[0] === 6) {
        text = "a Full House, " + numToText(hand[1], true) + " full of " + numToText(hand[2], true);
    } else if (hand[0] === 5) {
        text = "a Flush, " + numToText(hand[1], false) + " High";
    } else if (hand[0] === 4) {
        text = "a Straight, " + numToText(hand[1], false) + " High";
    } else if (hand[0] === 3) {
        text = "Three of a Kind, " + numToText(hand[1], true);
    } else if (hand[0] === 2) {
        text = "Two Pair, " + numToText(hand[1], true) + " and " + numToText(hand[2], true);
    } else if (hand[0] === 1) {
        text = "One Pair, " + numToText(hand[1], true);
    } else {
        text = numToText(hand[1], false) + " High";
    }
    return text;
}
