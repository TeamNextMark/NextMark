import "../CSS/Home.css"

function Home () {
    return (
        <div className="mainContent">
            <h1 className="pageTitle">Courses</h1>

            <div className="coursesGrid">
                <div className="courseCard">
                    <div className="courseImage">
                        <img src="../Images/course1.jpg" alt="Course 1" />
                    </div>

                    <div className="courseInfo">
                        <h2>Class 1</h2>
                    </div>
                </div>
        
                <div className="courseCard">
                    <div className="courseImage">
                        <img src="../Images/course2.jpg" alt="Course 2" />
                    </div>

                    <div className="courseInfo">
                        <h2>Class 2</h2>
                    </div>
                </div>

                <div className="courseCard">
                    <div className="courseImage">
                        <img src="../Images/course3.jpg" alt="Course 3" />
                    </div>

                    <div className="courseInfo">
                        <h2>Class 3</h2>
                    </div>
                </div>

                <div className="courseCard">
                    <div className="courseImage">
                        <img src="../Images/course3.jpg" alt="Course 3" />
                    </div>

                    <div className="courseInfo">
                        <h2>Class 4</h2>
                    </div>
                </div>

                <div className="courseCard">
                    <div className="courseImage">
                        <img src="../Images/course3.jpg" alt="Course 3" />
                    </div>

                    <div className="courseInfo">
                        <h2>Class 5</h2>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home