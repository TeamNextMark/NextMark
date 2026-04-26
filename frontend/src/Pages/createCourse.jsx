import "../CSS/Template.css";
import "../CSS/Admin.css";
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

      const response = await fetch(`${API_BASE}/courses/`, {
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
    <div className="adminPage">
      <div className="adminHeader">
        <div className="adminHeaderText">
          <h1 className="adminTitle">Create Class</h1>
          <p className="adminSubtitle">Add a new class section and assign it to an instructor.</p>
        </div>

        <button className="secondaryBtn" onClick={() => navigate("/admin/courses")}>
          Back to Classes
        </button>
      </div>

      {error && <p className="errorText">{error}</p>}

      <div className="adminCard adminFormCard">
        <form onSubmit={handleSubmit} className="adminForm">
          <div className="adminField">
            <label>Course Code</label>
            <input
              className="adminInput"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="COMS"
              required
            />
          </div>

          <div className="adminField">
            <label>Course Name</label>
            <input
              className="adminInput"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="Programming Foundations II"
              required
            />
          </div>

          <div className="adminField">
            <label>Course Description</label>
            <textarea
              className="adminTextarea"
              value={courseDescription}
              onChange={(e) => setCourseDescription(e.target.value)}
              placeholder="Brief class description"
            />
          </div>

          <div className="adminField">
            <label>Semester</label>
            <input
              className="adminInput"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              placeholder="Fall 2026"
              required
            />
          </div>

          <div className="adminField">
            <label>Faculty ID</label>
            <input
              className="adminInput"
              value={facultyId}
              onChange={(e) => setFacultyId(e.target.value)}
              placeholder="Faculty UUID"
              required
            />
          </div>

          <div className="adminActions">
            <button className="primaryBtn" type="submit">Create Class</button>
            <button className="secondaryBtn" type="button" onClick={() => navigate("/admin/courses")}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateCourse;
