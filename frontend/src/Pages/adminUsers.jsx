import "../CSS/Template.css";
import "../CSS/Home.css";
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
    <div className="mainContent">
      <h1 className="pageTitle">Manage Users</h1>

      <button className="primaryBtn" onClick={() => navigate("/admin/users/create")}>
        Create User
      </button>

      {error && <p>{error}</p>}

      <div className="coursesGrid">
        {users.map((u) => (
          <div className="courseCard" key={u.id || u.id_users}>
            <div className="courseInfo">
              <h2>{u.email}</h2>
              <p>{Array.isArray(u.roles) ? u.roles.join(", ") : u.position?.join(", ")}</p>

              <button onClick={() => navigate(`/admin/users/${u.id || u.id_users}/edit`)}>
                Edit
              </button>

              <button onClick={() => removeUser(u.id || u.id_users)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminUsers;