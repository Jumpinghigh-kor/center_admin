import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../../store/store";
import { openInputDatePicker } from "../../../utils/commonUtils";
import ProductAppPopup from "../../../components/app/ProductAppPopup";
import couponImg1 from "../../../images/coupon_example_001.png";
import couponImg2 from "../../../images/coupon_example_002.png";

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
  product_del_yn: string;
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

const CouponAppDetail: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [couponData, setCouponData] = useState<CouponApp | null>(null);
  const [memberCouponList, setMemberCouponList] = useState<CouponMember[]>([]);
  const [formData, setFormData] = useState({
    product_app_id: -1,
    product_name: "",
    brand_name: "",
    discount_amount: 0,
    discount_type: "FIXED",
    min_order_amount: 0,
    description: "",
    badge_text: "",
    title: "",
    coupon_notice: "",
    start_dt: "",
    end_dt: "",
  });
  const [showProductPopup, setShowProductPopup] = useState(false);
  const [isDiscountFocused, setIsDiscountFocused] = useState(false);
  const [isMinOrderFocused, setIsMinOrderFocused] = useState(false);
  const [isBadgeTextFocused, setIsBadgeTextFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const couponAppId = searchParams.get('couponAppId');

  // 쿠폰 상세 조회
  const getCouponAppDetail = async () => {
    if (!couponAppId) return;
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/couponApp/selectCouponAppDetail`,
        {
          coupon_app_id: couponAppId
        }
      );
      
      if (response.data.result && response.data.result.length > 0) {
        const data = response.data.result[0];
        setCouponData(data);
        setFormData({
          product_app_id: data.product_app_id,
          product_name: (data as any).product_name || data.title || "",
          brand_name: data.brand_name,
          discount_amount: data.discount_amount,
          discount_type: data.discount_type,
          min_order_amount: data.min_order_amount,
          description: data.description,
          badge_text: data.badge_text,
          title: data.title,
          coupon_notice: data.coupon_notice,
          start_dt: data.start_dt,
          end_dt: data.end_dt,
        });
      }
    } catch (error) {
      console.error("쿠폰 상세 조회 오류:", error);
    }
  };

  // 쿠폰 회원 목록 조회
  const selectMembercouponAppList = async (coupon_app_id: string | null) => {
    if (!coupon_app_id) return;
    
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

  useEffect(() => {
    getCouponAppDetail();
    selectMembercouponAppList(couponAppId || "");
  }, [couponAppId]);

  const modifyCouponApp = async (action: 'update' | 'delete') => {
    if (!couponData) return;
    if (action === 'update') {
      if (!window.confirm(memberCouponList.length > 0 ? "해당 쿠폰을 소유하고 있는 회원들이 존재합니다.\n정말로 쿠폰 정보를 수정하시겠습니까?" : "쿠폰 정보를 수정하시겠습니까?")) return;
      
      if (formData.start_dt > formData.end_dt) {
        alert("종료일은 시작일보다 늦어야 합니다.");
        return;
      }
      try {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/app/couponApp/updateCouponApp`,
          {
            coupon_app_id: couponData.coupon_app_id,
            product_app_id: formData.product_app_id,
            discount_type: formData.discount_type,
            discount_amount: formData.discount_amount,
            min_order_amount: formData.min_order_amount,
            description: formData.description,
            badge_text: formData.badge_text,
            title: formData.title,
            start_dt: formData.start_dt,
            end_dt: formData.end_dt,
            coupon_notice: formData.coupon_notice,
            userId: user.index,
          }
        );
        navigate("/app/couponApp");
      } catch (error) {
        console.error("쿠폰 수정 오류:", error);
        alert("쿠폰 수정 중 오류가 발생했습니다.");
      }
    } else {
      if (!window.confirm(memberCouponList.length > 0 ? "해당 쿠폰을 소유하고 있는 회원들이 존재합니다.\n정말로 쿠폰을 삭제하시겠습니까?" : "쿠폰을 삭제하시겠습니까?")) return;
      
      try {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/app/couponApp/deleteCouponApp`,
          {
            coupon_app_id: [couponData?.coupon_app_id],
            userId: user.index,
          }
        );
        navigate("/app/couponApp");
      } catch (err) {
        console.error("쿠폰 삭제 오류:", err);
        alert("쿠폰 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">쿠폰 등록</h2>
      </div>

      <form className="space-y-6">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold">
                  상품 선택 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <button 
                      type="button"
                      onClick={() => setShowProductPopup(true)}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      선택
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  브랜드 이름 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3 w-2/6">
                  <p>
                    {formData.product_app_id === -1 ? '미선택' : formData.product_app_id === 0
                      ? '전체 상품'
                      : `브랜드명: ${formData.brand_name}`}
                  </p>
                </td>
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  상품 이름 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3 w-2/6">
                  <p>
                    {formData.product_app_id === -1 ? '미선택' : formData.product_app_id === 0
                      ? '전체 상품'
                      : `상품명: ${formData.product_name || '-'}`}
                  </p>
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  할인 금액 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3 flex flex-row items-center w-2/6">
                  <input
                    type="number"
                    name="discount_amount"
                    value={isDiscountFocused && formData.discount_amount === 0 ? '' : formData.discount_amount}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const normalized = raw.replace(/^0+(?=\d)/, '');
                      let n = Number(normalized);
                      if (isNaN(n)) n = 0;
                      if (formData.discount_type === 'PERCENT') {
                        if (n < 1) n = 1;
                        if (n > 100) n = 100;
                      }
                      setFormData({ ...formData, discount_amount: n });
                    }}
                    onFocus={() => setIsDiscountFocused(true)}
                    onBlur={() => setIsDiscountFocused(false)}
                    inputMode="numeric"
                    min={formData.discount_type === 'PERCENT' ? 1 : 0}
                    max={formData.discount_type === 'PERCENT' ? 100 : undefined}
                    className="p-2 border border-gray-300 rounded"
                    placeholder="0"
                    disabled={false}
                  />
                  <span className="ml-2">{formData.discount_type === 'PERCENT' ? '%' : '원'}</span>
                </td>
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  할인 단위 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3 w-2/6">
                  <select
                    name="discount_type"
                    value={formData.discount_type}
                    onChange={(e) => {
                      const nextType = e.target.value as 'FIXED' | 'PERCENT';
                      let nextAmount = formData.discount_amount;
                      if (nextType === 'PERCENT') {
                        if (!nextAmount || nextAmount < 1) nextAmount = 1;
                        if (nextAmount > 100) nextAmount = 100;
                      }
                      setFormData({ ...formData, discount_type: nextType, discount_amount: nextAmount });
                    }}
                    className="p-2 border border-gray-300 rounded"
                    disabled={false}
                  >
                    <option value="FIXED">원</option>
                    <option value="PERCENT">%</option>
                  </select>
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  최소 주문 금액
                </td>
                <td className="px-4 py-3 w-2/6">
                  <input
                    type="number"
                    name="min_order_amount"
                    value={isMinOrderFocused && formData.min_order_amount === 0 ? '' : formData.min_order_amount}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const normalized = raw.replace(/^0+(?=\d)/, '');
                      let n = Number(normalized);
                      if (isNaN(n)) n = 0;
                      setFormData({ ...formData, min_order_amount: n });
                    }}
                    onFocus={() => setIsMinOrderFocused(true)}
                    onBlur={() => setIsMinOrderFocused(false)}
                    inputMode="numeric"
                    className="p-2 border border-gray-300 rounded"
                    placeholder="0"
                    disabled={false}
                  />
                  <span className="ml-2">원</span>
                </td>
                <td className="bg-gray-100 px-4 py-3 w-1/6 font-semibold">
                  쿠폰 설명 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3 w-2/6">
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="쿠폰 설명을 간략히 입력하세요."
                    disabled={false}
                  />
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 w-1/6 font-semibold">
                  시작일 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3 w-2/6" onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target && target.tagName.toLowerCase() === 'input') return;
                  const input = e.currentTarget.querySelector('input[type="datetime-local"]') as HTMLInputElement | null;
                  if (input) openInputDatePicker(input);
                }}>
                  <input
                    type="datetime-local"
                    name="start_dt"
                    value={formData.start_dt}
                    onChange={(e) => {
                      setFormData({ ...formData, start_dt: e.target.value });
                      requestAnimationFrame(() => {
                        try { e.currentTarget.blur(); } catch {}
                      });
                    }}
                    onInput={(e) => {
                      const input = e.currentTarget;
                      requestAnimationFrame(() => {
                        try { input.blur(); } catch {}
                      });
                    }}
                    onClick={(e) => openInputDatePicker(e.currentTarget)}
                    onFocus={(e) => openInputDatePicker(e.currentTarget)}
                    className="w-full p-2 border cursor-pointer border-gray-300 rounded"
                    disabled={false}
                  />
                </td>
                <td className="bg-gray-100 px-4 py-3 w-1/6 font-semibold">
                  종료일 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3 w-2/6" onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target && target.tagName.toLowerCase() === 'input') return;
                  const input = e.currentTarget.querySelector('input[type="datetime-local"]') as HTMLInputElement | null;
                  if (input) openInputDatePicker(input);
                }}>
                  <input
                    type="datetime-local"
                    name="end_dt"
                    value={formData.end_dt}
                    onChange={(e) => {
                      setFormData({ ...formData, end_dt: e.target.value });
                      requestAnimationFrame(() => {
                        try { e.currentTarget.blur(); } catch {}
                      });
                    }}
                    onInput={(e) => {
                      const input = e.currentTarget;
                      requestAnimationFrame(() => {
                        try { input.blur(); } catch {}
                      });
                    }}
                    onClick={(e) => openInputDatePicker(e.currentTarget)}
                    onFocus={(e) => openInputDatePicker(e.currentTarget)}
                    className="w-full p-2 border cursor-pointer border-gray-300 rounded"
                    disabled={false}
                  />
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 w-1/6 font-semibold">
                  뱃지 텍스트
                </td>
                <td className="px-4 py-3 w-2/6">
                  <input
                    type="text"
                    name="badge_text"
                    value={isBadgeTextFocused && !formData.badge_text ? '' : (formData.badge_text ? formData.badge_text : "-")}
                    onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                    onFocus={() => setIsBadgeTextFocused(true)}
                    onBlur={() => setIsBadgeTextFocused(false)}
                    className="p-2 border border-gray-300 rounded"
                    disabled={false}
                  />
                </td>
              </tr>
              <tr>
                <td className="bg-gray-100 px-4 py-3 w-1/6 font-semibold">
                  쿠폰 이용약관 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3 w-2/6">
                  <textarea
                    name="coupon_notice"
                    value={formData.coupon_notice}
                    onChange={(e) => setFormData({ ...formData, coupon_notice: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded"
                    style={{ whiteSpace: 'pre-wrap' }}
                    rows={4}
                    disabled={false}
                    placeholder="쿠폰 이용약관을 입력하세요. (줄바꿈 가능)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={() => modifyCouponApp('delete')}
            disabled={isSubmitting}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            삭제
          </button>
          <button
            type="button"
            onClick={() => modifyCouponApp('update')}
            disabled={isSubmitting}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            수정
          </button>
        </div>
      </form>

      <div className="mt-12">
        {memberCouponList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">소유 회원이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="w-full h-16 border-b border-gray-200 bg-gray-200">
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

      <div className="mt-8">
        <h3 className="text-lg font-semibold">쿠폰 가이드 이미지</h3>
        <div className="flex justify-start items-center gap-4 mt-4 overflow-hidden">
          <img src={couponImg1} alt="쿠폰 이미지" className="w-1/3 h-auto" />
          <img src={couponImg2} alt="쿠폰 이미지" className="w-1/3 h-auto" />
        </div>
      </div>

      <ProductAppPopup
        isOpen={showProductPopup}
        onClose={() => setShowProductPopup(false)}
        selectedProductId={formData.product_app_id}
        onChangeSelected={() => {}}
        onConfirm={({ product_app_id, title, brand_name }) => { setFormData({ ...formData, product_app_id, product_name: title || "", brand_name: brand_name || "" }); setShowProductPopup(false); }}
      />
    </div>
  );
};

export default CouponAppDetail;
