import "../CSS/Template.css";
import "../CSS/Home.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta?.env?.VITE_API_URL || "/api";

function AdminCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");

  async function fetchCourses() {
    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetch(`${API_BASE}/courses/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to load classes");

      const data = await response.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeCourse(courseId) {
    if (!window.confirm("Remove this class?")) return;

    const token = localStorage.getItem("accessToken");

    const response = await fetch(`${API_BASE}/admin/courses/${courseId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      fetchCourses();
    } else {
      alert("Failed to remove class");
    }
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <div className="mainContent">
      <h1 className="pageTitle">Manage Classes</h1>

      <button className="primaryBtn" onClick={() => navigate("/admin/courses/create")}>
        Create Class
      </button>

      {error && <p>{error}</p>}

      <div className="coursesGrid">
        {courses.map((course) => (
          <div className="courseCard" key={course.id}>
            <div className="courseInfo">
              <h2>{course.course_code} - {course.course_name}</h2>
              <p>{course.semester}</p>

              <button onClick={() => navigate(`/admin/courses/${course.id}/edit`)}>
                Edit
              </button>

              <button onClick={() => removeCourse(course.id)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminCourses;