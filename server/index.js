const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");

const app = express();

const server = http.createServer(app);

// specifying origin.
const io = socketio(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// users and msgs arrays.
let users = [];
const msgs = [];

// cross origin
app.use(cors());

// on connecting to server with socket.
io.on("connection", (socket) => {
  console.log("Connected");
  console.log("Id", socket.id);

  // receive signal and trigger this event
  socket.on("setUser", ({ name }) => {
    console.log("setUser called");

    // looking if the username is already exists or not
    const index = users.findIndex((user) => user.name === name);

    // if not insert new user
    if (index < 0) {
      users.push({ name, status: "online", id: socket.id });
    }

    // update existing user status and socket id
    else {
      users.splice(index, 1, { name, status: "online", id: socket.id });
    }

    // emiting signal to updated all users
    io.sockets.emit("response", users);
  });

  // emiting signal to set socket id at front-end for current user.
  socket.emit("yourId", socket.id);

  // emiting signal to set users and msgs for current user initially
  io.sockets.emit("join", { users, msgs });

  // emiting signal to updated all users
  io.sockets.emit("response", users);

  // on calling user.
  socket.on("callUser", (data) => {
    // emit signal to specific user (based on socket id we sent from front-end).
    io.to(data.userToCall).emit("hey", {
      signal: data.signalData,
      from: data.from,
    });
  });

  // on accepting call.
  socket.on("acceptCall", (data) => {
    // if accept call this event will listen and emit signal to
    // that specific socket id from which we are being called.
    io.to(data.to).emit("callAccepted", data.signal);
  });

  // on disconnection or going offline.
  socket.on("offline", ({ name }) => {
    console.log("Disconnected", name);
    const index = users.findIndex((user) => user.name === name);
    if (name)
      // changing status from online to offline.
      users.splice(index, 1, { name, status: "offline", id: socket.id });

    // emiting signal to updated all users.
    io.sockets.emit("response", users);
  });

  // on sending msg event will trigger.
  socket.on("msg", (msg) => {
    console.log("message recievd", msg);

    // pushing msg to msgs array.
    msgs.push(msg);

    // emiting signal with updated msgs to all users.
    io.sockets.emit("sendmsg", msgs);
  });
});

const PORT = process.env.PORT || 9000;
server.listen(PORT, () => console.log(`Server is listening on port ${PORT}`));
