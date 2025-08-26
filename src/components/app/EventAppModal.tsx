import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUserStore } from "../../store/store";

interface EventApp {
  event_app_id: number;
  title: string;
  use_yn: string;
  del_yn: string;
  reg_dt: string;
  navigation_path: string;
}

interface EventAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedEvent: EventApp | null;
}

interface ExistingImage {
  file_id: number;
  file_name: string;
  file_path: string;
  event_img_type: string;
  order_seq: number;
}

const EventAppModal: React.FC<EventAppModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedEvent,
}) => {
  const user = useUserStore((state) => state.user);
  const [title, setTitle] = useState("");
  const [useYn, setUseYn] = useState("Y");
  const [detailImage, setDetailImage] = useState<File | null>(null);
  const [buttonImage, setButtonImage] = useState<File | null>(null);
  const [navigationPath, setNavigationPath] = useState("");
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  
  // 이미지 미리보기 상태 추가
  const [detailImagePreview, setDetailImagePreview] = useState<string>("");
  const [buttonImagePreview, setButtonImagePreview] = useState<string>("");
  
  // 기존 이미지 조회
  const fetchExistingImages = async (eventAppId: number) => {
    try {
      setIsLoadingImages(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/eventApp/selectEventAppImgList`,
        { event_app_id: eventAppId }
      );
      
      if (response.data.result) {
        setExistingImages(response.data.result);
      }
    } catch (error) {
      console.error("기존 이미지 조회 오류:", error);
    } finally {
      setIsLoadingImages(false);
    }
  };

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
      
      // 선택된 이벤트가 있으면 기존 값을 설정
      if (selectedEvent) {
        setTitle(selectedEvent.title || "");
        setUseYn(selectedEvent.use_yn || "Y");
        // 기존 이미지 조회
        fetchExistingImages(selectedEvent.event_app_id);
      } else {
        // 새로운 이벤트 생성
        setTitle("");
        setUseYn("Y");
        setExistingImages([]);
      }
      setDetailImage(null);
      setButtonImage(null);
      setNavigationPath(selectedEvent?.navigation_path || "");
      
      // 미리보기 URL 초기화
      setDetailImagePreview("");
      setButtonImagePreview("");
    } 

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
      
      // 미리보기 URL 메모리 해제
      if (detailImagePreview) {
        URL.revokeObjectURL(detailImagePreview);
      }
      if (buttonImagePreview) {
        URL.revokeObjectURL(buttonImagePreview);
      }
    };
  }, [isOpen, onClose, selectedEvent]);

  if (!isOpen) return null;

  const handleDetailImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // 파일 형식 검증
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('JPG, PNG, JPEG 파일만 업로드 가능합니다.');
        e.target.value = '';
        return;
      }
      
      // 파일 크기 검증 (2MB = 2 * 1024 * 1024 bytes)
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('파일 크기는 2MB 이하여야 합니다.');
        e.target.value = '';
        return;
      }
      
      // 이전 미리보기 URL 해제
      if (detailImagePreview) {
        URL.revokeObjectURL(detailImagePreview);
      }
      
      // 새로운 미리보기 URL 생성
      const previewUrl = URL.createObjectURL(file);
      setDetailImagePreview(previewUrl);
      setDetailImage(file);
    }
  };

  const handleButtonImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // 파일 형식 검증
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('JPG, PNG, JPEG 파일만 업로드 가능합니다.');
        e.target.value = '';
        return;
      }
      
      // 파일 크기 검증 (2MB = 2 * 1024 * 1024 bytes)
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('파일 크기는 2MB 이하여야 합니다.');
        e.target.value = '';
        return;
      }
      
      // 이전 미리보기 URL 해제
      if (buttonImagePreview) {
        URL.revokeObjectURL(buttonImagePreview);
      }
      
      // 새로운 미리보기 URL 생성
      const previewUrl = URL.createObjectURL(file);
      setButtonImagePreview(previewUrl);
      setButtonImage(file);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // data:image/jpeg;base64, 부분 제거
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 필수 필드 확인
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!detailImage && (!selectedEvent || !existingContentImage)) {
      alert("상세 이미지를 선택해주세요.");
      return;
    }

    if (!buttonImage && (!selectedEvent || !existingButtonImage)) {
      alert("버튼 이미지를 선택해주세요.");
      return;
    }

    try {
      let imagesData = [];
      
      // 상세 이미지 처리 (order_seq: 1)
      if (detailImage) {
        const base64Data = await convertFileToBase64(detailImage);
        imagesData.push({
          file_data: base64Data,
          content_type: detailImage.type,
          event_img_type: "CONTENT",
          order_seq: 1
        });
      }

      // 버튼 이미지 처리 (order_seq: 2)
      if (buttonImage) {
        const base64Data = await convertFileToBase64(buttonImage);
        imagesData.push({
          file_data: base64Data,
          content_type: buttonImage.type,
          event_img_type: "BUTTON",
          order_seq: 2
        });
      }

      const requestData = {
        title,
        use_yn: useYn,
        reg_id: user.index,
        navigation_path: navigationPath,
        images: imagesData
      };

      if (selectedEvent) {
        // 수정 API 호출
        await axios.post(
          `${process.env.REACT_APP_API_URL}/app/eventApp/updateEventApp`,
          {
            ...requestData,
            event_app_id: selectedEvent.event_app_id,
            mod_id: user.index
          }
        );
        alert("이벤트가 성공적으로 수정되었습니다.");
      } else {
        // 등록 API 호출
        await axios.post(
          `${process.env.REACT_APP_API_URL}/app/eventApp/insertEventApp`,
          requestData
        );
        alert("이벤트가 성공적으로 등록되었습니다.");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("이벤트 처리 오류:", error);
      alert("이벤트 처리 중 오류가 발생했습니다.");
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 기존 이미지 타입별 필터링
  const existingContentImage = existingImages.find(img => img.event_img_type === 'CONTENT');
  const existingButtonImage = existingImages.find(img => img.event_img_type === 'BUTTON');

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleBackdropClick}
    >
      <div 
        className={`bg-white w-full max-w-md h-full overflow-y-auto transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">
            {selectedEvent ? "이벤트 수정" : "이벤트 등록"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="이벤트 제목을 입력하세요..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사용 여부
                </label>
                <select
                  value={useYn}
                  onChange={(e) => setUseYn(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Y">사용</option>
                  <option value="N">미사용</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  네비게이션 경로
                </label>
                <input
                  type="text"
                  value={navigationPath}
                  onChange={(e) => setNavigationPath(e.target.value)}
                  placeholder="예: /event/detail/1"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상세 이미지 <span className="text-red-500">*</span>
                </label>
                
                {selectedEvent && existingContentImage && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">현재 이미지:</div>
                    <img 
                      src={existingContentImage.file_path} 
                      alt="현재 상세 이미지"
                      className="w-full h-32 object-contain rounded border"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {existingContentImage.file_name}
                    </div>
                  </div>
                )}
                
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleDetailImageChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="mt-1 text-xs text-gray-500">
                  JPG, PNG, JPEG 파일만 가능 (최대 2MB)
                  {selectedEvent && existingContentImage && (
                    <span>
                      <br />새 이미지를 선택하면 기존 이미지가 교체됩니다.
                    </span>
                  )}
                </div>
                {detailImage && (
                  <div className="mt-2 text-sm text-gray-600">
                    새로 선택된 파일: {detailImage.name}
                  </div>
                )}
                
                {/* 상세 이미지 미리보기 */}
                {detailImagePreview && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-700 mb-2">새로 선택된 이미지 미리보기:</div>
                    <img 
                      src={detailImagePreview} 
                      alt="상세 이미지 미리보기"
                      className="w-full h-32 object-contain rounded border"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  버튼 이미지 <span className="text-red-500">*</span>
                </label>
                
                {selectedEvent && existingButtonImage && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">현재 이미지:</div>
                    <img 
                      src={existingButtonImage.file_path} 
                      alt="현재 버튼 이미지"
                      className="w-full h-32 object-contain rounded border"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {existingButtonImage.file_name}
                    </div>
                  </div>
                )}
                
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleButtonImageChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="mt-1 text-xs text-gray-500">
                  JPG, PNG, JPEG 파일만 가능 (최대 2MB)
                  {selectedEvent && existingButtonImage && (
                    <span>
                      <br />새 이미지를 선택하면 기존 이미지가 교체됩니다.
                    </span>
                  )}
                </div>
                {buttonImage && (
                  <div className="mt-2 text-sm text-gray-600">
                    새로 선택된 파일: {buttonImage.name}
                  </div>
                )}
                
                {/* 버튼 이미지 미리보기 */}
                {buttonImagePreview && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-700 mb-2">새로 선택된 이미지 미리보기:</div>
                    <img 
                      src={buttonImagePreview} 
                      alt="버튼 이미지 미리보기"
                      className="w-full h-32 object-contain rounded border"
                    />
                  </div>
                )}
              </div>

              {isLoadingImages && (
                <div className="text-center text-gray-500">
                  이미지를 불러오는 중...
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                취소
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                {selectedEvent ? "수정" : "등록"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventAppModal; 