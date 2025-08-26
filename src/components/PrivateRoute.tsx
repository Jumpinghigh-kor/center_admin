import React from "react";
import { Navigate } from "react-router-dom";
import { isTokenExpired } from "../utils/auth";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useSidebarStore } from "../store/store";

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const token = localStorage.getItem("accessToken");
  const sidebar = useSidebarStore((state) => state.sidebar);

  if (!token || isTokenExpired(token)) {
    localStorage.removeItem("accessToken");
    return <Navigate to="/login" />;
  }
  return (
    <>
      <div className="flex">
        <div>{!!token && sidebar ? <Sidebar /> : null}</div>
        <div className="flex flex-1 flex-col h-full min-h-screen">
          <Navbar />
          <div className="h-full">{children}</div>
        </div>
      </div>
    </>
  );
};

export default PrivateRoute;
