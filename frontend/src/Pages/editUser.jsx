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
    <div className="mainContent">
      <h1 className="pageTitle">Edit User</h1>

      {error && <p>{error}</p>}

      <form onSubmit={handleSubmit} className="formCard">
        <input value={email} onChange={(e) => setEmail(e.target.value)} required />

        {["student", "ta", "faculty", "admin"].map((role) => (
          <label key={role}>
            <input
              type="checkbox"
              checked={roles.includes(role)}
              onChange={() => toggleRole(role)}
            />
            {role}
          </label>
        ))}

        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
}

export default EditUser;