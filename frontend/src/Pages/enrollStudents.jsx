import "../CSS/Template.css";
import "../CSS/Admin.css";
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE = import.meta?.env?.VITE_API_URL || "/api";

function EnrollStudents() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchCourse();
    fetchStudents();
  }, [courseId]);

  const selectedCount = useMemo(() => selectedStudents.length, [selectedStudents]);

  async function fetchCourse() {
    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetch(`${API_BASE}/courses/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setCourse(data);
    } catch (error) {
      setError("Failed to fetch class information.");
      console.error("Failed to fetch course:", error);
    }
  }

  async function fetchStudents() {
    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      const users = Array.isArray(data) ? data : [];

      const onlyStudents = users.filter((user) =>
        user.roles?.includes("student") ||
        user.position?.includes("student") ||
        user.role === "student"
      );

      setStudents(onlyStudents);
    } catch (error) {
      setError("Failed to fetch students.");
      console.error("Failed to fetch students:", error);
    }
  }

  function toggleStudent(studentId) {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  }

  function toggleAllStudents() {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
      return;
    }

    setSelectedStudents(students.map((student) => student.id || student.id_users));
  }

  async function handleEnroll() {
    setError("");
    setSuccess("");

    if (selectedStudents.length === 0) {
      setError("Please select at least one student.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetch(`${API_BASE}/enrollments/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          course_id: courseId,
          student_ids: selectedStudents,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      setSuccess("Students enrolled successfully.");
      setSelectedStudents([]);
    } catch (error) {
      console.error("Enrollment failed:", error);
      setError("Failed to enroll students.");
    }
  }

  return (
    <div className="adminPage">
      <div className="adminHeader">
        <div className="adminHeaderText">
          <h1 className="adminTitle">Enroll Students</h1>
          <p className="adminSubtitle">
            {course
              ? `${course.course_code || course.subject || "Course"} ${course.id || course.course_id || courseId} - ${course.course_name || course.name || "Untitled class"}`
              : `Class ID: ${courseId}`}
          </p>
        </div>

        <button className="secondaryBtn" onClick={() => navigate("/admin/courses/enrollment")}>
          Back to Classes
        </button>
      </div>

      {error && <p className="errorText">{error}</p>}
      {success && <p className="successText">{success}</p>}

      <div className="adminCard">
        <div className="adminHeader" style={{ borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}>
          <div className="adminHeaderText">
            <h2 style={{ margin: 0, color: "#115740" }}>Available Students</h2>
            <p className="adminSubtitle">{selectedCount} student{selectedCount === 1 ? "" : "s"} selected.</p>
          </div>

          <div className="adminActions" style={{ marginTop: 0 }}>
            <button className="secondaryBtn" type="button" onClick={toggleAllStudents} disabled={students.length === 0}>
              {selectedStudents.length === students.length && students.length > 0 ? "Clear Selection" : "Select All"}
            </button>
            <button className="primaryBtn" type="button" onClick={handleEnroll}>
              Enroll Selected
            </button>
          </div>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="emptyState">No student users found.</div>
      ) : (
        <div className="adminTableWrapper">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Select</th>
                <th>Student Name</th>
                <th>Email</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => {
                const studentId = student.id || student.id_users;

                return (
                  <tr key={studentId}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(studentId)}
                        onChange={() => toggleStudent(studentId)}
                      />
                    </td>
                    <td>{student.name || student.full_name || "N/A"}</td>
                    <td>{student.email}</td>
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

export default EnrollStudents;
