import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../../store/store";
import { openInputDatePicker } from "../../../utils/commonUtils";
import ProductAppPopup from "../../../components/app/ProductAppPopup";
import couponImg1 from "../../../images/coupon_example_001.png";
import couponImg2 from "../../../images/coupon_example_002.png";

interface ProductApp {
  product_app_id: number;
  brand_name: string;
  big_category: string;
  small_category: string;
  title: string;
  price: number;
  original_price: number;
  discount: number;
  give_point: number;
  sell_start_dt: string;
  sell_end_dt: string;
  view_yn: "Y" | "N";
  del_yn: "Y" | "N";
  reg_dt: string;
  reg_id: number;
}

const CouponAppRegister: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();
  const [showProductPopup, setShowProductPopup] = useState(false);
  const [formData, setFormData] = useState({
    product_app_id: -1 as number,
    product_name: "" as string,
    brand_name: "" as string,
    discount_type: "FIXED" as "FIXED" | "PERCENT",
    discount_amount: 0 as number,
    min_order_amount: 0 as number,
    description: "" as string,
    start_dt: "" as string,
    end_dt: "" as string,
    badge_text: "" as string,
    coupon_notice: "" as string,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDiscountFocused, setIsDiscountFocused] = useState(false);
  const [isMinOrderFocused, setIsMinOrderFocused] = useState(false);

  const formatToYYYYMMDDHHIISS = (datetimeLocal: string): string => {
    if (!datetimeLocal) return "";
    try {
      const d = new Date(datetimeLocal);
      if (isNaN(d.getTime())) return "";
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const HH = String(d.getHours()).padStart(2, '0');
      const MI = String(d.getMinutes()).padStart(2, '0');
      const SS = String(d.getSeconds()).padStart(2, '0');
      return `${yyyy}${mm}${dd}${HH}${MI}${SS}`;
    } catch {
      return "";
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    // 기본 검증
    if (formData.product_app_id === -1) {
      alert('상품을 선택해주세요.');
      return;
    }
    if (!formData.discount_type) {
      alert('할인 단위를 선택해주세요.');
      return;
    }
    if (!formData.discount_amount || Number(formData.discount_amount) < 0) {
      alert('할인 금액을 입력해주세요.');
      return;
    }
    if (!formData.description.trim()) {
      alert('쿠폰 설명을 입력해주세요.');
      return;
    }
    if (!formData.start_dt) {
      alert('시작일을 입력해주세요.');
      return;
    }
    if (!formData.end_dt) {
      alert('종료일을 입력해주세요.');
      return;
    }
    if (!formData.coupon_notice.trim()) {
      alert('쿠폰 이용약관을 입력해주세요.');
      return;
    }

    const start = formatToYYYYMMDDHHIISS(formData.start_dt);
    const end = formatToYYYYMMDDHHIISS(formData.end_dt);
    if (start && end && start > end) {
      alert('종료일은 시작일보다 늦어야 합니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post(
        `${process.env.REACT_APP_API_URL}/app/couponApp/insertCouponApp`,
        {
          product_app_id: formData.product_app_id,
          discount_type: formData.discount_type,
          discount_amount: formData.discount_amount,
          min_order_amount: formData.min_order_amount || 0,
          description: formData.description,
          badge_text: formData.badge_text,
          start_dt: start,
          end_dt: end,
          coupon_notice: formData.coupon_notice,
          user_id: user?.index,
        }
      );
      alert('쿠폰이 성공적으로 등록되었습니다.');
      navigate('/app/couponApp');
    } catch (err) {
      alert('쿠폰 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
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
                      : `상품명: ${formData.product_name}`}
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
                    onChange={(e) => setFormData({ ...formData, start_dt: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, end_dt: e.target.value })}
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
                    value={formData.badge_text}
                    onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
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
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isSubmitting ? '등록 중...' : '등록'}
          </button>
        </div>
      </form>

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

export default CouponAppRegister;
