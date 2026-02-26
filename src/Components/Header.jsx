import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../CSS/Header.css";
import logo from "../Images/homeHeaderLogo.png";

function Header({ user, setUser }) {
  const [open, setOpen] = useState(false);
  const userRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  const isLogin = location.pathname === "/";

  function handleLogout() {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    setUser(null);
    setOpen(false);
    navigate("/", { replace: true });
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

  const getHomeRoute = () => {
    if (!user?.roles) return "/";
    if (user.roles.includes("instructor")) return "/home/instructor";
    if (user.roles.includes("admin")) return "/home/admin";
    if (user.roles.includes("ta")) return "/home/ta";
    return "/home/student";
  };

  const canGoAdmin = user?.roles?.includes("admin");
  const canGoInstructor = user?.roles?.includes("instructor");
  const canGoTA = user?.roles?.includes("ta");
  const canGoStudent = user?.roles?.includes("student");

  return (
    <header className="header">
      <div
        className="headerLeft"
        onClick={() => navigate(user ? getHomeRoute() : "/")}
      >
        <img className="headerLogo" src={logo} alt="NM logo" />

        <div className="textBlock">
          <p className="appName">NextMark</p>
          <p className="courseName">Arkansas Tech University</p>
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
              {user.name} ▾
            </button>

            {open && (
              <div className="userDropdown" role="menu">
                {canGoAdmin && (
                  <button
                    className="dropdownItem"
                    onClick={() => navigate("/home/admin")}
                    type="button"
                  >
                    Admin Homepage
                  </button>
                )}

                {canGoInstructor && (
                  <button
                    className="dropdownItem"
                    onClick={() => navigate("/home/instructor")}
                    type="button"
                  >
                    Instructor Homepage
                  </button>
                )}

                {canGoTA && (
                  <button
                    className="dropdownItem"
                    onClick={() => navigate("/home/ta")}
                    type="button"
                  >
                    TA Homepage
                  </button>
                )}

                {canGoStudent && (
                  <button
                    className="dropdownItem"
                    onClick={() => navigate("/home/student")}
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