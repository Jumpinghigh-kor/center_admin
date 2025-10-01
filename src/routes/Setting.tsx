import axios, { AxiosError, AxiosResponse } from "axios";
import React, { useEffect, useState } from "react";
import { useUserStore } from "../store/store";
import { useNavigate } from "react-router-dom";

const Setting: React.FC = () => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const [mode, setMode] = useState(1);
  const [currentPassword, setCurrentPassword] = useState("");
  const [lastPrimaryPassword, setLastPrimaryPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 접근 인증(1차/2차) 게이트
  const [authStep, setAuthStep] = useState<"primary" | "secondary" | "done">("primary");
  const [primaryAuthPwd, setPrimaryAuthPwd] = useState("");
  const [secondaryAuthPwd, setSecondaryAuthPwd] = useState("");

  // 항상 1차 → 2차 인증 요구
  useEffect(() => {
    setAuthStep("primary");
  }, []);

  // 두 비밀번호를 한 번에 입력받아 순차 인증
  const handleAuthBoth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.usr_id) {
      alert("유저 정보가 없습니다. 다시 로그인해 주세요.");
      navigate("/login");
      return;
    }
    if (!primaryAuthPwd) {
      alert("1차 비밀번호를 입력해 주세요.");
      return;
    }
    if (!secondaryAuthPwd) {
      alert("2차 비밀번호를 입력해 주세요.");
      return;
    }
    try {
      // 1차 인증
      const res1 = await axios.post(`${process.env.REACT_APP_API_URL}/login/primary`, {
        id: user.usr_id,
        password: primaryAuthPwd,
      });
      const ok1 = (res1 as any)?.data?.login === true;
      if (!ok1) {
        alert("1차 비밀번호가 올바르지 않습니다.");
        return;
      }
      // 2차 인증
      const res2 = await axios.post(`${process.env.REACT_APP_API_URL}/login/secondary`, {
        id: user.usr_id,
        password: secondaryAuthPwd,
      });
      const ok2 = (res2 as any)?.data?.login === true;
      if (!ok2) {
        alert("2차 비밀번호가 올바르지 않습니다.");
        return;
      }
      const token = (res2 as any)?.data?.access_token;
      if (token) {
        localStorage.setItem("accessToken", token);
      }
      setPrimaryAuthPwd("");
      setLastPrimaryPassword(primaryAuthPwd);
      setSecondaryAuthPwd("");
      setAuthStep("done");
    } catch (error) {
      alert("비밀번호를 다시 확인해 주세요.");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    // 간단한 검증 로직
    if (!newPassword || !confirmPassword) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    if (mode === 1 && newPassword.length < 8) {
      alert("새 비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }
    try {
      const result = await axios.patch(
        `${process.env.REACT_APP_API_URL}/user/${user.center_id}`,
        {
          mode: mode,
          // 서버는 현재 비밀번호를 요구하므로, 직전에 인증한 1차 비밀번호로 대체
          currentPassword: lastPrimaryPassword,
          newPassword: newPassword,
        }
      );
      alert(result.data.message);
      localStorage.removeItem("accessToken");
      navigate("/login");
    } catch (error) {
      const errorResponse = (error as AxiosError).response;
      if (errorResponse) {
        const message = (errorResponse as AxiosResponse).data.message;
        alert(message);
      }
    }
  };

  return (
    <div className="p-3 sm:p-10">
      {authStep !== "done" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow w-full max-w-sm mx-4">
            <div className="bg-custom-C4C4C4 text-white px-4 py-3 rounded-t flex items-center justify-between">
              <div className="text-base font-semibold">
                비밀번호 인증 (1차/2차)
              </div>
              <button
                type="button"
                aria-label="닫기"
                className="text-white/90 hover:text-white p-1 rounded"
                onClick={() => navigate(-1)}
              >
                <svg
                  className="w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <form onSubmit={handleAuthBoth} className="space-y-3">
                <div className="text-sm text-gray-600">설정 화면에 접근하려면 1차/2차 비밀번호가 모두 필요합니다.</div>
                <input
                  type="password"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  placeholder="1차 비밀번호"
                  value={primaryAuthPwd}
                  onChange={(e) => setPrimaryAuthPwd(e.target.value)}
                  autoFocus
                />
                <input
                  type="password"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  placeholder="2차 비밀번호"
                  value={secondaryAuthPwd}
                  onChange={(e) => setSecondaryAuthPwd(e.target.value)}
                />
                <button
                  type="submit"
                  className="w-full text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5"
                >
                  확인
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col">
        <span className="font-bold text-xl">계정 관리</span>
      </div>
      <div className="flex py-4">
        <table className="min-w-60 max-w-60">
          <tbody>
            <tr
              onClick={() => {
                setMode(1);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              className={`${
                mode === 1
                  ? "bg-custom-C4C4C4 text-white"
                  : "bg-white text-black hover:bg-gray-100"
              } flex items-center justify-center p-2 md:p-3 border-b rounded-t`}
            >
              <td className="text-base font-semibold">비밀번호 변경</td>
            </tr>
            <tr
              onClick={() => {
                setMode(2);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              className={`${
                mode === 2
                  ? "bg-custom-C4C4C4 text-white"
                  : "bg-white text-black hover:bg-gray-100"
              } flex items-center justify-center p-2 md:p-3 border-b rounded-b`}
            >
              <td className="text-base font-semibold">2차 비밀번호 변경</td>
            </tr>
          </tbody>
        </table>

        <div
          id="authentication-modal"
          className="mx-4 overflow-y-auto overflow-x-hidden top-0 right-0 left-0 z-10 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full"
        >
          <div className="relative w-full max-w-md max-h-full">
            <div className="relative bg-white rounded-lg shadow">
              <div className="flex bg-custom-C4C4C4 items-center justify-center p-2 md:p-3 border-b rounded-t">
                <div className="text-base font-semibold text-white">
                  {mode === 1 ? "비밀번호 변경" : "2차 비밀번호 변경"}
                </div>
              </div>
              <div className="p-4 md:px-10 md:py-6">
                <div className="flex justify-center">
                  <div className="text-center">
                    <div className="font-semibold mb-3 text-gray-500">
                      회원님의{" "}
                      <span className="text-red-500">
                        {mode === 1 ? "비밀번호 변경" : "2차 비밀번호 변경"}
                      </span>
                      해주세요
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      안전한 비밀번호로 내 정보를 보호하세요
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      이전에 사용한 적 없는 비밀번호가 안전합니다
                    </div>
                  </div>
                </div>
                <form
                  className="space-y-4 mt-4"
                  onSubmit={handleUpdatePassword}
                >
                  <div>
                    <input
                      type="password"
                      name="new-password"
                      id="new-password"
                      placeholder={
                        mode === 1 ? "새 비밀번호" : "새 2차 비밀번호"
                      }
                      maxLength={15}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      onChange={(e) => setNewPassword(e.target.value)}
                      value={newPassword}
                      autoComplete="off"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      name="confirm-password"
                      id="confirm-password"
                      placeholder={
                        mode === 1 ? "새 비밀번호 확인" : "새 2차 비밀번호 확인"
                      }
                      maxLength={15}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      value={confirmPassword}
                      className="bg-gray-50 border mb-10 border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      autoComplete="off"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                  >
                    변경
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Setting;
