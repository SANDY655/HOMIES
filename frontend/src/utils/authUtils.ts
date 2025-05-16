import * as jwtDecode from "jwt-decode";


type JwtPayload = {
  exp: number;
  iat: number;
  id: string;
  email: string;
};

export function scheduleAutoLogout(navigate: (opts: { to: string }) => void) {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const decoded: JwtPayload = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    const timeLeft = decoded.exp - currentTime;

    if (timeLeft <= 0) {
      handleAutoLogout(navigate);
    } else {
      setTimeout(() => {
        handleAutoLogout(navigate);
      }, timeLeft * 1000);
    }
  } catch (err) {
    console.error("Failed to decode token:", err);
    handleAutoLogout(navigate); // fallback logout
  }
}

export function handleAutoLogout(navigate: (opts: { to: string }) => void) {
  const token = localStorage.getItem("token");
  if (token) {
    fetch("http://localhost:5000/api/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).catch(console.warn);
  }

  localStorage.clear();
  alert("Session expired. You've been logged out.");
  navigate({ to: "/" });
}
