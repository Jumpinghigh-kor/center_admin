import React from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import profileImage from "./../images/profile2.png";
import { useUserStore } from "../store/store";
import { isTokenExpired } from "../utils/auth";
import packageJson from "./../../package.json";
import DescriptionPopover from "./DescriptionPopover";

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const location = useLocation();
  const token = localStorage.getItem("accessToken");
  if (!token || isTokenExpired(token)) {
    localStorage.removeItem("accessToken");
    return null;
  }

  const onLogout = async () => {
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  return (
    <aside
      id="default-sidebar"
      className="z-40 sm:w-64 h-full transition-transform 
      bg-custom-E8E8E8"
      aria-label="Sidebar"
    >
      <div className="p-10 flex-col items-center bg-custom-727272 hidden sm:flex">
        <img
          alt="profileImage"
          src={profileImage}
          style={{ width: "8rem", height: "8rem" }}
          className="rounded-full"
        />
        <span className="text-white mt-3 text-2xl">{user?.usr_name}</span>
      </div>
      <div className="px-3 py-4 overflow-y-auto">
        <ul className="space-y-2 font-medium">
          <li>
            <NavLink to="/">
              <div className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <svg
                  className={`${
                    location.pathname === "/" ? "text-black" : "text-gray-500"
                  } w-5 h-5 transition duration-75 group-hover:text-gray-900`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 18 18"
                >
                  <path d="M6.143 0H1.857A1.857 1.857 0 0 0 0 1.857v4.286C0 7.169.831 8 1.857 8h4.286A1.857 1.857 0 0 0 8 6.143V1.857A1.857 1.857 0 0 0 6.143 0Zm10 0h-4.286A1.857 1.857 0 0 0 10 1.857v4.286C10 7.169 10.831 8 11.857 8h4.286A1.857 1.857 0 0 0 18 6.143V1.857A1.857 1.857 0 0 0 16.143 0Zm-10 10H1.857A1.857 1.857 0 0 0 0 11.857v4.286C0 17.169.831 18 1.857 18h4.286A1.857 1.857 0 0 0 8 16.143v-4.286A1.857 1.857 0 0 0 6.143 10Zm10 0h-4.286A1.857 1.857 0 0 0 10 11.857v4.286c0 1.026.831 1.857 1.857 1.857h4.286A1.857 1.857 0 0 0 18 16.143v-4.286A1.857 1.857 0 0 0 16.143 10Z" />
                </svg>
                <span
                  className={`${
                    location.pathname === "/" ? "font-semibold" : ""
                  } flex-1 ms-3 whitespace-nowrap hidden sm:block`}
                >
                  대시보드
                </span>
              </div>
            </NavLink>
          </li>
          <li>
            <Link to="/sales_year">
              <span className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <svg
                  className={`${
                    location.pathname === "/sales_year" ||
                    location.pathname.includes("/sales_month")
                      ? "text-black"
                      : "text-gray-500"
                  } w-5 h-5 transition duration-75 group-hover:text-gray-900`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 22 21"
                >
                  <path d="M16.975 11H10V4.025a1 1 0 0 0-1.066-.998 8.5 8.5 0 1 0 9.039 9.039.999.999 0 0 0-1-1.066h.002Z" />
                  <path d="M12.5 0c-.157 0-.311.01-.565.027A1 1 0 0 0 11 1.02V10h8.975a1 1 0 0 0 1-.935c.013-.188.028-.374.028-.565A8.51 8.51 0 0 0 12.5 0Z" />
                </svg>
                <span
                  className={`${
                    location.pathname === "/sales_year" ||
                    location.pathname.includes("/sales_month")
                      ? "font-semibold"
                      : ""
                  } flex-1 ms-3 whitespace-nowrap hidden sm:block`}
                >
                  매출
                </span>
              </span>
            </Link>
          </li>

          <li>
            <NavLink to="/schedules">
              <div className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <svg
                  className={`${
                    location.pathname.includes("/schedules")
                      ? "text-black"
                      : "text-gray-500"
                  } w-5 h-5 transition duration-75 group-hover:text-gray-900`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm14-7.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm0 4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm-5-4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm0 4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm-5-4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm0 4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1ZM20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4Z" />
                </svg>
                <span
                  className={`${
                    location.pathname.includes("/schedules")
                      ? "font-semibold"
                      : ""
                  } flex-1 ms-3 whitespace-nowrap hidden sm:block`}
                >
                  시간표 관리
                </span>
                <DescriptionPopover
                  tip={"수업을 생성하고 등록인원을 확인할 수 있어요."}
                />
              </div>
            </NavLink>
          </li>

          <li>
            <NavLink to="/locker">
              <div className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <svg
                  className={`${
                    location.pathname.includes("/locker")
                      ? "text-black"
                      : "text-gray-500"
                  } w-5 h-5 transition duration-75 group-hover:text-gray-900`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M20 10H4v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8ZM9 13v-1h6v1a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1Z"
                    clipRule="evenodd"
                  />
                  <path d="M2 6a2 2 0 0 1 2-2h16a2 2 0 1 1 0 4H4a2 2 0 0 1-2-2Z" />
                </svg>
                <span
                  className={`${
                    location.pathname.includes("/locker") ? "font-semibold" : ""
                  } flex-1 ms-3 whitespace-nowrap hidden sm:block`}
                >
                  사물함 관리
                </span>
              </div>
            </NavLink>
          </li>

          <li>
            <NavLink to="/products">
              <div className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <svg
                  className={`${
                    location.pathname === "/products"
                      ? "text-black"
                      : "text-gray-500"
                  } w-5 h-5 transition duration-75 group-hover:text-gray-900`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 18"
                >
                  <path d="M18 0H6a2 2 0 0 0-2 2h14v12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Z" />
                  <path d="M14 4H2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2ZM2 16v-6h12v6H2Z" />
                </svg>
                <span
                  className={`${
                    location.pathname === "/products" ? "font-semibold" : ""
                  } flex-1 ms-3 whitespace-nowrap hidden sm:block`}
                >
                  회원권 관리
                </span>
                {/* <span className="items-center justify-center px-2 ms-3 text-sm text-white bg-red-500 font-bold rounded hidden sm:block">
                  NEW
                </span> */}
                {/* <span className="inline-flex items-center justify-center w-3 h-3 p-3 ms-3 text-sm font-medium text-blue-800 bg-blue-100 rounded-full">
                  4
                </span> */}
              </div>
            </NavLink>
          </li>

          <li>
            <NavLink to="/members">
              <span className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <svg
                  className={`${
                    location.pathname === "/members" ||
                    location.pathname === "/join"
                      ? "text-black"
                      : "text-gray-500"
                  } w-5 h-5 transition duration-75 group-hover:text-gray-900`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 18"
                >
                  <path d="M14 2a3.963 3.963 0 0 0-1.4.267 6.439 6.439 0 0 1-1.331 6.638A4 4 0 1 0 14 2Zm1 9h-1.264A6.957 6.957 0 0 1 15 15v2a2.97 2.97 0 0 1-.184 1H19a1 1 0 0 0 1-1v-1a5.006 5.006 0 0 0-5-5ZM6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Z" />
                </svg>
                <span
                  className={`${
                    location.pathname === "/members" ||
                    location.pathname === "/join"
                      ? "font-semibold"
                      : ""
                  } flex-1 ms-3 whitespace-nowrap hidden sm:block`}
                >
                  회원 관리
                </span>
                {/* <span className="items-center justify-center px-2 ms-3 text-sm text-white bg-red-500 font-bold rounded hidden sm:block">
                  NEW
                </span> */}
              </span>
            </NavLink>
          </li>

          {/* <li>
            <NavLink to="/members/reservation">
              <span className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <svg
                  className={`${
                    location.pathname === "/members/reservation"
                      ? "text-black"
                      : "text-gray-500"
                  } w-5 h-5 transition duration-75 group-hover:text-gray-900`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm14-7.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm0 4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm-5-4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm0 4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm-5-4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm0 4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1ZM20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4Z" />
                </svg>
                <span
                  className={`${
                    location.pathname === "/members/reservation"
                      ? "font-semibold"
                      : ""
                  } flex-1 ms-3 whitespace-nowrap hidden sm:block`}
                >
                  예약 관리
                </span>
              </span>
            </NavLink>
          </li> */}

          <li>
            <NavLink to="/client_call_log">
              <div className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <svg
                  className={`${
                    location.pathname === "/client_call_log"
                      ? "text-black"
                      : "text-gray-500"
                  } w-5 h-5 transition duration-75 group-hover:text-gray-900`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.96 2.96 0 0 0 .13 5H5Z" />
                  <path d="M6.737 11.061a2.961 2.961 0 0 1 .81-1.515l6.117-6.116A4.839 4.839 0 0 1 16 2.141V2a1.97 1.97 0 0 0-1.933-2H7v5a2 2 0 0 1-2 2H0v11a1.969 1.969 0 0 0 1.933 2h12.134A1.97 1.97 0 0 0 16 18v-3.093l-1.546 1.546c-.413.413-.94.695-1.513.81l-3.4.679a2.947 2.947 0 0 1-1.85-.227 2.96 2.96 0 0 1-1.635-3.257l.681-3.397Z" />
                  <path d="M8.961 16a.93.93 0 0 0 .189-.019l3.4-.679a.961.961 0 0 0 .49-.263l6.118-6.117a2.884 2.884 0 0 0-4.079-4.078l-6.117 6.117a.96.96 0 0 0-.263.491l-.679 3.4A.961.961 0 0 0 8.961 16Zm7.477-9.8a.958.958 0 0 1 .68-.281.961.961 0 0 1 .682 1.644l-.315.315-1.36-1.36.313-.318Zm-5.911 5.911 4.236-4.236 1.359 1.359-4.236 4.237-1.7.339.341-1.699Z" />
                </svg>
                <span
                  className={`${
                    location.pathname === "/client_call_log"
                      ? "font-semibold"
                      : ""
                  } flex-1 ms-3 whitespace-nowrap hidden sm:block`}
                >
                  상담 기록
                </span>
              </div>
            </NavLink>
          </li>

          <li>
            <NavLink to="/inquiry">
              <div className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <svg
                  className={`${
                    location.pathname === "/inquiry"
                      ? "text-black"
                      : "text-gray-500"
                  } w-5 h-5 transition duration-75 group-hover:text-gray-900`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="m17.418 3.623-.018-.008a6.713 6.713 0 0 0-2.4-.569V2h1a1 1 0 1 0 0-2h-2a1 1 0 0 0-1 1v2H9.89A6.977 6.977 0 0 1 12 8v5h-2V8A5 5 0 1 0 0 8v6a1 1 0 0 0 1 1h8v4a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-4h6a1 1 0 0 0 1-1V8a5 5 0 0 0-2.582-4.377ZM6 12H4a1 1 0 0 1 0-2h2a1 1 0 0 1 0 2Z" />
                </svg>
                <span
                  className={`${
                    location.pathname === "/inquiry" ? "font-semibold" : ""
                  } flex-1 ms-3 whitespace-nowrap hidden sm:block`}
                >
                  문의 남기기
                </span>
                <DescriptionPopover
                  tip={"프로그램 관련 가장 빠른 답변을 받을 수 있어요!"}
                />
              </div>
            </NavLink>
          </li>

          <li>
            <NavLink to="/members/checkinlist">
              <div className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <svg
                  className={`${
                    location.pathname === "/members/checkinlist"
                      ? "text-black"
                      : "text-gray-500"
                  } w-5 h-5 transition duration-75 group-hover:text-gray-900`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 1v3m5-3v3m5-3v3M1 7h18M5 11h10M2 3h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
                  />
                </svg>
                <span
                  className={`${
                    location.pathname === "/members/checkinlist"
                      ? "font-semibold"
                      : ""
                  } flex-1 ms-3 whitespace-nowrap hidden sm:block`}
                >
                  출입 내역
                </span>
              </div>
            </NavLink>
          </li>

          <li>
            <NavLink to="/members/attendance">
              <div className="flex items-center py-2 px-1.5 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <svg
                  className={`${
                    location.pathname === "/members/attendance"
                      ? "text-black"
                      : "text-gray-500"
                  } w-6 h-6 transition duration-75 group-hover:text-gray-900`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 5V4a1 1 0 1 1 2 0v1h3V4a1 1 0 1 1 2 0v1h3V4a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v2H3V7a2 2 0 0 1 2-2h1ZM3 19v-8h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Zm5-6a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2H8Z"
                    clipRule="evenodd"
                  />
                </svg>

                <span
                  className={`${
                    location.pathname === "/members/attendance"
                      ? "font-semibold"
                      : ""
                  } flex-1 ms-3 whitespace-nowrap hidden sm:block`}
                >
                  출석현황
                </span>
                <DescriptionPopover
                  tip={"출석체크는 시간표관리에서 추가로 할 수 있어요."}
                />
              </div>
            </NavLink>
          </li>

          <li>
            <NavLink target="_blank" to="/members/checkin">
              <div className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <svg
                  className="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M18 2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2ZM2 18V7h6.7l.4-.409A4.309 4.309 0 0 1 15.753 7H18v11H2Z" />
                  <path d="M8.139 10.411 5.289 13.3A1 1 0 0 0 5 14v2a1 1 0 0 0 1 1h2a1 1 0 0 0 .7-.288l2.886-2.851-3.447-3.45ZM14 8a2.463 2.463 0 0 0-3.484 0l-.971.983 3.468 3.468.987-.971A2.463 2.463 0 0 0 14 8Z" />
                </svg>
                <span className="flex-1 ms-3 whitespace-nowrap hidden sm:flex">
                  출입하기
                  <svg
                    className="w-4 h-4 text-gray-800"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 14v4.833A1.166 1.166 0 0 1 16.833 20H5.167A1.167 1.167 0 0 1 4 18.833V7.167A1.166 1.166 0 0 1 5.167 6h4.618m4.447-2H20v5.768m-7.889 2.121 7.778-7.778"
                    />
                  </svg>
                </span>
              </div>
            </NavLink>
          </li>

          <li>
            <NavLink target="_blank" to="/videos">
              <div className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <svg
                  className={`${
                    location.pathname === "/videos"
                      ? "text-black"
                      : "text-gray-500"
                  } w-5 h-5 transition duration-75 group-hover:text-gray-900`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M21.7 8.037a4.26 4.26 0 0 0-.789-1.964 2.84 2.84 0 0 0-1.984-.839c-2.767-.2-6.926-.2-6.926-.2s-4.157 0-6.928.2a2.836 2.836 0 0 0-1.983.839 4.225 4.225 0 0 0-.79 1.965 30.146 30.146 0 0 0-.2 3.206v1.5a30.12 30.12 0 0 0 .2 3.206c.094.712.364 1.39.784 1.972.604.536 1.38.837 2.187.848 1.583.151 6.731.2 6.731.2s4.161 0 6.928-.2a2.844 2.844 0 0 0 1.985-.84 4.27 4.27 0 0 0 .787-1.965 30.12 30.12 0 0 0 .2-3.206v-1.516a30.672 30.672 0 0 0-.202-3.206Zm-11.692 6.554v-5.62l5.4 2.819-5.4 2.801Z" />
                </svg>

                <span
                  className={`flex-1 ms-3 whitespace-nowrap hidden sm:flex`}
                >
                  비상 영상
                  <svg
                    className="w-4 h-4 text-gray-800"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 14v4.833A1.166 1.166 0 0 1 16.833 20H5.167A1.167 1.167 0 0 1 4 18.833V7.167A1.166 1.166 0 0 1 5.167 6h4.618m4.447-2H20v5.768m-7.889 2.121 7.778-7.778"
                    />
                  </svg>
                </span>
                {/* <span className="items-center justify-center px-2 ms-3 text-sm text-white bg-red-500 font-bold rounded hidden sm:block">
                  NEW
                </span> */}
              </div>
            </NavLink>
          </li>

          <li>
            <NavLink to="/center">
              <div className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <svg
                  className={`${
                    location.pathname === "/center"
                      ? "text-black"
                      : "text-gray-500"
                  } w-5 h-5 transition duration-75 group-hover:text-gray-900`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M 12 2.0996094 L 1 12 L 4 12 L 4 21 L 10 21 L 10 14 L 14 14 L 14 21 L 20 21 L 20 12 L 23 12 L 12 2.0996094 z"></path>
                </svg>
                <span
                  className={`${
                    location.pathname === "/center" ? "font-semibold" : ""
                  } flex-1 ms-3 whitespace-nowrap hidden sm:block`}
                >
                  센터 관리
                </span>
                {/* <span className="items-center justify-center px-2 ms-3 text-sm font-medium text-white bg-green-600 rounded-full hidden sm:block">
                  개발중
                </span> */}
              </div>
            </NavLink>
          </li>

          <li>
            <NavLink to="/notice/update">
              <div className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <svg
                  className={`${
                    location.pathname.includes("/notice")
                      ? "text-black"
                      : "text-gray-500"
                  } "w-5 h-5 group-hover:text-gray-900`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 18 19"
                >
                  <path d="M15 1.943v12.114a1 1 0 0 1-1.581.814L8 11V5l5.419-3.871A1 1 0 0 1 15 1.943ZM7 4H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2v5a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V4ZM4 17v-5h1v5H4ZM16 5.183v5.634a2.984 2.984 0 0 0 0-5.634Z" />
                </svg>
                <span
                  className={`${
                    location.pathname.includes("/notice") ? "font-semibold" : ""
                  } flex-1 ms-3 whitespace-nowrap hidden sm:block`}
                >
                  새 소식
                </span>
                {/* <span className="items-center justify-center px-2 ms-3 text-sm text-white bg-red-500 font-bold rounded hidden sm:block">
                  NEW
                </span> */}
              </div>
            </NavLink>
          </li>

          <li>
            <NavLink to="/setting">
              <div className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <svg
                  className={`${
                    location.pathname.includes("/setting")
                      ? "text-black"
                      : "text-gray-500"
                  } w-5 h-5`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 10V7a4 4 0 1 1 8 0v3h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h1Zm2-3a2 2 0 1 1 4 0v3h-4V7Zm2 6a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0v-3a1 1 0 0 1 1-1Z"
                    clipRule="evenodd"
                  />
                </svg>

                <span
                  className={`${
                    location.pathname.includes("/setting")
                      ? "font-semibold"
                      : ""
                  } flex-1 ms-3 whitespace-nowrap hidden sm:block`}
                >
                  계정 관리
                </span>
              </div>
            </NavLink>
          </li>

          {user?.usr_role === "admin" ? (
            <li>
              <NavLink to="/center_list">
                <div className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                  <svg
                    className={`${
                      location.pathname === "/center_list"
                        ? "text-black"
                        : "text-gray-500"
                    } w-5 h-5 group-hover:text-gray-900`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeWidth={2}
                      d="M3 11h18M3 15h18m-9-4v8m-8 0h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z"
                    />
                  </svg>

                  <span
                    className={`${
                      location.pathname === "/center_list"
                        ? "font-semibold"
                        : ""
                    } flex-1 ms-3 whitespace-nowrap hidden sm:flex`}
                  >
                    전체 센터
                    <svg
                      className="w-4 h-4 text-gray-800"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="m7.171 12.906-2.153 6.411 2.672-.89 1.568 2.34 1.825-5.183m5.73-2.678 2.154 6.411-2.673-.89-1.568 2.34-1.825-5.183M9.165 4.3c.58.068 1.153-.17 1.515-.628a1.681 1.681 0 0 1 2.64 0 1.68 1.68 0 0 0 1.515.628 1.681 1.681 0 0 1 1.866 1.866c-.068.58.17 1.154.628 1.516a1.681 1.681 0 0 1 0 2.639 1.682 1.682 0 0 0-.628 1.515 1.681 1.681 0 0 1-1.866 1.866 1.681 1.681 0 0 0-1.516.628 1.681 1.681 0 0 1-2.639 0 1.681 1.681 0 0 0-1.515-.628 1.681 1.681 0 0 1-1.867-1.866 1.681 1.681 0 0 0-.627-1.515 1.681 1.681 0 0 1 0-2.64c.458-.361.696-.935.627-1.515A1.681 1.681 0 0 1 9.165 4.3ZM14 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"
                      />
                    </svg>
                  </span>
                  {/* <span className="items-center justify-center px-2 ms-3 text-sm font-medium text-white bg-green-600 rounded-full hidden sm:block">
                  개발중
                </span> */}
                </div>
              </NavLink>
            </li>
          ) : null}

          {user?.usr_role === "admin" ? (
            <li>
              <NavLink to="/add_user">
                <div className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                  <svg
                    className={`${
                      location.pathname.includes("/add_user")
                        ? "text-black"
                        : "text-gray-500"
                    } w-5 h-5`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12h4m-2 2v-4M4 18v-1a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Zm8-10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>

                  <span
                    className={`${
                      location.pathname === "/add_user" ? "font-semibold" : ""
                    } flex-1 ms-3 whitespace-nowrap hidden sm:flex`}
                  >
                    센터 추가
                    <svg
                      className="w-4 h-4 text-gray-800"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="m7.171 12.906-2.153 6.411 2.672-.89 1.568 2.34 1.825-5.183m5.73-2.678 2.154 6.411-2.673-.89-1.568 2.34-1.825-5.183M9.165 4.3c.58.068 1.153-.17 1.515-.628a1.681 1.681 0 0 1 2.64 0 1.68 1.68 0 0 0 1.515.628 1.681 1.681 0 0 1 1.866 1.866c-.068.58.17 1.154.628 1.516a1.681 1.681 0 0 1 0 2.639 1.682 1.682 0 0 0-.628 1.515 1.681 1.681 0 0 1-1.866 1.866 1.681 1.681 0 0 0-1.516.628 1.681 1.681 0 0 1-2.639 0 1.681 1.681 0 0 0-1.515-.628 1.681 1.681 0 0 1-1.867-1.866 1.681 1.681 0 0 0-.627-1.515 1.681 1.681 0 0 1 0-2.64c.458-.361.696-.935.627-1.515A1.681 1.681 0 0 1 9.165 4.3ZM14 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"
                      />
                    </svg>
                  </span>
                  {/* <span className="items-center justify-center px-2 ms-3 text-sm font-medium text-white bg-green-600 rounded-full hidden sm:block">
                  개발중
                </span> */}
                </div>
              </NavLink>
            </li>
          ) : null}

          {/* <li>
            <NavLink to="/app">
              <div className="flex items-center p-2 text-gray-900 rounded-lg cursor-pointer hover:bg-gray-100 group">
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 6a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2V6z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 15a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 15a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2v-3z"
                  />
                </svg>
                <span className="flex-1 ms-3 whitespace-nowrap hidden sm:block">
                  점핑하이 플러스 관리
                </span>
              </div>
            </NavLink>
          </li> */}

          <li onClick={onLogout}>
            <div className="flex items-center p-2 text-gray-900 rounded-lg cursor-pointer hover:bg-gray-100 group">
              <svg
                className="flex-shrink-0 w-5 h-5 text-gray-500 group-hover:text-gray-900"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M16 12H4m12 0-4 4m4-4-4-4m3-4h2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-2"
                />
              </svg>

              <span className="flex-1 ms-3 whitespace-nowrap hidden sm:block">
                로그아웃
              </span>
            </div>
          </li>
        </ul>
        <div
          id="dropdown-cta"
          className="p-4 mt-6 rounded-lg bg-blue-50 hidden sm:flex"
          role="alert"
        >
          <div className="flex items-center">
            <span className="bg-orange-100 text-orange-800 text-sm font-semibold me-2 px-2.5 py-0.5 rounded">
              Version
            </span>
          </div>
          <p className="text-sm text-black">{packageJson.version}</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
