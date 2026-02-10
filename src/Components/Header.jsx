import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "../CSS/Header.css";

function Header() {
  const [open, setOpen] = useState(false);
  const userRef = useRef(null);

  const location = useLocation();
  const isHome = location.pathname === "/";

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
        <p className="appName">NextMark</p>

        <p className="courseName">
          {isHome ? "Arkansas Tech University" : "Class Name"}
        </p>
      </div>

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

        <button className="logout">Logout</button>
      </div>
    </header>
  );
}

export default Header;


