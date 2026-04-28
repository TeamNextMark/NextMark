import "../CSS/Template.css";
import "../CSS/Admin.css";
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
  const [facultyIds, setFacultyIds] = useState("");
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
        setSemester(data.semester || data.term || "");
        setFacultyIds(Array.isArray(data.faculty_ids) ? data.faculty_ids.join(", ") : "");
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
          faculty_ids: facultyIds
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to update class");
      }

      navigate("/admin/courses");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="adminPage">
      <div className="adminHeader">
        <div className="adminHeaderText">
          <h1 className="adminTitle">Edit Class</h1>
          <p className="adminSubtitle">Update the class details shown to instructors and students.</p>
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
              required
            />
          </div>

          <div className="adminField">
            <label>Course Name</label>
            <input
              className="adminInput"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              required
            />
          </div>

          <div className="adminField">
            <label>Course Description</label>
            <textarea
              className="adminTextarea"
              value={courseDescription}
              onChange={(e) => setCourseDescription(e.target.value)}
            />
          </div>

          <div className="adminField">
            <label>Semester</label>
            <input
              className="adminInput"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              required
            />
          </div>

          <div className="adminField">
            <label>Faculty ID(s)</label>
            <input
              className="adminInput"
              value={facultyIds}
              onChange={(e) => setFacultyIds(e.target.value)}
              placeholder="Faculty UUID or T-number, comma separated"
              required
            />
          </div>

          <div className="adminActions">
            <button className="primaryBtn" type="submit">Save Changes</button>
            <button className="secondaryBtn" type="button" onClick={() => navigate("/admin/courses")}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditCourse;
