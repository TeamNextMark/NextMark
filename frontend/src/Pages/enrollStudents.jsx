import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function EnrollStudents() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);

  const API_BASE = "/api";

  useEffect(() => {
    fetchCourse();
    fetchStudents();
  }, [courseId]);

  async function fetchCourse() {
    try {
      const response = await fetch(`${API_BASE}/courses/${courseId}`);
      const data = await response.json();
      setCourse(data);
    } catch (error) {
      console.error("Failed to fetch course:", error);
    }
  }

  async function fetchStudents() {
    try {
      const response = await fetch(`${API_BASE}/users?role=student`);
      const data = await response.json();
      setStudents(data);
    } catch (error) {
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

  async function handleEnroll() {
    if (selectedStudents.length === 0) {
      alert("Please select at least one student.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/enrollments/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          course_id: courseId,
          student_ids: selectedStudents,
        }),
      });

      if (!response.ok) {
        throw new Error("Enrollment failed");
      }

      alert("Students enrolled successfully.");
      setSelectedStudents([]);
    } catch (error) {
      console.error(error);
      alert("Failed to enroll students.");
    }
  }

  return (
    <div className="adminContainer">
      <button className="secondaryButton" onClick={() => navigate("/admin/enrollments")}>
        Back to Courses
      </button>

      <div className="adminHeader">
        <h2>Enroll Students</h2>

        {course && (
          <p>
            {course.subject} {course.course_id} -{" "}
            {course.course_name || course.name}
          </p>
        )}
      </div>

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
            {students.map((student) => (
              <tr key={student.id || student.id_users}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id || student.id_users)}
                    onChange={() =>
                      toggleStudent(student.id || student.id_users)
                    }
                  />
                </td>
                <td>{student.name || student.full_name || "N/A"}</td>
                <td>{student.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="primaryButton" onClick={handleEnroll}>
        Enroll Selected Students
      </button>
    </div>
  );
}

export default EnrollStudents;