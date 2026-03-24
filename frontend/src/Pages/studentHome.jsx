import "../CSS/Template.css";
import "../CSS/Home.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const API_BASE = import.meta?.env?.VITE_API_URL || "/api";

function Home() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCourses() {
      try {
        const token = localStorage.getItem("accessToken");

        const response = await fetch(`${API_BASE}/courses/my-student-courses`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load student courses");
        }

        const data = await response.json();
        console.log("Student courses:", data);

        setCourses(data);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  function goToCourses(course) {
    navigate("/student/courses", { state: { course } });
  }

  return (
    <div className="mainContent">
      <h1 className="pageTitle">Courses</h1>

      {loading && <p>Loading courses...</p>}
      {error && <p>{error}</p>}
      {!loading && courses.length === 0 && <p>No enrolled courses.</p>}

      <div className="coursesGrid">
        {courses.map((course) => (
          <button
            key={course.id}
            className="courseCard"
            onClick={() => goToCourses(course)}
          >
            <div className="courseImage">
              <img
                src="/images/course1.jpg"
                alt={`${course.course_code} (${course.id}) - ${course.semester}`}
              />
            </div>

            <div className="courseInfo">
              <h2>{course.course_code} - {course.id}</h2>
              <p>{course.semester}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Home;