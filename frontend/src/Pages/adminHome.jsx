import "../CSS/Template.css";
import "../CSS/Home.css";
import { useNavigate } from "react-router-dom";

function AdminHome() {
  const navigate = useNavigate();

  return (
    <div className="mainContent">
      <h1 className="pageTitle">Admin Dashboard</h1>

      <div className="coursesGrid">
        <button className="courseCard" onClick={() => navigate("/admin/users")}>
          <div className="courseInfo">
            <h2>Manage Users</h2>
            <p>Create, edit, and remove users.</p>
          </div>
        </button>

        <button className="courseCard" onClick={() => navigate("/admin/courses")}>
          <div className="courseInfo">
            <h2>Manage Classes</h2>
            <p>Create, edit, and remove classes.</p>
          </div>
        </button>
      </div>
    </div>
  );
}

export default AdminHome;