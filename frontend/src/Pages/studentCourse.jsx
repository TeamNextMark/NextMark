import "../CSS/Course.css";
import { useState, useRef, useEffect } from "react";
import logo from "../Images/downArrow.png"

function StudentCourse () {

    function Dropdown() {
        const [isOpen, setIsOpen] = useState(false);
        const dropdownRef = useRef();

        useEffect(() => {
            function handleClickOutside(event) {
                if (dropdownRef.current &&
                    !dropdownRef.current.contains(event.target)) {
                    setIsOpen(false);
                }
            }

            document.addEventListener("mousedown", handleClickOutside);

            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }, []);

        return (
            <div ref={dropdownRef} style={{position: "relative"}}>
                <div className="descDD">
                    <button className="courseDesc" onClick={() => setIsOpen(!isOpen)}>
                        Course Description <span className={`arrowDirection ${isOpen ? "open" : ""}`}><img className="arrow" src={logo}/></span>
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
                    <button
                        className="assignCard"
                        onClick={() => window.open("https://example.com/assignment1", "_blank")}
                    >
                        Assignment 1
                    </button>

                    <button
                        className="assignCard"
                        onClick={() => window.open("https://example.com/assignment2", "_blank")}
                    >
                        Assignment 2
                    </button>

                    <button
                        className="assignCard"
                        onClick={() => window.open("https://example.com/assignment3", "_blank")}
                    >
                        Assignment 3
                    </button>

                </div>
            </div>
        </div>
    )
}

export default StudentCourse