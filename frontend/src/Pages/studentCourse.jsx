import "../CSS/Template.css";
import "../CSS/Course.css";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../Images/downArrow.png";

function InstructorCourse() {
    const navigate = useNavigate();

    function Dropdown() {
        const [isOpen, setIsOpen] = useState(false);
        const dropdownRef = useRef();

        useEffect(() => {
            function handleClickOutside(event) {
                if (
                    dropdownRef.current &&
                    !dropdownRef.current.contains(event.target)
                ) {
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
                        <p>Course description goes here</p>
                    </div>
                )}
            </div>
        );
    }

    function goToAssignment() {
        navigate("/student/course/assignment");
    }

    return (
        <div className="mainContent">
            <div className="courseBanner">
                <img src="../Images/course1.jpg" alt="Course Pic" />
            </div>

            <div className="textContent">
                <div className="courseTitle">
                    <h1>Course Title</h1>
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