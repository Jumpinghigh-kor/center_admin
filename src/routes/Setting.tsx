import axios, { AxiosError, AxiosResponse } from "axios";
import React, { useState } from "react";
import { useUserStore } from "../store/store";
import { useNavigate } from "react-router-dom";

const Setting: React.FC = () => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const [mode, setMode] = useState(1);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    // 간단한 검증 로직
    if (!currentPassword || !newPassword || !confirmPassword) {
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
          currentPassword: currentPassword,
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
                      name="password"
                      id="password"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      placeholder="현재 비밀번호"
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      value={currentPassword}
                      maxLength={15}
                      autoComplete="off"
                      required
                    />
                  </div>
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
