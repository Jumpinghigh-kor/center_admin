import React, { useState, useEffect } from "react";
import axios, { AxiosError, AxiosResponse } from "axios";
import { useUserStore } from "../../store/store";

interface Member {
  mem_id?: number;
  mem_name?: string;
  mem_phone?: string;
  mem_birth?: any;
  mem_email_id?: string;
  mem_gender?: boolean | number;
  mem_locker?: boolean | number;
  mem_locker_number?: string;
  mem_checkin_number?: string;
  mem_manager?: string;
  mem_memo?: string;
  mem_app_status?: string;
  mem_role?: string;
  push_yn?: string;
  push_token?: string;
  app_reg_dt?: string;
  center_id?: number;
}

interface AppAccount {
  mem_email_id: string;
  mem_app_password: string;
  confirmPassword: string;
  mem_role: string;
}

interface CreateAppAccountPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedMember?: Member;
  mode: string;
}

const CreateAppAccountPopup: React.FC<CreateAppAccountPopupProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedMember,
  mode,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const user = useUserStore((state) => state.user);
  
  const [formData, setFormData] = useState<AppAccount>({
    mem_email_id: selectedMember?.mem_email_id || "",
    mem_app_password: "",
    confirmPassword: "",
    mem_role: selectedMember?.mem_role || "USER",
  });
  
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
      }, 300);

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // 에러 메시지 초기화
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const validateForm = (): boolean => {
    // 이메일 검증 (계정 생성 또는 이메일 변경 모드)
    if ((mode === "create" || mode === "emailChange")) {
      if (!formData.mem_email_id.trim()) {
        setErrorMessage("이메일을 입력해주세요.");
        return false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.mem_email_id)) {
        setErrorMessage("올바른 이메일 형식을 입력해주세요.");
        return false;
      }
    }

    // 비밀번호 검증 (계정 생성 또는 비밀번호 변경 모드)
    if ((mode === "create" || mode === "passwordChange")) {
      if (!formData.mem_app_password) {
        setErrorMessage("비밀번호를 입력해주세요.");
        return false;
      }
    
      if (formData.mem_app_password.length < 6) {
        setErrorMessage("비밀번호는 6자 이상 입력해주세요.");
        return false;
      }

      if (formData.mem_app_password !== formData.confirmPassword) {
        setErrorMessage("비밀번호가 일치하지 않습니다.");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      let apiEndpoint = "";
      let accountData = {};
      let successMessage = "";

      if (mode === "create") {
        apiEndpoint = `${process.env.REACT_APP_API_URL}/member/createMemberApp`;
        accountData = {
          mem_id: selectedMember?.mem_id,
          mem_email_id: formData.mem_email_id.trim(),
          mem_app_password: formData.mem_app_password,
          mem_role: formData.mem_role,
        };
        successMessage = "앱 계정이 성공적으로 생성되었습니다.";
      } else if (mode === "passwordChange") {
        apiEndpoint = `${process.env.REACT_APP_API_URL}/member/updateMemberAppPassword`;
        accountData = {
          mem_id: selectedMember?.mem_id,
          mem_app_password: formData.mem_app_password,
        };
        successMessage = "비밀번호가 성공적으로 변경되었습니다.";
      } else if (mode === "emailChange") {
        apiEndpoint = `${process.env.REACT_APP_API_URL}/member/updateMemberAppEmail`;
        accountData = {
          mem_id: selectedMember?.mem_id,
          mem_email_id: formData.mem_email_id.trim(),
          mem_role: formData.mem_role,
        };
        successMessage = "이메일과 권한이 성공적으로 변경되었습니다.";
      }

      await axios.post(
        apiEndpoint,
        accountData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      alert(successMessage);
      onSuccess();
      onClose();
      
      // 폼 초기화
      setFormData({
        mem_email_id: "",
        mem_app_password: "",
        confirmPassword: "",
        mem_role: "USER",
      });

    } catch (error) {
      const errorResponse = (error as AxiosError).response;
      if (errorResponse) {
        const data = (errorResponse as AxiosResponse).data;
        setErrorMessage(data.message || "계정 생성에 실패했습니다.");
      } else {
        setErrorMessage("서버 연결에 실패했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div
        className={`relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 transform transition-transform duration-300 ${
          isOpen ? "scale-100" : "scale-95"
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
          <h3 className="text-xl font-semibold text-gray-900">
            {mode === "create" ? "앱 계정 생성" : 
             mode === "passwordChange" ? "앱 비밀번호 변경" : 
             mode === "emailChange" ? "앱 이메일 변경" : "앱 계정 관리"} - {selectedMember?.mem_name || "회원"}
          </h3>
          <button
            type="button"
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <svg
              className="w-3 h-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 14 14"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
              />
            </svg>
            <span className="sr-only">Close modal</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 md:p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">
                {errorMessage}
              </div>
            )}

            <div className="space-y-4">
              {/* Email - 계정 생성 또는 이메일 변경 모드에서만 표시 */}
              {(mode === "create" || mode === "emailChange") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이메일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="mem_email_id"
                    value={formData.mem_email_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="이메일을 입력하세요"
                    maxLength={100}
                    autoComplete="off"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {/* Password - 계정 생성 또는 비밀번호 변경 모드에서만 표시 */}
              {(mode === "create" || mode === "passwordChange") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    비밀번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="mem_app_password"
                    value={formData.mem_app_password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="비밀번호를 입력하세요 (6자 이상)"
                    maxLength={50}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {/* Confirm Password - 계정 생성 또는 비밀번호 변경 모드에서만 표시 */}
              {(mode === "create" || mode === "passwordChange") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    비밀번호 확인 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="비밀번호를 다시 입력하세요"
                    maxLength={50}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {/* Role - 계정 생성 또는 이메일 변경 모드에서 표시 */}
              {(mode === "create" || mode === "emailChange") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    권한
                  </label>
                  <select
                    name="mem_role"
                    value={formData.mem_role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                  >
                    <option value="USER">일반회원</option>
                    <option value="FRANCHISEE">가맹점주</option>
                  </select>
                </div>
              )}
            </div>

            {/* Form Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 
                  (mode === "create" ? "생성 중..." : 
                   mode === "passwordChange" ? "변경 중..." : 
                   mode === "emailChange" ? "변경 중..." : "처리 중...") :
                  (mode === "create" ? "계정 생성" : 
                   mode === "passwordChange" ? "비밀번호 변경" : 
                   mode === "emailChange" ? "이메일 변경" : "확인")
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAppAccountPopup;
