import React, { useState, useEffect } from "react";
import axios, { AxiosError, AxiosResponse } from "axios";
import { useUserStore } from "../../store/store";

interface Member {
  mem_id?: number;
  mem_name?: string;
  mem_phone?: string;
  mem_birth?: any;
  mem_app_id?: string;
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
  mem_app_id: string;
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
  const isChangeMode = mode !== "create";
  const [activeTab, setActiveTab] = useState<"info" | "password">("info");
  
  const [formData, setFormData] = useState<AppAccount>({
    mem_app_id: selectedMember?.mem_app_id || "",
    mem_app_password: "",
    confirmPassword: "",
    mem_role: selectedMember?.mem_role || "USER",
  });
  
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(true);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(true);
  const [reactivateExit, setReactivateExit] = useState<"Y" | "N">("N");
  
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

  // 선택된 회원 정보로 아이디/권한 매핑
  useEffect(() => {
    if (!isOpen) return;
    setFormData((prev) => ({
      ...prev,
      mem_app_id: selectedMember?.mem_app_id || "",
      mem_role: selectedMember?.mem_role || prev.mem_role,
    }));
  }, [isOpen, selectedMember]);

  // API 매핑 제거 요청으로 삭제됨

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

  const effectiveMode = mode === "create" ? "create" : (activeTab === "info" ? "emailChange" : "passwordChange");

  const validateForm = (): boolean => {
    // 이메일 검증 (계정 생성 또는 이메일 변경 모드)
    if ((effectiveMode === "create" || effectiveMode === "emailChange")) {
      if (!formData.mem_app_id.trim()) {
        setErrorMessage("아이디를 입력해주세요.");
        return false;
      }

      // 아이디는 영문/숫자만 허용 (특수문자 불가)
      const idRegex = /^[A-Za-z0-9]+$/;
      if (!idRegex.test(formData.mem_app_id.trim())) {
        setErrorMessage("아이디는 영문과 숫자만 입력 가능합니다.");
        return false;
      }
    }

    // 비밀번호 검증 (계정 생성 또는 비밀번호 변경 모드)
    if ((effectiveMode === "create" || effectiveMode === "passwordChange")) {
      if (!formData.mem_app_password) {
        setErrorMessage("비밀번호를 입력해주세요.");
        return false;
      }

      // 최소 8자, 대문자/소문자/숫자/특수문자 각 1자 이상 포함
      const passwordPolicyRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
      if (!passwordPolicyRegex.test(formData.mem_app_password)) {
        setErrorMessage("비밀번호는 8자 이상이며, 대문자, 소문자, 숫자, 특수문자를 각각 1자 이상 포함해야 합니다.");
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

    const defaultErrorMessage = effectiveMode === "create"
      ? "앱 계정 생성에 실패했습니다."
      : effectiveMode === "passwordChange"
      ? "비밀번호 변경에 실패했습니다."
      : "정보 변경에 실패했습니다.";

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      let apiEndpoint = "";
      let accountData = {};
      let successMessage = "";
      let didReactivate = false;

      if (effectiveMode === "create") {
        apiEndpoint = `${process.env.REACT_APP_API_URL}/app/memberApp/createMemberApp`;
        accountData = {
          mem_id: selectedMember?.mem_id,
          mem_app_id: formData.mem_app_id.trim(),
          mem_app_password: formData.mem_app_password,
          mem_role: formData.mem_role,
        };
        successMessage = "앱 계정이 성공적으로 생성되었습니다.";
      } else if (effectiveMode === "passwordChange") {
        apiEndpoint = `${process.env.REACT_APP_API_URL}/app/memberApp/updateMemberAppPassword`;
        accountData = {
          mem_id: selectedMember?.mem_id,
          mem_app_password: formData.mem_app_password,
        };
        successMessage = "비밀번호가 성공적으로 변경되었습니다.";
      } else if (effectiveMode === "emailChange") {
        apiEndpoint = `${process.env.REACT_APP_API_URL}/app/memberApp/updateMemberAppInfo`;
        accountData = {
          mem_id: selectedMember?.mem_id,
          mem_app_id: formData.mem_app_id.trim(),
          mem_role: formData.mem_role,
        };
        successMessage = "앱 계정 정보가 성공적으로 변경되었습니다.";
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

      // 탈퇴 해재 요청 (선택된 회원이 EXIT이고 '예' 선택 시)
      if (selectedMember?.mem_app_status === 'EXIT' && reactivateExit === 'Y') {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/app/memberApp/updateMemberActive`,
          { mem_id: selectedMember?.mem_id },
          {
            headers: {
              "Content-Type": "application/json",
            },
            withCredentials: true,
          }
        );
        // 목록 즉시 반영
        didReactivate = true;
        onSuccess();
      }

      // 계정 생성 시 환영 우편 발송 (베스트 에포트)
      if (effectiveMode === "create") {
        try {
          const memId = selectedMember?.mem_id;
          if (memId) {
            const postRes = await axios.post(
              `${process.env.REACT_APP_API_URL}/app/postApp/insertPostApp`,
              {
                post_type: 'JUMPING',
                title: '회원 가입을 진심으로 환영합니다! 🎉',
                content: '회원님께 더 큰 만족을 드릴 수 있도록 항상 노력하겠습니다.',
                all_send_yn: 'N',
                push_send_yn: 'Y',
                userId: user?.index,
                mem_id: String(memId),
              }
            );
            const postAppId = (postRes as any)?.data?.postAppId;
            if (postAppId) {
              await axios.post(`${process.env.REACT_APP_API_URL}/app/postApp/insertMemberPostApp`, {
                post_app_id: postAppId,
                mem_id: memId,
                userId: user?.index,
              });
            }
          }
        } catch (postErr) {
          console.error('환영 우편 발송 오류:', postErr);
        }
      }

      alert(successMessage);
      if (!didReactivate) {
        onSuccess();
      }
      onClose();
      
      // 폼 초기화
      setFormData({
        mem_app_id: "",
        mem_app_password: "",
        confirmPassword: "",
        mem_role: "USER",
      });

    } catch (error) {
      const errorResponse = (error as AxiosError).response;
      if (errorResponse) {
        const data = (errorResponse as AxiosResponse).data;
        setErrorMessage((data as any).message || defaultErrorMessage);
      } else {
        setErrorMessage(defaultErrorMessage);
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
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      
      <div
        className={`relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 transform transition-transform duration-300 ${
          isOpen ? "scale-100" : "scale-95"
        }`}
      >
        <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
          <h3 className="text-xl font-semibold text-gray-900">
            {mode === "create" ? "앱 계정 생성" : (
              activeTab === "password" ? "앱 비밀번호 변경" : "앱 계정 정보 변경"
            )}
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

        <div className="p-4 md:p-5">
          {isChangeMode && (
            <div className="mb-4 flex border-b">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'} hover:text-blue-600`}
                onClick={() => setActiveTab('info')}
                disabled={isSubmitting}
              >
                정보변경
              </button>
              <button
                type="button"
                className={`ml-2 px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'password' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'} hover:text-blue-600`}
                onClick={() => setActiveTab('password')}
                disabled={isSubmitting}
              >
                비밀번호 변경
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">
                {errorMessage}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <p>회원명: {selectedMember?.mem_name}</p>
              </div>
              {(effectiveMode === "create" || effectiveMode === "emailChange") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    아이디 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="mem_app_id"
                    value={formData.mem_app_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="아이디를 입력하세요."
                    maxLength={100}
                    autoComplete="off"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {(effectiveMode === "create" || effectiveMode === "passwordChange") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    비밀번호 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="mem_app_password"
                      value={formData.mem_app_password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 pr-16"
                      placeholder="비밀번호를 입력하세요"
                      maxLength={50}
                      autoComplete="new-password"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800 px-2 py-1"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isSubmitting}
                    >
                      {showPassword ? "가리기" : "보기"}
                    </button>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">- 8자 이상 입력해야 합니다.</p>
                    <p className="text-sm text-gray-600">- 대문자, 소문자, 숫자, 특수문자를 각각 1자 이상 포함해야 합니다.</p>
                  </div>
                </div>
              )}

              {(effectiveMode === "create" || effectiveMode === "passwordChange") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    비밀번호 확인 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 pr-16"
                      placeholder="비밀번호를 다시 입력하세요"
                      maxLength={50}
                      autoComplete="new-password"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800 px-2 py-1"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isSubmitting}
                    >
                      {showConfirmPassword ? "가리기" : "보기"}
                    </button>
                  </div>
                </div>
              )}

              {(effectiveMode === "create" || effectiveMode === "emailChange") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    유형
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

                  {selectedMember?.mem_app_status === "EXIT" && (
                    <div className="mt-4">
                      <p className="block text-sm font-medium text-gray-700 mb-2">
                        탈퇴 해재
                      </p>
                      <div className="flex items-center space-x-6">
                        <label className="inline-flex items-center space-x-2">
                          <input
                            type="radio"
                            name="reactivate_exit"
                            value="Y"
                            checked={reactivateExit === "Y"}
                            onChange={() => setReactivateExit("Y")}
                            disabled={isSubmitting}
                          />
                          <span className="text-sm text-gray-700">예</span>
                        </label>
                        <label className="inline-flex items-center space-x-2">
                          <input
                            type="radio"
                            name="reactivate_exit"
                            value="N"
                            checked={reactivateExit === "N"}
                            onChange={() => setReactivateExit("N")}
                            disabled={isSubmitting}
                          />
                          <span className="text-sm text-gray-700">아니오</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

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
                {isSubmitting 
                  ? (effectiveMode === "create" 
                      ? "생성 중..." 
                      : effectiveMode === "passwordChange" 
                        ? "비밀번호 변경 중..." 
                        : "정보 변경 중...")
                  : (effectiveMode === "create" 
                      ? "생성" 
                      : effectiveMode === "passwordChange" 
                        ? "비밀번호 변경" 
                        : "정보 변경")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAppAccountPopup;
