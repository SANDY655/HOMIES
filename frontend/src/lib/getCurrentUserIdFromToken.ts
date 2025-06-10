import { jwtDecode } from "jwt-decode";

type DecodedToken = {
  id: string;
  // add other properties if needed
  [key: string]: any;
};

export const getCurrentUserIdFromToken = () => {
  const token = localStorage.getItem("token");

  if (token) {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.id;
  }
};
