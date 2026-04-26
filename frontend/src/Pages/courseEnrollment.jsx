import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function CourseEnrollment() {
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  const API_BASE = "/api";

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    try {
      const response = await fetch(`${API_BASE}/courses/`);
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    }
  }

  return (
    <div className="adminContainer">
      <div className="adminHeader">
        <h2>Course Enrollment</h2>
        <p>Select a course to enroll students.</p>
      </div>

      <div className="adminTableWrapper">
        <table className="adminTable">
          <thead>
            <tr>
              <th>Course ID</th>
              <th>Subject</th>
              <th>Course Name</th>
              <th>Term</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {courses.map((course) => (
              <tr key={course.course_id}>
                <td>{course.course_id}</td>
                <td>{course.subject}</td>
                <td>{course.course_name || course.name}</td>
                <td>{course.term}</td>
                <td>
                  <button
                    className="primaryButton"
                    onClick={() =>
                      navigate(`/admin/enrollments/${course.course_id}`)
                    }
                  >
                    Enroll Students
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CourseEnrollment;