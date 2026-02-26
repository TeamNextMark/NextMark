import { Routes, Route } from "react-router-dom";
import { useState } from "react";

import Header from "./Components/Header";
import ProtectedRoute from "./Components/protectedRoute";

import Login from "./Pages/Login";
import AdminHome from "./Pages/adminHome";
import InstructorHome from "./Pages/instructorHome";
import TAHome from "./Pages/taHome";
import StudentHome from "./Pages/studentHome";

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

        <Route
          path="/home/admin"
          element={
            <ProtectedRoute user={user} allowedRoles={["admin"]}>
              <AdminHome user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/home/instructor"
          element={
            <ProtectedRoute user={user} allowedRoles={["instructor"]}>
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
            <ProtectedRoute
              user={user}
              allowedRoles={["student", "ta", "instructor", "admin"]}
            >
              <StudentHome user={user} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}