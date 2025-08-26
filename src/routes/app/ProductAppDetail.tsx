import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../store/store";
import productGuideImg1 from "../../images/product_guide_001.png";
import productGuideImg2 from "../../images/product_guide_002.png";
import productGuideImg3 from "../../images/product_guide_003.png";



interface CommonCode {
  common_code: string;
  group_code: string;
  common_code_name: string;
  common_code_memo: string;
}

const ProductAppDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useUserStore((state) => state.user);
  const [commonCodeCache, setCommonCodeCache] = useState<Record<string, CommonCode[]>>({});
  const [commonCodeList, setCommonCodeList] = useState<CommonCode[]>([]);
  const [smallCategoryList, setSmallCategoryList] = useState<CommonCode[]>([]);
  const [deliveryCompanyList, setDeliveryCompanyList] = useState<CommonCode[]>([]);
  const [productOptionList, setProductOptionList] = useState<CommonCode[]>([]);
  const [productUnitLists, setProductUnitLists] = useState<Record<number, CommonCode[]>>({});
  const [productAppImgList, setProductAppImgList] = useState<any[]>([]);
  const searchParams = new URLSearchParams(location.search);
  const productAppId = searchParams.get('product_app_id');
  const isEditMode = !!productAppId;

  // location.state에서 전달받은 상품 데이터 확인
  const productDataFromList = location.state?.productData;

  // 날짜 형식 변환 함수 (YYYYMMDDHHMMSS -> YYYY-MM-DDTHH:MM)
  const formatDateTimeForInput = (dateTimeStr: string): string => {
    if (!dateTimeStr || dateTimeStr.length !== 14) return "";
    
    const year = dateTimeStr.substring(0, 4);
    const month = dateTimeStr.substring(4, 6);
    const day = dateTimeStr.substring(6, 8);
    const hour = dateTimeStr.substring(8, 10);
    const minute = dateTimeStr.substring(10, 12);
    
    return `${year}-${month}-${day}T${hour}:${minute}`;
  };

  // 시간 형식 변환 함수 (HHMM -> HH:MM)
  const formatTimeForInput = (timeStr: string): string => {
    if (!timeStr || timeStr.length !== 4) return "";
    
    const hour = timeStr.substring(0, 2);
    const minute = timeStr.substring(2, 4);
    
    return `${hour}:${minute}`;
  };

  const [formData, setFormData] = useState({
    brand_name: productDataFromList?.brand_name || "",
    product_name: productDataFromList?.product_name || "",
    big_category: productDataFromList?.big_category || "",
    small_category: productDataFromList?.small_category || "",
    title: productDataFromList?.title || "",
    price: productDataFromList?.price?.toString() || "",
    original_price: productDataFromList?.original_price?.toString() || "",
    discount: productDataFromList?.discount?.toString() || "0",
    give_point: productDataFromList?.give_point?.toString() || "",
    sell_start_dt: formatDateTimeForInput(productDataFromList?.sell_start_dt || ""),
    sell_end_dt: formatDateTimeForInput(productDataFromList?.sell_end_dt || ""),
    view_yn: productDataFromList?.view_yn || "Y",
    courier_code: productDataFromList?.courier_code || "",
    delivery_fee: productDataFromList?.delivery_fee?.toString() || "",
    free_shipping_amount: productDataFromList?.free_shipping_amount?.toString() || "",
    remote_delivery_fee: productDataFromList?.remote_delivery_fee?.toString() || "",
    inquiry_phone_number: productDataFromList?.inquiry_phone_number || "",
    today_send_yn: productDataFromList?.today_send_yn || "Y",
    today_send_time: formatTimeForInput(productDataFromList?.today_send_time || ""),
    not_today_send_day: productDataFromList?.not_today_send_day?.toString() || "",
  });

  // 이미지 관련 상태
  const [representImages, setRepresentImages] = useState<File[]>([]);
  const [representImagePreviews, setRepresentImagePreviews] = useState<string[]>([]);
  const [representImageOrders, setRepresentImageOrders] = useState<number[]>([]);
  const [representImageIds, setRepresentImageIds] = useState<(number | null)[]>([]); // 기존 이미지 ID
  const [detailImages, setDetailImages] = useState<File[]>([]);
  const [detailImagePreviews, setDetailImagePreviews] = useState<string[]>([]);
  const [detailImageOrders, setDetailImageOrders] = useState<number[]>([]);
  const [detailImageIds, setDetailImageIds] = useState<(number | null)[]>([]); // 기존 이미지 ID

  // 상품 상세 정보 상태
  const [productDetails, setProductDetails] = useState<Array<{
    id: number;
    option_type: string;
    option_unit: string;
    option_amount: string;
    quantity: string;
    option_gender: string;
    use_yn: string;
    product_detail_app_id?: number; // 수정 시 기존 ID
  }>>([]);

  // 상품 반품/교환 정책 상태
  const [policyDetails, setPolicyDetails] = useState<Array<{
    product_app_id: number;
    title: string;
    content: string;
    direction: string;
    order_seq: string;
    return_exchange_id?: number; // 수정 시 기존 ID
  }>>([]);

  // 공통 코드 조회 (캐싱 적용)
  const fetchCommonCode = async (groupCode: string): Promise<CommonCode[]> => {
    // 캐시에서 먼저 확인
    if (commonCodeCache[groupCode]) {
      return commonCodeCache[groupCode];
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/common/selectCommonCodeList`,
        {
          group_code: groupCode
        }
      );

      const result = response.data.result;
      
      // 캐시에 저장
      setCommonCodeCache(prev => ({
        ...prev,
        [groupCode]: result
      }));

      return result;
    } catch (err) {
      console.error(`공통 코드 목록 로딩 오류:`, err);
      return [];
    }
  };

  // 대분류 목록 조회
  const loadProductCategories = async () => {
    const result = await fetchCommonCode("PRODUCT_CATEGORY");
    setCommonCodeList(result);
  };

  // 소분류 목록 조회
  const loadSmallCategories = async (bigCategory: string) => {
    if (!bigCategory) {
      setSmallCategoryList([]);
      return;
    }

    const groupCode = `${bigCategory}_CATEGORY`;
    const result = await fetchCommonCode(groupCode);
    setSmallCategoryList(result);
  };

  // 택배사 목록 조회
  const loadDeliveryCompanies = async () => {
    const result = await fetchCommonCode("DELIVERY_COMPANY");
    setDeliveryCompanyList(result);
  };

  // 상품 옵션 목록 조회
  const loadProductOptions = async () => {
    const result = await fetchCommonCode("PRODUCT_OPTION_TYPE");
    setProductOptionList(result);
  };

  // 상품 단위 목록 조회 (상품 속성에 따라)
  const loadProductUnits = async (optionType: string, detailId: number) => {
    if (!optionType) {
      setProductUnitLists(prev => ({ ...prev, [detailId]: [] }));
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/common/selectCommonCodeList`,
        {
          group_code: "PRODUCT_OPTION_UNIT",
          common_code_memo: optionType
        }
      );

      const result = response.data.result || [];
      setProductUnitLists(prev => ({ ...prev, [detailId]: result }));
    } catch (err) {
      console.error("상품 단위 목록 로딩 오류:", err);
      setProductUnitLists(prev => ({ ...prev, [detailId]: [] }));
    }
  };

  // 수정 모드일 때 기존 데이터 불러오기
  useEffect(() => {
    loadProductCategories();
    loadDeliveryCompanies();
    loadProductOptions();
    if (isEditMode && productAppId) {
      fetchProductDetail();
      fetchReturnExchangePolicy();
      fetchProductAppImgList();
    }
  }, [productAppId, isEditMode]);

  const fetchProductDetail = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/productApp/selectProductAppDetail`,
        {
          product_app_id: productAppId
        }
      );

      setProductDetails(response.data.result);  
      
    } catch (err) {
      console.error("상품 상세 정보 로딩 오류:", err);
    }
  };

  const fetchReturnExchangePolicy = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/productApp/returnExchangePolicy`,
        {
          product_app_id: productAppId
        }
      );

      setPolicyDetails(response.data.result);
    } catch (err) {
      console.error("상품 반품/교환 정책 로딩 오류:", err);
    }
  };

  const fetchProductAppImgList = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/productApp/selectProductAppImgList`,
        {
          product_app_id: productAppId
        }
      );

      setProductAppImgList(response.data);
    } catch (err) {
      console.error("상품 이미지 목록 로딩 오류:", err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 오늘 발송 여부가 변경되면 관련 필드 초기화
    if (name === "today_send_yn") {
      setFormData(prev => ({
        ...prev,
        today_send_time: "",
        not_today_send_day: ""
      }));
    }

    // 대분류가 변경되면 소분류 목록을 새로 가져오고 소분류 선택을 초기화
    if (name === "big_category") {
      loadSmallCategories(value);
      setFormData(prev => ({
        ...prev,
        small_category: ""
      }));
    }

    // 원가와 할인율이 변경되면 가격 자동 계산
    if (name === "original_price" || name === "discount") {
      const originalPrice = name === "original_price" ? parseFloat(value) : parseFloat(formData.original_price);
      const discount = name === "discount" ? parseFloat(value) : parseFloat(formData.discount);
      
      if (!isNaN(originalPrice) && !isNaN(discount)) {
        const calculatedPrice = originalPrice * (1 - discount / 100);
        setFormData(prev => ({
          ...prev,
          price: calculatedPrice.toFixed(0)
        }));
      }
    }
  };

  // 대표 이미지 처리 함수
  const handleRepresentImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);

      // 이미지 추가 개수 제한 (최대 3개)
      if (representImagePreviews.length + files.length > 3) {
        alert("대표 이미지는 최대 3개까지 업로드 가능합니다.");
        return;
      }

      // 파일 타입과 크기 검증
      const invalidFiles = files.filter((file) => {
        const fileType = file.type;
        if (fileType !== "image/png" && fileType !== "image/jpeg") {
          return true;
        }
        if (file.size > 1 * 1024 * 1024) {
          return true;
        }
        return false;
      });

      if (invalidFiles.length > 0) {
        alert("PNG 또는 JPG 파일만 업로드 가능하며, 각 파일은 1MB 이하여야 합니다.");
        return;
      }

      // 유효한 파일 저장
      const newImages = [...representImages, ...files];
      setRepresentImages(newImages);

      // 이미지 미리보기 URL 생성
      const newPreviews = [...representImagePreviews];
      const newOrders = [...representImageOrders];
      files.forEach((file) => {
        const imageUrl = URL.createObjectURL(file);
        newPreviews.push(imageUrl);
        newOrders.push(newOrders.length + 1);
      });
      setRepresentImagePreviews(newPreviews);
      setRepresentImageOrders(newOrders);
    }
  };

  const removeRepresentImage = (index: number) => {
    const newImages = [...representImages];
    const newPreviews = [...representImagePreviews];
    const newOrders = [...representImageOrders];

    newImages.splice(index, 1);
    const removedPreview = newPreviews.splice(index, 1)[0];
    newOrders.splice(index, 1);

    URL.revokeObjectURL(removedPreview);

    setRepresentImages(newImages);
    setRepresentImagePreviews(newPreviews);
    setRepresentImageOrders(newOrders);
  };

  const handleRepresentImageOrderChange = (index: number, newOrder: number) => {
    if (newOrder < 1 || newOrder > representImagePreviews.length) {
      return;
    }

    const newOrders = [...representImageOrders];
    const oldOrder = newOrders[index];

    newOrders[index] = newOrder;

    newOrders.forEach((order, i) => {
      if (i !== index) {
        if (oldOrder < newOrder && order > oldOrder && order <= newOrder) {
          newOrders[i] = order - 1;
        } else if (oldOrder > newOrder && order < oldOrder && order >= newOrder) {
          newOrders[i] = order + 1;
        }
      }
    });

    setRepresentImageOrders(newOrders);
  };

  // 상세 이미지 처리 함수
  const handleDetailImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);

      // 상세 이미지는 정확히 1개 필요
      if (detailImages.length + files.length !== 1 && detailImages.length + files.length > 1) {
        alert("상세 이미지는 반드시 1개가 필요합니다.");
        return;
      }

      // 파일 타입과 크기 검증
      const invalidFiles = files.filter((file) => {
        const fileType = file.type;
        if (fileType !== "image/png" && fileType !== "image/jpeg") {
          return true;
        }
        if (file.size > 5 * 1024 * 1024) {
          return true;
        }
        return false;
      });

      if (invalidFiles.length > 0) {
        alert("PNG 또는 JPG 파일만 업로드 가능하며, 각 파일은 5MB 이하여야 합니다.");
        return;
      }

      // 유효한 파일 저장
      const newImages = [...detailImages, ...files];
      setDetailImages(newImages);

      // 이미지 미리보기 URL 생성
      const newPreviews = [...detailImagePreviews];
      const newOrders = [...detailImageOrders];
      files.forEach((file) => {
        const imageUrl = URL.createObjectURL(file);
        newPreviews.push(imageUrl);
        newOrders.push(newOrders.length + 1);
      });
      setDetailImagePreviews(newPreviews);
      setDetailImageOrders(newOrders);
    }
  };

  const removeDetailImage = (index: number) => {
    const newImages = [...detailImages];
    const newPreviews = [...detailImagePreviews];
    const newOrders = [...detailImageOrders];

    newImages.splice(index, 1);
    const removedPreview = newPreviews.splice(index, 1)[0];
    newOrders.splice(index, 1);

    URL.revokeObjectURL(removedPreview);

    setDetailImages(newImages);
    setDetailImagePreviews(newPreviews);
    setDetailImageOrders(newOrders);
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

  // 상품 상세 정보 삭제
  const removeProductDetail = (id: number) => {
    setProductDetails(prev => prev.filter(item => item.id !== id));
  };

  // 상품 상세 정보 입력 핸들러
  const handleProductDetailChange = (id: number, field: string, value: string) => {
    setProductDetails(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));

    // 상품 속성이 변경되면 해당 상품 단위 목록 로드
    if (field === 'option_type') {
      loadProductUnits(value, id);
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

  // 상품 반품/교환 정책 삭제
  const removePolicyDetail = (id: number) => {
    setPolicyDetails(prev => prev.filter(item => item.product_app_id !== id));
  };

  // 상품 반품/교환 정책 입력 핸들러
  const handlePolicyDetailChange = (id: number, field: string, value: string) => {
    setPolicyDetails(prev => prev.map(item => 
      item.product_app_id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    if (!formData.title.trim()) {
      alert("제목을 입력해주세요.");
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
        product_name: formData.product_name || formData.title,
        big_category: formData.big_category,
        small_category: formData.small_category,
        title: formData.title,
        price: parseInt(formData.price),
        original_price: parseInt(formData.original_price),
        discount: parseInt(formData.discount),
        give_point: parseInt(formData.give_point),
        sell_start_dt: formData.sell_start_dt,
        sell_end_dt: formData.sell_end_dt === "unlimited" ? "29991230235959" : formData.sell_end_dt,
        courier_code: formData.courier_code,
        delivery_fee: parseInt(formData.delivery_fee) || 0,
        remote_delivery_fee: parseInt(formData.remote_delivery_fee) || 0,
        free_shipping_amount: parseInt(formData.free_shipping_amount) || 0,
        inquiry_phone_number: formData.inquiry_phone_number,
        today_send_yn: formData.today_send_yn,
        today_send_time: formData.today_send_time,
        not_today_send_day: parseInt(formData.not_today_send_day) || 0,
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

      // 이미지 데이터
      const representImageData = representImages.map((file, index) => ({
        img_form: "REPRESENTER",
        file_name: file.name,
        order_seq: representImageOrders[index],
        product_app_img_id: representImageIds[index] || null // 기존 이미지면 ID 포함
      }));

      const detailImageData = detailImages.map((file, index) => ({
        img_form: "DETAIL", 
        file_name: file.name,
        order_seq: detailImageOrders[index],
        product_app_img_id: detailImageIds[index] || null // 기존 이미지면 ID 포함
      }));

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

      if (isEditMode) {
        // 수정 - 기존 ID들 포함
        const updateProductDetailAppData = productDetailAppData.map(detail => ({
          ...detail,
          product_app_id: productAppId,
          product_detail_app_id: detail.product_detail_app_id || null // 기존 데이터면 ID 포함, 새 데이터면 null
        }));

        const updateImageData = imageData.map(image => ({
          ...image,
          product_app_id: productAppId,
          product_app_img_id: image.product_app_img_id || null // 기존 이미지면 ID 포함, 새 이미지면 null
        }));

        // await axios.post(
        //   `${process.env.REACT_APP_API_URL}/app/productApp/updateProductApp`,
        //   {
        //     productApp: { ...productAppData, product_app_id: productId },
        //     productDetailApp: updateProductDetailAppData,
        //     imageData: updateImageData,
        //     returnExchangeData: returnExchangeData
        //   }
        // );
        alert("상품이 수정되었습니다.");
      } else {
        // 등록
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
      }

      // 목록 페이지로 이동
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
          {isEditMode ? "상품 수정" : "상품 등록"}
        </h2>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">1. 상품 기본 정보 등록</h3>
        <button
          type="button"
          onClick={() => window.open(productGuideImg1, '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes')}
          className="px-4 py-2 ml-4 bg-orange-500 text-white rounded-md hover:bg-orange-600"
        >
          가이드 보기
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
                  제목 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
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
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="할인율을 입력하세요 (%)"
                    required
                  />
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
                <td className="px-4 py-3">
                  <input
                    type="datetime-local"
                    name="sell_start_dt"
                    value={formData.sell_start_dt}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </td>
                <td className="bg-gray-100 px-4 py-3 font-semibold">
                  판매 종료일 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3">
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
                      onChange={(e) => setFormData(prev => ({ ...prev, sell_end_dt: e.target.value }))}
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
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    multiple
                    onChange={handleRepresentImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={representImagePreviews.length >= 3}
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    PNG, JPG만 가능, 최대 1MB, 최소 1장 ~ 최대 3장
                  </div>

                  {productAppImgList.map((img) => {
                    if (img.imgForm === "REPRESENTER") {
                      return (
                        <div key={img.fileId} className="mt-4 inline-block mr-4 mb-4">
                          <div className="relative border border-gray-300 rounded-lg p-3 bg-gray-50">
                            <img 
                              src={img.imageUrl} 
                              alt={img.fileName} 
                              className="w-32 h-32 object-cover rounded-md"
                            />
                            <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 text-xs rounded">
                              기존 대표
                            </div>
                            <div className="mt-2 text-xs text-gray-600 text-center">
                              {img.fileName}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}

                  {representImagePreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {representImagePreviews.map((preview, index) => (
                        <div key={index} className="relative border p-2 rounded">
                          <img
                            src={preview}
                            alt={`대표 이미지 ${index + 1}`}
                            className="max-w-full h-40 object-contain rounded"
                          />
                          <button
                            type="button"
                            onClick={() => removeRepresentImage(index)}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                          <div className="flex items-center mt-2">
                            <span className="mr-2 text-sm">노출 순서:</span>
                            <select
                              value={representImageOrders[index] || ""}
                              onChange={(e) => handleRepresentImageOrderChange(index, parseInt(e.target.value))}
                              className="p-1 border border-gray-300 rounded text-sm"
                            >
                              {Array.from({ length: representImagePreviews.length }, (_, i) => (
                                <option key={i} value={i + 1}>{i + 1}</option>
                              ))}
                            </select>
                          </div>
                          <div className="absolute top-0 left-0 bg-green-500 text-white px-2 py-1 text-xs rounded-br">
                            대표 {representImageOrders[index]}번
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
              </tr>

              {/* 상세 이미지 */}
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold">
                  상세 이미지 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3" colSpan={3}>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={handleDetailImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={detailImagePreviews.length >= 1}
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    PNG, JPG만 가능, 최대 5MB, 정확히 1장 필요
                  </div>

                  {productAppImgList.map((img) => {
                    if (img.imgForm === "DETAIL") {
                      return (
                        <div key={img.fileId} className="mt-4 inline-block mr-4 mb-4">
                          <div className="relative border border-gray-300 rounded-lg p-3 bg-gray-50">
                            <img 
                              src={img.imageUrl} 
                              alt={img.fileName} 
                              className="w-32 h-32 object-cover rounded-md"
                            />
                            <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 text-xs rounded">
                              기존 상세
                            </div>
                            <div className="mt-2 text-xs text-gray-600 text-center">
                              {img.fileName}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}

                  {detailImagePreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {detailImagePreviews.map((preview, index) => (
                        <div key={index} className="relative border p-2 rounded">
                          <img
                            src={preview}
                            alt={`상세 이미지 ${index + 1}`}
                            className="max-w-full h-40 object-contain rounded"
                          />
                          <button
                            type="button"
                            onClick={() => removeDetailImage(index)}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                          <div className="absolute top-0 left-0 bg-blue-500 text-white px-2 py-1 text-xs rounded-br">
                            상세 {detailImageOrders[index]}번
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 상품 상세 정보 등록 */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold">2. 상품 상세 정보 등록</h3>
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
                  onClick={() => removeProductDetail(detail.id)}
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
              <h3 className="text-lg font-semibold">3. 상품 반품/교환 정책 등록</h3>
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
                          onChange={(e) => handlePolicyDetailChange(policy.product_app_id, 'title', e.target.value)}
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
                          onChange={(e) => handlePolicyDetailChange(policy.product_app_id, 'direction', e.target.value)}
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
                           onChange={(e) => handlePolicyDetailChange(policy.product_app_id, 'content', e.target.value)}
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
                           onChange={(e) => handlePolicyDetailChange(policy.product_app_id, 'order_seq', e.target.value)}
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
                  onClick={() => removePolicyDetail(policy.product_app_id)}
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
            {(isEditMode ? "수정" : "등록")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductAppDetail; 