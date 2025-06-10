// lib/socket.ts
import { io } from "socket.io-client";

const socket = io("https://homies-oqpt.onrender.com", {
  autoConnect: false,
  transports: ["websocket"],
  withCredentials: true,
});

export default socket;
