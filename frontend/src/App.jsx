import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

import Header from "./Components/Header";
import ProtectedRoute from "./Components/protectedRoute";

import Login from "./Pages/login";
import AdminHome from "./Pages/adminHome";
import InstructorHome from "./Pages/instructorHome";
import TAHome from "./Pages/taHome";
import StudentHome from "./Pages/studentHome";
import StudentCourse from "./Pages/studentCourse";
import InstructorCourse from "./Pages/instructorCourse";
import StudentAssignment from "./Pages/studentAssigment";
import InstructorAssignment from "./Pages/instructorAssigment";

function HomeRedirect({ user }) {
  if (!user) return <Navigate to="/" replace />;

  const roles = user.roles || [];

  if (roles.includes("admin")) return <Navigate to="/home/admin" replace />;
  if (roles.includes("faculty")) return <Navigate to="/home/faculty" replace />;
  if (roles.includes("ta")) return <Navigate to="/home/ta" replace />;
  return <Navigate to="/home/student" replace />;
}

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  return (
    <>
      <Header user={user} setUser={setUser} />

      <Routes>
        <Route path="/" element={<Login setUser={setUser} />} />
        <Route path="/home" element={<HomeRedirect user={user} />} />

        <Route
          path="/home/admin"
          element={
            <ProtectedRoute user={user} allowedRoles={["admin"]}>
              <AdminHome user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/home/faculty"
          element={
            <ProtectedRoute user={user} allowedRoles={["faculty"]}>
              <InstructorHome user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/home/ta"
          element={
            <ProtectedRoute user={user} allowedRoles={["ta"]}>
              <TAHome user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/home/student"
          element={
            <ProtectedRoute user={user} allowedRoles={["student"]}>
              <StudentHome user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/course/:courseSlug"
          element={
            <ProtectedRoute user={user} allowedRoles={["student"]}>
              <StudentCourse user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/course/:courseSlug"
          element={
            <ProtectedRoute user={user} allowedRoles={["faculty"]}>
              <InstructorCourse user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/course/:courseSlug/assignment/:assignment_name"
          element={
            <ProtectedRoute user={user} allowedRoles={["student"]}>
              <StudentAssignment user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/course/:courseSlug/assignment/:assignment_name"
          element={
            <ProtectedRoute user={user} allowedRoles={["faculty"]}>
              <InstructorAssignment user={user} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}