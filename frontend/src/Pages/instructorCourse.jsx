import "../CSS/Template.css";
import "../CSS/Course.css";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../Images/downArrow.png";

function InstructorCourse() {
  const navigate = useNavigate();
  const location = useLocation();
  const course = location.state?.course;

  function Dropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef();

    useEffect(() => {
      function handleClickOutside(event) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      }

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    return (
      <div ref={dropdownRef} style={{ position: "relative" }}>
        <div className="descDD">
          <button
            className="courseDesc"
            onClick={() => setIsOpen(!isOpen)}
          >
            Course Description{" "}
            <span className={`arrowDirection ${isOpen ? "open" : ""}`}>
              <img className="arrow" src={logo} alt="arrow" />
            </span>
          </button>
        </div>

        {isOpen && (
          <div className="dropdown-menu">
            <p>
              {course
                ? `${course.course_code} for ${course.semester}`
                : "No course selected."}
            </p>
          </div>
        )}
      </div>
    );
  }

  function goToAssignment() {
    navigate("/faculty/course/assignment", { state: { course } });
  }

  if (!course) {
    return (
      <div className="mainContent">
        <h1>No course selected</h1>
        <button onClick={() => navigate("/home/faculty")}>Back to Courses</button>
      </div>
    );
  }

  return (
    <div className="mainContent">
      <div className="courseBanner">
        <img src="/images/course1.jpg" alt="Course Pic" />
      </div>

      <div className="textContent">
        <div className="courseTitle">
          <h1>{course.course_code}</h1>
          <p>{course.semester}</p>
        </div>

        <Dropdown />

        <div className="assignGrid">
          <button className="assignCard" onClick={goToAssignment}>
            Assignment 1
          </button>

          <button className="assignCard" onClick={goToAssignment}>
            Assignment 2
          </button>

          <button className="assignCard" onClick={goToAssignment}>
            Assignment 3
          </button>
        </div>
      </div>
    </div>
  );
}

export default InstructorCourse;