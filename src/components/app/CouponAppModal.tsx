import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUserStore } from "../../store/store";
import couponImg1 from "../../images/coupon_example_001.png";
import couponImg2 from "../../images/coupon_example_002.png";

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
}

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

interface CouponAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedCoupon: CouponApp | null;
}

const CouponAppModal: React.FC<CouponAppModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedCoupon,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const user = useUserStore((state) => state.user);
  const [showProductPopup, setShowProductPopup] = useState(false);
  const [productList, setProductList] = useState<ProductApp[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number>(-1);
  const [selectedProductInfo, setSelectedProductInfo] = useState({
    product_app_id: selectedCoupon ? selectedCoupon.product_app_id : 0,
    title: selectedCoupon && selectedCoupon.title ? selectedCoupon.title : "",
    brand_name: selectedCoupon && selectedCoupon.brand_name ? selectedCoupon.brand_name : "",
  });

  // selectedCoupon이 변경될 때마다 selectedProductInfo 업데이트
  useEffect(() => {
    if (selectedCoupon) {
      const newProductInfo = {
        product_app_id: selectedCoupon.product_app_id || 0,
        title: selectedCoupon.title || "",
        brand_name: selectedCoupon.brand_name || "",
      };
      setSelectedProductInfo(newProductInfo);
    } else {
      // selectedCoupon이 null일 때 초기화
      setSelectedProductInfo({
        product_app_id: 0,
        title: "",
        brand_name: "",
      });
    }
  }, [selectedCoupon]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);

    // 모달이 열리면 body 스크롤 방지
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setIsAnimating(true);
    } else {
      // 애니메이션이 끝난 후에 isAnimating을 false로 설정
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300); // 애니메이션 시간(duration)과 동일하게 설정

      return () => {
        clearTimeout(timer);
      };
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  // 상품 목록 조회
  const selectProductAppList = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/app/productApp/selectProductAppList`
      );
      setProductList(response.data.result);
      // 현재 선택된 상품이 있다면 해당 상품을 선택 상태로 설정
      setSelectedProductId(selectedProductInfo.product_app_id || 0);
      setShowProductPopup(true);
    } catch (error) {
      console.error("상품 목록 조회 오류:", error);
      alert("상품 목록을 불러오는 중 오류가 발생했습니다.");
    }
  };

  // 상품 라디오 핸들러
  const handleProductRadio = (productId: number) => {
    setSelectedProductId(productId);
  };

  // 상품 선택 확인
  const handleProductConfirm = () => {
    if (selectedProductId === 0) {
      // 전체 상품 선택
      setSelectedProductInfo({
        product_app_id: 0,
        title: "",
        brand_name: "",
      });
    } else {
      // 특정 상품 선택
      const selectedProduct = productList.find(p => p.product_app_id === selectedProductId);
      if (selectedProduct) {
        setSelectedProductInfo({
          product_app_id: selectedProduct.product_app_id,
          title: selectedProduct.title,
          brand_name: selectedProduct.brand_name,
        });
      }
    }
    setShowProductPopup(false);
  };

  if (!isOpen && !isAnimating) return null;

  // 날짜 형식 변환 함수들
  const formatToYYYYMMDDHHIISS = (datetimeLocal: string): string => {
    if (!datetimeLocal) return "";
    
    try {
      const date = new Date(datetimeLocal);
      
      // 유효한 날짜인지 확인
      if (isNaN(date.getTime())) {
        return "";
      }
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      const result = `${year}${month}${day}${hours}${minutes}${seconds}`;
      return result;
    } catch (error) {
      return "";
    }
  };

  const formatToDatetimeLocal = (yyyymmddhhiiss: string | number): string => {
    if (!yyyymmddhhiiss) return "";
    const dateStr = String(yyyymmddhhiiss);
    
    // 다양한 형식 처리
    if (dateStr.length === 14) {
      // YYYYMMDDHHIISS 형식
      const year = dateStr.slice(0, 4);
      const month = dateStr.slice(4, 6);
      const day = dateStr.slice(6, 8);
      const hours = dateStr.slice(8, 10);
      const minutes = dateStr.slice(10, 12);
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } else if (dateStr.includes('-') && dateStr.includes('T')) {
      // 이미 datetime-local 형식인 경우
      return dateStr.slice(0, 16); // YYYY-MM-DDTHH:MM 형식으로 자르기
    } else if (dateStr.includes('-') && dateStr.includes(' ')) {
      // YYYY-MM-DD HH:MM:SS 형식인 경우
      const parts = dateStr.split(' ');
      if (parts.length === 2) {
        const datePart = parts[0];
        const timePart = parts[1].slice(0, 5); // HH:MM만 추출
        return `${datePart}T${timePart}`;
      }
    } else if (dateStr.length === 8) {
      // YYYYMMDD 형식 (시간 없음)
      const year = dateStr.slice(0, 4);
      const month = dateStr.slice(4, 6);
      const day = dateStr.slice(6, 8);
      return `${year}-${month}-${day}T00:00`;
    }
    
    return "";
  };

  // Coupon Edit Form Component
  const CouponAppForm = () => {
    const [formData, setFormData] = useState({
      coupon_app_id: selectedCoupon ? selectedCoupon.coupon_app_id : 0,
      product_app_id: selectedCoupon ? selectedCoupon.product_app_id : 0,
      discount_type: selectedCoupon ? selectedCoupon.discount_type : "FIXED",
      discount_amount: selectedCoupon ? selectedCoupon.discount_amount : "",
      min_order_amount: selectedCoupon ? selectedCoupon.min_order_amount : "",
      description: selectedCoupon ? selectedCoupon.description : "",
      badge_text: selectedCoupon ? selectedCoupon.badge_text : "",
      start_dt: selectedCoupon ? formatToDatetimeLocal(selectedCoupon.start_dt) : "",
      end_dt: selectedCoupon ? formatToDatetimeLocal(selectedCoupon.end_dt) : "",
      coupon_notice: selectedCoupon ? selectedCoupon.coupon_notice : "",
    });

    // selectedCoupon이 변경될 때 formData 업데이트
    useEffect(() => {
      setFormData({
        coupon_app_id: selectedCoupon ? selectedCoupon.coupon_app_id : 0,
        product_app_id: selectedCoupon ? selectedCoupon.product_app_id : 0,
        discount_type: selectedCoupon ? selectedCoupon.discount_type : "FIXED",
        discount_amount: selectedCoupon ? selectedCoupon.discount_amount : "",
        min_order_amount: selectedCoupon ? selectedCoupon.min_order_amount : "",
        description: selectedCoupon ? selectedCoupon.description : "",
        badge_text: selectedCoupon ? selectedCoupon.badge_text : "",
        start_dt: selectedCoupon ? formatToDatetimeLocal(selectedCoupon.start_dt) : "",
        end_dt: selectedCoupon ? formatToDatetimeLocal(selectedCoupon.end_dt) : "",
        coupon_notice: selectedCoupon ? selectedCoupon.coupon_notice : "",
      });
    }, [selectedCoupon]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      
      // 할인 금액 유효성 검증
      if (name === 'discount_amount') {
        const numValue = Number(value);
        
        // 퍼센트인 경우 100 이하로 제한
        if (formData.discount_type === 'PERCENT' && numValue > 100) {
          alert('퍼센트 할인은 100% 이하로만 입력 가능합니다.');
          return;
        }
        
        // 원인 경우 상품 금액을 넘지 않도록 제한
        if (formData.discount_type === 'FIXED' && selectedProductInfo.product_app_id > 0) {
          const selectedProduct = productList.find(p => p.product_app_id === selectedProductInfo.product_app_id);
          if (selectedProduct && numValue > selectedProduct.price) {
            alert('할인 금액은 상품 가격을 넘을 수 없습니다.');
            return;
          }
        }
      }
      
      // 할인 단위 변경 시 기존 할인 금액 검증
      if (name === 'discount_type') {
        const currentAmount = Number(formData.discount_amount);
        
        // 퍼센트로 변경 시 100 이하인지 확인
        if (value === 'PERCENT' && currentAmount > 100) {
          alert('퍼센트 할인으로 변경 시 할인 금액이 100을 넘을 수 없습니다. 할인 금액을 먼저 수정해주세요.');
          return;
        }
        
        // 원으로 변경 시 상품 금액을 넘지 않는지 확인
        if (value === 'FIXED' && selectedProductInfo.product_app_id > 0) {
          const selectedProduct = productList.find(p => p.product_app_id === selectedProductInfo.product_app_id);
          if (selectedProduct && currentAmount > selectedProduct.price) {
            alert('원 할인으로 변경 시 할인 금액이 상품 가격을 넘을 수 없습니다. 할인 금액을 먼저 수정해주세요.');
            return;
          }
        }
      }

      setFormData({
        ...formData,
        [name]: value,
      });
    };

    // selectedProductInfo가 변경될 때 formData 업데이트
    useEffect(() => {
      setFormData(prev => ({
        ...prev,
        product_app_id: selectedProductInfo.product_app_id,
      }));
    }, [selectedProductInfo]);

    const handleSubmit = async () => {
      try {
        setIsSubmitting(true);
        
        // 필수 필드 유효성 검증
        if (!formData.product_app_id && formData.product_app_id !== 0) {
          alert("상품을 선택해주세요.");
          return;
        }
        if (!formData.discount_type) {
          alert("할인 단위를 선택해주세요.");
          return;
        }
        if (!formData.discount_amount) {
          alert("할인 금액을 입력해주세요.");
          return;
        }
        if (!formData.description.trim()) {
          alert("쿠폰 설명을 입력해주세요.");
          return;
        }
        if (!formData.start_dt) {
          alert("시작일을 입력해주세요.");
          return;
        }
        if (!formData.end_dt) {
          alert("종료일을 입력해주세요.");
          return;
        }
        if (!formData.coupon_notice.trim()) {
          alert("쿠폰 이용약관을 입력해주세요.");
          return;
        }
          
        const isUpdate = selectedCoupon !== null;
        const apiUrl = isUpdate 
          ? `${process.env.REACT_APP_API_URL}/app/couponApp/updateCouponApp`
          : `${process.env.REACT_APP_API_URL}/app/couponApp/insertCouponApp`;
        
        // 요청 데이터 구성
        const requestData: any = {
          product_app_id: formData.product_app_id,
          discount_type: formData.discount_type,
          discount_amount: formData.discount_amount,
          min_order_amount: formData.min_order_amount || 0,
          description: formData.description,
          badge_text: formData.badge_text,
          start_dt: formatToYYYYMMDDHHIISS(formData.start_dt),
          end_dt: formatToYYYYMMDDHHIISS(formData.end_dt),
          coupon_notice: formData.coupon_notice,
          user_id: user?.index
        };

        // 업데이트인 경우 coupon_app_id 추가
        if (isUpdate) {
          requestData.coupon_app_id = formData.coupon_app_id;
        }
        
        const response = await axios.post(apiUrl, requestData);

        alert(isUpdate ? "쿠폰이 성공적으로 수정되었습니다." : "쿠폰이 성공적으로 등록되었습니다.");
        onSuccess();
      } catch (error) {
        alert(selectedCoupon ? "쿠폰 수정 중 오류가 발생했습니다." : "쿠폰 등록 중 오류가 발생했습니다.");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div>
        <div className="overflow-x-auto">
          <div>
            <img src={couponImg1} alt="쿠폰 이미지" className="w-full h-auto" />
            <img src={couponImg2} alt="쿠폰 이미지" className="w-full h-auto" />
          </div>
          <table className="min-w-full bg-white border border-gray-200 mt-8">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 w-1/4 font-semibold">
                  브랜드 이름 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3">
                  {selectedProductInfo.brand_name || (selectedProductInfo.product_app_id === 0 ? '전체 상품' : '')}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 w-1/4 font-semibold">
                  상품 이름 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3">
                  {selectedProductInfo.title || (selectedProductInfo.product_app_id === 0 ? '전체 상품' : '')}
                </td>
                <td className="px-4 py-3">
                  <button 
                    onClick={selectProductAppList}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    상품 선택
                  </button>
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 w-1/4 font-semibold">
                  할인 단위 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3">
                  <select
                    name="discount_type"
                    value={formData.discount_type}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    disabled={isSubmitting}
                  >
                    <option value="FIXED">원</option>
                    <option value="PERCENT">%</option>
                  </select>
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 w-1/4 font-semibold">
                  할인 금액 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3 flex flex-row items-center">
                  <input
                    type="number"
                    name="discount_amount"
                    value={formData.discount_amount}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="0"
                    disabled={isSubmitting}
                  />
                  <span className="ml-2">{formData.discount_type === 'PERCENT' ? '%' : '원'}</span>
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 w-1/4 font-semibold">
                  최소 주문 금액
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    name="min_order_amount"
                    value={formData.min_order_amount}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="0"
                    disabled={isSubmitting}
                  />
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 w-1/4 font-semibold">
                  쿠폰 설명 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    disabled={isSubmitting}
                  />
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 w-1/4 font-semibold">
                  뱃지 텍스트
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    name="badge_text"
                    value={formData.badge_text}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    disabled={isSubmitting}
                  />
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 w-1/4 font-semibold">
                  시작일 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="datetime-local"
                    name="start_dt"
                    value={formData.start_dt}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    disabled={isSubmitting}
                  />
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 w-1/4 font-semibold">
                  종료일 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="datetime-local"
                    name="end_dt"
                    value={formData.end_dt}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    disabled={isSubmitting}
                  />
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 w-1/4 font-semibold">
                  쿠폰 이용약관 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3">
                  <textarea
                    name="coupon_notice"
                    value={formData.coupon_notice}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    style={{ whiteSpace: 'pre-wrap' }}
                    rows={4}
                    disabled={isSubmitting}
                    placeholder="쿠폰 이용약관을 입력하세요. (줄바꿈 가능)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
                <div className="flex justify-end mt-4 space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            disabled={isSubmitting}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className={`px-4 py-2 text-white rounded transition-colors ${
              isSubmitting
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 백드롭 (배경 어둡게) */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${
          isOpen ? "bg-opacity-50" : "bg-opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* 모달 컨테이너 - 모바일에서는 아래에서 위로, 데스크톱에서는 오른쪽에서 왼쪽으로 */}
      <div
        className={`
          fixed bg-white shadow-xl 
          md:top-0 md:right-0 md:bottom-0 md:h-full md:w-2/3 lg:w-1/2 xl:w-1/3
          md:border-l md:border-gray-200
          transform 
          md:transform ${isOpen ? "md:translate-x-0" : "md:translate-x-full"}
          bottom-0 right-0 h-[90vh] rounded-t-xl md:rounded-none
          ${isOpen ? "translate-x-0" : "translate-x-full"}
          md:translate-y-0
        `}
      >
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
          <h3 className="text-xl font-semibold text-gray-900">
            쿠폰 상세 정보
          </h3>
          <button
            type="button"
            className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
            onClick={onClose}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 모달 내용 */}
        <div className="p-4 overflow-y-auto max-h-[calc(100%-4rem)]">
          <CouponAppForm />
        </div>
      </div>

      {/* 상품 선택 팝업 - 화면 전체 중앙에 표시 */}
      {showProductPopup && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
          onClick={() => setShowProductPopup(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-4xl w-[90vw] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">상품 선택</h3>
              <button
                onClick={() => setShowProductPopup(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {productList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">등록된 상품이 없습니다.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="w-full h-16 border-b border-gray-200">
                      <th className="text-center pl-4 whitespace-nowrap">번호</th>
                      <th className="text-center whitespace-nowrap">브랜드명</th>
                      <th className="text-center whitespace-nowrap">상품명</th>
                      <th className="text-center whitespace-nowrap">할인가</th>
                      <th className="text-center whitespace-nowrap">원가</th>
                      <th className="text-center whitespace-nowrap">선택</th>
                    </tr>
                  </thead>
                                     <tbody>
                     <tr className="h-16 border-b border-gray-200 hover:bg-gray-50">
                       <td colSpan={5} className="text-center px-2">전체 상품</td>
                       <td className="text-center px-2">
                         <input
                           type="radio"
                           name="productSelect"
                           className="form-radio h-5 w-5"
                           checked={selectedProductId === 0}
                           onChange={() => handleProductRadio(0)}
                         />
                       </td>
                     </tr>
                     {productList.map((product, index) => (
                      <tr key={product.product_app_id} className="h-16 border-b border-gray-200 hover:bg-gray-50">
                        <td className="pl-4 text-center">{productList.length - index}</td>
                        <td className="text-center px-2">{product.brand_name}</td>
                        <td className="text-center px-2">{product.title}</td>
                        <td className="text-center px-2">{product.price?.toLocaleString()}원</td>
                        <td className="text-center px-2">{product.original_price?.toLocaleString()}원</td>
                        <td className="text-center px-2">
                          <input
                            type="radio"
                            name="productSelect"
                            className="form-radio h-5 w-5"
                            checked={selectedProductId === product.product_app_id}
                            onChange={() => handleProductRadio(product.product_app_id)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => setShowProductPopup(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleProductConfirm}
                className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
                disabled={selectedProductId === -1}
              >
                선택
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponAppModal;
