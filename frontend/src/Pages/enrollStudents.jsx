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
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchCourse();
    fetchStudents();
    fetchEnrolledStudents();
  }, [courseId]);

  const enrolledIds = useMemo(
    () => new Set(enrolledStudents.map((student) => student.id || student.id_users)),
    [enrolledStudents]
  );

  const availableStudents = useMemo(
    () => students.filter((student) => !enrolledIds.has(student.id || student.id_users)),
    [students, enrolledIds]
  );

  const selectedCount = selectedStudents.length;

  async function fetchCourse() {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE}/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      setCourse(await response.json());
    } catch (error) {
      setError("Failed to fetch class information.");
      console.error("Failed to fetch course:", error);
    }
  }

  async function fetchStudents() {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();
      const users = Array.isArray(data) ? data : [];
      setStudents(
        users.filter((user) =>
          user.roles?.includes("student") || user.position?.includes("student") || user.role === "student"
        )
      );
    } catch (error) {
      setError("Failed to fetch students.");
      console.error("Failed to fetch students:", error);
    }
  }

  async function fetchEnrolledStudents() {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE}/enrollments/course/${courseId}/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();
      setEnrolledStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      setError("Failed to fetch enrolled students.");
      console.error("Failed to fetch enrolled students:", error);
    }
  }

  function toggleStudent(studentId) {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  }

  function toggleAllStudents() {
    if (selectedStudents.length === availableStudents.length) {
      setSelectedStudents([]);
      return;
    }
    setSelectedStudents(availableStudents.map((student) => student.id || student.id_users));
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
        body: JSON.stringify({ course_id: courseId, student_ids: selectedStudents }),
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      setSuccess("Students enrolled successfully.");
      setSelectedStudents([]);
      await fetchEnrolledStudents();
    } catch (error) {
      console.error("Enrollment failed:", error);
      setError("Failed to enroll students.");
    }
  }

  async function handleRemoveStudent(studentId) {
    if (!window.confirm("Remove this student from the class?")) return;

    try {
      setError("");
      setSuccess("");
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE}/enrollments/course/${courseId}/students/${studentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);
      setSuccess("Student removed from class.");
      await fetchEnrolledStudents();
    } catch (error) {
      console.error("Remove student failed:", error);
      setError("Failed to remove student from class.");
    }
  }

  return (
    <div className="adminPage">
      <div className="adminHeader">
        <div className="adminHeaderText">
          <h1 className="adminTitle">Enroll Students</h1>
          <p className="adminSubtitle">
            {course
              ? `${course.course_code || "Course"} ${course.id || courseId} - ${course.course_name || "Untitled class"}`
              : `Class ID: ${courseId}`}
          </p>
        </div>

        <button className="secondaryBtn" onClick={() => navigate("/admin/courses/enrollment")}>Back to Classes</button>
      </div>

      {error && <p className="errorText">{error}</p>}
      {success && <p className="successText">{success}</p>}

      <div className="adminCard" style={{ marginBottom: "22px" }}>
        <div className="adminHeader" style={{ borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}>
          <div className="adminHeaderText">
            <h2 style={{ margin: 0, color: "#115740" }}>Currently Enrolled</h2>
            <p className="adminSubtitle">{enrolledStudents.length} student{enrolledStudents.length === 1 ? "" : "s"} enrolled.</p>
          </div>
        </div>

        {enrolledStudents.length === 0 ? (
          <div className="emptyState">No students are currently enrolled in this class.</div>
        ) : (
          <div className="adminTableWrapper" style={{ marginTop: "16px" }}>
            <table className="adminTable">
              <thead>
                <tr>
                  <th>T-Number / User ID</th>
                  <th>Email</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {enrolledStudents.map((student) => {
                  const studentId = student.id || student.id_users;
                  return (
                    <tr key={studentId}>
                      <td>{studentId}</td>
                      <td>{student.email}</td>
                      <td><button className="dangerBtn" onClick={() => handleRemoveStudent(studentId)}>Remove</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="adminCard">
        <div className="adminHeader" style={{ borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}>
          <div className="adminHeaderText">
            <h2 style={{ margin: 0, color: "#115740" }}>Available Students</h2>
            <p className="adminSubtitle">{selectedCount} student{selectedCount === 1 ? "" : "s"} selected.</p>
          </div>
          <div className="adminActions" style={{ marginTop: 0 }}>
            <button className="secondaryBtn" type="button" onClick={toggleAllStudents} disabled={availableStudents.length === 0}>
              {selectedStudents.length === availableStudents.length && availableStudents.length > 0 ? "Clear Selection" : "Select All"}
            </button>
            <button className="primaryBtn" type="button" onClick={handleEnroll}>Enroll Selected</button>
          </div>
        </div>
      </div>

      {availableStudents.length === 0 ? (
        <div className="emptyState">No available student users found.</div>
      ) : (
        <div className="adminTableWrapper">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Select</th>
                <th>T-Number / User ID</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {availableStudents.map((student) => {
                const studentId = student.id || student.id_users;
                return (
                  <tr key={studentId}>
                    <td><input type="checkbox" checked={selectedStudents.includes(studentId)} onChange={() => toggleStudent(studentId)} /></td>
                    <td>{studentId}</td>
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
