import "../CSS/Template.css";
import "../CSS/Admin.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta?.env?.VITE_API_URL || "/api";

function CourseEnrollment() {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetch(`${API_BASE}/courses/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      setError("Failed to fetch courses.");
      console.error("Failed to fetch courses:", error);
    }
  }

  return (
    <div className="adminPage">
      <div className="adminHeader">
        <div className="adminHeaderText">
          <h1 className="adminTitle">Class Enrollment</h1>
          <p className="adminSubtitle">Select a class, then enroll students into that class.</p>
        </div>

        <button className="secondaryBtn" onClick={() => navigate("/home/admin")}>
          Back to Dashboard
        </button>
      </div>

      {error && <p className="errorText">{error}</p>}

      {courses.length === 0 && !error ? (
        <div className="emptyState">No classes found.</div>
      ) : (
        <div className="adminTableWrapper">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Course ID</th>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Term</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {courses.map((course) => {
                const courseId = course.id || course.course_id;

                return (
                  <tr key={courseId}>
                    <td>{courseId}</td>
                    <td>{course.course_code || course.subject || "N/A"}</td>
                    <td>{course.course_name || course.name || "Untitled class"}</td>
                    <td>{course.term || course.semester || "N/A"}</td>
                    <td>
                      <button
                        className="primaryBtn"
                        onClick={() => navigate(`/admin/courses/${courseId}/enrollment`)}
                      >
                        Enroll Students
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CourseEnrollment;
