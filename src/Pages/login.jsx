import "../CSS/Login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";


function Login() {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const getRoleFromUsername = (name) => {
    const u = name.trim().toLowerCase();

    if (u === "admin" || u.startsWith("admin:")) return "admin";
    if (u === "instructor" || u === "prof" || u.startsWith("instructor:")) return "instructor";
    if (u === "ta" || u.startsWith("ta:")) return "ta";
    if (u === "student" || u.startsWith("student:")) return "student";

    return "student";
  };

  const cleanName = (name) => {
    return name.replace(/^(admin|instructor|ta|student)\s*:/i, "").trim();
  };

  function handleSubmit(e) {
    e.preventDefault();

    const username = user.trim();
    if (!username) {
      alert("Please enter a username");
      return;
    }

    const role = getRoleFromUsername(username);
    const displayName = cleanName(username) || "Test User";

    navigate("/home", {
      state: { user: { name: displayName, role } },
    });
  }

  return (
    <div className="loginContent">
      <form className="loginCard" onSubmit={handleSubmit}>
        <h2 className="loginHeading">Login</h2>

        <input
          className="inputBar"
          type="text"
          placeholder="Username"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />

        <input
          className="inputBar"
          type="password"
          placeholder="Password (ignored for testing)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="loginButton" type="submit">
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;
