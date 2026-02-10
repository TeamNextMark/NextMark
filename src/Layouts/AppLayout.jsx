import { Outlet } from "react-router-dom";
import Header from "../Components/Header.jsx";

function AppLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  );
}

export default AppLayout;
