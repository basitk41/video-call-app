import React, { useState, useEffect, useRef } from "react";
import queryString from "query-string";
import io from "socket.io-client";
import Peer from "simple-peer";
import { Link } from "react-router-dom";
import { Offline, Online } from "react-detect-offline";
import ScrollToBottom from "react-scroll-to-bottom";
import { css } from "@emotion/css";
import img from "../assets/images/video.svg";
import Modal from "./UI/Modal";
import { callAlert, closeCallAlert } from "../utils/jquery";

const Chat = ({ location }) => {
  // server endpoint.
  const ENDPOINT = "http://localhost:9000";

  // current login username and all registered users.
  const [username, setName] = useState("");
  const [users, setUsers] = useState([]);

  // chats vars
  const [msg, setMsg] = useState("");
  const [msgs, setMsgs] = useState([]);

  // video call vars.
  const [yourID, setYourID] = useState("");
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerName, setCallerName] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);

  // video call ref vars and running socket ref
  const userVideo = useRef();
  const partnerVideo = useRef();
  const socket = useRef();

  useEffect(() => {
    // connection server creating new socket connection with server.
    socket.current = io(ENDPOINT);

    // asking and getting user camera and mic for video call.
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        if (userVideo.current) {
          userVideo.current.srcObject = stream;
        }
      });

    // getting name from url and setting in username var.
    const { name } = queryString.parse(location.search);
    setName(name);

    // sending name to backend for connection.
    socket.current.emit("setUser", { name });

    // receiving current socket id and setting to yourId var
    socket.current.on("yourId", (id) => {
      setYourID(id);
    });

    // initial users and msgs on connection.
    socket.current.on("join", ({ users, msgs }) => {
      setUsers(users);
      setMsgs(msgs);
    });

    // receiving updated users when a new user join.
    socket.current.on("response", (users) => {
      console.log("users update");
      setUsers(users);
    });

    // emited to this specific user and here it will listen.
    // It will notify us that someone is calling us.
    socket.current.on("hey", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    });

    // going offline on closing tab or browser.
    window.onbeforeunload = () => {
      socket.current.emit("offline", { name });
      socket.current.off();
    };

    // useEffect cleanup. Calling this anonymous function when component removing from dom.
    return () => {
      socket.current.emit("offline", { name });
      socket.current.off();
    };

    // useEffect defendencies array. rerender this useEffect upon changing one of them.
  }, [ENDPOINT, location.search]);

  //
  const style = {
    fontSize: "10px",
  };

  // message box container style
  const messageCSS = css({
    border: "1px solid pink",
    borderRadius: "10px",
    height: "170px",
    padding: "10px",
    marginBottom: "0px",
  });

  // sending msg
  const sendMsg = () => {
    socket.current.emit("msg", { msg, username }, () => {});
    const data = [...msgs];
    data.push({ msg, username });
    setMsgs(data);
    setMsg("");
  };

  // recieving updated msgs
  useEffect(() => {
    socket.current.on("sendmsg", (msgs) => {
      console.log(msgs);
      setMsgs(msgs);
    });
  });

  // this method will trigger when we click on call button.
  const callPeer = (id) => {
    // creating new peer which will emit signal for hand shake from the person who calling someone.
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    // will listen to signal and emit event to backend. passing caller id, signal data and our id.
    peer.on("signal", (data) => {
      socket.current.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: yourID,
      });
    });

    // on handshake from opponent we will get partner stream and storing to ref var.
    peer.on("stream", (stream) => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = stream;
      }
    });

    // if call accepted, it emit an event in which we will notify the opponent to make proper handshake
    socket.current.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });
  };

  // will trigger this method on clicking upon accept button.
  const acceptCall = () => {
    closeCallAlert();
    setCallAccepted(true);
    setReceivingCall(false);

    // this will create new peer at the caller side, the person which is being called.
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    // if we accept call the emited signal will listen here and
    // we will send response to the person who is calling us.
    peer.on("signal", (data) => {
      socket.current.emit("acceptCall", { signal: data, to: caller });
    });

    // on handshake from opponent we will get partner stream and storing to ref var.
    peer.on("stream", (stream) => {
      partnerVideo.current.srcObject = stream;
    });

    // this will emit signal to opponent that I accepted call and send signalData back to the one
    // who is calling for handshake.
    peer.signal(callerSignal);
  };

  // setting our streaming to put into DOM
  let UserVideo;
  if (stream) {
    UserVideo = (
      <video
        width="100%"
        height="100%"
        playsInline
        muted
        ref={userVideo}
        autoPlay
      />
    );
  }

  // setting partner streaming to put into DOM
  let PartnerVideo;
  if (callAccepted) {
    PartnerVideo = (
      <video
        width="100%"
        height="100%"
        playsInline
        ref={partnerVideo}
        autoPlay
      />
    );
  }

  // setting incoming call alert.
  if (receivingCall) {
    callAlert();
  }

  return (
    <div className="container">
      <div className="row">
        <div className="col-sm-5">
          <h3>
            {username} <span style={style}>(You)</span>{" "}
            <span style={style} className="text text-success">
              Online
            </span>
          </h3>
          <hr></hr>
          <ScrollToBottom mode={"bottom"} className={messageCSS}>
            <p></p>
            {msgs.map((msg, i) => {
              return msg.username === username ? (
                <p key={i} style={{ textAlign: "right" }}>
                  <span
                    style={{
                      backgroundColor: "#85C1E9",
                      padding: "10px",
                      borderRadius: "20px",
                    }}
                  >
                    <span>{msg.msg}</span>
                  </span>
                </p>
              ) : (
                <p key={i}>
                  <span
                    style={{
                      backgroundColor: "#F9E79F",
                      padding: "10px",
                      borderRadius: "20px",
                    }}
                  >
                    <span style={{ color: "blue" }}>{msg.username}:</span>
                    <span>{msg.msg}</span>
                  </span>
                </p>
              );
            })}
          </ScrollToBottom>
          <div className="input-group mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Message"
              aria-label="Message"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              aria-describedby="button-addon2"
            />
            <button
              className="btn btn-outline-success"
              type="button"
              id="button-addon2"
              onClick={sendMsg}
            >
              Send
            </button>
          </div>
        </div>
        <div
          className="col-sm-5"
          style={{ border: "2px solid blue", borderRadius: "10px" }}
        >
          <h3>Users</h3>
          <hr></hr>
          {users
            .filter((user) => user.name !== username)
            .map((user, i) => {
              return (
                <h3 key={i} style={{ boxShadow: "1px 1px" }}>
                  {user.name}{" "}
                  {user.status === "online" ? (
                    <>
                      <span style={style} className="text text-success">
                        Online
                      </span>
                      &nbsp;&nbsp;&nbsp;
                      <span
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          callPeer(user.id);
                          setCallerName(user.name);
                        }}
                      >
                        <img width="20px" height="20px" alt="" src={img} />
                      </span>
                    </>
                  ) : (
                    <>
                      <span style={style} className="text text-danger">
                        Offline
                      </span>
                      &nbsp;&nbsp;&nbsp;
                      <span style={{ cursor: "not-allowed", opacity: "0.3" }}>
                        <img width="20px" height="20px" alt="" src={img} />
                      </span>
                    </>
                  )}
                </h3>
              );
            })}
        </div>
        <div className="col-sm-2">
          <br></br>
          <Link to="/">
            <button className="btn btn-info">Logout</button>
          </Link>
        </div>
      </div>
      <hr></hr>
      <div>
        <Online>Only shown when you're online</Online>
        <Offline>Only shown offline (surprise!)</Offline>
      </div>
      <div className="row">
        <div className="col-sm-6">
          <h3 align="center">You</h3>
          {UserVideo}
        </div>
        <div className="col-sm-6">
          <h3 align="center">
            {callAccepted
              ? users.filter((user) => user.id === caller).length > 0
                ? users
                    .filter((user) => user.id === caller)
                    .map((user) => user.name)
                : callerName
              : null}
          </h3>
          {PartnerVideo}
        </div>
      </div>
      <div className="row">
        <Modal
          name={users
            .filter((user) => user.id === caller)
            .map((user) => user.name)}
          acceptCall={acceptCall}
        />
      </div>
    </div>
  );
};
export default Chat;
