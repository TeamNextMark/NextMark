import "../CSS/Login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta?.env?.VITE_API_URL || "/api";

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

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      if (!res.ok) {
        let detail = "Login failed.";
        try {
          const err = await res.json();
          detail = err?.detail || err?.message || detail;
        } catch {}
        throw new Error(detail);
      }

      const data = await res.json();
      console.log("login response:", data);

      if (!data?.access_token) {
        throw new Error("No access token returned from server.");
      }

      localStorage.setItem("accessToken", data.access_token);
      localStorage.setItem("tokenType", data.token_type || "bearer");

      const rawRoles =
        data.roles ||
        data.position_users ||
        data.position ||
        data.role ||
        [];

      const firstRole = Array.isArray(rawRoles) ? rawRoles[0] : rawRoles;

      let appRole = "student";

      if (firstRole === "faculty") {
        appRole = "instructor";
      } else if (firstRole === "admin") {
        appRole = "admin";
      } else if (firstRole === "ta") {
        appRole = "ta";
      } else if (firstRole === "student") {
        appRole = "student";
      }

      const userObj = {
        email: cleanEmail,
        roles: [appRole],
      };

      localStorage.setItem("user", JSON.stringify(userObj));
      setUser?.(userObj);

      if (appRole === "admin") {
        navigate("/home/admin", { replace: true });
      } else if (appRole === "instructor") {
        navigate("/home/instructor", { replace: true });
      } else if (appRole === "ta") {
        navigate("/home/ta", { replace: true });
      } else {
        navigate("/home/student", { replace: true });
      }
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