import { io } from "socket.io-client";
const socket = io("https://homies-oqpt.onrender.com", { autoConnect: false });
export default socket;
