import React from "react";
import { NavLink, useLocation } from "react-router-dom";

const NoticeNav: React.FC = () => {
  const location = useLocation();

  return (
    <div className="my-4">
      <NavLink to="/notice/update">
        <button
          type="button"
          className={`${
            location.pathname === "/notice/update"
              ? "text-white bg-gray-800 hover:bg-gray-900"
              : "text-gray-900 bg-white hover:bg-gray-200"
          } focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2`}
        >
          업데이트
        </button>
      </NavLink>
      <NavLink to="/notice/notice">
        <button
          type="button"
          className={`${
            location.pathname === "/notice/notice"
              ? "text-white bg-gray-800 hover:bg-gray-900"
              : "text-gray-900 bg-white hover:bg-gray-200"
          } focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2`}
        >
          공지사항
        </button>
      </NavLink>
      <NavLink to="/notice/guideline">
        <button
          type="button"
          className={`${
            location.pathname === "/notice/guideline"
              ? "text-white bg-gray-800 hover:bg-gray-900"
              : "text-gray-900 bg-white hover:bg-gray-200"
          } focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2`}
        >
          안내사항
        </button>
      </NavLink>
    </div>
  );
};

export default NoticeNav;
