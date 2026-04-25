import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../CSS/Header.css";
import logo from "../Images/homeHeaderLogo.png";
import arrow from "../Images/downArrow.png";

function Header({ user, setUser }) {
  const [open, setOpen] = useState(false);
  const userRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  const isLogin = location.pathname === "/";

  function handleLogout() {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("tokenType");
    setUser(null);
    setOpen(false);
    navigate("/", { replace: true });
  }

  function goTo(path) {
    setOpen(false);
    navigate(path);
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (userRef.current && !userRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roles = user?.roles || [];

  const isAdmin = roles.includes("admin");
  const isFaculty = roles.includes("faculty");
  const isTA = roles.includes("ta");
  const isStudent = roles.includes("student");

  const getHomeRoute = () => {
    if (!user) return "/";
    if (isAdmin) return "/home/admin";
    if (isFaculty) return "/home/faculty";
    if (isTA) return "/home/student";
    return "/home/student";
  };

  const canGoAdmin = isAdmin;
  const canGoFaculty = isFaculty || isTA || isAdmin;
  const canGoStudent = isStudent || isTA || isAdmin;

  const subtitle = useMemo(() => {
    const path = location.pathname;

    if (
      path.startsWith("/home") ||
      path.startsWith("/admin") ||
      path === "/"
    ) {
      return "Arkansas Tech University";
    }

    const courseMatch = path.match(/^\/(student|faculty)\/course\/([^/]+)/);

    if (courseMatch) {
      const courseSlug = courseMatch[2];
      const match = courseSlug.match(/^([a-zA-Z]+)(.+)$/);

      if (match) {
        const courseCode = match[1].toUpperCase();
        const courseId = match[2];
        return `${courseCode} - ${courseId}`;
      }

      return courseSlug.toUpperCase();
    }

    return "Course Name";
  }, [location.pathname]);

  return (
    <header className="header">
      <div
        className="headerLeft"
        onClick={() => navigate(user ? getHomeRoute() : "/")}
      >
        <img className="headerLogo" src={logo} alt="NM logo" />

        <div className="textBlock">
          <p className="appName">NextMark AI</p>
          <p className="courseName">{subtitle}</p>
        </div>
      </div>

      {!isLogin && user && (
        <div className="headerRight">
          <div className="userWrapper" ref={userRef}>
            <button
              className="user"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={open}
              type="button"
            >
              {user.name || user.email}
              <span className={`ddDirection ${open ? "open" : ""}`}>
                <img className="arrow" src={arrow} alt="dropdown arrow" />
              </span>
            </button>

            {open && (
              <div className="userDropdown" role="menu">
                {canGoAdmin && !location.pathname.startsWith("/home/admin") && (
                  <button
                    className="dropdownItem"
                    onClick={() => goTo("/home/admin")}
                    type="button"
                  >
                    Admin Homepage
                  </button>
                )}

                {canGoFaculty && !location.pathname.startsWith("/home/faculty") && (
                  <button
                    className="dropdownItem"
                    onClick={() => goTo("/home/faculty")}
                    type="button"
                  >
                    Instructor Homepage
                  </button>
                )}

                {canGoStudent && !location.pathname.startsWith("/home/student") && (
                  <button
                    className="dropdownItem"
                    onClick={() => goTo("/home/student")}
                    type="button"
                  >
                    Student Homepage
                  </button>
                )}
              </div>
            )}
          </div>

          <button className="logout" onClick={handleLogout} type="button">
            Logout
          </button>
        </div>
      )}
    </header>
  );
}

export default Header;