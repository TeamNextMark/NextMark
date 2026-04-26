import "../CSS/Template.css";
import "../CSS/Admin.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta?.env?.VITE_API_URL || "/api";

function CreateUser() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roles, setRoles] = useState(["student"]);
  const [error, setError] = useState("");

  function toggleRole(role) {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetch(`${API_BASE}/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          password,
          roles,
        }),
      });

      if (!response.ok) throw new Error("Failed to create user");

      navigate("/admin/users");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mainContent">
      <h1 className="pageTitle">Create User</h1>

      {error && <p>{error}</p>}

      <form onSubmit={handleSubmit} className="formCard">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Temporary Password"
          type="password"
          required
        />

        <label>
          <input type="checkbox" checked={roles.includes("student")} onChange={() => toggleRole("student")} />
          Student
        </label>

        <label>
          <input type="checkbox" checked={roles.includes("ta")} onChange={() => toggleRole("ta")} />
          TA
        </label>

        <label>
          <input type="checkbox" checked={roles.includes("faculty")} onChange={() => toggleRole("faculty")} />
          Faculty
        </label>

        <label>
          <input type="checkbox" checked={roles.includes("admin")} onChange={() => toggleRole("admin")} />
          Admin
        </label>

        <button type="submit">Create User</button>
      </form>
    </div>
  );
}

export default CreateUser;