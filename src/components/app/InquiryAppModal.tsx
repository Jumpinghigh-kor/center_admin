import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUserStore } from "../../store/store";

interface InquiryApp {
  inquiry_app_id: number;
  title: string;
  content: string;
  answer: string;
  mem_name: string;
  answer_dt: string;
}

interface InquiryAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedInquiry: InquiryApp | null;
}

const InquiryAppModal: React.FC<InquiryAppModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedInquiry,
}) => {
  const [answer, setAnswer] = useState("");
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
      // 선택된 문의가 있으면 기존 답변을 설정
      if (selectedInquiry) {
        setAnswer(selectedInquiry.answer || "");
      }
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose, selectedInquiry]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 필수 필드 확인
    if (!answer.trim()) {
      alert("답변을 입력해주세요.");
      return;
    }

    try {
      // API 요청
      if (selectedInquiry) {
        // 수정 API 호출
        await axios.post(
          `${process.env.REACT_APP_API_URL}/app/inquiryApp/updateInquiryApp`,
          {
            inquiry_app_id: selectedInquiry.inquiry_app_id,
            answer: answer,
            userId: user.index,
          }
        );

        alert("답변이 성공적으로 등록되었습니다.");
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("문의 처리 오류:", error);
      alert("문의 처리 중 오류가 발생했습니다.");
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
          <h2 className="text-xl font-bold">문의 답변</h2>
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
                  이름
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-sm">
                    {selectedInquiry?.mem_name || "이름 없음"}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-sm">{selectedInquiry?.title || "제목 없음"}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  문의 내용
                </label>
                <textarea
                  value={selectedInquiry?.content || "내용 없음"}
                  disabled
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[120px] resize-none text-sm overflow-y-auto"
                  rows={5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  답변
                </label>
                <textarea
                  name="answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="답변을 입력하세요..."
                  className="w-full p-3 border border-gray-300 rounded-lg min-h-[150px] resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={6}
                />
                <p className="text-sm text-gray-500 text-right">
                  {selectedInquiry?.answer_dt}
                </p>
              </div>
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
                등록
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InquiryAppModal;
