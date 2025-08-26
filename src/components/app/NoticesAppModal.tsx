import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUserStore } from "../../store/store";

interface NoticesApp {
  noticesAppId: number;
  noticesType: string;
  title: string;
  content: string;
  viewYn: "Y" | "N";
  delYn: "Y" | "N";
  regDate: string;
}

interface NoticesAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedNotice: NoticesApp | null;
}

const NoticesAppModal: React.FC<NoticesAppModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedNotice,
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

  if (!isOpen && !isAnimating) return null;

  // Banner Form Component
  const NoticesAppForm = () => {
    const user = useUserStore((state) => state.user);
    const [formData, setFormData] = useState({
      noticesType: selectedNotice ? selectedNotice.noticesType : "NOTICE",
      title: selectedNotice ? selectedNotice.title : "",
      content: selectedNotice ? selectedNotice.content : "",
      viewYn: selectedNotice ? selectedNotice.viewYn : "Y",
      delYn: selectedNotice ? selectedNotice.delYn : "N",
      regId: user.index.toString(),
    });
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleInputChange = (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const { name, value } = e.target;
      setFormData({
        ...formData,
        [name]: value,
      });
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      // 필수 필드 확인
      if (!formData.title || !formData.content) {
        setErrorMessage("제목과 내용을 입력해주세요.");
        return;
      }

      try {
        setIsSubmitting(true);

        // API 요청
        if (selectedNotice) {
          // 수정 API 호출

          await axios.post(
            `${process.env.REACT_APP_API_URL}/app/noticesApp/updateNoticesApp`,
            {
              noticesAppId: selectedNotice.noticesAppId,
              noticesType: formData.noticesType,
              title: formData.title,
              content: formData.content,
              viewYn: formData.viewYn,
              delYn: formData.delYn,
              userId: user.index.toString(),
            }
          );

          alert("공지 사항이 성공적으로 수정되었습니다.");
        } else {
          // 등록 API 호출
          await axios.post(
            `${process.env.REACT_APP_API_URL}/app/noticesApp/insertNoticesApp`,
            {
              noticesType: formData.noticesType,
              title: formData.title,
              content: formData.content,
              viewYn: formData.viewYn,
              delYn: formData.delYn,
              userId: user.index.toString(),
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
              withCredentials: true,
            }
          );

          alert("공지 사항이 성공적으로 등록되었습니다.");
        }

        onSuccess();
      } catch (error) {
        console.error("공지 사항 처리 오류:", error);
        setErrorMessage("공지 사항 처리 중 오류가 발생했습니다.");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div>
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <tbody>
                {/* 모바일 화면에서는 배너 위치와 타입이 각각 별도의 행에 표시됨 */}
                <tr className="border-b border-gray-200 md:table-row">
                  <td className="bg-gray-100 px-4 py-3 w-1/4 font-semibold">
                    공지 유형
                  </td>
                  <td className="px-4 py-3">
                    <select
                      name="noticesType"
                      value={formData.noticesType}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      disabled={isSubmitting}
                    >
                      <option value="NOTICE">공지</option>
                      <option value="EVENT">이벤트</option>
                      <option value="GUIDE">가이드</option>
                    </select>
                  </td>
                </tr>
                <tr className="border-b border-gray-200 md:table-row">
                  <td className="bg-gray-100 px-4 py-3 w-1/4 font-semibold">
                    공지 제목
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="공지 제목을 입력하세요"
                      disabled={isSubmitting}
                    />
                  </td>
                </tr>

                {/* 데스크톱 화면에서는 배너 위치와 타입이 한 행에 표시됨 */}
                <tr className="border-b border-gray-200 hidden md:table-row">
                  <td className="bg-gray-100 px-4 py-3 w-1/6 font-semibold">
                    공지 내용
                  </td>
                  <td className="px-4 py-3 w-1/3">
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      disabled={isSubmitting}
                    />
                  </td>
                </tr>

                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-4 py-3 font-semibold">
                    노출 여부
                  </td>
                  <td className="px-4 py-3" colSpan={3}>
                    <div className="flex items-center space-x-6">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="viewYn"
                          value="Y"
                          checked={formData.viewYn === "Y"}
                          onChange={handleInputChange}
                          className="form-radio h-5 w-5 text-red-600"
                          disabled={isSubmitting}
                        />
                        <span className="ml-2">네</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="viewYn"
                          value="N"
                          checked={formData.viewYn === "N"}
                          onChange={handleInputChange}
                          className="form-radio h-5 w-5 text-blue-600"
                          disabled={isSubmitting}
                        />
                        <span className="ml-2">아니오</span>
                      </label>
                    </div>
                  </td>
                </tr>

                {selectedNotice && (
                  <tr className="border-b border-gray-200">
                    <td className="bg-gray-100 px-4 py-3 font-semibold">
                      삭제 여부
                    </td>
                    <td className="px-4 py-3" colSpan={3}>
                      <div className="flex items-center space-x-6">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="delYn"
                            value="Y"
                            checked={formData.delYn === "Y"}
                            onChange={handleInputChange}
                            className="form-radio h-5 w-5 text-red-600"
                            disabled={isSubmitting}
                          />
                          <span className="ml-2">네</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="delYn"
                            value="N"
                            checked={formData.delYn === "N"}
                            onChange={handleInputChange}
                            className="form-radio h-5 w-5 text-blue-600"
                            disabled={isSubmitting}
                          />
                          <span className="ml-2">아니오</span>
                        </label>
                      </div>
                    </td>
                  </tr>
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
                : selectedNotice
                ? "공지 수정"
                : "공지 등록"}
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
            {selectedNotice ? "공지 수정" : "공지 등록"}
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
          <NoticesAppForm />
        </div>
      </div>
    </div>
  );
};

export default NoticesAppModal;
