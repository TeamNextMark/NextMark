import "../CSS/Login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE =
  import.meta?.env?.VITE_API_URL || "http://localhost:5173";

function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      alert("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      if (!res.ok) {
        let detail = "Login failed.";
        try {
          const err = await res.json();
          detail = err?.detail || err?.message || detail;
        } catch {
        }
        throw new Error(detail);
      }

      const data = await res.json();

      if (!data?.access_token) {
        throw new Error("No access token returned from server.");
      }

      localStorage.setItem("accessToken", data.access_token);
      localStorage.setItem("tokenType", data.token_type || "bearer");

      const userObj = { email: cleanEmail };
      localStorage.setItem("user", JSON.stringify(userObj));
      setUser?.(userObj);

      navigate("/home", { replace: true });
    } catch (err) {
      alert(err?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="loginContent">
      <form className="loginCard" onSubmit={handleSubmit}>
        <h2 className="loginHeading">Login</h2>

        <input
          className="inputBar"
          type="email"
          placeholder="Email"
          value={email}
          autoComplete="username"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="inputBar"
          type="password"
          placeholder="Password"
          value={password}
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="loginButton" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

export default Login;