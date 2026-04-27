import "../CSS/Template.css";
import "../CSS/Admin.css";
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
    <div className="adminPage">
      <div className="adminHeader">
        <div className="adminHeaderText">
          <h1 className="adminTitle">Manage Classes</h1>
          <p className="adminSubtitle">Create, edit, and remove course sections.</p>
        </div>

        <button className="primaryBtn" onClick={() => navigate("/admin/courses/create")}>
          Create Class
        </button>
      </div>

      {error && <p className="errorText">{error}</p>}

      {courses.length === 0 && !error ? (
        <div className="emptyState">No classes found.</div>
      ) : (
        <div className="adminGrid">
          {courses.map((course) => {
            const courseId = course.id || course.course_id;

            return (
              <div className="adminListCard" key={courseId}>
                <div>
                  <h2>
                    {course.course_code || course.subject || "Course"} {course.courseId || courseId}
                  </h2>
                  <p>{course.course_name || course.name || "Untitled class"}</p>

                  <div className="adminBadgeRow">
                    {course.semester && <span className="adminBadge">{course.semester}</span>}
                    {course.term && <span className="adminBadge">{course.term}</span>}
                    {Array.isArray(course.faculty_ids) && course.faculty_ids.length > 0 && (
                      <span className="adminBadge">Faculty: {course.faculty_ids.join(", ")}</span>
                    )}
                  </div>
                </div>

                <div className="adminActions">
                  <button
                    className="secondaryBtn"
                    onClick={() => navigate(`/admin/courses/${courseId}/edit`)}
                  >
                    Edit
                  </button>

                  <button className="dangerBtn" onClick={() => removeCourse(courseId)}>
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

export default AdminCourses;
