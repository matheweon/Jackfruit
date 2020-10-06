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
    });

    // Handle setHand event
    socket.on("setHand", function(data){
        socket.broadcast.emit("setHand", data);
    });

});

var fullDeck = [
    "2♣", "3♣", "4♣", "5♣", "6♣", "7♣", "8♣", "9♣", "T♣", "J♣", "Q♣", "K♣", "A♣",
    "2♦", "3♦", "4♦", "5♦", "6♦", "7♦", "8♦", "9♦", "T♦", "J♦", "Q♦", "K♦", "A♦",
    "2♥", "3♥", "4♥", "5♥", "6♥", "7♥", "8♥", "9♥", "T♥", "J♥", "Q♥", "K♥", "A♥",
    "2♠", "3♠", "4♠", "5♠", "6♠", "7♠", "8♠", "9♠", "T♠", "J♠", "Q♠", "K♠", "A♠"
]

// Prevent suits from coverting to emojis on iPhone (DOESNT EVEN WORK LOL)
fullDeck.forEach(function(element) {
    element += "&#xFE0E;";
});

var gamesDictionary = {};

function startGame(roomCode) {
    deck = fullDeck.slice();
    gamesDictionary[roomCode] = {
        "hand1": [],
        "hand2": [],
        "flop": [],
        "turn": "",
        "river": ""
    };
    for (var i = 0; i < 7; i++) {
        gamesDictionary[roomCode]["hand1"].push(drawCard(deck));
    }
    for (var i = 0; i < 7; i++) {
        gamesDictionary[roomCode]["hand2"].push(drawCard(deck));
    }
    for (var i = 0; i < 3; i++) {
        gamesDictionary[roomCode]["flop"].push(drawCard(deck));
    }
    gamesDictionary[roomCode]["turn"] = drawCard(deck);
    gamesDictionary[roomCode]["river"] = drawCard(deck);

    console.log(gamesDictionary);

    io.sockets.emit("dealCards", {
        roomCode: roomCode,
        hand1: gamesDictionary[roomCode]["hand1"],
        hand2: gamesDictionary[roomCode]["hand2"],
        flop: gamesDictionary[roomCode]["flop"],
        turn: gamesDictionary[roomCode]["turn"],
        river: gamesDictionary[roomCode]["river"]
    });
}

function drawCard(deck) {
    var randomIndex = Math.floor(Math.random()*deck.length);
    var card = deck[randomIndex];
    deck.splice(randomIndex, 1);
    return card;
}
