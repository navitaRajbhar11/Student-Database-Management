import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <>
      <Navbar /> {/* ✅ Navbar appears on all pages */}
      <div className="p-6">
        <Outlet /> {/* ✅ This will render the current page component */}
      </div>
    </>
  );
};

export default Layout;
