import "../CSS/Template.css";
import "../CSS/Admin.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta?.env?.VITE_API_URL || "/api";

function CreateUser() {
  const navigate = useNavigate();

  const [tNumber, setTNumber] = useState("");
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
          id: tNumber.trim() || null,
          email,
          password,
          roles,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to create user");
      }

      navigate("/admin/users");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="adminPage">
      <div className="adminHeader">
        <div className="adminHeaderText">
          <h1 className="adminTitle">Create User</h1>
          <p className="adminSubtitle">Add a new user and assign their system role.</p>
        </div>

        <button className="secondaryBtn" onClick={() => navigate("/admin/users")}>Back to Users</button>
      </div>

      {error && <p className="errorText">{error}</p>}

      <div className="adminCard adminFormCard">
        <form onSubmit={handleSubmit} className="adminForm">
          <div className="adminField">
            <label>T-Number / User ID <span style={{ fontWeight: 400 }}>(optional)</span></label>
            <input className="adminInput" value={tNumber} onChange={(e) => setTNumber(e.target.value)} placeholder="T01234567" />
          </div>

          <div className="adminField">
            <label>Email</label>
            <input className="adminInput" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@atu.edu" type="email" required />
          </div>

          <div className="adminField">
            <label>Temporary Password</label>
            <input className="adminInput" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Temporary Password" type="password" required />
          </div>

          <div className="adminField">
            <span className="adminFieldTitle">Roles</span>
            <div className="adminRoleGroup">
              {["student", "ta", "faculty", "admin"].map((role) => (
                <label className="adminCheckboxLabel" key={role}>
                  <input type="checkbox" checked={roles.includes(role)} onChange={() => toggleRole(role)} />
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div className="adminActions">
            <button className="primaryBtn" type="submit">Create User</button>
            <button className="secondaryBtn" type="button" onClick={() => navigate("/admin/users")}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateUser;
