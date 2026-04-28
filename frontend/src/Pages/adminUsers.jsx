import "../CSS/Template.css";
import "../CSS/Admin.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta?.env?.VITE_API_URL || "/api";

function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  async function fetchUsers() {
    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to load users");

      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeUser(userId) {
    if (!window.confirm("Remove this user?")) return;

    const token = localStorage.getItem("accessToken");

    const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      fetchUsers();
    } else {
      alert("Failed to remove user");
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="adminPage">
      <div className="adminHeader">
        <div className="adminHeaderText">
          <h1 className="adminTitle">Manage Users</h1>
          <p className="adminSubtitle">Create, update, and remove NextMark user accounts.</p>
        </div>

        <button className="primaryBtn" onClick={() => navigate("/admin/users/create")}>
          Create User
        </button>
      </div>

      {error && <p className="errorText">{error}</p>}

      {users.length === 0 && !error ? (
        <div className="emptyState">No users found.</div>
      ) : (
        <div className="adminGrid">
          {users.map((u) => {
            const userId = u.id || u.id_users;
            const userRoles = Array.isArray(u.roles)
              ? u.roles
              : Array.isArray(u.position)
              ? u.position
              : u.role
              ? [u.role]
              : [];

            return (
              <div className="adminListCard" key={userId}>
                <div>
                  <h2>{u.email}</h2>
                  <p>{u.name || u.full_name || "User account"}</p>
                  <p style={{ marginTop: "4px", color: "#667085", fontSize: "0.9rem" }}>ID: {userId}</p>

                  <div className="adminBadgeRow">
                    {userRoles.length > 0 ? (
                      userRoles.map((role) => (
                        <span className="adminBadge" key={role}>{role}</span>
                      ))
                    ) : (
                      <span className="adminBadge">No role</span>
                    )}
                  </div>
                </div>

                <div className="adminActions">
                  <button
                    className="secondaryBtn"
                    onClick={() => navigate(`/admin/users/${userId}/edit`)}
                  >
                    Edit
                  </button>

                  <button className="dangerBtn" onClick={() => removeUser(userId)}>
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
