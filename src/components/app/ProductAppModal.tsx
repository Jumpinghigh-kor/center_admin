import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUserStore } from "../../store/store";

interface ProductApp {
  product_app_id: number;
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
  mod_dt: string;
  mod_id: number;
  imageUrls?: string[];
  representImageUrl?: string;
}

interface ProductAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedProduct: ProductApp | null;
}

const ProductAppModal: React.FC<ProductAppModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedProduct,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const user = useUserStore((state) => state.user);

  // Modal functionality
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

      // 선택된 상품이 있을 경우 이미지 정보 가져오기
      if (selectedProduct?.product_app_id) {
        fetchProductImages(selectedProduct.product_app_id);
      }
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
  }, [isOpen, onClose, selectedProduct]);

  // 상품 이미지 데이터 가져오기
  const fetchProductImages = async (productAppId: number) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/productApp/selectProductAppImgList/${productAppId}`,
        { withCredentials: true }
      );

      console.log(response.data);

      if (response.data && Array.isArray(response.data)) {
        // 이미지 데이터 처리
        const representImgs = response.data
          .filter((img) => img.imgForm === "REPRESENTER")
          .sort((a, b) => a.orderSeq - b.orderSeq)
          .map((img) => ({
            ...img,
            imageUrl: `https://rkpeiqnrtbpwuaxymwkr.supabase.co/storage/v1/object/public/product/product/${img.fileName}`,
          }));

        const detailImgs = response.data
          .filter((img) => img.imgForm === "DETAIL")
          .sort((a, b) => a.orderSeq - b.orderSeq)
          .map((img) => ({
            ...img,
            imageUrl: `https://rkpeiqnrtbpwuaxymwkr.supabase.co/storage/v1/object/public/product/product/${img.fileName}`,
          }));

        // 대표 이미지 URL 배열
        const representImageUrls = representImgs.map((img) => img.imageUrl);
        // 대표 이미지 순서 배열
        const representImageOrderSeqs = representImgs.map(
          (img) => img.orderSeq
        );
        console.log(representImageUrls);

        // 상세 이미지 URL 배열
        const detailImageUrls = detailImgs.map((img) => img.imageUrl);
        // 상세 이미지 순서 배열
        const detailImageOrderSeqs = detailImgs.map((img) => img.orderSeq);

        // ProductAppForm에서 미리보기 이미지로 사용할 수 있도록 상태 업데이트
        setProductImages(detailImgs);
        setDetailImages(representImgs);

        // 이미지 미리보기 상태도 업데이트 (ProductAppForm에 prop으로 전달될 예정)
        setRepresentImagePreviews(representImageUrls);
        setDetailImagePreviews(detailImageUrls);

        // 이미지 순서 정보도 저장
        setRepresentImageOrders(representImageOrderSeqs);
        setDetailImageOrders(detailImageOrderSeqs);
      }
    } catch (error) {
      console.error("상품 이미지 조회 오류:", error);
    }
  };

  // 이미지 데이터를 자식 컴포넌트에 전달하기 위한 상태
  const [productImages, setProductImages] = useState<any[]>([]);
  const [detailImages, setDetailImages] = useState<any[]>([]);
  const [representImagePreviews, setRepresentImagePreviews] = useState<
    string[]
  >([]);
  const [detailImagePreviews, setDetailImagePreviews] = useState<string[]>([]);
  const [representImageOrders, setRepresentImageOrders] = useState<number[]>(
    []
  );
  const [detailImageOrders, setDetailImageOrders] = useState<number[]>([]);

  if (!isOpen && !isAnimating) return null;

  // Banner Form Component
  const ProductAppForm = () => {
    const user = useUserStore((state) => state.user);

    // 오늘 날짜 생성 (YYYY-MM-DD 형식)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const todayFormatted = `${year}-${month}-${day}`;

    const [formData, setFormData] = useState({
      big_category: selectedProduct?.big_category || "FOOD",
      small_category: selectedProduct?.small_category || "TOMATO",
      title: selectedProduct ? selectedProduct.title : "",
      price: selectedProduct ? selectedProduct.price : 0,
      original_price: selectedProduct ? selectedProduct.original_price : 0,
      discount: selectedProduct ? selectedProduct.discount : 0,
      give_point: selectedProduct ? selectedProduct.give_point : 0,
      sell_start_dt: selectedProduct
        ? selectedProduct.sell_start_dt.length >= 8
          ? `${selectedProduct.sell_start_dt.substring(
              0,
              4
            )}-${selectedProduct.sell_start_dt.substring(
              4,
              6
            )}-${selectedProduct.sell_start_dt.substring(6, 8)}`
          : selectedProduct.sell_start_dt
        : todayFormatted,
      sell_end_dt: selectedProduct
        ? selectedProduct.sell_end_dt === "29991231" ||
          selectedProduct.sell_end_dt === "29991231235959"
          ? "29991231"
          : selectedProduct.sell_end_dt.length >= 8
          ? `${selectedProduct.sell_end_dt.substring(
              0,
              4
            )}-${selectedProduct.sell_end_dt.substring(
              4,
              6
            )}-${selectedProduct.sell_end_dt.substring(6, 8)}`
          : selectedProduct.sell_end_dt
        : "",
      view_yn: selectedProduct ? selectedProduct.view_yn : "Y",
      del_yn: selectedProduct ? selectedProduct.del_yn : "N",
      reg_dt: selectedProduct ? selectedProduct.reg_dt : "",
      reg_id: user.index.toString(),
      mod_dt: selectedProduct ? selectedProduct.mod_dt : "",
      modId: user.index.toString(),
      isIndefinite:
        selectedProduct?.sell_end_dt === "29991231" ||
        selectedProduct?.sell_end_dt === "29991231235959"
          ? true
          : false,
    });

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [discountedPrice, setDiscountedPrice] = useState<number>(0);
    const [displayPrice, setDisplayPrice] = useState<string>(
      selectedProduct ? selectedProduct.original_price.toLocaleString() : "0"
    );
    const [formProductImages, setFormProductImages] = useState<File[]>([]);

    // 부모 컴포넌트에서 받은 이미지 URL들을 사용하여 초기화
    const [formImagePreviews, setFormImagePreviews] =
      useState<string[]>(detailImagePreviews);

    // 부모 컴포넌트에서 받은 이미지 순서를 사용하여 초기화
    const [formImageOrders, setFormImageOrders] =
      useState<number[]>(detailImageOrders);

    const [formRepresentImages, setFormRepresentImages] = useState<File[]>([]);

    // 부모 컴포넌트에서 받은 대표 이미지 URL들을 사용하여 초기화
    const [formRepresentImagePreviews, setFormRepresentImagePreviews] =
      useState<string[]>(representImagePreviews);

    // 부모 컴포넌트에서 받은 대표 이미지 순서를 사용하여 초기화
    const [formRepresentImageOrders, setFormRepresentImageOrders] =
      useState<number[]>(representImageOrders);

    // 이미지 데이터가 로드될 때 미리보기 업데이트
    useEffect(() => {
      if (detailImagePreviews.length > 0) {
        setFormImagePreviews(detailImagePreviews);
        setFormImageOrders(detailImageOrders);
      }

      if (representImagePreviews.length > 0) {
        setFormRepresentImagePreviews(representImagePreviews);
        setFormRepresentImageOrders(representImageOrders);
      }
    }, [
      detailImagePreviews,
      representImagePreviews,
      detailImageOrders,
      representImageOrders,
    ]);

    // 할인가 계산
    useEffect(() => {
      if (formData.original_price) {
        const calculatedPrice = Math.round(
          formData.original_price * (1 - formData.discount / 100)
        );
        setDiscountedPrice(calculatedPrice);
        setFormData((prev) => ({
          ...prev,
          price: calculatedPrice,
        }));
      } else {
        setDiscountedPrice(0);
        setFormData((prev) => ({
          ...prev,
          price: 0,
        }));
      }
    }, [formData.original_price, formData.discount]);

    // handleRepresentImageChange 함수에서 변수명 변경
    const handleRepresentImageChange = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);

        // 이미지 추가 개수 제한 (최대 3개)
        if (formRepresentImagePreviews.length + files.length > 3) {
          alert("대표 이미지는 최대 3개까지 업로드 가능합니다.");
          return;
        }

        // 파일 타입과 크기 검증
        const invalidFiles = files.filter((file) => {
          const fileType = file.type;
          // PNG, JPG만 허용
          if (fileType !== "image/png" && fileType !== "image/jpeg") {
            return true;
          }
          // 1MB 이하만 허용
          if (file.size > 1 * 1024 * 1024) {
            return true;
          }
          return false;
        });

        if (invalidFiles.length > 0) {
          alert(
            "PNG 또는 JPG 파일만 업로드 가능하며, 각 파일은 1MB 이하여야 합니다."
          );
          return;
        }

        // 유효한 파일 저장
        const newImages = [...formRepresentImages, ...files];
        setFormRepresentImages(newImages);

        // 이미지 미리보기 URL 생성
        const newPreviews = [...formRepresentImagePreviews];
        const newOrders = [...formRepresentImageOrders];
        files.forEach((file) => {
          const imageUrl = URL.createObjectURL(file);
          newPreviews.push(imageUrl);
          newOrders.push(newOrders.length + 1); // 새 이미지의 순서는 기존 이미지 수 + 1부터 시작
        });
        setFormRepresentImagePreviews(newPreviews);
        setFormRepresentImageOrders(newOrders);
      }
    };

    const removeRepresentImage = (index: number) => {
      // 이미지와 미리보기 제거
      const newImages = [...formRepresentImages];
      const newPreviews = [...formRepresentImagePreviews];
      const newOrders = [...formRepresentImageOrders];

      // 이미지 및 미리보기 URL 제거
      newImages.splice(index, 1);
      const removedPreview = newPreviews.splice(index, 1)[0];
      newOrders.splice(index, 1);

      // 선택된 제품의 이미지가 아닌 경우에만 URL 객체 반환
      if (selectedProduct?.representImageUrl !== removedPreview) {
        URL.revokeObjectURL(removedPreview);
      }

      setFormRepresentImages(newImages);
      setFormRepresentImagePreviews(newPreviews);
      setFormRepresentImageOrders(newOrders);
    };

    const handleRepresentImageOrderChange = (
      index: number,
      newOrder: number
    ) => {
      if (newOrder < 1 || newOrder > formRepresentImagePreviews.length) {
        return; // 유효하지 않은 순서값
      }

      const newOrders = [...formRepresentImageOrders];
      const oldOrder = newOrders[index];

      // 해당 인덱스의 순서 변경
      newOrders[index] = newOrder;

      // 다른 이미지들의 순서 조정
      newOrders.forEach((order, i) => {
        if (i !== index) {
          if (oldOrder < newOrder && order > oldOrder && order <= newOrder) {
            // 순서가 높아진 경우, 사이에 있는 이미지들의 순서를 하나씩 낮춤
            newOrders[i] = order - 1;
          } else if (
            oldOrder > newOrder &&
            order < oldOrder &&
            order >= newOrder
          ) {
            // 순서가 낮아진 경우, 사이에 있는 이미지들의 순서를 하나씩 높임
            newOrders[i] = order + 1;
          }
        }
      });

      setFormRepresentImageOrders(newOrders);
    };

    const handleInputChange = (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const { name, value } = e.target;

      // 제목에 이모지 입력 방지
      if (name === "title") {
        const emojiRegex = /[\u{1F300}-\u{1F9FF}]/u;
        if (emojiRegex.test(value)) {
          return;
        }
      }

      setFormData({
        ...formData,
        [name]: value,
      });
    };

    const handleNumericInputChange = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const { name, value } = e.target;

      // 입력값에서 콤마 제거
      const numericValue = value.replace(/,/g, "");

      if (name === "original_price") {
        // 숫자만 입력 가능하고 최대 8자리까지만 허용
        if (
          numericValue === "" ||
          (/^[0-9]+$/.test(numericValue) && numericValue.length <= 8)
        ) {
          const newValue = numericValue === "" ? 0 : parseInt(numericValue, 10);
          setFormData({
            ...formData,
            [name]: newValue,
          });
          // 천단위 콤마 표시
          setDisplayPrice(newValue.toLocaleString());
        }
      } else if (name === "discount") {
        // 할인율은 숫자만 입력 가능하고 최대 3자리까지만 허용
        if (
          numericValue === "" ||
          (/^[0-9]+$/.test(numericValue) && numericValue.length <= 3)
        ) {
          setFormData({
            ...formData,
            [name]: numericValue === "" ? 0 : parseInt(numericValue, 10),
          });
        }
      } else if (name === "give_point") {
        // 포인트는 숫자만 입력 가능하고 최대 8자리까지만 허용
        if (
          numericValue === "" ||
          (/^[0-9]+$/.test(numericValue) && numericValue.length <= 8)
        ) {
          setFormData({
            ...formData,
            [name]: numericValue === "" ? 0 : parseInt(numericValue, 10),
          });
        }
      } else {
        // 다른 숫자 필드의 처리
        if (numericValue === "" || /^[0-9]+$/.test(numericValue)) {
          setFormData({
            ...formData,
            [name]: numericValue === "" ? 0 : parseInt(numericValue, 10),
          });
        }
      }
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, checked } = e.target;

      if (name === "isIndefinite") {
        // 오늘 날짜 생성 (YYYY-MM-DD 형식)
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        const todayFormatted = `${year}-${month}-${day}`;

        setFormData({
          ...formData,
          isIndefinite: checked,
          sell_end_dt: checked ? "29991231" : "",
          sell_start_dt: checked ? todayFormatted : formData.sell_start_dt,
        });
      }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);

        // 상세 이미지는 정확히 1개 필요
        if (
          formProductImages.length + files.length !== 1 &&
          formProductImages.length + files.length > 1
        ) {
          alert("상세 이미지는 반드시 1개가 필요합니다.");
          return;
        }

        // 파일 타입과 크기 검증
        const invalidFiles = files.filter((file) => {
          const fileType = file.type;
          // PNG, JPG만 허용
          if (fileType !== "image/png" && fileType !== "image/jpeg") {
            return true;
          }
          // 5MB 이하만 허용
          if (file.size > 5 * 1024 * 1024) {
            return true;
          }
          return false;
        });

        if (invalidFiles.length > 0) {
          alert(
            "PNG 또는 JPG 파일만 업로드 가능하며, 각 파일은 5MB 이하여야 합니다."
          );
          return;
        }

        // 유효한 파일 저장
        const newImages = [...formProductImages, ...files];
        setFormProductImages(newImages);

        // 이미지 미리보기 URL 생성
        const newPreviews = [...formImagePreviews];
        const newOrders = [...formImageOrders];
        files.forEach((file) => {
          const imageUrl = URL.createObjectURL(file);
          newPreviews.push(imageUrl);
          newOrders.push(newOrders.length + 1); // 새 이미지의 순서는 기존 이미지 수 + 1부터 시작
        });
        setFormImagePreviews(newPreviews);
        setFormImageOrders(newOrders);
      }
    };

    const removeImage = (index: number) => {
      // 이미지와 미리보기 제거
      const newImages = [...formProductImages];
      const newPreviews = [...formImagePreviews];
      const newOrders = [...formImageOrders];

      // 이미지 및 미리보기 URL 제거
      newImages.splice(index, 1);
      const removedPreview = newPreviews.splice(index, 1)[0];
      newOrders.splice(index, 1);

      // URL 객체 반환
      if (!selectedProduct?.imageUrls?.includes(removedPreview)) {
        URL.revokeObjectURL(removedPreview);
      }

      setFormProductImages(newImages);
      setFormImagePreviews(newPreviews);
      setFormImageOrders(newOrders);
    };

    const handleOrderChange = (index: number, newOrder: number) => {
      if (newOrder < 1 || newOrder > formImagePreviews.length) {
        return; // 유효하지 않은 순서값
      }

      const newOrders = [...formImageOrders];
      const oldOrder = newOrders[index];

      // 해당 인덱스의 순서 변경
      newOrders[index] = newOrder;

      // 다른 이미지들의 순서 조정
      newOrders.forEach((order, i) => {
        if (i !== index) {
          if (oldOrder < newOrder && order > oldOrder && order <= newOrder) {
            // 순서가 높아진 경우, 사이에 있는 이미지들의 순서를 하나씩 낮춤
            newOrders[i] = order - 1;
          } else if (
            oldOrder > newOrder &&
            order < oldOrder &&
            order >= newOrder
          ) {
            // 순서가 낮아진 경우, 사이에 있는 이미지들의 순서를 하나씩 높임
            newOrders[i] = order + 1;
          }
        }
      });

      setFormImageOrders(newOrders);
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      // 필수 필드 확인
      if (
        !formData.big_category ||
        !formData.small_category ||
        !formData.original_price ||
        !formData.discount ||
        !formData.sell_start_dt ||
        !formData.sell_end_dt
      ) {
        alert("모든 필드를 입력해주세요.");
        return;
      }

      // 대표 이미지 최소 1장 확인
      if (formRepresentImagePreviews.length === 0) {
        alert("대표 이미지는 최소 1장 이상 필요합니다.");
        return;
      }

      // 상세 이미지 정확히 1장 확인
      if (formImagePreviews.length !== 1) {
        alert("상세 이미지는 정확히 1장이 필요합니다.");
        return;
      }

      try {
        setIsSubmitting(true);

        // 날짜 형식 변환 (YYYY-MM-DD → YYYYMMDD)
        const formattedStartDt = formData.sell_start_dt.replace(/-/g, "");
        const formattedEndDt = formData.sell_end_dt.replace(/-/g, "");

        if (selectedProduct) {
          // 수정 API 호출
          // 대표 이미지 정보 배열
          const representImgArray = formRepresentImages.map((image, index) => {
            // 파일을 base64로 변환하는 함수
            const getBase64 = (file: File): Promise<string> => {
              return new Promise((resolve, reject) => {
                // 이미지 품질 압축을 위한 캔버스 사용
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (event) => {
                  const img = new Image();
                  img.src = event.target?.result as string;
                  img.onload = () => {
                    // 최대 크기 설정 (가로/세로 중 큰 쪽을 600px로 제한)
                    let width = img.width;
                    let height = img.height;
                    const maxSize = 600; // 더 작은 이미지로 설정

                    if (width > height && width > maxSize) {
                      height = Math.round((height * maxSize) / width);
                      width = maxSize;
                    } else if (height > maxSize) {
                      width = Math.round((width * maxSize) / height);
                      height = maxSize;
                    }

                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext("2d");
                    ctx?.drawImage(img, 0, 0, width, height);

                    // 압축된 이미지 품질 (0.4 = 40% 품질로 더 강한 압축)
                    const quality = 0.4;

                    // 파일 확장자 확인
                    const extension = file.name.split(".").pop()?.toLowerCase();
                    const isJpeg = extension === "jpg" || extension === "jpeg";

                    // JPEG 형식으로 통일하여 저장 (더 작은 파일 크기)
                    const dataURL = canvas.toDataURL(
                      isJpeg ? "image/jpeg" : "image/png",
                      quality
                    );

                    console.log(
                      `원본 이미지: ${
                        file.size
                      } 바이트, 압축 후: 약 ${Math.round(
                        dataURL.length * 0.75
                      )} 바이트`
                    );

                    resolve(dataURL);
                  };
                  img.onerror = (error) => {
                    reject(error);
                  };
                };
                reader.onerror = (error) => reject(error);
              });
            };

            return {
              fileName: image.name,
              orderSeq: formRepresentImageOrders[index],
              regId: user.index.toString(),
              filePromise: getBase64(image), // base64 변환 Promise 저장
            };
          });

          // 상세 이미지 정보 배열
          const detailImgArray = formProductImages.map((image, index) => {
            // 파일을 base64로 변환하는 함수
            const getBase64 = (file: File): Promise<string> => {
              return new Promise((resolve, reject) => {
                // 이미지 품질 압축을 위한 캔버스 사용
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (event) => {
                  const img = new Image();
                  img.src = event.target?.result as string;
                  img.onload = () => {
                    // 최대 크기 설정 (가로/세로 중 큰 쪽을 600px로 제한)
                    let width = img.width;
                    let height = img.height;
                    const maxSize = 600; // 더 작은 이미지로 설정

                    if (width > height && width > maxSize) {
                      height = Math.round((height * maxSize) / width);
                      width = maxSize;
                    } else if (height > maxSize) {
                      width = Math.round((width * maxSize) / height);
                      height = maxSize;
                    }

                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext("2d");
                    ctx?.drawImage(img, 0, 0, width, height);

                    // 압축된 이미지 품질 (0.4 = 40% 품질로 더 강한 압축)
                    const quality = 0.4;

                    // 파일 확장자 확인
                    const extension = file.name.split(".").pop()?.toLowerCase();
                    const isJpeg = extension === "jpg" || extension === "jpeg";

                    // JPEG 형식으로 통일하여 저장 (더 작은 파일 크기)
                    const dataURL = canvas.toDataURL(
                      isJpeg ? "image/jpeg" : "image/png",
                      quality
                    );

                    console.log(
                      `원본 이미지: ${
                        file.size
                      } 바이트, 압축 후: 약 ${Math.round(
                        dataURL.length * 0.75
                      )} 바이트`
                    );

                    resolve(dataURL);
                  };
                  img.onerror = (error) => {
                    reject(error);
                  };
                };
                reader.onerror = (error) => reject(error);
              });
            };

            return {
              fileName: image.name,
              orderSeq: formImageOrders[index],
              regId: user.index.toString(),
              filePromise: getBase64(image), // base64 변환 Promise 저장
            };
          });

          // Promise.all을 사용하여 모든 파일이 base64로 변환될 때까지 기다림
          let representImgWithData: Array<{
            fileName: string;
            orderSeq: number;
            regId: string;
            file: string;
          }> = [];
          let detailImgWithData: Array<{
            fileName: string;
            orderSeq: number;
            regId: string;
            file: string;
          }> = [];

          if (formRepresentImages.length > 0) {
            representImgWithData = await Promise.all(
              representImgArray.map(async (img) => {
                const file = await img.filePromise;
                return {
                  fileName: img.fileName,
                  orderSeq: img.orderSeq,
                  regId: img.regId,
                  file: file, // base64 데이터로 변환된 파일
                };
              })
            );
          }

          if (formProductImages.length > 0) {
            detailImgWithData = await Promise.all(
              detailImgArray.map(async (img) => {
                const file = await img.filePromise;
                return {
                  fileName: img.fileName,
                  orderSeq: img.orderSeq,
                  regId: img.regId,
                  file: file, // base64 데이터로 변환된 파일
                };
              })
            );
          }

          // JSON 데이터 구성
          const jsonData: {
            product_app_id: string;
            title: string;
            big_category: string;
            small_category: string;
            price: string;
            original_price: string;
            discount: string;
            give_point: string;
            sell_start_dt: string;
            sell_end_dt: string;
            view_yn: "Y" | "N";
            del_yn: "Y" | "N";
            reg_id: string;
            mod_id: string;
            representImg?: string;
            detailImg?: string;
          } = {
            product_app_id: selectedProduct.product_app_id.toString(),
            title: formData.title,
            big_category: formData.big_category,
            small_category: formData.small_category,
            price: formData.price.toString(),
            original_price: formData.original_price.toString(),
            discount: formData.discount.toString(),
            give_point: formData.give_point.toString(),
            sell_start_dt: formattedStartDt,
            sell_end_dt: formattedEndDt,
            view_yn: formData.view_yn,
            del_yn: formData.del_yn,
            reg_id: user.index.toString(),
            mod_id: user.index.toString(),
          };

          // FormData 객체 생성
          const formDataWithFiles = new FormData();

          // 새 이미지가 있는 경우에만 representImg와 detailImg 추가
          if (formRepresentImages.length > 0) {
            jsonData.representImg = JSON.stringify(representImgWithData);
          }

          if (formProductImages.length > 0) {
            jsonData.detailImg = JSON.stringify(detailImgWithData);
          }

          // JSON 데이터를 FormData에 추가
          Object.entries(jsonData).forEach(([key, value]) => {
            formDataWithFiles.append(key, value.toString());
          });

          await axios.put(
            `${process.env.REACT_APP_API_URL}/app/productApp/updateProductApp`,
            formDataWithFiles,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
              withCredentials: true,
            }
          );

          alert("상품이 성공적으로 수정되었습니다.");
        } else {
          // 등록 API 호출 (JSON 객체 사용)
          // 대표 이미지 정보 배열
          const representImgArray = formRepresentImages.map((image, index) => {
            // 파일을 base64로 변환하는 함수
            const getBase64 = (file: File): Promise<string> => {
              return new Promise((resolve, reject) => {
                // 이미지 품질 압축을 위한 캔버스 사용
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (event) => {
                  const img = new Image();
                  img.src = event.target?.result as string;
                  img.onload = () => {
                    // 최대 크기 설정 (가로/세로 중 큰 쪽을 600px로 제한)
                    let width = img.width;
                    let height = img.height;
                    const maxSize = 600; // 더 작은 이미지로 설정

                    if (width > height && width > maxSize) {
                      height = Math.round((height * maxSize) / width);
                      width = maxSize;
                    } else if (height > maxSize) {
                      width = Math.round((width * maxSize) / height);
                      height = maxSize;
                    }

                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext("2d");
                    ctx?.drawImage(img, 0, 0, width, height);

                    // 압축된 이미지 품질 (0.4 = 40% 품질로 더 강한 압축)
                    const quality = 0.4;

                    // 파일 확장자 확인
                    const extension = file.name.split(".").pop()?.toLowerCase();
                    const isJpeg = extension === "jpg" || extension === "jpeg";

                    // JPEG 형식으로 통일하여 저장 (더 작은 파일 크기)
                    const dataURL = canvas.toDataURL(
                      isJpeg ? "image/jpeg" : "image/png",
                      quality
                    );

                    console.log(
                      `원본 이미지: ${
                        file.size
                      } 바이트, 압축 후: 약 ${Math.round(
                        dataURL.length * 0.75
                      )} 바이트`
                    );

                    resolve(dataURL);
                  };
                  img.onerror = (error) => {
                    reject(error);
                  };
                };
                reader.onerror = (error) => reject(error);
              });
            };

            // 파일 데이터를 비동기적으로 가져오기 위한 준비
            return {
              fileName: image.name,
              orderSeq: formRepresentImageOrders[index],
              regId: user.index.toString(),
              filePromise: getBase64(image), // base64 변환 Promise 저장
            };
          });

          // 상세 이미지 정보 배열
          const detailImgArray = formProductImages.map((image, index) => {
            // 파일을 base64로 변환하는 함수
            const getBase64 = (file: File): Promise<string> => {
              return new Promise((resolve, reject) => {
                // 이미지 품질 압축을 위한 캔버스 사용
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (event) => {
                  const img = new Image();
                  img.src = event.target?.result as string;
                  img.onload = () => {
                    // 최대 크기 설정 (가로/세로 중 큰 쪽을 600px로 제한)
                    let width = img.width;
                    let height = img.height;
                    const maxSize = 600; // 더 작은 이미지로 설정

                    if (width > height && width > maxSize) {
                      height = Math.round((height * maxSize) / width);
                      width = maxSize;
                    } else if (height > maxSize) {
                      width = Math.round((width * maxSize) / height);
                      height = maxSize;
                    }

                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext("2d");
                    ctx?.drawImage(img, 0, 0, width, height);

                    // 압축된 이미지 품질 (0.4 = 40% 품질로 더 강한 압축)
                    const quality = 0.4;

                    // 파일 확장자 확인
                    const extension = file.name.split(".").pop()?.toLowerCase();
                    const isJpeg = extension === "jpg" || extension === "jpeg";

                    // JPEG 형식으로 통일하여 저장 (더 작은 파일 크기)
                    const dataURL = canvas.toDataURL(
                      isJpeg ? "image/jpeg" : "image/png",
                      quality
                    );

                    console.log(
                      `원본 이미지: ${
                        file.size
                      } 바이트, 압축 후: 약 ${Math.round(
                        dataURL.length * 0.75
                      )} 바이트`
                    );

                    resolve(dataURL);
                  };
                  img.onerror = (error) => {
                    reject(error);
                  };
                };
                reader.onerror = (error) => reject(error);
              });
            };

            return {
              fileName: image.name,
              orderSeq: formImageOrders[index],
              regId: user.index.toString(),
              filePromise: getBase64(image), // base64 변환 Promise 저장
            };
          });

          // Promise.all을 사용하여 모든 파일이 base64로 변환될 때까지 기다림
          const [representImgWithData, detailImgWithData] = await Promise.all([
            Promise.all(
              representImgArray.map(async (img) => {
                const file = await img.filePromise;
                return {
                  fileName: img.fileName,
                  orderSeq: img.orderSeq,
                  regId: img.regId,
                  file: file, // base64 데이터로 변환된 파일
                };
              })
            ),
            Promise.all(
              detailImgArray.map(async (img) => {
                const file = await img.filePromise;
                return {
                  fileName: img.fileName,
                  orderSeq: img.orderSeq,
                  regId: img.regId,
                  file: file, // base64 데이터로 변환된 파일
                };
              })
            ),
          ]);

          // JSON 데이터 구성
          const jsonData: {
            title: string;
            big_category: string;
            small_category: string;
            price: string;
            original_price: string;
            discount: string;
            give_point: string;
            sell_start_dt: string;
            sell_end_dt: string;
            view_yn: "Y" | "N";
            del_yn: "Y" | "N";
            reg_id: string;
            mod_id: string;
            representImg: string;
            detailImg: string;
          } = {
            title: formData.title,
            big_category: formData.big_category,
            small_category: formData.small_category,
            price: formData.price.toString(),
            original_price: formData.original_price.toString(),
            discount: formData.discount.toString(),
            give_point: formData.give_point.toString(),
            sell_start_dt: formattedStartDt,
            sell_end_dt: formattedEndDt,
            view_yn: formData.view_yn,
            del_yn: formData.del_yn,
            reg_id: user.index.toString(),
            mod_id: user.index.toString(),
            representImg: JSON.stringify(representImgWithData),
            detailImg: JSON.stringify(detailImgWithData),
          };

          // FormData 객체 생성 - 파일과 JSON 데이터 모두 포함
          const formDataWithFiles = new FormData();

          // JSON 데이터를 FormData에 추가
          Object.entries(jsonData).forEach(([key, value]) => {
            formDataWithFiles.append(key, value.toString());
          });

          // 대표 이미지 파일 추가
          formRepresentImages.forEach((image, index) => {
            formDataWithFiles.append(`representImage`, image);
          });

          // 상세 이미지 파일 추가
          formProductImages.forEach((image, index) => {
            formDataWithFiles.append(`productImage`, image);
          });

          // API 호출
          await axios.post(
            `${process.env.REACT_APP_API_URL}/app/productApp/insertProductApp`,
            formDataWithFiles,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
              withCredentials: true,
            }
          );

          alert("상품이 성공적으로 등록되었습니다.");
        }

        onSuccess();
      } catch (error) {
        console.error("상품 처리 오류:", error);
        alert("상품 처리 중 오류가 발생했습니다.");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div>
        <form onSubmit={handleSubmit}>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <tbody>
                {/* 모바일 화면에서는 배너 위치와 타입이 각각 별도의 행에 표시됨 */}
                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-4 py-3 w-1/4 font-semibold">
                    대분류 <span className="text-red-500">*</span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      name="bigCategory"
                      value={formData.big_category}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      disabled={isSubmitting}
                    >
                      <option value="FOOD">식품</option>
                      <option value="COSMETIC">화장품</option>
                      <option value="CLOTHING">의류</option>
                    </select>
                  </td>
                </tr>

                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-4 py-3 w-1/4 font-semibold">
                    소분류 <span className="text-red-500">*</span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      name="smallCategory"
                      value={formData.small_category}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      disabled={isSubmitting}
                    >
                      {formData.big_category === "FOOD" && (
                        <option value="TOMATO">토마토</option>
                      )}
                      {formData.big_category === "COSMETIC" && (
                        <>
                          <option value="STRENGTH">STRENGTH</option>
                          <option value="EXTRA_STRENGTH">EXTRA_STRENGTH</option>
                          <option value="SCULPT">SCULPT</option>
                        </>
                      )}
                      {formData.big_category === "CLOTHING" && (
                        <>
                          <option value="SLEEVELESS">민소매</option>
                          <option value="ACCESSORY">악세서리</option>
                        </>
                      )}
                    </select>
                  </td>
                </tr>

                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-4 py-3 font-semibold">
                    상품 제목 <span className="text-red-500">*</span>
                  </td>
                  <td className="px-4 py-3" colSpan={3}>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="상품 제목을 입력하세요"
                      disabled={isSubmitting}
                    />
                  </td>
                </tr>

                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-4 py-3 font-semibold">
                    상품 가격 <span className="text-red-500">*</span>
                  </td>
                  <td className="px-4 py-3" colSpan={3}>
                    <div className="flex items-center">
                      <input
                        type="text"
                        name="original_price"
                        value={displayPrice}
                        onChange={handleNumericInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="상품 가격을 입력하세요"
                        disabled={isSubmitting}
                      />
                      <span className="ml-2">원</span>
                    </div>
                  </td>
                </tr>

                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-4 py-3 font-semibold">
                    할인율
                  </td>
                  <td className="px-4 py-3" colSpan={3}>
                    <div className="flex items-center">
                      <input
                        type="text"
                        name="discount"
                        value={formData.discount}
                        onChange={handleNumericInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="할인율을 입력하세요"
                        disabled={isSubmitting}
                      />
                      <span className="ml-2">%</span>
                    </div>
                  </td>
                </tr>

                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-4 py-3 font-semibold">
                    할인가
                  </td>
                  <td className="px-4 py-3" colSpan={3}>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={discountedPrice.toLocaleString()}
                        className="w-full p-2 border border-gray-300 rounded bg-gray-100"
                        readOnly
                        disabled
                      />
                      <span className="ml-2">원</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      원가와 할인율에 따라 자동 계산됩니다
                    </div>
                  </td>
                </tr>

                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-4 py-3 font-semibold">
                    포인트
                  </td>
                  <td className="px-4 py-3" colSpan={3}>
                    <div className="flex items-center">
                      <input
                        type="text"
                        name="give_point"
                        value={formData.give_point}
                        onChange={handleNumericInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="포인트를 입력하세요"
                        disabled={isSubmitting}
                      />
                      <span className="ml-2">P</span>
                    </div>
                  </td>
                </tr>

                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-4 py-3 font-semibold">
                    대표 이미지 <span className="text-red-500">*</span>
                  </td>
                  <td className="px-4 py-3" colSpan={3}>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={handleRepresentImageChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      disabled={
                        isSubmitting || formRepresentImagePreviews.length >= 3
                      }
                    />
                    <div className="text-sm text-gray-500 mt-1">
                      PNG, JPG만 가능, 최대 1MB, 최소 1장 ~ 최대 3장
                    </div>

                    {formRepresentImagePreviews.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {formRepresentImagePreviews.map((preview, index) => (
                          <div
                            key={index}
                            className="relative border p-2 rounded"
                          >
                            <img
                              src={preview}
                              alt={`대표 이미지 ${index + 1}`}
                              className="max-w-full h-40 object-contain rounded"
                            />
                            <button
                              type="button"
                              onClick={() => removeRepresentImage(index)}
                              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                              disabled={isSubmitting}
                            >
                              <svg
                                className="w-4 h-4"
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
                                ></path>
                              </svg>
                            </button>
                            <div className="flex items-center mt-2">
                              <div className="flex items-center">
                                <span className="mr-2 text-sm">노출 순서:</span>
                                <select
                                  value={formRepresentImageOrders[index]}
                                  onChange={(e) =>
                                    handleRepresentImageOrderChange(
                                      index,
                                      parseInt(e.target.value)
                                    )
                                  }
                                  className="p-1 border border-gray-300 rounded text-sm"
                                  disabled={isSubmitting}
                                >
                                  {Array.from(
                                    {
                                      length: formRepresentImagePreviews.length,
                                    },
                                    (_, i) => (
                                      <option key={i} value={i + 1}>
                                        {i + 1}
                                      </option>
                                    )
                                  )}
                                </select>
                              </div>
                            </div>
                            <div className="absolute top-0 left-0 bg-green-500 text-white px-2 py-1 text-xs rounded-br">
                              대표 {formRepresentImageOrders[index]}번
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>

                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-4 py-3 font-semibold">
                    상세 이미지 <span className="text-red-500">*</span>
                  </td>
                  <td className="px-4 py-3" colSpan={3}>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={handleImageChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      disabled={isSubmitting || formImagePreviews.length >= 1}
                    />
                    <div className="text-sm text-gray-500 mt-1">
                      PNG, JPG만 가능, 최대 5MB, 정확히 1장 필요
                    </div>

                    {formImagePreviews.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {formImagePreviews.map((preview, index) => (
                          <div
                            key={index}
                            className="relative border p-2 rounded"
                          >
                            <img
                              src={preview}
                              alt={`상세 이미지 ${index + 1}`}
                              className="max-w-full h-40 object-contain rounded"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                              disabled={isSubmitting}
                            >
                              <svg
                                className="w-4 h-4"
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
                                ></path>
                              </svg>
                            </button>
                            <div className="flex items-center mt-2">
                              <div className="flex items-center">
                                <span className="mr-2 text-sm">노출 순서:</span>
                                <select
                                  value={formImageOrders[index]}
                                  onChange={(e) =>
                                    handleOrderChange(
                                      index,
                                      parseInt(e.target.value)
                                    )
                                  }
                                  className="p-1 border border-gray-300 rounded text-sm"
                                  disabled={isSubmitting}
                                >
                                  {Array.from(
                                    { length: formImagePreviews.length },
                                    (_, i) => (
                                      <option key={i} value={i + 1}>
                                        {i + 1}
                                      </option>
                                    )
                                  )}
                                </select>
                              </div>
                            </div>
                            <div className="absolute top-0 left-0 bg-blue-500 text-white px-2 py-1 text-xs rounded-br">
                              상세 {formImageOrders[index]}번
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>

                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-4 py-3 font-semibold">
                    판매일자
                  </td>
                  <td className="px-4 py-3" colSpan={3}>
                    <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4">
                      <div className="flex items-center w-full md:w-auto">
                        <input
                          type="date"
                          name="sellStartDt"
                          value={formData.sell_start_dt}
                          onChange={handleInputChange}
                          className="p-2 border border-gray-300 rounded"
                          disabled={isSubmitting}
                        />
                        <span className="mx-2">~</span>
                        <input
                          type="date"
                          name="sellEndDt"
                          value={
                            formData.isIndefinite ? "" : formData.sell_end_dt
                          }
                          onChange={handleInputChange}
                          className="p-2 border border-gray-300 rounded"
                          disabled={isSubmitting || formData.isIndefinite}
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isIndefinite"
                          name="isIndefinite"
                          checked={formData.isIndefinite}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          disabled={isSubmitting}
                        />
                        <label
                          htmlFor="isIndefinite"
                          className="ml-2 text-sm text-gray-700"
                        >
                          무기한
                        </label>
                      </div>
                    </div>
                  </td>
                </tr>

                {selectedProduct && (
                  <>
                    <tr className="border-b border-gray-200">
                      <td className="bg-gray-100 px-4 py-3 font-semibold">
                        노출 여부
                      </td>
                      <td className="px-4 py-3" colSpan={3}>
                        <div className="flex items-center space-x-6">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="view_yn"
                              value="Y"
                              checked={formData.view_yn === "Y"}
                              onChange={handleInputChange}
                              className="form-radio h-5 w-5 text-blue-600"
                              disabled={isSubmitting}
                            />
                            <span className="ml-2">네</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="view_yn"
                              value="N"
                              checked={formData.view_yn === "N"}
                              onChange={handleInputChange}
                              className="form-radio h-5 w-5 text-red-600"
                              disabled={isSubmitting}
                            />
                            <span className="ml-2">아니오</span>
                          </label>
                        </div>
                      </td>
                    </tr>

                    <tr className="border-b border-gray-200">
                      <td className="bg-gray-100 px-4 py-3 font-semibold">
                        삭제 여부
                      </td>
                      <td className="px-4 py-3" colSpan={3}>
                        <div className="flex items-center space-x-6">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="del_yn"
                              value="Y"
                              checked={formData.del_yn === "Y"}
                              onChange={handleInputChange}
                              className="form-radio h-5 w-5 text-red-600"
                              disabled={isSubmitting}
                            />
                            <span className="ml-2">네</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="del_yn"
                              value="N"
                              checked={formData.del_yn === "N"}
                              onChange={handleInputChange}
                              className="form-radio h-5 w-5 text-blue-600"
                              disabled={isSubmitting}
                            />
                            <span className="ml-2">아니오</span>
                          </label>
                        </div>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-6">
            <button
              type="submit"
              className={`${
                isSubmitting
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              } text-white px-4 py-2 rounded`}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "처리 중..."
                : selectedProduct
                ? "상품 수정"
                : "상품 등록"}
            </button>
          </div>
        </form>
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
            {selectedProduct ? "상품 수정" : "상품 등록"}
          </h3>
          <button
            type="button"
            className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
            data-modal-hide="authentication-modal"
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
          <ProductAppForm />
        </div>
      </div>
    </div>
  );
};

export default ProductAppModal;
