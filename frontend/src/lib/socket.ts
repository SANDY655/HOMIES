// lib/socket.ts
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  autoConnect: false,
  transports: ["websocket"],
  withCredentials: true,
});

export default socket;
