import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useUserStore, useSidebarStore } from "../../store/store";
import profileImage from "../../images/profile2.png";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useUserStore((state) => state.user);
  const sidebar = useSidebarStore((state) => state.sidebar);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const prevSidebar = useRef<boolean>(sidebar);
  const [hasUnansweredCenterInquiry, setHasUnansweredCenterInquiry] = useState<boolean>(false);
  const [hasUnansweredMobileInquiry, setHasUnansweredMobileInquiry] = useState<boolean>(false);
  const [hasUnansweredShoppingInquiry, setHasUnansweredShoppingInquiry] = useState<boolean>(false);
  const [hasPendingReservations, setHasPendingReservations] = useState<boolean>(false);
  const [hasOrderAttention, setHasOrderAttention] = useState<boolean>(false);
  
  // 햄버거 메뉴(전역 sidebar)가 false -> true로 변할 때만 토글
  useEffect(() => {
    if (!prevSidebar.current && sidebar) {
      setIsVisible((v) => !v);
    }
    prevSidebar.current = sidebar;
  }, [sidebar]);

  // App 사이드바 숨김 시, 본문 컨테이너를 전체 폭으로 확장
  useEffect(() => {
    const contentContainer = document.querySelector(
      ".flex-1.overflow-x-hidden.p-4 .container.mx-auto"
    ) as HTMLElement | null;
    if (!contentContainer) return;
    if (!isVisible) {
      contentContainer.style.maxWidth = "100%";
      contentContainer.style.width = "100%";
      contentContainer.style.marginLeft = "0";
      contentContainer.style.marginRight = "0";
    } else {
      contentContainer.style.maxWidth = "";
      contentContainer.style.width = "";
      contentContainer.style.marginLeft = "";
      contentContainer.style.marginRight = "";
    }
  }, [isVisible]);

  // App 사이드바 숨김 시, 헤더 아이콘 영역이 좌측에 붙도록 헤더 마진 조정
  useEffect(() => {
    const headerContainer = document.querySelector(
      "nav .bg-custom-393939"
    ) as HTMLElement | null;
    if (!headerContainer) return;
    if (!isVisible) {
      headerContainer.style.marginLeft = "0px";
    } else {
      headerContainer.style.marginLeft = "";
    }
  }, [isVisible]);

  // 센터 문의 관리 배지(미답변 존재 여부) 체크
  useEffect(() => {
    let mounted = true;
    const fetchUnanswered = async () => {
      try {
        if (!user || !user.center_id) return;
        const { data } = await axios.post(
          `${process.env.REACT_APP_API_URL}/app/inquiryApp/selectInquiryAppList`,
          {
            center_id: user.center_id,
            inquiry_type: "FRANCHISE",
            answer: "N",
          }
        );
        if (!mounted) return;
        const list = data?.result || [];
        setHasUnansweredCenterInquiry(Array.isArray(list) && list.length > 0);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("center inquiry badge fetch error", e);
      }
    };
    fetchUnanswered();
    window.addEventListener("focus", fetchUnanswered);
    return () => {
      mounted = false;
      window.removeEventListener("focus", fetchUnanswered);
    };
  }, [user, location.pathname]);
  
  // 어플 문의 관리 배지(미답변 존재 여부) 체크
  useEffect(() => {
    let mounted = true;
    const fetchUnansweredMobile = async () => {
      try {
        if (!user || !user.center_id) return;
        const { data } = await axios.post(
          `${process.env.REACT_APP_API_URL}/app/inquiryApp/selectInquiryAppList`,
          {
            center_id: user.center_id,
            inquiry_type: "APPLICATION",
            answer: "N",
          }
        );
        if (!mounted) return;
        const list = data?.result || [];
        setHasUnansweredMobileInquiry(Array.isArray(list) && list.length > 0);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("mobile inquiry badge fetch error", e);
      }
    };
    fetchUnansweredMobile();
    window.addEventListener("focus", fetchUnansweredMobile);
    return () => {
      mounted = false;
      window.removeEventListener("focus", fetchUnansweredMobile);
    };
  }, [user, location.pathname]);

  // 쇼핑몰 문의 관리 배지(미답변 존재 여부) 체크
  useEffect(() => {
    let mounted = true;
    const fetchUnansweredShopping = async () => {
      try {
        if (!user || !user.center_id) return;
        const { data } = await axios.post(
          `${process.env.REACT_APP_API_URL}/app/inquiryShoppingApp/selectInquiryShoppingAppList`,
          {
            center_id: user.center_id,
            answerStatus: "N",
          }
        );
        if (!mounted) return;
        const list = data?.result || [];
        setHasUnansweredShoppingInquiry(Array.isArray(list) && list.length > 0);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("shopping inquiry badge fetch error", e);
      }
    };
    fetchUnansweredShopping();
    window.addEventListener("focus", fetchUnansweredShopping);
    return () => {
      mounted = false;
      window.removeEventListener("focus", fetchUnansweredShopping);
    };
  }, [user, location.pathname]);

  // 예약 관리 배지(향후 예약 중 동의 미확인 존재 여부) 체크
  useEffect(() => {
    let mounted = true;
    const fetchPendingReservations = async () => {
      try {
        if (!user || !user.center_id) return;
        const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/schedule/getReservationMemberCnt`, {
          center_id: user.center_id,
        });
        
        if (!mounted) return;
        const hasPendingReservations = data?.result[0]?.cnt > 0;
        setHasPendingReservations(hasPendingReservations);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('reservation badge fetch error', e);
      }
    };
    fetchPendingReservations();
    window.addEventListener('focus', fetchPendingReservations);
    return () => {
      mounted = false;
      window.removeEventListener('focus', fetchPendingReservations);
    };
  }, [user, location.pathname]);

  // 주문 관리 배지(처리 필요 주문 존재 여부) 체크
  useEffect(() => {
    let mounted = true;
    const fetchOrderCnt = async () => {
      try {
        if (!user || !user.center_id) return;
        const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/app/memberOrderApp/selectMemberOrderAppCnt`, {
          center_id: user.center_id,
        });
        if (!mounted) return;
        const cnt = Number((data && data[0] && data[0].cnt) || 0);
        setHasOrderAttention(cnt > 0);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('order badge fetch error', e);
      }
    };
    fetchOrderCnt();
    window.addEventListener('focus', fetchOrderCnt);
    return () => {
      mounted = false;
      window.removeEventListener('focus', fetchOrderCnt);
    };
  }, [user, location.pathname]);

  // 주문 상태 변경 등 관련 API 성공 시 즉시 배지 갱신 (전역 axios 인터셉터)
  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => {
        try {
          const url = String(response?.config?.url || '');
          const shouldRefresh = (
            url.includes('/app/memberOrderApp/updateOrderStatus') ||
            url.includes('/app/memberOrderApp/deleteTrackingNumber') ||
            url.includes('/app/memberOrderApp/updateTrackingNumber') ||
            url.includes('/app/memberOrderApp/updateOrderGroup') ||
            url.includes('/app/memberOrderApp/updateNewMemberOrderApp')
          );
          if (shouldRefresh && user && user.center_id) {
            axios
              .post(`${process.env.REACT_APP_API_URL}/app/memberOrderApp/selectMemberOrderAppCnt`, {
                center_id: user.center_id,
              })
              .then(({ data }) => {
                const cnt = Number((data && data[0] && data[0].cnt) || 0);
                setHasOrderAttention(cnt > 0);
              })
              .catch(() => {});
          }
        } catch {}
        return response;
      },
      (error) => Promise.reject(error)
    );
    return () => {
      axios.interceptors.response.eject(interceptorId);
    };
  }, [user]);

  const handleNavigation = (path: string, tab: string) => {
    setActiveTab(tab);
    navigate(path);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-white w-16 md:w-64 shadow-lg h-full flex flex-col">
      <div className="p-10 flex-col items-center bg-custom-727272 hidden sm:flex">
        <img
          alt="profileImage"
          src={profileImage}
          style={{ width: "8rem", height: "8rem" }}
          className="rounded-full"
        />
        <span className="text-white mt-3 text-2xl">관리자</span>
      </div>

      <div className="flex-1">
        <ul>
          <li>
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

          <li>
            <button
              onClick={() =>
                handleNavigation("/app/memberAppList", "memberAppList")
              }
              className={`flex items-center w-full py-2 px-4 text-left ${
                activeTab === "memberAppList"
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              title="회원 관리"
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
                  d="M5.121 17.804A7 7 0 0112 15a7 7 0 016.879 2.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="hidden md:inline">회원 관리</span>
            </button>
          </li>

          <li>
            <button
              onClick={() =>
                handleNavigation("/app/reservation", "reservationAppList")
              }
              className={`flex items-center w-full py-2 px-4 text-left ${
                activeTab === "reservationAppList"
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              title="예약 관리"
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
                  d="M0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm14-7.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm0 4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm-5-4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm0 4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1ZM20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4Z"
                />
              </svg>
              <span className="hidden md:inline">예약 관리</span>
              {hasPendingReservations && (
                <span className="ml-1 inline-block h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
          </li>

          <li>
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

          <li>
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

          <li>
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
              <svg className="w-6 h-6 md:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.313 3 21l1.687-4.5L16.862 3.487z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.5 7.5l-3-3" />
              </svg>
              <span className="hidden md:inline">센터 문의 관리</span>
              {hasUnansweredCenterInquiry && (
                <span className="ml-1 inline-block h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
          </li>

          {/* 공통 관리 */}
          {user.usr_role === 'admin' && (
            <>
              <li className="bg-gray-500 text-gray-300">
                <p className="flex items-center w-full py-2 px-4 text-left">공통 관리</p>
              </li>

              <li>
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

              <li>
                <button
                  onClick={() => handleNavigation("/app/noticesAppList", "noticesAppList")}
                  className={`flex items-center w-full py-2 px-4 text-left ${
                    activeTab === "noticesAppList"
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

              <li>
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

              <li>
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

              <li>
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
                  <svg className="w-6 h-6 md:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.313 3 21l1.687-4.5L16.862 3.487z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.5 7.5l-3-3" />
                  </svg>
                  <span className="hidden md:inline">어플 문의 관리</span>
                  {hasUnansweredMobileInquiry && (
                    <span className="ml-1 inline-block h-2 w-2 rounded-full bg-red-500" />
                  )}
                </button>
              </li>

              {/* 쇼핑몰 관리 */}
              <li className="bg-gray-500 text-gray-300">
                <p className="flex items-center w-full py-2 px-4 text-left">쇼핑몰 관리</p>
              </li>

              <li>
                <button
                  onClick={() =>
                    handleNavigation("/app/memberOrderAppList", "memberOrderAppList")
                  }
                  className={`flex items-center w-full py-2 px-4 text-left ${
                    activeTab === "memberOrderAppList"
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
                  {hasOrderAttention && (
                    <span className="ml-1 inline-block h-2 w-2 rounded-full bg-red-500" />
                  )}
                </button>
              </li>

              <li>
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

              <li>
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
                  <svg className="w-6 h-6 md:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.313 3 21l1.687-4.5L16.862 3.487z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.5 7.5l-3-3" />
                  </svg>
                  <span className="hidden md:inline">쇼핑몰 문의 관리</span>
                  {hasUnansweredShoppingInquiry && (
                    <span className="ml-1 inline-block h-2 w-2 rounded-full bg-red-500" />
                  )}
                </button>
              </li>

              <li>
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

              <li>
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

              <li>
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
          
          <li className="border-t border-gray-500">
            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/login";
              }}
              className={`flex items-center w-full py-2 px-4 text-left ${
                activeTab === "logout"
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
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
          </li>
        </ul>        
      </div>

    </div>
  );
};

export default Sidebar;
