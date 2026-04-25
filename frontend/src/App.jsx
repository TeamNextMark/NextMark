import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

import Header from "./Components/Header";
import ProtectedRoute from "./Components/protectedRoute";

import Login from "./Pages/login";
import AdminHome from "./Pages/adminHome";
import FacultyHome from "./Pages/instructorHome";
import StudentHome from "./Pages/studentHome";
import StudentCourse from "./Pages/studentCourse";
import FacultyCourse from "./Pages/instructorCourse";
import StudentAssignment from "./Pages/studentAssigment";
import FacultyAssignment from "./Pages/instructorAssigment";
import StudentSubmissionPage from "./Pages/studentSubmission";
import CreateAssignment from "./Pages/createAssignment";
import TACourse from "./Pages/taCourse";
import AdminUsers from "./Pages/adminUsers";
import CreateUser from "./Pages/createUser";
import EditUser from "./Pages/editUser";
import AdminCourses from "./Pages/adminCourses";
import CreateCourse from "./Pages/createCourse";
import EditCourse from "./Pages/editCourse";

function HomeRedirect({ user }) {
  if (!user) return <Navigate to="/" replace />;

  const roles = user.roles || [];

  if (roles.includes("admin")) return <Navigate to="/home/admin" replace />;
  if (roles.includes("faculty")) return <Navigate to="/home/faculty" replace />;
  if (roles.includes("ta")) return <Navigate to="/home/student" replace />;
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
          path="/admin/users"
          element={
            <ProtectedRoute user={user} allowedRoles={["admin"]}>
              <AdminUsers user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users/create"
          element={
            <ProtectedRoute user={user} allowedRoles={["admin"]}>
              <CreateUser user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users/:userId/edit"
          element={
            <ProtectedRoute user={user} allowedRoles={["admin"]}>
              <EditUser user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/courses"
          element={
            <ProtectedRoute user={user} allowedRoles={["admin"]}>
              <AdminCourses user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/courses/create"
          element={
            <ProtectedRoute user={user} allowedRoles={["admin"]}>
              <CreateCourse user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/courses/:courseId/edit"
          element={
            <ProtectedRoute user={user} allowedRoles={["admin"]}>
              <EditCourse user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/home/faculty"
          element={
            <ProtectedRoute user={user} allowedRoles={["faculty", "ta"]}>
              <FacultyHome user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/home/student"
          element={
            <ProtectedRoute user={user} allowedRoles={["student", "ta"]}>
              <StudentHome user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/course/:courseSlug"
          element={
            <ProtectedRoute user={user} allowedRoles={["student", "ta"]}>
              <StudentCourse user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/course/:courseSlug"
          element={
            <ProtectedRoute user={user} allowedRoles={["faculty"]}>
              <FacultyCourse user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ta/course/:courseSlug"
          element={
            <ProtectedRoute user={user} allowedRoles={["ta"]}>
              <TACourse user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/course/:courseSlug/assignment/:assignmentId"
          element={
            <ProtectedRoute user={user} allowedRoles={["student", "ta"]}>
              <StudentAssignment user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/course/:courseSlug/assignment/:assignmentId"
          element={
            <ProtectedRoute user={user} allowedRoles={["faculty", "ta"]}>
              <FacultyAssignment user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/course/:courseSlug/assignment/:assignmentId/submission/:submissionId"
          element={
            <ProtectedRoute user={user} allowedRoles={["student", "ta"]}>
              <StudentSubmissionPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/course/:courseSlug/create-assignment"
          element={
            <ProtectedRoute user={user} allowedRoles={["faculty"]}>
              <CreateAssignment user={user} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}