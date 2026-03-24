import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE = import.meta?.env?.VITE_API_URL || "/api";

function StudentCourse() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCourse() {
      try {
        const token = localStorage.getItem("accessToken");

        const response = await fetch(`${API_BASE}/course/${courseCode}${courseId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load course");
        }

        const data = await response.json();
        setCourse(data);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchCourse();
  }, [courseId]);

  if (loading) return <p>Loading course...</p>;
  if (error) return <p>{error}</p>;
  if (!course) return <p>Course not found.</p>;

  return (
    <div className="mainContent">
      <h1>{course.course_code} - {course.id}</h1>
      <p>{course.semester}</p>
    </div>
  );
}

export default StudentCourse;