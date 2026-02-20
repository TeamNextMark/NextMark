import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "../CSS/Header.css";
import logo from "../Images/homeHeaderLogo.png"
import { useNavigate } from "react-router-dom";

function Header() {
  const [open, setOpen] = useState(false);
  const userRef = useRef(null);

  const location = useLocation();
  const isHome = location.pathname === "/home";
  const isLogin = location.pathname === "/";

  const navigate = useNavigate();

  function handleLogout() {
    navigate("/");
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

  return (
    <header className="header">
      <div className="headerLeft">
        <img className="headerLogo" src={logo} alt="NM logo" />
        
        <div className="textBlock">
          <p className="appName">NextMark</p>

          <p className="courseName">
            {isHome || isLogin ? "Arkansas Tech University" : "Class Name"}
          </p>
        </div>
      </div>

      {!isLogin && (
        <div className="headerRight">
          <div className="userWrapper" ref={userRef}>
            <button
              className="user"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={open}
            >
              User ▾
            </button>

            {open && (
              <div className="userDropdown">
                <button className="dropdownItem">Profile</button>
                <button className="dropdownItem">Settings</button>
              </div>
            )}
          </div>

          <button className="logout" onClick={handleLogout}>Logout</button>
        </div>
      )}
    </header>
  );
}

export default Header;
