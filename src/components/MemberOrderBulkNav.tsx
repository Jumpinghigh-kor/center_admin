import React from "react";
import { NavLink, useLocation } from "react-router-dom";

const MembersOrderBulkNav: React.FC = () => {
  const location = useLocation();

  return (
    <div className="my-4">
      <NavLink to="/members/membersOrderBulkRegister">
        <button
          type="button"
          className={`${
            location.pathname === "/members/membersOrderBulkRegister"
              ? "text-white bg-gray-800 hover:bg-gray-900"
              : "text-gray-900 bg-white hover:bg-gray-200"
          } focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2`}
        >
          회원권 등록
        </button>
      </NavLink>
      <NavLink to="/members/membersOrderBulkExtend">
        <button
          type="button"
          className={`${
            location.pathname === "/members/membersOrderBulkExtend"
              ? "text-white bg-gray-800 hover:bg-gray-900"
              : "text-gray-900 bg-white hover:bg-gray-200"
          } focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2`}
        >
          회원권 연장
        </button>
      </NavLink>
    </div>
  );
};

export default MembersOrderBulkNav;
