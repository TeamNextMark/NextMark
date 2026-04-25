import "../CSS/Template.css";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = import.meta?.env?.VITE_API_URL || "/api";

function EditCourse() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [semester, setSemester] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCourse() {
      try {
        const token = localStorage.getItem("accessToken");

        const response = await fetch(`${API_BASE}/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to load class");

        const data = await response.json();

        setCourseCode(data.course_code || "");
        setCourseName(data.course_name || "");
        setCourseDescription(data.course_description || "");
        setSemester(data.semester || "");
      } catch (err) {
        setError(err.message);
      }
    }

    fetchCourse();
  }, [courseId]);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetch(`${API_BASE}/admin/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          course_code: courseCode,
          course_name: courseName,
          course_description: courseDescription,
          semester,
        }),
      });

      if (!response.ok) throw new Error("Failed to update class");

      navigate("/admin/courses");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mainContent">
      <h1 className="pageTitle">Edit Class</h1>

      {error && <p>{error}</p>}

      <form onSubmit={handleSubmit} className="formCard">
        <input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} required />
        <input value={courseName} onChange={(e) => setCourseName(e.target.value)} required />
        <textarea value={courseDescription} onChange={(e) => setCourseDescription(e.target.value)} />
        <input value={semester} onChange={(e) => setSemester(e.target.value)} required />

        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
}

export default EditCourse;