import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../../store/store";
import productGuideImg1 from "../../../images/product_guide_001.png";
import productGuideImg2 from "../../../images/product_guide_002.png";
import productGuideImg3 from "../../../images/product_guide_003.png";
import ProductImageUploader from "../../../components/app/ProductImageUploader";
import { openInputDatePicker } from "../../../utils/commonUtils";


interface CommonCode {
  common_code: string;
  group_code: string;
  common_code_name: string;
  common_code_memo: string;
}

const ProductAppRegister: React.FC = () => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  
  const [commonCodeList, setCommonCodeList] = useState<CommonCode[]>([]);
  const [smallCategoryList, setSmallCategoryList] = useState<CommonCode[]>([]);
  const [deliveryCompanyList, setDeliveryCompanyList] = useState<CommonCode[]>([]);
  const [productOptionList, setProductOptionList] = useState<CommonCode[]>([]);
  const [productUnitLists, setProductUnitLists] = useState<Record<number, CommonCode[]>>({});
  const [isDiscountFocused, setIsDiscountFocused] = useState(false);

  // 상품 기본 정보 상태
  const [formData, setFormData] = useState({
    brand_name: "",
    product_name: "",
    big_category: "",
    small_category: "", 
    title: "",
    price: "",
    original_price: "",
    discount: "0",
    give_point: "",
    sell_start_dt: "",
    sell_end_dt: "",
    view_yn: "Y",
    courier_code: "",
    delivery_fee: "",
    free_shipping_amount: "",
    remote_delivery_fee: "",
    return_delivery_fee: "",
    inquiry_phone_number: "",
    today_send_yn: "Y",
    today_send_time: "",
    not_today_send_day: "",
    consignment_yn: "Y",
  });

  // 이미지 상태
  const [representImages, setRepresentImages] = useState<File[]>([]);
  const [representImagePreviews, setRepresentImagePreviews] = useState<string[]>([]);
  const [representImageOrders, setRepresentImageOrders] = useState<number[]>([]);
  const [detailImages, setDetailImages] = useState<File[]>([]);
  const [detailImagePreviews, setDetailImagePreviews] = useState<string[]>([]);
  const [detailImageOrders, setDetailImageOrders] = useState<number[]>([]);

  // 상품 상세 정보 상태
  const [productDetails, setProductDetails] = useState<Array<{
    id: number;
    option_type: string;
    option_unit: string;
    option_amount: string;
    quantity: string;
    option_gender: string;
    use_yn: string;
    product_detail_app_id?: number;
  }>>([]);

  // 상품 반품/교환 정책 상태
  const [policyDetails, setPolicyDetails] = useState<Array<{
    product_app_id: number;
    title: string;
    content: string;
    direction: string;
    order_seq: string;
    return_exchange_id?: number;
  }>>([]);

  useEffect(() => {
    loadInitialCommonCodes();
  }, []);

  // 공통 코드 초기 로딩
  const loadInitialCommonCodes = async () => {
    try {
      const [categories, deliveryCompanies, options] = await Promise.all([
        fetchCommonCode("PRODUCT_CATEGORY"),
        fetchCommonCode("DELIVERY_COMPANY"),
        fetchCommonCode("PRODUCT_OPTION_TYPE"),
      ]);
      setCommonCodeList(categories);
      setDeliveryCompanyList(deliveryCompanies);
      setProductOptionList(options);
    } catch (e) {
      console.error("공통 코드 초기 로딩 오류:", e);
    }
  };

  // 공통 코드 조회
  const fetchCommonCode = async (
    groupCode: string,
    opts?: { common_code_memo?: string }
  ): Promise<CommonCode[]> => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/common/selectCommonCodeList`,
        {
          group_code: groupCode,
          ...(opts?.common_code_memo ? { common_code_memo: opts.common_code_memo } : {}),
        }
      );
      return response.data.result || [];
    } catch (err) {
      console.error(`공통 코드 목록 로딩 오류:`, err);
      return [];
    }
  };

  // 상품 기본 정보 입력 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let nextValue: string = value as string;

    // 1. 할인율: 숫자만 허용 + 0~100 클램프
    if (name === "discount") {
      const numericOnly = (value as string).replace(/[^0-9]/g, "");
      if (numericOnly === "") {
        nextValue = "";
      } else {
        const n = Math.max(0, Math.min(100, parseInt(numericOnly, 10)));
        nextValue = String(n);
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: nextValue
    }));

    // 2. 오늘 발송 여부가 변경되면 관련 필드 초기화
    if (name === "today_send_yn") {
      setFormData(prev => ({
        ...prev,
        today_send_time: "",
        not_today_send_day: ""
      }));
    }

    // 3. 대분류가 변경되면 소분류 목록을 새로 가져오고 소분류 선택 초기화
    if (name === "big_category") {
      if (!value) {
        setSmallCategoryList([]);
      } else {
        fetchCommonCode(`${value}_CATEGORY`).then((result) => setSmallCategoryList(result));
      }
      setFormData(prev => ({
        ...prev,
        small_category: ""
      }));
    }

    // 4. 원가와 할인율이 변경되면 가격 자동 계산
    if (name === "original_price" || name === "discount") {
      const originalPrice = name === "original_price" ? parseFloat(nextValue) : parseFloat(formData.original_price);
      const discount = name === "discount" ? parseFloat(nextValue) : parseFloat(formData.discount);
      
      if (!isNaN(originalPrice) && !isNaN(discount)) {
        const calculatedPrice = originalPrice * (1 - discount / 100);
        setFormData(prev => ({
          ...prev,
          price: calculatedPrice.toFixed(0)
        }));
      }
    }
  };

  // 상품 상세 정보 추가
  const addProductDetail = () => {
    const newId = productDetails.length > 0 ? Math.max(...productDetails.map(item => item.id)) + 1 : 1;
    setProductDetails(prev => [...prev, {
      id: newId,
      option_type: "",
      option_unit: "",
      option_amount: "",
      quantity: "",
      option_gender: "",
      use_yn: "Y"
    }]);
  };

  // 상품 상세 정보 입력 핸들러
  const handleProductDetailChange = (id: number, field: string, value: string) => {
    setProductDetails(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));

    // 상품 속성이 변경되면 해당 상품 단위 목록 로드 (인라인)
    if (field === 'option_type') {
      if (!value) {
        setProductUnitLists(prev => ({ ...prev, [id]: [] }));
      } else {
        fetchCommonCode("PRODUCT_OPTION_UNIT", { common_code_memo: value })
          .then(result => setProductUnitLists(prev => ({ ...prev, [id]: result || [] })))
          .catch(() => setProductUnitLists(prev => ({ ...prev, [id]: [] })));
      }
      // 상품 단위 초기화
      setProductDetails(prev => prev.map(item => 
        item.id === id ? { ...item, option_unit: "", option_amount: "" } : item
      ));
    }

    // 상품 단위가 "없음"으로 변경되면 용량을 0으로 고정
    if (field === 'option_unit' && value === 'NONE') {
      setProductDetails(prev => prev.map(item => 
        item.id === id ? { ...item, option_amount: "0" } : item
      ));
    }
  };

  // 상품 반품/교환 정책 추가
  const addPolicyDetail = () => {
    const newId = policyDetails.length > 0 ? Math.max(...policyDetails.map(item => item.product_app_id)) + 1 : 1;
    setPolicyDetails(prev => [...prev, {
      product_app_id: newId,
      title: "",
      content: "",
      direction: "",
      order_seq: ""
    }]);
  };

  // 상품 등록
  const insertProductApp = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. 상품 기본 정보 등록 유효성 검사
    if (!formData.big_category) {
      alert("대분류를 선택해주세요.");
      return;
    }
    if (!formData.small_category) {
      alert("소분류를 선택해주세요.");
      return;
    }
    if (!formData.brand_name.trim()) {
      alert("브랜드명을 입력해주세요.");
      return;
    }
    if (!formData.product_name.trim()) {
      alert("상품명을 입력해주세요.");
      return;
    }
    if (!formData.original_price || parseFloat(formData.original_price) <= 0) {
      alert("원가를 올바르게 입력해주세요.");
      return;
    }
    if (!formData.sell_start_dt) {
      alert("판매 시작일을 선택해주세요.");
      return;
    }
    if (!formData.sell_end_dt || formData.sell_end_dt === "") {
      alert("판매 종료일을 선택해주세요.");
      return;
    }
    if (!formData.courier_code) {
      alert("택배사를 선택해주세요.");
      return;
    }
    if (!formData.delivery_fee || parseFloat(formData.delivery_fee) < 0) {
      alert("배송비를 올바르게 입력해주세요.");
      return;
    }
    if (!formData.inquiry_phone_number.trim()) {
      alert("고객문의 전화번호를 입력해주세요.");
      return;
    }
    if (formData.today_send_yn === "Y" && !formData.today_send_time) {
      alert("주문 마감 시간을 입력해주세요.");
      return;
    }
    if (formData.today_send_yn === "N" && (!formData.not_today_send_day || parseInt(formData.not_today_send_day) <= 0)) {
      alert("발송 일수를 올바르게 입력해주세요.");
      return;
    }

    // 이미지 필수 검증
    if (representImagePreviews.length === 0) {
      alert("대표 이미지는 최소 1장 이상 필요합니다.");
      return;
    }

    if (detailImagePreviews.length !== 1) {
      alert("상세 이미지는 정확히 1장이 필요합니다.");
      return;
    }

    // 2. 상품 상세 정보 등록 유효성 검사 (최소 1개 필요)
    if (productDetails.length === 0) {
      alert("상품 상세 정보를 최소 1개 이상 등록해주세요.");
      return;
    }

    // 상품 상세 정보 각 항목 검증
    for (let i = 0; i < productDetails.length; i++) {
      const detail = productDetails[i];
      
      if (!detail.option_type) {
        alert(`${i + 1}번째 상품 상세에서 상품 속성을 선택해주세요.`);
        return;
      }
      if (!detail.option_gender) {
        alert(`${i + 1}번째 상품 상세에서 상품 성별을 선택해주세요.`);
        return;
      }
      if (!detail.option_unit) {
        alert(`${i + 1}번째 상품 상세에서 상품 단위를 선택해주세요.`);
        return;
      }
      if (detail.option_unit !== "NONE" && (!detail.option_amount || parseFloat(detail.option_amount) <= 0)) {
        alert(`${i + 1}번째 상품 상세에서 용량을 올바르게 입력해주세요.`);
        return;
      }
      if (!detail.quantity || parseInt(detail.quantity) <= 0) {
        alert(`${i + 1}번째 상품 상세에서 수량을 올바르게 입력해주세요.`);
        return;
      }
    }

    // 3. 상품 반품/교환 정책 등록 유효성 검사 (최소 1개 필요)
    if (policyDetails.length === 0) {
      alert("상품 반품/교환 정책을 최소 1개 이상 등록해주세요.");
      return;
    }

    // 반품/교환 정책 각 항목 검증
    for (let i = 0; i < policyDetails.length; i++) {
      const policy = policyDetails[i];
      
      if (!policy.title.trim()) {
        alert(`${i + 1}번째 반품/교환 정책에서 제목을 입력해주세요.`);
        return;
      }
      if (!policy.direction) {
        alert(`${i + 1}번째 반품/교환 정책에서 방향을 선택해주세요.`);
        return;
      }
      if (!policy.content.trim()) {
        alert(`${i + 1}번째 반품/교환 정책에서 내용을 입력해주세요.`);
        return;
      }
      if (!policy.order_seq) {
        alert(`${i + 1}번째 반품/교환 정책에서 순서를 선택해주세요.`);
        return;
      }
    }
    
    try {
      
      // product_app 데이터
      const productAppData = {
        mem_id: user?.index,
        brand_name: formData.brand_name,
        product_name: formData.product_name,
        big_category: formData.big_category,
        small_category: formData.small_category,
        title: formData.product_name,
        price: parseInt(formData.price),
        original_price: parseInt(formData.original_price),
        discount: parseInt(formData.discount),
        give_point: parseInt(formData.give_point),
        sell_start_dt: formData.sell_start_dt,
        sell_end_dt: formData.sell_end_dt === "unlimited" ? "29991230235959" : formData.sell_end_dt,
        sell_dt_type: formData.sell_end_dt,
        courier_code: formData.courier_code,
        delivery_fee: parseInt(formData.delivery_fee) || 0,
        remote_delivery_fee: parseInt(formData.remote_delivery_fee) || 0,
        return_delivery_fee: parseInt(formData.return_delivery_fee) || 0,
        free_shipping_amount: parseInt(formData.free_shipping_amount) || 0,
        inquiry_phone_number: formData.inquiry_phone_number,
        today_send_yn: formData.today_send_yn,
        today_send_time: formData.today_send_time,
        not_today_send_day: parseInt(formData.not_today_send_day) || 0,
        consignment_yn: formData.consignment_yn,
        view_yn: formData.view_yn,
        del_yn: "N"
      };

      // product_detail_app 데이터
      const productDetailAppData = productDetails.map(detail => ({
        option_type: detail.option_type,
        option_amount: detail.option_amount,
        option_unit: detail.option_unit,
        option_gender: detail.option_gender,
        quantity: parseInt(detail.quantity),
        use_yn: detail.use_yn,
        del_yn: "N",
        product_detail_app_id: detail.product_detail_app_id || null // 기존 데이터면 ID 포함
      }));

      // 이미지 데이터 구성 (base64 + content_type 포함)
      const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(",")[1] || base64String;
            resolve(base64Data);
          };
          reader.onerror = (error) => reject(error);
        });
      };

      const representImageData = await Promise.all(
        representImages.map(async (file, index) => ({
          img_form: "REPRESENTER",
          file_name: file.name,
          order_seq: representImageOrders[index],
          product_app_img_id: null,
          file_data: await convertFileToBase64(file),
          content_type: file.type,
        }))
      );

      const detailImageData = await Promise.all(
        detailImages.map(async (file, index) => ({
          img_form: "DETAIL",
          file_name: file.name,
          order_seq: 1,
          product_app_img_id: null,
          file_data: await convertFileToBase64(file),
          content_type: file.type,
        }))
      );

      const imageData = [...representImageData, ...detailImageData];

      // 반품/교환 정책 데이터
      const returnExchangeData = policyDetails.map(policy => ({
        return_exchange_id: policy.return_exchange_id || null,
        title: policy.title,
        content: policy.content,
        direction: policy.direction,
        order_seq: parseInt(policy.order_seq),
        use_yn: "Y",
        del_yn: "N"
      }));
  
      await axios.post(
        `${process.env.REACT_APP_API_URL}/app/productApp/insertProductApp`,
        {
          productApp: productAppData,
          productDetailApp: productDetailAppData,
          imageData: imageData,
          returnExchangeData: returnExchangeData
        }
      );

      alert("상품이 등록되었습니다.");
      navigate("/app/productApp");
    } catch (err) {
      console.error("상품 저장 오류:", err);
      alert("상품 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          상품 등록
        </h2>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">1. 상품 기본 정보 등록<span className="text-red-500"> *</span></h3>
        <button
          type="button"
          onClick={() => window.open(productGuideImg1, '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes')}
          className="px-4 py-2 ml-4 bg-orange-500 text-white rounded-md hover:bg-orange-600"
        >
          가이드 보기
        </button>
      </div>

      <form onSubmit={insertProductApp} className="space-y-6">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <tbody>
              {/* 대분류 & 소분류 */}
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 w-1/6 font-semibold">
                  대분류 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3 w-1/3">
                  <select
                    name="big_category"
                    value={formData.big_category || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">선택</option>
                    {commonCodeList.map((code) => (
                      <option key={code.common_code} value={code.common_code}>
                        {code.common_code_name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="bg-gray-100 px-4 py-3 w-1/6 font-semibold">
                  소분류 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3 w-1/3">
                  <select
                    name="small_category"
                    value={formData.small_category || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!formData.big_category}
                  >
                    <option value="">선택</option>
                    {smallCategoryList.map((code) => (
                      <option key={code.common_code} value={code.common_code}>
                        {code.common_code_name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              {/* 브랜드명 & 제목 */}
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold">
                  브랜드명 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    name="brand_name"
                    value={formData.brand_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="브랜드명을 입력하세요"
                  />
                </td>
                <td className="bg-gray-100 px-4 py-3 font-semibold">
                  상품명 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    name="product_name"
                    value={formData.product_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="상품 제목을 입력하세요"
                    required
                  />
                </td>
              </tr>

              {/* 원가 & 할인율 */}
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold">
                  원가 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    name="original_price"
                    value={formData.original_price}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="원가를 입력하세요"
                    required
                  />
                </td>
                <td className="bg-gray-100 px-4 py-3 font-semibold">
                  할인율
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <input
                      type="number"
                      name="discount"
                      value={isDiscountFocused && (formData.discount === "0" || formData.discount === 0 as any) ? "" : formData.discount}
                      onChange={handleInputChange}
                      onFocus={() => setIsDiscountFocused(true)}
                      onBlur={() => setIsDiscountFocused(false)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="할인율을 입력하세요 (%)"
                      min="0"
                      max="100"
                      step="1"
                      required
                    />
                    <span className="ml-2">%</span>
                  </div>
                </td>
              </tr>

              {/* 가격 & 포인트 */}
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold">
                  가격 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                    placeholder="원가와 할인율을 입력하면 자동 계산됩니다"
                    required
                    disabled
                  />
                </td>
                <td className="bg-gray-100 px-4 py-3 font-semibold">
                  포인트
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    name="give_point"
                    value={formData.give_point}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="적립 포인트를 입력하세요"
                  />
                </td>
              </tr>

              {/* 판매 시작일 & 종료일 */}
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold">
                  판매 시작일 <span className="text-red-500">*</span>
                </td>
                <td
                  className="px-4 py-3"
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target && target.tagName.toLowerCase() === 'input') return;
                    const input = e.currentTarget.querySelector('input[type=\"datetime-local\"]') as HTMLInputElement | null;
                    if (input) openInputDatePicker(input);
                  }}
                >
                  <input
                    type="datetime-local"
                    name="sell_start_dt"
                    value={formData.sell_start_dt}
                    onChange={(e) => {
                      handleInputChange(e);
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </td>
                <td className="bg-gray-100 px-4 py-3 font-semibold">
                  판매 종료일 <span className="text-red-500">*</span>
                </td>
                <td
                  className="px-4 py-3"
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target && (target.tagName.toLowerCase() === 'input' || target.closest('label'))) return;
                    const input = e.currentTarget.querySelector('input[type=\"datetime-local\"]') as HTMLInputElement | null;
                    if (input) openInputDatePicker(input);
                  }}
                >
                  <div className="flex space-x-4 mb-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="sell_end_dt_type"
                        value="unlimited"
                        checked={formData.sell_end_dt === "unlimited"}
                        onChange={(e) => setFormData(prev => ({ ...prev, sell_end_dt: "unlimited" }))}
                        className="mr-2"
                      />
                      무제한
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="sell_end_dt_type"
                        value="custom"
                        checked={formData.sell_end_dt !== "unlimited" && formData.sell_end_dt !== ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, sell_end_dt: "custom" }))}
                        className="mr-2"
                      />
                      직접 입력
                    </label>
                  </div>
                  {formData.sell_end_dt !== "unlimited" && formData.sell_end_dt !== "" && (
                    <input
                      type="datetime-local"
                      name="sell_end_dt_custom"
                      value={formData.sell_end_dt === "custom" ? "" : formData.sell_end_dt}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, sell_end_dt: e.target.value }));
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  )}
                </td>
              </tr>

              {/* 전시 여부 & 택배사 */}
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold">
                  택배사 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3">
                  <select
                    name="courier_code"
                    value={formData.courier_code || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택</option>
                    {deliveryCompanyList.map((code) => (
                      <option key={code.common_code} value={code.common_code}>
                        {code.common_code_name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="bg-gray-100 px-4 py-3 font-semibold">
                  위탁상품 여부 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex space-x-4 mb-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="consignment_yn"
                        value="Y"
                        checked={formData.consignment_yn === "Y"}
                        onChange={(e) => setFormData(prev => ({ ...prev, consignment_yn: "Y" }))}
                        className="mr-2"
                      />
                      위탁 상품
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="consignment_yn"
                        value="N"
                        checked={formData.consignment_yn === "N"}
                        onChange={(e) => setFormData(prev => ({ ...prev, consignment_yn: "N" }))}
                        className="mr-2"
                      />
                      자사 상품
                    </label>
                  </div>
                </td>
              </tr>

              {/* 배송비 & 무료 배송 조건 */}
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold">
                  배송비 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    name="delivery_fee"
                    value={formData.delivery_fee}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="배송비를 입력하세요 (원)"
                  />
                </td>
                <td className="bg-gray-100 px-4 py-3 font-semibold">
                  무료 배송 조건 금액
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    name="free_shipping_amount"
                    value={formData.free_shipping_amount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="무료 배송 최소 주문금액 (원)"
                  />
                </td>
              </tr>

              {/* 도서 산간 지역 배송비 & 고객문의 전화번호 */}
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold">
                  도서 산간 지역 배송비
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    name="remote_delivery_fee"
                    value={formData.remote_delivery_fee}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="도서 산간 지역 추가 배송비 (원)"
                    min="0"
                  />
                </td>
                <td className="bg-gray-100 px-4 py-3 font-semibold">
                  고객문의 전화번호 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="tel"
                    name="inquiry_phone_number"
                    value={formData.inquiry_phone_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="고객문의 전화번호 (예: 010-1234-5678)"
                  />
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold">
                  반품 배송비
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    name="return_delivery_fee"
                    value={formData.return_delivery_fee}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="반품 배송비 (원)"
                    min="0"
                  />
                </td>
                <td className="bg-gray-100 px-4 py-3 font-semibold"></td>
                <td className="px-4 py-3"></td>
              </tr>

              {/* 오늘 발송 여부 & 주문 마감 시간 / 발송 일수 */}
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold">
                  오늘 발송 여부
                </td>
                <td className="px-4 py-3">
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="today_send_yn"
                        value="Y"
                        checked={formData.today_send_yn === "Y"}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      네
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="today_send_yn"
                        value="N"
                        checked={formData.today_send_yn === "N"}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      아니오
                    </label>
                  </div>
                </td>
                <td className="bg-gray-100 px-4 py-3 font-semibold">
                  {formData.today_send_yn === "Y" ? "주문 마감 시간" : "발송 일수"} <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3">
                  {formData.today_send_yn === "Y" ? (
                    <input
                      type="time"
                      name="today_send_time"
                      value={formData.today_send_time}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <input
                      type="number"
                      name="not_today_send_day"
                      value={formData.not_today_send_day}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="발송 일수를 입력하세요 (예: 3일)"
                      min="1"
                    />
                  )}
                </td>
              </tr>

              {/* 대표 이미지 */}
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold">
                  대표 이미지 <span className="text-red-500">*</span>
                  <br />
                  <p className="text-sm text-gray-500">노출 순서 1번 이미지가 썸네일 이미지로 등록됩니다.</p>
                </td>
                <td className="px-4 py-3" colSpan={3}>
                  <ProductImageUploader
                    label=""
                    multiple={true}
                    accept=".png,.jpg,.jpeg"
                    maxFiles={3}
                    maxSizeMB={1}
                    files={representImages}
                    previews={representImagePreviews}
                    orders={representImageOrders}
                    setFiles={setRepresentImages}
                    setPreviews={setRepresentImagePreviews}
                    setOrders={setRepresentImageOrders}
                    disabledAdd={representImagePreviews.length >= 3}
                    orderBadgePrefix="대표"
                  />
                  <div className="text-sm text-gray-500 mt-1">PNG, JPG만 가능, 최대 1MB, 최소 1장 ~ 최대 3장</div>
                </td>
              </tr>

              {/* 상세 이미지 */}
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold">
                  상세 이미지 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3" colSpan={3}>
                  <ProductImageUploader
                    label=""
                    multiple={false}
                    accept=".png,.jpg,.jpeg"
                    maxFiles={1}
                    maxSizeMB={5}
                    files={detailImages}
                    previews={detailImagePreviews}
                    orders={detailImageOrders.length ? detailImageOrders : [1]}
                    setFiles={setDetailImages}
                    setPreviews={setDetailImagePreviews}
                    setOrders={setDetailImageOrders}
                    disabledAdd={detailImagePreviews.length >= 1}
                    orderBadgePrefix="상세"
                  />
                  <div className="text-sm text-gray-500 mt-1">PNG, JPG만 가능, 최대 5MB, 정확히 1장 필요</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 상품 상세 정보 등록 */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold">2. 상품 상세 정보 등록<span className="text-red-500"> *</span></h3>
              <button
                type="button"
                onClick={addProductDetail}
                className="px-4 py-2 ml-4 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                추가
              </button>
            </div>
            <button
              type="button"
              onClick={() => window.open(productGuideImg2, '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes')}
              className="px-4 py-2 ml-4 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              가이드 보기
            </button>
          </div>
          
          {productDetails.map((detail, index) => (
            <div key={detail.product_detail_app_id} className="mb-6">
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <tbody>
                    {/* 상품 속성 & 상품 성별 */}
                    <tr className="border-b border-gray-200">
                      <td className="bg-gray-100 px-4 py-3 w-1/6 font-semibold">
                        상품 속성 <span className="text-red-500">*</span>
                      </td>
                      <td className="px-4 py-3 w-1/3">
                        <select
                          value={detail.option_type || ""}
                          onChange={(e) => handleProductDetailChange(detail.id, 'option_type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">선택</option>
                          {productOptionList.map((code) => (
                            <option key={code.common_code} value={code.common_code}>
                              {code.common_code_name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="bg-gray-100 px-4 py-3 w-1/6 font-semibold">
                        상품 성별 <span className="text-red-500">*</span>
                      </td>
                      <td className="px-4 py-3 w-1/3">
                        <select
                          value={detail.option_gender || ""}
                          onChange={(e) => handleProductDetailChange(detail.id, 'option_gender', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">선택</option>
                          <option value="W">여자</option>
                          <option value="M">남자</option>
                          <option value="A">전체</option>
                        </select>
                      </td>
                    </tr>

                    {/* 상품 단위 & 용량 */}
                    <tr className="border-b border-gray-200">
                      <td className="bg-gray-100 px-4 py-3 w-1/6 font-semibold">
                        상품 단위 <span className="text-red-500">*</span>
                      </td>
                      <td className="px-4 py-3 w-1/3">
                        <select
                          value={detail.option_unit || ""}
                          onChange={(e) => handleProductDetailChange(detail.id, 'option_unit', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={!detail.option_type}
                        >
                          <option value="">선택</option>
                          {(productUnitLists[detail.id] || []).map((unit) => (
                            <option key={unit.common_code} value={unit.common_code}>
                              {unit.common_code_name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="bg-gray-100 px-4 py-3 w-1/6 font-semibold">
                        용량 <span className="text-red-500">*</span>
                      </td>
                      <td className="px-4 py-3 w-1/3">
                        <input
                          type="number"
                          value={detail.option_amount}
                          onChange={(e) => handleProductDetailChange(detail.id, 'option_amount', e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${detail.option_unit === 'NONE' ? 'bg-gray-100' : ''}`}
                          placeholder={detail.option_unit === 'NONE' ? "상품 단위가 없음일 때는 0으로 고정됩니다" : "상품 단위에 대한 용량을 입력하세요 (예: 5KG)"}
                          min={detail.option_unit === 'NONE' ? "0" : "1"}
                          disabled={detail.option_unit === 'NONE'}
                        />
                      </td>
                    </tr>

                    {/* 수량 & 사용여부 */}
                    <tr className="border-b border-gray-200">
                      <td className="bg-gray-100 px-4 py-3 w-1/6 font-semibold">
                        수량 <span className="text-red-500">*</span>
                      </td>
                      <td className="px-4 py-3 w-1/3">
                        <input
                          type="number"
                          value={detail.quantity}
                          onChange={(e) => handleProductDetailChange(detail.id, 'quantity', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="수량을 입력하세요"
                          min="1"
                        />
                      </td>
                      {/* <td className="bg-gray-100 px-4 py-3 w-1/6 font-semibold">
                        사용여부 <span className="text-red-500">*</span>
                      </td>
                      <td className="px-4 py-3 w-1/3">
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`use_yn_${detail.id}`}
                              value="Y"
                              checked={detail.use_yn === "Y"}
                              onChange={(e) => handleProductDetailChange(detail.id, 'use_yn', e.target.value)}
                              className="mr-2"
                            />
                            사용
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`use_yn_${detail.id}`}
                              value="N"
                              checked={detail.use_yn === "N"}
                              onChange={(e) => handleProductDetailChange(detail.id, 'use_yn', e.target.value)}
                              className="mr-2"
                            />
                            사용안함
                          </label>
                        </div>
                      </td> */}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  onClick={() => setProductDetails(prev => prev.filter(item => item.id !== detail.id))}
                  className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 상품 반품/교환 정책 등록 */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold">3. 상품 반품/교환 정책 등록<span className="text-red-500"> *</span></h3>
              <button
                type="button"
                onClick={addPolicyDetail}
                className="px-4 py-2 ml-4 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                추가
              </button>
            </div>
            <button
              type="button"
              onClick={() => window.open(productGuideImg3, '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes')}
              className="px-4 py-2 ml-4 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              가이드 보기
            </button>
          </div>
           
          {policyDetails.map((policy, index) => (
            <div key={policy.product_app_id} className="mb-6">
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <tbody>
                    {/* 제목 & 방향향 */}
                    <tr className="border-b border-gray-200">
                      <td className="bg-gray-100 px-4 py-3 w-1/6 font-semibold">
                        제목 <span className="text-red-500">*</span>
                      </td>
                      <td className="px-4 py-3 w-1/3">
                        <input
                          type="text"
                          value={policy.title}
                          onChange={(e) => setPolicyDetails(prev => prev.map(item => item.product_app_id === policy.product_app_id ? { ...item, title: e.target.value } : item))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="제목을 입력하세요"
                        />
                      </td>
                      <td className="bg-gray-100 px-4 py-3 w-1/6 font-semibold">
                        방향 <span className="text-red-500">*</span>
                      </td>
                      <td className="px-4 py-3 w-1/3">
                        <select
                          value={policy.direction || ""}
                          onChange={(e) => setPolicyDetails(prev => prev.map(item => item.product_app_id === policy.product_app_id ? { ...item, direction: e.target.value } : item))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">선택</option>
                          <option value="ROW">가로</option>
                          <option value="COLUMN">세로</option>
                        </select>
                      </td>
                    </tr>

                                         {/* 내용 & 순서 */}
                     <tr className="border-b border-gray-200">
                       <td className="bg-gray-100 px-4 py-3 w-1/6 font-semibold">
                         내용 <span className="text-red-500">*</span>
                       </td>
                       <td className="px-4 py-3 w-1/2">
                        <textarea
                          value={policy.content}
                          onChange={(e) => setPolicyDetails(prev => prev.map(item => item.product_app_id === policy.product_app_id ? { ...item, content: e.target.value } : item))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="내용을 입력하세요"
                          rows={4}
                        />
                       </td>
                       <td className="bg-gray-100 px-4 py-3 w-1/6 font-semibold">
                         순서 <span className="text-red-500">*</span>
                       </td>
                       <td className="px-4 py-3 w-1/6">
                        <select
                          value={policy.order_seq || ""}
                          onChange={(e) => setPolicyDetails(prev => prev.map(item => item.product_app_id === policy.product_app_id ? { ...item, order_seq: e.target.value } : item))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                           <option value="">선택</option>
                           {Array.from({ length: policyDetails.length }, (_, i) => {
                             const orderNum = i + 1;
                             const isUsed = policyDetails.some(p => p.product_app_id !== policy.product_app_id && p.order_seq === orderNum.toString());
                             return (
                               <option 
                                 key={orderNum} 
                                 value={orderNum}
                                 disabled={isUsed}
                                 style={{ color: isUsed ? '#ccc' : 'inherit' }}
                               >
                                 {orderNum}{isUsed ? ' (사용중)' : ''}
                               </option>
                             );
                           })}
                         </select>
                       </td>
                     </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  onClick={() => setPolicyDetails(prev => prev.filter(item => item.product_app_id !== policy.product_app_id))}
                  className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 버튼 */}
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={() => navigate("/app/productApp")}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            등록
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductAppRegister;