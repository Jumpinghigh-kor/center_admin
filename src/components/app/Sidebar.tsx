import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/store";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
console.log(activeTab);
  const handleNavigation = (path: string, tab: string) => {
    setActiveTab(tab);
    navigate(path);
  };

  return (
    <div className="bg-white w-16 md:w-64 shadow-lg h-full flex flex-col">
      <div className="p-4 hidden md:block border-b">
        <h2 className="text-xl font-bold text-gray-800">점핑하이 매니저</h2>
      </div>

      <div className="p-4 flex justify-center md:hidden">
        <svg
          className="w-6 h-6 text-gray-800"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </div>

      <div className="py-4 flex-1">
        <ul>
          <li className="mb-1">
            <button
              onClick={() => handleNavigation("/app", "dashboard")}
              className={`flex items-center w-full py-2 px-4 text-left ${
                activeTab === "dashboard"
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              title="대시보드"
            >
              <svg
                className="w-6 h-6 md:mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="hidden md:inline">대시보드</span>
            </button>
          </li>

          <li className="mb-1">
            <button
              onClick={() =>
                handleNavigation("/app/exerciseAppList", "exerciseAppList")
              }
              className={`flex items-center w-full py-2 px-4 text-left ${
                activeTab === "exerciseAppList"
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              title="운동 관리"
            >
              <svg
                className="w-6 h-6 md:mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="hidden md:inline">운동 관리</span>
            </button>
          </li>

          <li className="mb-1">
            <button
              onClick={() =>
                handleNavigation("/app/centerOrderAppList", "centerOrderAppList")
              }
              className={`flex items-center w-full py-2 px-4 text-left ${
                activeTab === "centerOrderAppList"
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              title="센터 주문 관리"
            >
              <svg
                className="w-6 h-6 md:mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              <span className="hidden md:inline">센터 주문 관리</span>
            </button>
          </li>

          <li className="mb-1">
            <button
              onClick={() =>
                handleNavigation("/app/centerInquiryAppList", "centerInquiryAppList")
              }
              className={`flex items-center w-full py-2 px-4 text-left ${
                activeTab === "centerInquiryAppList"
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              title="센터 문의 관리"
            >
              <svg
                className="w-6 h-6 md:mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span className="hidden md:inline">센터 문의 관리</span>
            </button>
          </li>

          {/* 공통 관리 */}
          {user.usr_role === 'admin' && (
            <>
              <li className="mb-1 bg-gray-500 text-gray-300">
                <p className="flex items-center w-full py-2 px-4 text-left">공통 관리</p>
              </li>

              <li className="mb-1">
                <button
                  onClick={() => handleNavigation("/app/banner", "banner")}
                  className={`flex items-center w-full py-2 px-4 text-left ${
                    activeTab === "banner"
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  title="배너 관리"
                >
                  <svg
                    className="w-6 h-6 md:mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="hidden md:inline">배너 관리</span>
                </button>
              </li>

              <li className="mb-1">
                <button
                  onClick={() => handleNavigation("/app/noticesApp", "noticesApp")}
                  className={`flex items-center w-full py-2 px-4 text-left ${
                    activeTab === "noticesApp"
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  title="공지사항 관리"
                >
                  <svg
                    className="w-6 h-6 md:mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  <span className="hidden md:inline">공지사항 관리</span>
                </button>
              </li>

              <li className="mb-1">
                <button
                  onClick={() =>
                    handleNavigation("/app/postAppList", "postAppList")
                  }
                  className={`flex items-center w-full py-2 px-4 text-left ${
                    activeTab === "postAppList"
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  title="우편함 관리"
                >
                  <svg
                    className="w-6 h-6 md:mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="hidden md:inline">우편함 관리</span>
                </button>
              </li>

              <li className="mb-1">
                <button
                  onClick={() =>
                    handleNavigation("/app/updateLogApp", "updateLogApp")
                  }
                  className={`flex items-center w-full py-2 px-4 text-left ${
                    activeTab === "updateLogApp"
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  title="업데이트 로그 관리"
                >
                  <svg
                    className="w-6 h-6 md:mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="hidden md:inline">업데이트 로그 관리</span>
                </button>
              </li>

              <li className="mb-1">
                <button
                  onClick={() =>
                    handleNavigation("/app/MobileInquiryAppList", "mobileInquiryAppList")
                  }
                  className={`flex items-center w-full py-2 px-4 text-left ${
                    activeTab === "mobileInquiryAppList"
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  title="어플 문의 관리"
                >
                  <svg
                    className="w-6 h-6 md:mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="hidden md:inline">어플 문의 관리</span>
                </button>
              </li>

              {/* 쇼핑몰 관리 */}
              <li className="mb-1 bg-gray-500 text-gray-300">
                <p className="flex items-center w-full py-2 px-4 text-left">쇼핑몰 관리</p>
              </li>

              <li className="mb-1">
                <button
                  onClick={() =>
                    handleNavigation("/app/memberOrderApp", "memberOrderApp")
                  }
                  className={`flex items-center w-full py-2 px-4 text-left ${
                    activeTab === "memberOrderApp"
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  title="주문 관리"
                >
                  <svg
                    className="w-6 h-6 md:mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                  <span className="hidden md:inline">주문 관리</span>
                </button>
              </li>

              <li className="mb-1">
                <button
                  onClick={() => handleNavigation("/app/productApp", "productApp")}
                  className={`flex items-center w-full py-2 px-4 text-left ${
                    activeTab === "productApp"
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  title="상품 관리"
                >
                  <svg
                    className="w-6 h-6 md:mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  <span className="hidden md:inline">상품 관리</span>
                </button>
              </li>

              <li className="mb-1">
                <button
                  onClick={() =>
                    handleNavigation("/app/inquiryShoppingApp", "inquiryShoppingApp")
                  }
                  className={`flex items-center w-full py-2 px-4 text-left ${
                    activeTab === "inquiryShoppingApp"
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  title="쇼핑몰 문의 관리"
                >
                  <svg
                    className="w-6 h-6 md:mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="hidden md:inline">쇼핑몰 문의 관리</span>
                </button>
              </li>

              <li className="mb-1">
                <button
                  onClick={() => handleNavigation("/app/memberReviewApp", "memberReviewApp")}
                  className={`flex items-center w-full py-2 px-4 text-left ${
                    activeTab === "memberReviewApp"
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  title="리뷰 관리"
                >
                  <svg
                    className="w-6 h-6 md:mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  <span className="hidden md:inline">리뷰 관리</span>
                </button>
              </li>

              <li className="mb-1">
                <button
                  onClick={() => handleNavigation("/app/couponApp", "couponApp")}
                  className={`flex items-center w-full py-2 px-4 text-left ${
                    activeTab === "couponApp"
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  title="쿠폰 관리"
                >
                  <svg
                    className="w-6 h-6 md:mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                    />
                  </svg>
                  <span className="hidden md:inline">쿠폰 관리</span>
                </button>
              </li>

              <li className="mb-1">
                <button
                  onClick={() => handleNavigation("/app/eventApp", "eventApp")}
                  className={`flex items-center w-full py-2 px-4 text-left ${
                    activeTab === "eventApp"
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  title="이벤트 관리"
                >
                  <svg
                    className="w-6 h-6 md:mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="hidden md:inline">이벤트 관리</span>
                </button>
              </li>
            </>
          )}
        </ul>

        
      </div>

      <div className="border-t p-4">
        <Link
          to="/"
          className="flex items-center mb-6 justify-center md:justify-start text-gray-600 hover:text-gray-800"
          title="메인으로 돌아가기"
        >
          <svg
            className="w-6 h-6 md:mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="hidden md:inline">점핑하이 관리 페이지</span>
        </Link>

        <button
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
          }}
          className="flex items-center justify-center md:justify-start text-gray-600 hover:text-gray-800 mt-4"
          title="로그아웃"
        >
          <svg
            className="w-6 h-6 md:mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span className="hidden md:inline">로그아웃</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
