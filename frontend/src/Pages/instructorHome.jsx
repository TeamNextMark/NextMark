import "../CSS/Template.css";
import "../CSS/Home.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { assignImagesToCourses } from "../utils/courseImages";

const API_BASE = import.meta?.env?.VITE_API_URL || "/api";

function FacultyHome({ user }) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCourses() {
      try {
        const token = localStorage.getItem("accessToken");

        if (!token) {
          throw new Error("No access token found. Please log in again.");
        }

        const response = await fetch(`${API_BASE}/courses/my-faculty-courses`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          let message = "Failed to load faculty courses";
          try {
            const err = await response.json();
            message = err?.detail || err?.message || message;
          } catch {}
          throw new Error(message);
        }

        const data = await response.json();
        setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  const coursesWithImages = useMemo(() => assignImagesToCourses(courses), [courses]);

  function goToCourses(course) {
    const slug = `${course.course_code}${course.id}`;
    const roles = user?.roles || [];

    if (roles.includes("faculty") || roles.includes("ta")) {
      navigate(`/faculty/course/${slug}`);
    } else {
      navigate(`/ta/course/${slug}`);
    }
  }

  return (
    <div className="mainContent">
      <h1 className="pageTitle">My Courses</h1>

      {loading && <p>Loading courses...</p>}
      {!loading && error && <p>{error}</p>}

      <div className="coursesGrid">
        {!loading && !error && coursesWithImages.length === 0 && <p>No courses assigned yet.</p>}

        {coursesWithImages.map((course) => (
          <button
            key={course.course_id}
            className="courseCard"
            onClick={() => goToCourses(course)}
          >
            <div className="courseImage">
              <img
                src={course.image}
                alt={`${course.course_code} (${course.id}) - ${course.semester}`}
              />
            </div>

            <div className="courseInfo">
              <h2>
                {course.course_code} - {course.id} {course.course_name}
              </h2>
              <p>{course.semester}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default FacultyHome;