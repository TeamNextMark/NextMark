import "../CSS/Template.css"
import "../CSS/Home.css";
import { useNavigate } from "react-router-dom";
function Home() {
  const navigate = useNavigate();

  function goToCourses() {
    navigate("/student/courses");
  }

  return (
    <div className="mainContent">
      <h1 className="pageTitle">Courses</h1>

      <div className="coursesGrid">

        <button className="courseCard" onClick={goToCourses}>
          <div className="courseImage">
            <img src="/images/course1.jpg" alt="Course 1" />
          </div>

          <div className="courseInfo">
            <h2>Class 1</h2>
          </div>
        </button>

        <button className="courseCard" onClick={goToCourses}>
          <div className="courseImage">
            <img src="/images/course2.jpg" alt="Course 2" />
          </div>

          <div className="courseInfo">
            <h2>Class 2</h2>
          </div>
        </button>

        <button className="courseCard" onClick={goToCourses}>
          <div className="courseImage">
            <img src="/images/course3.jpg" alt="Course 3" />
          </div>

          <div className="courseInfo">
            <h2>Class 3</h2>
          </div>
        </button>

        <button className="courseCard" onClick={goToCourses}>
          <div className="courseImage">
            <img src="/images/course3.jpg" alt="Course 3" />
          </div>

          <div className="courseInfo">
            <h2>Class 4</h2>
          </div>
        </button>

        <button className="courseCard" onClick={goToCourses}>
          <div className="courseImage">
            <img src="/images/course3.jpg" alt="Course 3" />
          </div>

          <div className="courseInfo">
            <h2>Class 5</h2>
          </div>
        </button>

      </div>
    </div>
  );
}

export default Home;