import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUserStore } from "../../store/store";
import CouponAppModal from "../../components/app/CouponAppModal";

interface CouponApp {
  coupon_app_id: number;
  product_app_id: number;
  discount_type: string;
  discount_amount: number;
  min_order_amount: number;
  description: string;
  badge_text: string;
  start_dt: string | number;
  end_dt: string | number;
  coupon_notice: string;
  del_yn: "Y" | "N";
  reg_date: string;
  reg_time: string;
  mod_dt: string;
  reg_id: string;
  mod_id: string;
  title: string;
  brand_name: string;
  have_cnt: number;
}

interface CouponMember {
  member_coupon_app_id: number;
  mem_id: string;
  mem_name: string;
  coupon_app_id: number;
  use_yn: string;
  use_dt: string;
  reg_dt: string;
}

const MembercouponApp: React.FC = () => {
  const [couponList, setcouponList] = useState<CouponApp[]>([]);
  const user = useUserStore((state) => state.user);
  const [selectedcoupon, setSelectedcoupon] = useState<number[]>([]);
  const [memberCouponList, setMemberCouponList] = useState<CouponMember[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<number[]>([]);
  const [showMemberPopup, setShowMemberPopup] = useState<boolean>(false);
  const [showCouponModal, setShowCouponModal] = useState<boolean>(false);
  const [selectedCouponData, setSelectedCouponData] = useState<CouponApp | null>(null);

  // 쿠폰 목록 불러오기
  useEffect(() => {
    if (user && user.index) {
      selectCouponAppList();
    }
  }, [user]);

  // 쿠폰 목록 조회
  const selectCouponAppList = async () => {    
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/app/couponApp/selectCouponAppList`
      );

      setcouponList(response.data.result);
      setSelectedcoupon([]);
      setMemberCouponList([]);
      setSelectedCoupon([]);
    } catch (err) {
      alert("쿠폰 목록을 불러오는 도중 오류가 발생했습니다.");
    } finally {
    }
  };

  // 쿠폰 회원 목록 조회
  const selectMembercouponAppList = async (coupon_app_id: number) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/couponApp/selectMemberCouponAppList`,
        {
          coupon_app_id
        }
      );

      setMemberCouponList(response.data.result);
    } catch (err) {
      alert("쿠폰 목록을 불러오는 도중 오류가 발생했습니다.");
    } finally {
    }
  };

  // 체크박스 상태 변경 핸들러
  const handleCheckboxChange = (couponAppId: number) => {
    setSelectedcoupon((prev) => {
      if (prev.includes(couponAppId)) {
        return prev.filter((id) => id !== couponAppId);
      } else {
        return [...prev, couponAppId];
      }
    });
  };

  // 쿠폰 삭제
  const deleteMembercouponApp = async () => {
    if (selectedcoupon.length === 0) {
       alert("삭제할 쿠폰을 선택해주세요.");
       return;
     }

    const confirm = window.confirm("정말 삭제하시겠습니까?");
    if (!confirm) {
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/couponApp/deleteCouponApp`,
        {
          coupon_app_id: selectedcoupon,
          user_id: user?.index
        }
      );

      selectCouponAppList();
    } catch (err) {
      alert("쿠폰 목록을 불러오는 도중 오류가 발생했습니다.");
    } finally {
    }
  };

  // 전체 선택 체크박스 핸들러
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // 모든 배너 ID 선택
      const allcouponIds = couponList.map((coupon) => coupon.coupon_app_id);
      setSelectedcoupon(allcouponIds);
    } else {
      // 선택 초기화
      setSelectedcoupon([]);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">쿠폰 관리</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedCouponData(null);
                setShowCouponModal(true);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              등록
            </button>
            <button
              onClick={() => {
                deleteMembercouponApp();
              }}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              삭제
            </button>
          </div>
        </div>

        {couponList.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>등록된 쿠폰 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="w-full h-16 border-b border-gray-200">
                  <th className="text-center px-4 w-12">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 cursor-pointer"
                      onChange={handleSelectAll}
                      checked={
                        selectedcoupon.length === couponList.length &&
                        couponList.length > 0
                      }
                    />
                  </th>
                  <th className="text-center pl-4 whitespace-nowrap">번호</th>
                  <th className="text-center whitespace-nowrap">브랜드이름</th>
                  <th className="text-center whitespace-nowrap">상품이름</th>
                  <th className="text-center whitespace-nowrap">할인 금액</th>
                  <th className="text-center whitespace-nowrap">할인 단위</th>
                  <th className="text-center whitespace-nowrap hidden md:table-cell">
                    내용
                  </th>
                  <th className="text-center whitespace-nowrap">최소 주문 금액</th>
                  <th className="text-center whitespace-nowrap">시작일 ~ 종료일</th>
                  <th className="text-center whitespace-nowrap">이용약관</th>
                  <th className="text-center whitespace-nowrap">소유 회원</th>
                  <th className="text-center whitespace-nowrap">등록일</th>
                </tr>
              </thead>
              <tbody>
                {couponList.map((coupon, index) => (
                  <tr
                    key={coupon.coupon_app_id}
                    className="h-16 border-b border-gray-200 hover:bg-gray-50"
                    onDoubleClick={() => {
                      setSelectedCouponData(coupon);
                      setShowCouponModal(true);
                    }}
                  >
                    <td
                      className="px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 cursor-pointer"
                        checked={selectedcoupon.includes(coupon.coupon_app_id)}
                        onChange={() =>
                          handleCheckboxChange(coupon.coupon_app_id)
                        }
                      />
                    </td>
                    <td className="pl-4 text-center">{couponList.length - index}</td>
                    <td className="text-center px-2 max-w-[100px] md:max-w-[200px]">
                      {coupon.product_app_id && !coupon.brand_name ? '상품 삭제' : !coupon.product_app_id && !coupon.brand_name ? '전체 상품' : coupon.brand_name}
                    </td>
                    <td className="text-center px-2 max-w-[100px] md:max-w-[200px]">
                      {coupon.product_app_id && !coupon.title ? '상품 삭제' : !coupon.product_app_id && !coupon.title ? '전체 상품' : coupon.title}
                    </td>
                    <td className="text-center px-2 max-w-[100px] md:max-w-[200px]">
                      {coupon.discount_amount.toLocaleString()}
                    </td>
                    <td className="text-center px-2 max-w-[150px] md:max-w-[200px]">
                      {coupon.discount_type === 'PERCENT' ? '%' : '원'}
                    </td>
                    <td className="text-center px-2 max-w-[200px] hidden md:table-cell">
                      <div style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {coupon.description}
                      </div>
                    </td>
                    <td className="text-center px-2">
                      {coupon.min_order_amount.toLocaleString()}원
                    </td>
                    <td className="text-center hidden md:table-cell">
                      {coupon.start_dt} ~ <br /> {coupon.end_dt}
                    </td>
                    <td className="text-center hidden md:table-cell">
                      <button
                        onClick={() => { 
                          setSelectedCouponData(coupon);
                          setShowCouponModal(true);
                        }}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        보기
                      </button>
                    </td>
                    <td className="text-center hidden md:table-cell">
                      <button
                        onClick={() => { 
                          selectMembercouponAppList(coupon.coupon_app_id);
                          setShowMemberPopup(true);
                        }}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        보기
                      </button>
                    </td>
                    <td className="text-center hidden md:table-cell">
                      {coupon.reg_date} <br /> {coupon.reg_time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 이미지 팝업 */}
      {showMemberPopup && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowMemberPopup(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-5xl w-[90vw] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">쿠폰 소유 회원</h3>
              <button
                onClick={() => setShowMemberPopup(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {memberCouponList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">소유 회원이 없습니다.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="w-full h-16 border-b border-gray-200">
                      <th className="text-center pl-4 whitespace-nowrap">번호</th>
                      <th className="text-center max-w-[100px] md:max-w-[200px] whitespace-nowrap">회원 ID</th>
                      <th className="text-center max-w-[100px] md:max-w-[200px] whitespace-nowrap">회원 이름</th>
                      <th className="text-center max-w-[100px] md:max-w-[200px] whitespace-nowrap">사용 여부</th>
                      <th className="text-center max-w-[100px] md:max-w-[200px] whitespace-nowrap">쿠폰 사용일</th>
                      <th className="text-center max-w-[100px] md:max-w-[200px] whitespace-nowrap">등록일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberCouponList.map((ele, index) => (
                      <tr key={ele.member_coupon_app_id} className="h-16 border-b border-gray-200 hover:bg-gray-50">
                        <td className="pl-4 text-center">{memberCouponList.length - index}</td>
                        <td className="text-center px-2">{ele.mem_id}</td>
                        <td className="text-center px-2">{ele.mem_name}</td>
                        <td className="text-center px-2">{ele.use_yn === 'Y' ? '사용' : '미사용'}</td>
                        <td className="text-center px-2">{ele.use_dt ? ele.use_dt : '-'}</td>
                        <td className="text-center px-2">{ele.reg_dt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 쿠폰 모달 */}
      <CouponAppModal
        isOpen={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        onSuccess={() => {
          setShowCouponModal(false);
          selectCouponAppList();
        }}
        selectedCoupon={selectedCouponData}
      />
    </>
  );
};

export default MembercouponApp;
