import "../CSS/Template.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta?.env?.VITE_API_URL || "/api";

function CreateCourse() {
  const navigate = useNavigate();

  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [semester, setSemester] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetch(`${API_BASE}/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          course_code: courseCode,
          course_name: courseName,
          course_description: courseDescription,
          semester,
          faculty_id: facultyId,
        }),
      });

      if (!response.ok) throw new Error("Failed to create class");

      navigate("/admin/courses");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mainContent">
      <h1 className="pageTitle">Create Class</h1>

      {error && <p>{error}</p>}

      <form onSubmit={handleSubmit} className="formCard">
        <input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} placeholder="Course Code" required />
        <input value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="Course Name" required />
        <textarea value={courseDescription} onChange={(e) => setCourseDescription(e.target.value)} placeholder="Course Description" />
        <input value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="Semester" required />
        <input value={facultyId} onChange={(e) => setFacultyId(e.target.value)} placeholder="Faculty ID" required />

        <button type="submit">Create Class</button>
      </form>
    </div>
  );
}

export default CreateCourse;