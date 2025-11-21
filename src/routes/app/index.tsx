import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useUserStore } from "../../store/store";
import Dashboard from "./dashboard/Dashboard";
import AppSidebar from "../../components/app/Sidebar";
import { useSidebarStore } from "../../store/store";
import BannerAppList from "./banner/BannerAppList";
import BannerAppDetail from "./banner/BannerAppDetail";
import BannerAppRegister from "./banner/BannerAppRegister";
import NoticesAppList from "./notice/NoticesAppList";
import NoticesAppRegister from "./notice/NoticesAppRegister";
import NoticesAppDetail from "./notice/NoticesAppDetail";
import ProductAppList from "./product/ProductAppList";
import ProductAppDetail from "./product/ProductAppDetail";
import ProductAppRegister from "./product/ProductAppRegister";
import UpdateLogAppList from "./updateLogApp/UpdateLogAppList";
import UpdateLogAppRegister from "./updateLogApp/UpdateLogAppRegister";
import UpdateLogAppDetail from "./updateLogApp/UpdateLogAppDetail";
import MemberOrderAppList from "./order/MemberOrderAppList";
import MemberOrderAppDetail from "./order/MemberOrderAppDetail";
import MemberReviewAppList from "./review/MemberReviewAppList";
import CouponAppList from "./coupon/CouponAppList";
import CouponAppRegister from "./coupon/CouponAppRegister";
import CouponAppDetail from "./coupon/CouponAppDetail";
import CenterInquiryAppList from "./inquiry/CenterInquiryAppList";
import CommonInquiryAppDetail from "./inquiry/CommonInquiryAppDetail";
import MobileInquiryAppList from "./inquiry/MobileInquiryAppList";
import EventAppList from "./event/EventAppList"
import EventAppDetail from "./event/EventAppDetail"
import EventAppRegister from "./event/EventAppRegister"
import ExerciseAppList from "./exercise/ExerciseAppList";
import InquiryShoppingAppList from "./inquiryShopping/InquiryShoppingAppList";
import MemberOrderAppReturn from "./order/MemberOrderAppReturn";
import CenterOrderAppList from "./centerOrder/CenterOrderAppList";
import PostAppList from "./post/PostAppList";
import PostAppDetail from "./post/PostAppDetail";
import PostAppRegister from "./post/PostAppRegister";
import InquiryShoppingAppDetail from "./inquiryShopping/InquiryShoppingAppDetail";
import ReservationManagement from "../ReservationManagement";
import MemberAppList from "./member/MemberAppList";
import NoticesShoppingAppList from "./noticeShopping/NoticesShoppingAppList";
import NoticesShoppingAppDetail from "./noticeShopping/NoticesShoppingAppDetail";
import NoticesShoppingAppRegister from "./noticeShopping/NoticesShoppingAppRegister";
import CommonCodeList from "./commonCode/commonCodeList";

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
    } else if (location.pathname.includes("/noticesAppList")) {
      setActiveTab("noticesAppList");
    } else if (location.pathname.includes("/updateLogApp")) {
      setActiveTab("updateLogApp");
    } else if (location.pathname.includes("/settings")) {
      setActiveTab("settings");
    } else if (location.pathname.includes("/memberReviewApp")) {
      setActiveTab("memberReviewApp");
    } else if (location.pathname.includes("/memberOrderAppList")) {
      setActiveTab("memberOrderAppList");
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
    } else if (location.pathname.includes("/memberAppList")) {
      setActiveTab("memberAppList");
    } else if (location.pathname.includes("/noticesShoppingAppList")) {
      setActiveTab("noticesShoppingAppList");
    } else if (location.pathname.includes("/commonCodeList")) {
      setActiveTab("commonCodeList");
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
      <div className="bg-white shadow-lg -mt-16">
        <AppSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-x-hidden p-4 mt-6">
        <div className="container mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/memberAppList" element={<MemberAppList />} />
            <Route path="/banner" element={<BannerAppList />} />
            <Route path="/banner/bannerAppDetail" element={<BannerAppDetail />} />
            <Route path="/banner/bannerAppRegister" element={<BannerAppRegister />} />
            <Route path="/noticesAppList" element={<NoticesAppList />} />
            <Route path="/notice/noticesAppRegister" element={<NoticesAppRegister />} />
            <Route path="/notice/noticesAppDetail" element={<NoticesAppDetail />} />
            <Route path="/noticesShoppingAppList" element={<NoticesShoppingAppList />} />
            <Route path="/noticeShopping/noticesShoppingAppDetail" element={<NoticesShoppingAppDetail />} />
            <Route path="/noticeShopping/noticesShoppingAppRegister" element={<NoticesShoppingAppRegister />} />
            <Route path="/productApp" element={<ProductAppList />} />
            <Route path="/productApp/productAppDetail" element={<ProductAppDetail />} />
            <Route path="/productApp/productAppRegister" element={<ProductAppRegister />} />
            <Route path="/updateLogApp" element={<UpdateLogAppList />} />
            <Route path="/updateLogApp/updateLogAppRegister" element={<UpdateLogAppRegister />} />
            <Route path="/updateLogApp/updateLogAppDetail" element={<UpdateLogAppDetail />} />
            <Route path="/memberOrderAppList" element={<MemberOrderAppList />} />
            <Route path="/memberOrderApp/detail/:orderId" element={<MemberOrderAppDetail />} />
            <Route path="/memberReviewApp" element={<MemberReviewAppList />} />
            <Route path="/couponApp" element={<CouponAppList />} />
            <Route path="/couponApp/couponAppRegister" element={<CouponAppRegister />} />
            <Route path="/couponApp/couponAppDetail" element={<CouponAppDetail />} />
            <Route path="/centerInquiryAppList" element={<CenterInquiryAppList />} />
            <Route path="/commonInquiryAppDetail" element={<CommonInquiryAppDetail />} />
            <Route path="/mobileInquiryAppList" element={<MobileInquiryAppList />} />
            <Route path="/inquiryShoppingApp" element={<InquiryShoppingAppList />} />
            <Route path="/inquiryShoppingAppDetail" element={<InquiryShoppingAppDetail />} />
            <Route path="/eventApp" element={<EventAppList />} />
            <Route path="/eventApp/eventAppDetail" element={<EventAppDetail />} />
            <Route path="/eventApp/eventAppRegister" element={<EventAppRegister />} />
            <Route path="/exerciseAppList" element={<ExerciseAppList />} />
            <Route path="/memberOrderAppReturn" element={<MemberOrderAppReturn />} />
            <Route path="/centerOrderAppList" element={<CenterOrderAppList />} />
            <Route path="/postAppList" element={<PostAppList />} />
            <Route path="/postApp/postAppDetail" element={<PostAppDetail />} />
            <Route path="/postApp/postAppRegister" element={<PostAppRegister />} />
            <Route path="/reservation" element={<ReservationManagement />} />
            <Route path="/settings" element={<div>설정 페이지</div>} />
            <Route path="/commonCodeList" element={<CommonCodeList />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default MemberApp;
