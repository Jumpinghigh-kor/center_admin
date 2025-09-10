import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useUserStore } from "../../store/store";
import Dashboard from "./dashboard/Dashboard";
import UserManagement from "./UserManagement";
import AppSidebar from "../../components/app/Sidebar";
import { useSidebarStore } from "../../store/store";
import BannerList from "./BannerList";
import NoticesAppList from "./NoticesAppList";
import ProductAppList from "./ProductAppList";
import ProductAppDetail from "./ProductAppDetail";
import UpdateLogAppList from "./UpdateLogAppList";
import MemberOrderApp from "./MemberOrderApp";
import MemberOrderAppDetail from "./MemberOrderAppDetail";
import MemberReviewApp from "./MemberReviewApp";
import CouponApp from "./CouponApp";
import CenterInquiryAppList from "./inquiry/CenterInquiryAppList";
import CommonInquiryAppDetail from "./inquiry/CommonInquiryAppDetail";
import MobileInquiryAppList from "./inquiry/MobileInquiryAppList";
import EventApp from "./EventApp"
import ExerciseAppList from "./exercise/ExerciseAppList";
import InquiryShoppingApp from "./InquiryShoppingApp";
import MemberOrderAppReturn from "./MemberOrderAppReturn";
import CenterOrderAppList from "./centerOrder/CenterOrderAppList";
import PostAppList from "./post/PostAppList";
import PostAppDetail from "./post/PostAppDetail";
import PostAppRegister from "./post/PostAppRegister";

const MemberApp: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const setSidebar = useSidebarStore((state) => state.setSidebar);
  const sidebar = useSidebarStore((state) => state.sidebar);

  // Check if user is admin, if not redirect to home
  useEffect(() => {
    // Hide the main sidebar when entering this page
    setSidebar(false);

    // 새로고침 시 현재 경로 유지
    if (location.pathname === "/app") {
      // 루트 경로일 경우에만 대시보드로
      setActiveTab("dashboard");
    } else if (location.pathname.includes("/users")) {
      setActiveTab("users");
    } else if (location.pathname.includes("/banner")) {
      setActiveTab("banner");
    } else if (location.pathname.includes("/products")) {
      setActiveTab("products");
    } else if (location.pathname.includes("/noticesApp")) {
      setActiveTab("noticesApp");
    } else if (location.pathname.includes("/updateLogApp")) {
      setActiveTab("updateLogApp");
    } else if (location.pathname.includes("/settings")) {
      setActiveTab("settings");
    } else if (location.pathname.includes("/memberReviewApp")) {
      setActiveTab("memberReviewApp");
    } else if (location.pathname.includes("/memberOrderApp")) {
      setActiveTab("memberOrderApp");
    } else if (location.pathname.includes("/couponApp")) {
      setActiveTab("couponApp");
    } else if (location.pathname.includes("/centerInquiryAppList")) {
      setActiveTab("centerInquiryAppList");
    } else if (location.pathname.includes("/inquiryShoppingApp")) {
      setActiveTab("inquiryShoppingApp");
    } else if (location.pathname.includes("/mobileInquiryAppList")) {
      setActiveTab("mobileInquiryAppList");
    } else if (location.pathname.includes("/eventApp")) {
      setActiveTab("eventApp");
    } else if (location.pathname.includes("/exerciseAppList")) {
      setActiveTab("exerciseAppList");
    } else if (location.pathname.includes("/memberOrderAppReturn")) {
      setActiveTab("memberOrderAppReturn");
    } else if (location.pathname.includes("/postAppList")) {
      setActiveTab("postAppList");
    }

    // 햄버거 메뉴 클릭 시 사이드바가 표시되는 것 방지
    const preventSidebarToggle = () => {
      if (sidebar) {
        setSidebar(false);
      }
    };

    // sidebar 상태가 변경될 때마다 확인
    preventSidebarToggle();

    // Restore sidebar when leaving this page
    return () => {
      setSidebar(true);
    };
  }, [user, navigate, setSidebar, location.pathname, sidebar]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* 사이드바 - 항상 표시 */}
      <div className="bg-white shadow-lg">
        <AppSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-x-hidden p-4">
        <div className="container mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/banner" element={<BannerList />} />
            <Route path="/noticesApp" element={<NoticesAppList />} />
            <Route path="/productApp" element={<ProductAppList />} />
            <Route path="/productApp/detail" element={<ProductAppDetail />} />
            <Route path="/updateLogApp" element={<UpdateLogAppList />} />
            <Route path="/memberOrderApp" element={<MemberOrderApp />} />
            <Route path="/memberOrderApp/detail/:orderId" element={<MemberOrderAppDetail />} />
            <Route path="/memberReviewApp" element={<MemberReviewApp />} />
            <Route path="/couponApp" element={<CouponApp />} />
            <Route path="/centerInquiryAppList" element={<CenterInquiryAppList />} />
            <Route path="/commonInquiryAppDetail" element={<CommonInquiryAppDetail />} />
            <Route path="/mobileInquiryAppList" element={<MobileInquiryAppList />} />
            <Route path="/inquiryShoppingApp" element={<InquiryShoppingApp />} />
            <Route path="/eventApp" element={<EventApp />} />
            <Route path="/exerciseAppList" element={<ExerciseAppList />} />
            <Route path="/memberOrderAppReturn" element={<MemberOrderAppReturn />} />
            <Route path="/centerOrderAppList" element={<CenterOrderAppList />} />
            <Route path="/postAppList" element={<PostAppList />} />
            <Route path="/postApp/postAppDetail" element={<PostAppDetail />} />
            <Route path="/postApp/postAppRegister" element={<PostAppRegister />} />
            <Route path="/settings" element={<div>설정 페이지</div>} />
            {/* Add more routes as needed */}
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default MemberApp;
