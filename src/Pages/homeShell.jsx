import Header from "../Components/Header.jsx";
import "../CSS/Home.css";
import { useLocation, Navigate } from "react-router-dom";


import StudentHome from "../Pages/studentHome";
import InstructorHome from "../Pages/instructorHome";
import TAHome from "../Pages/taHome";
import AdminHome from "../Pages/adminHome";


function Home() {
  const { state } = useLocation();
  const user = state?.user;

  if (!user) return <Navigate to="/" replace />;

  function renderDashboard() {
    switch (user.role) {
      case "instructor":
        return <InstructorHome user={user} />;
      case "ta":
        return <TAHome user={user} />;
      case "admin":
        return <AdminHome user={user} />;
      case "student":
      default:
        return <StudentHome user={user} />;
    }
  }

  return (
    <>
      <main className="mainContent">
        {renderDashboard()}
      </main>
    </>
  );
}

export default Home;
