import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useUserStore } from "../../store/store";
import Dashboard from "./Dashboard";
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
import InquiryApp from "./InquiryApp";
import EventApp from "./EventApp"
import ExerciseApp from "./ExerciseApp"
import InquiryShoppingApp from "./InquiryShoppingApp";
import InquiryAdminApp from "./InquiryAdminApp";
import MemberOrderAppReturn from "./MemberOrderAppReturn";
import CenterMemberOrderAppList from "./CenterMemberOrderAppList";
import PostApp from "./PostApp";
import PostAppDetail from "./PostAppDetail";

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
    } else if (location.pathname.includes("/inquiryApp")) {
      setActiveTab("inquiryApp");
    } else if (location.pathname.includes("/inquiryShoppingApp")) {
      setActiveTab("inquiryShoppingApp");
    } else if (location.pathname.includes("/inquiryAdminApp")) {
      setActiveTab("inquiryAdminApp");
    } else if (location.pathname.includes("/eventApp")) {
      setActiveTab("eventApp");
    } else if (location.pathname.includes("/exerciseApp")) {
      setActiveTab("exerciseApp");
    } else if (location.pathname.includes("/memberOrderAppReturn")) {
      setActiveTab("memberOrderAppReturn");
    } else if (location.pathname.includes("/postApp")) {
      setActiveTab("postApp");
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
            <Route path="/inquiryApp" element={<InquiryApp />} />
            <Route path="/inquiryShoppingApp" element={<InquiryShoppingApp />} />
            <Route path="/inquiryAdminApp" element={<InquiryAdminApp />} />
            <Route path="/eventApp" element={<EventApp />} />
            <Route path="/exerciseApp" element={<ExerciseApp />} />
            <Route path="/memberOrderAppReturn" element={<MemberOrderAppReturn />} />
            <Route path="/centerMemberOrderAppList" element={<CenterMemberOrderAppList />} />
            <Route path="/postApp" element={<PostApp />} />
            <Route path="/postApp/postAppDetail" element={<PostAppDetail />} />
            <Route path="/settings" element={<div>설정 페이지</div>} />
            {/* Add more routes as needed */}
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default MemberApp;
