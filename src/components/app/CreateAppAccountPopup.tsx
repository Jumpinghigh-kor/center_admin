import React, { useState, useEffect } from "react";
import axios, { AxiosError, AxiosResponse } from "axios";
import { useUserStore } from "../../store/store";

interface Member {
  mem_id?: number;
  mem_name?: string;
  mem_phone?: string;
  mem_birth?: any;
  mem_gender?: boolean | number;
  mem_locker?: boolean | number;
  mem_locker_number?: string;
  mem_checkin_number?: string;
  mem_manager?: string;
  mem_memo?: string;
  account_app_id?: string;
  center_id?: number;
  login_id?: string;
  status?: string;
  mem_role?: string;
  push_yn?: string;
  push_token?: string;
  reg_dt?: string;
}

interface AppAccount {
  login_id: string;
  password: string;
  confirmPassword: string;
  mem_role: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
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
  
  // 생년월일 파싱 함수
  const parseBirthDate = (birthDate: any): { year: string; month: string; day: string } => {
    if (!birthDate) return { year: "", month: "", day: "" };
    
    let dateStr = "";
    if (typeof birthDate === "string") {
      dateStr = birthDate;
    } else if (birthDate instanceof Date) {
      dateStr = birthDate.toISOString().split("T")[0];
    }
    
    if (dateStr) {
      const parts = dateStr.split(/[-/]/);
      if (parts.length >= 3) {
        return {
          year: parts[0],
          month: parts[1].padStart(2, "0"),
          day: parts[2].padStart(2, "0"),
        };
      }
    }
    
    return { year: "", month: "", day: "" };
  };

  const initialBirth = parseBirthDate(selectedMember?.mem_birth);
  
  const [formData, setFormData] = useState<AppAccount>({
    login_id: selectedMember?.login_id || "",
    password: "",
    confirmPassword: "",
    mem_role: selectedMember?.mem_role || "USER",
    birthYear: initialBirth.year,
    birthMonth: initialBirth.month,
    birthDay: initialBirth.day,
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

  // 선택된 회원 정보로 아이디/권한/생년월일 매핑
  useEffect(() => {
    if (!isOpen) return;
    const birth = parseBirthDate(selectedMember?.mem_birth);
    setFormData((prev) => ({
      ...prev,
      login_id: selectedMember?.login_id || "",
      mem_role: selectedMember?.mem_role || prev.mem_role,
      birthYear: birth.year || prev.birthYear,
      birthMonth: birth.month || prev.birthMonth,
      birthDay: birth.day || prev.birthDay,
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
      if (!formData.login_id.trim()) {
        setErrorMessage("아이디를 입력해주세요.");
        return false;
      }

      // 아이디는 영문/숫자만 허용 (특수문자 불가)
      const idRegex = /^[A-Za-z0-9]+$/;
      if (!idRegex.test(formData.login_id.trim())) {
        setErrorMessage("아이디는 영문과 숫자만 입력 가능합니다.");
        return false;
      }
    }

    // 비밀번호 검증 (계정 생성 또는 비밀번호 변경 모드)
    if ((effectiveMode === "create" || effectiveMode === "passwordChange")) {
      if (!formData.password) {
        setErrorMessage("비밀번호를 입력해주세요.");
        return false;
      }

      // 최소 8자, 대문자/소문자/숫자/특수문자 각 1자 이상 포함
      const passwordPolicyRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
      if (!passwordPolicyRegex.test(formData.password)) {
        setErrorMessage("비밀번호는 8자 이상이며, 대문자, 소문자, 숫자, 특수문자를 각각 1자 이상 포함해야 합니다.");
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setErrorMessage("비밀번호가 일치하지 않습니다.");
        return false;
      }
    }

    // 생년월일 필수 검증 (계정 생성 모드)
    if (effectiveMode === "create") {
      if (!formData.birthYear || !formData.birthMonth || !formData.birthDay) {
        setErrorMessage("생년월일을 모두 입력해주세요.");
        return false;
      }

      // 유효한 날짜인지 검증
      const birthDate = new Date(
        parseInt(formData.birthYear),
        parseInt(formData.birthMonth) - 1,
        parseInt(formData.birthDay)
      );
      
      // 입력한 연도, 월, 일과 실제 Date 객체의 값이 일치하는지 확인 (잘못된 날짜 체크)
      if (
        birthDate.getFullYear() !== parseInt(formData.birthYear) ||
        birthDate.getMonth() !== parseInt(formData.birthMonth) - 1 ||
        birthDate.getDate() !== parseInt(formData.birthDay)
      ) {
        setErrorMessage("유효한 생년월일을 입력해주세요.");
        return false;
      }

      // 미래 날짜 검증
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (birthDate > today) {
        setErrorMessage("생년월일은 오늘 날짜보다 이전이어야 합니다.");
        return false;
      }
    }

    // 생년월일 검증 (정보 변경 모드 - 선택사항이지만 입력 시 유효성 검증)
    if (effectiveMode === "emailChange") {
      // 일부만 입력된 경우
      const hasPartialBirth = (formData.birthYear && !formData.birthMonth) || 
                              (formData.birthMonth && !formData.birthDay) ||
                              (formData.birthYear && !formData.birthDay);
      if (hasPartialBirth) {
        setErrorMessage("생년월일을 모두 입력해주세요.");
        return false;
      }

      // 모두 입력된 경우 유효성 검증
      if (formData.birthYear && formData.birthMonth && formData.birthDay) {
        const birthDate = new Date(
          parseInt(formData.birthYear),
          parseInt(formData.birthMonth) - 1,
          parseInt(formData.birthDay)
        );
        
        // 입력한 연도, 월, 일과 실제 Date 객체의 값이 일치하는지 확인 (잘못된 날짜 체크)
        if (
          birthDate.getFullYear() !== parseInt(formData.birthYear) ||
          birthDate.getMonth() !== parseInt(formData.birthMonth) - 1 ||
          birthDate.getDate() !== parseInt(formData.birthDay)
        ) {
          setErrorMessage("유효한 생년월일을 입력해주세요.");
          return false;
        }

        // 미래 날짜 검증
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (birthDate > today) {
          setErrorMessage("생년월일은 오늘 날짜보다 이전이어야 합니다.");
          return false;
        }
      }
    }

    // 만 14세 미만 검증 (생년월일이 모두 입력된 경우)
    if (effectiveMode === "create" && formData.birthYear && formData.birthMonth && formData.birthDay) {
      const birthDate = new Date(
        parseInt(formData.birthYear),
        parseInt(formData.birthMonth) - 1,
        parseInt(formData.birthDay)
      );
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
      
      // 만 나이 계산: 생일이 지나지 않았으면 1살 빼기
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
      
      if (actualAge < 14) {
        setErrorMessage("만 14세 미만은 가입할 수 없습니다.");
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

      // 생년월일 조합
      const birthday = formData.birthYear && formData.birthMonth && formData.birthDay
        ? `${formData.birthYear}${formData.birthMonth}${formData.birthDay}`
        : null;

      if (effectiveMode === "create") {
        apiEndpoint = `${process.env.REACT_APP_API_URL}/app/memberApp/createMemberApp`;
        accountData = {
          mem_id: selectedMember?.mem_id,
          login_id: formData.login_id.trim(),
          password: formData.password,
          mem_role: formData.mem_role,
          ...(birthday && { birthday }),
        };
        successMessage = "앱 계정이 성공적으로 생성되었습니다.";
      } else if (effectiveMode === "passwordChange") {
        apiEndpoint = `${process.env.REACT_APP_API_URL}/app/memberApp/updateMemberAppPassword`;
        accountData = {
          userId: user?.index,
          account_app_id: selectedMember?.account_app_id,
          password: formData.password,
        };
        successMessage = "비밀번호가 성공적으로 변경되었습니다.";
      } else if (effectiveMode === "emailChange") {
        apiEndpoint = `${process.env.REACT_APP_API_URL}/app/memberApp/updateMemberAppInfo`;
        accountData = {
          userId: user?.index,
          account_app_id: selectedMember?.account_app_id,
          login_id: formData.login_id.trim(),
          mem_role: formData.mem_role,
          ...(birthday && { birthday }),
        };
        successMessage = "앱 계정 정보가 성공적으로 변경되었습니다.";
      }

      const createResponse = await axios.post(
        apiEndpoint,
        accountData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      // 계정 생성 시 생성된 account_app_id 추출
      let createdAccountAppId: string | undefined;
      if (effectiveMode === "create") {
        createdAccountAppId = (createResponse as any)?.data?.result?.insertId?.toString() || 
                              selectedMember?.account_app_id;
      }

      // 탈퇴 해재 요청 (선택된 회원이 EXIT이고 '예' 선택 시)
      if (selectedMember?.status === 'EXIT' && reactivateExit === 'Y') {
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
          const accountAppId = createdAccountAppId || selectedMember?.account_app_id;
          
          if (accountAppId) {
            const postRes = await axios.post(
              `${process.env.REACT_APP_API_URL}/app/postApp/insertPostApp`,
              {
                post_type: 'JUMPING',
                title: '회원 가입을 진심으로 환영합니다! 🎉',
                content: '회원님께 더 큰 만족을 드릴 수 있도록 항상 노력하겠습니다.',
                all_send_yn: 'N',
                push_send_yn: 'Y',
                userId: user?.index
              }
            );
            const postAppId = (postRes as any)?.data?.postAppId;
            if (postAppId) {
              await axios.post(`${process.env.REACT_APP_API_URL}/app/postApp/insertMemberPostApp`, {
                post_app_id: postAppId,
                account_app_id: accountAppId,
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
        login_id: "",
        password: "",
        confirmPassword: "",
        mem_role: "USER",
        birthYear: "",
        birthMonth: "",
        birthDay: "",
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
                    name="login_id"
                    value={formData.login_id}
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
                      name="password"
                      value={formData.password}
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
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      생년월일 {effectiveMode === "create" && <span className="text-red-500">*</span>}
                    </label>
                    <div className="flex gap-2">
                      <select
                        name="birthYear"
                        value={formData.birthYear}
                        onChange={handleInputChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        disabled={isSubmitting}
                      >
                        <option value="">연도</option>
                        {Array.from({ length: 100 }, (_, i) => {
                          const year = new Date().getFullYear() - i;
                          return (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          );
                        })}
                      </select>
                      <select
                        name="birthMonth"
                        value={formData.birthMonth}
                        onChange={handleInputChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        disabled={isSubmitting}
                      >
                        <option value="">월</option>
                        {Array.from({ length: 12 }, (_, i) => {
                          const month = (i + 1).toString().padStart(2, "0");
                          return (
                            <option key={month} value={month}>
                              {month}
                            </option>
                          );
                        })}
                      </select>
                      <select
                        name="birthDay"
                        value={formData.birthDay}
                        onChange={handleInputChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        disabled={isSubmitting}
                      >
                        <option value="">일</option>
                        {Array.from({ length: 31 }, (_, i) => {
                          const day = (i + 1).toString().padStart(2, "0");
                          return (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
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

                    {selectedMember?.status === "EXIT" && (
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
                </>
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
