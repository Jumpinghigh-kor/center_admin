import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUserStore } from "../../store/store";

interface UpdateLogApp {
  upAppId: number;
  upAppVersion: number;
  upAppDesc: string;
  delYn: "Y" | "N";
  regDt: string;
  regId: string;
  modDt: string;
  modId: string;
}

interface UpdateLogAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedUpdateLog: UpdateLogApp | null;
}

const UpdateLogAppModal: React.FC<UpdateLogAppModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedUpdateLog,
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
  const UpdateLogAppForm = () => {
    const user = useUserStore((state) => state.user);
    const [formData, setFormData] = useState({
      upAppVersion: selectedUpdateLog ? selectedUpdateLog.upAppVersion : "",
      upAppDesc: selectedUpdateLog ? selectedUpdateLog.upAppDesc : "",
      delYn: selectedUpdateLog ? selectedUpdateLog.delYn : "N",
      regId: user.index.toString(),
    });
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // selectedUpdateLog가 변경될 때 formData 업데이트
    useEffect(() => {
      if (selectedUpdateLog) {
        setFormData({
          upAppVersion: selectedUpdateLog.upAppVersion,
          upAppDesc: selectedUpdateLog.upAppDesc,
          delYn: selectedUpdateLog.delYn,
          regId: user.index.toString(),
        });
      } else {
        setFormData({
          upAppVersion: "",
          upAppDesc: "",
          delYn: "N",
          regId: user.index.toString(),
        });
      }
    }, [selectedUpdateLog, user.index]);

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
      if (!formData.upAppVersion || !formData.upAppDesc) {
        setErrorMessage("버전과 설명을 입력해주세요.");
        return;
      }

      try {
        setIsSubmitting(true);

        // API 요청
        if (selectedUpdateLog) {
          // 수정 API 호출

          await axios.post(
            `${process.env.REACT_APP_API_URL}/app/updateLogApp/updateUpdateLogApp`,
            {
              upAppId: selectedUpdateLog.upAppId,
              upAppVersion: formData.upAppVersion,
              upAppDesc: formData.upAppDesc,
              delYn: formData.delYn,
              userId: user.index.toString(),
            }
          );

          alert("공지 사항이 성공적으로 수정되었습니다.");
        } else {
          // 등록 API 호출
          await axios.post(
            `${process.env.REACT_APP_API_URL}/app/updateLogApp/insertUpdateLogApp`,
            {
              upAppVersion: formData.upAppVersion,
              upAppDesc: formData.upAppDesc,
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
                    버전
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      name="upAppVersion"
                      value={formData.upAppVersion}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="버전을 입력하세요"
                      disabled={isSubmitting}
                    />
                  </td>
                </tr>

                {/* 데스크톱 화면에서는 배너 위치와 타입이 한 행에 표시됨 */}
                <tr className="border-b border-gray-200 hidden md:table-row">
                  <td className="bg-gray-100 px-4 py-3 w-1/6 font-semibold">
                    내용
                  </td>
                  <td className="px-4 py-3 w-1/3">
                    <textarea
                      name="upAppDesc"
                      value={formData.upAppDesc}
                      onChange={handleInputChange}
                      className="w-full h-40 p-2 border border-gray-300 rounded"
                      disabled={isSubmitting}
                    />
                  </td>
                </tr>

                {selectedUpdateLog && (
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
                : selectedUpdateLog
                ? "업데이트 수정"
                : "업데이트 등록"}
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
            {selectedUpdateLog ? "업데이트 수정" : "업데이트 등록"}
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
          <UpdateLogAppForm />
        </div>
      </div>
    </div>
  );
};

export default UpdateLogAppModal;
