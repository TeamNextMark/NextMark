import "../CSS/Template.css";
import "../CSS/Course.css";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import logo from "../Images/downArrow.png";

const API_BASE = import.meta?.env?.VITE_API_URL || "/api";

function InstructorCourse() {
  const navigate = useNavigate();
  const { courseSlug } = useParams();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCourse() {
      try {
        const token = localStorage.getItem("accessToken");

        const courseId = courseSlug.replace(/^[a-zA-Z]+/, "");

        const response = await fetch(`${API_BASE}/courses/${courseId}`, {
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
  }, [courseSlug]);

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
            <p>
              {course
                ? `${course.course_code} (${course.id}) for ${course.semester}`
                : "No course selected."}
            </p>
          </div>
        )}
      </div>
    );
  }

  function goToAssignment() {
    navigate(`/faculty/course/${courseSlug}/assignment`);
  }

  if (loading) return <div className="mainContent"><p>Loading course...</p></div>;
  if (error) return <div className="mainContent"><p>{error}</p></div>;
  if (!course) return <div className="mainContent"><p>Course not found.</p></div>;

  return (
    <div className="mainContent">
      <div className="courseBanner">
        <img
          src="/images/course1.jpg"
          alt={`${course.course_code} (${course.id}) - ${course.semester}`}
        />
      </div>

      <div className="textContent">
        <div className="courseTitle">
          <h1>{course.course_code} - {course.id}</h1>
          <p>{course.semester}</p>
        </div>

        <Dropdown />

        <div className="assignGrid">
          <button className="assignCard" onClick={goToAssignment}>Assignment 1</button>
          <button className="assignCard" onClick={goToAssignment}>Assignment 2</button>
          <button className="assignCard" onClick={goToAssignment}>Assignment 3</button>
        </div>
      </div>
    </div>
  );
}
