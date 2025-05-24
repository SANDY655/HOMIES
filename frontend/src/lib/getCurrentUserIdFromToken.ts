import { jwtDecode } from "jwt-decode";
export const getCurrentUserIdFromToken = () => {
  const token = localStorage.getItem("token");

  if (token) {
    const decoded = jwtDecode(token);
    return decoded.id;
  }
};
