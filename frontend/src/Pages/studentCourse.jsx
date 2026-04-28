import "../CSS/Template.css";
import "../CSS/Course.css";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import logo from "../Images/downArrow.png";
import { getCourseImage } from "../utils/courseImages";

const API_BASE = import.meta?.env?.VITE_API_URL || "/api";

function StudentCourse() {
  const navigate = useNavigate();
  const { courseSlug } = useParams();

  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const courseId = courseSlug.replace(/^[a-zA-Z]+/, "");

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("accessToken");

        const [courseRes, assignmentsRes] = await Promise.all([
          fetch(`${API_BASE}/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/assignments/course/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!courseRes.ok) throw new Error("Failed to load course");
        if (!assignmentsRes.ok) throw new Error("Failed to load assignments");

        const courseData = await courseRes.json();
        const assignmentData = await assignmentsRes.json();

        setCourse(courseData);
        setAssignments(assignmentData);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [courseId]);

  function goToAssignment(assignmentId) {
    navigate(`/student/course/${courseSlug}/assignment/${assignmentId}`);
  }

  function Dropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
      function handleClickOutside(event) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      }

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <div ref={dropdownRef} style={{ position: "relative" }}>
        <div className="descDD">
          <button className="courseDesc" onClick={() => setIsOpen(!isOpen)}>
            Course Description
            <span className={`arrowDirection ${isOpen ? "open" : ""}`}>
              <img className="arrow" src={logo} alt="arrow" />
            </span>
          </button>
        </div>

        {isOpen && (
          <div className="dropdown-menu">
            <p>{course?.course_description || "No description available."}</p>
          </div>
        )}
      </div>
    );
  }

  if (loading) return <div className="mainContent"><p>Loading course...</p></div>;
  if (error) return <div className="mainContent"><p>{error}</p></div>;
  if (!course) return <div className="mainContent"><p>Course not found.</p></div>;

  return (
    <div className="mainContent">
      <div className="courseBanner">
        <img
          src={getCourseImage(course)}
          alt={`${course.course_code} (${course.id}) - ${course.semester}`}
        />
      </div>

      <div className="textContent">
        <div className="courseTitle">
          <h1>
            {course.course_code} - {course.id} {course.course_name}
          </h1>
          <p>{course.semester}</p>
        </div>

        <Dropdown />

        <div className="assignGrid">
          {assignments.length > 0 ? (
            assignments.map((assignment) => (
              <button
                key={assignment.id}
                className="assignCard"
                onClick={() => goToAssignment(assignment.id)}
              >
                <strong>{assignment.assignment_name}</strong>
                <div>Due: {assignment.due_date}</div>
                <div>Language: {assignment.code_language}</div>
              </button>
            ))
          ) : (
            <p>No assignments found for this course.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentCourse;