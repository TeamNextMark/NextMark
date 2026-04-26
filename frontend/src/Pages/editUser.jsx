import "../CSS/Template.css";
import "../CSS/Admin.css";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = import.meta?.env?.VITE_API_URL || "/api";

function EditUser() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState("");

  function toggleRole(role) {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  useEffect(() => {
    async function fetchUser() {
      try {
        const token = localStorage.getItem("accessToken");

        const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to load user");

        const data = await response.json();
        setEmail(data.email || "");
        setRoles(data.roles || data.position || []);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchUser();
  }, [userId]);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          roles,
        }),
      });

      if (!response.ok) throw new Error("Failed to update user");

      navigate("/admin/users");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="adminPage">
      <div className="adminHeader">
        <div className="adminHeaderText">
          <h1 className="adminTitle">Edit User</h1>
          <p className="adminSubtitle">Update this user's email and assigned roles.</p>
        </div>

        <button className="secondaryBtn" onClick={() => navigate("/admin/users")}>
          Back to Users
        </button>
      </div>

      {error && <p className="errorText">{error}</p>}

      <div className="adminCard adminFormCard">
        <form onSubmit={handleSubmit} className="adminForm">
          <div className="adminField">
            <label>Email</label>
            <input
              className="adminInput"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>

          <div className="adminField">
            <span className="adminFieldTitle">Roles</span>
            <div className="adminRoleGroup">
              {["student", "ta", "faculty", "admin"].map((role) => (
                <label className="adminCheckboxLabel" key={role}>
                  <input
                    type="checkbox"
                    checked={roles.includes(role)}
                    onChange={() => toggleRole(role)}
                  />
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div className="adminActions">
            <button className="primaryBtn" type="submit">Save Changes</button>
            <button className="secondaryBtn" type="button" onClick={() => navigate("/admin/users")}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditUser;
