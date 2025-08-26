import axios, { AxiosError, AxiosResponse } from "axios";
import React, { useEffect, useState } from "react";
import { useUserStore } from "../store/store";
import { useNavigate } from "react-router-dom";

const AddUser: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.usr_role !== "admin") {
      return navigate("/");
    }
  }, [user, navigate]);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    // 간단한 검증 로직
    if (!id || !password || !confirmPassword) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    if (password !== confirmPassword) {
      alert("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    if (password.length < 8) {
      alert("새 비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/user`, {
        name: name.trim(),
        id: id.trim(),
        password: password.trim(),
        user_role: user.usr_role,
      });
      alert(res.data.message);
      setName("");
      setId("");
      setPassword("");
      setConfirmPassword("");
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
        <span className="font-bold text-xl">센터 추가</span>
      </div>
      <div className="flex py-4">
        <div
          id="authentication-modal"
          className="overflow-y-auto overflow-x-hidden top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full"
        >
          <div className="relative w-full max-w-md max-h-full">
            <div className="relative bg-white rounded-lg shadow">
              <div className="flex bg-custom-C4C4C4 items-center justify-center p-2 md:p-3 border-b rounded-t">
                <div className="text-base font-semibold text-white">
                  회원가입
                </div>
              </div>
              <div className="p-4 md:px-10 md:py-6">
                <div className="flex justify-center">
                  <div className="text-center">
                    <div className="font-semibold mb-3 text-gray-500">
                      가맹점의{" "}
                      <span className="text-red-500">새 계정을 추가</span>
                      합니다
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      아이디와 비밀번호를 입력해주세요.
                    </div>
                  </div>
                </div>
                <form className="space-y-4 mt-4" onSubmit={createUser}>
                  <div>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      placeholder="센터 이름"
                      onChange={(e) => setName(e.target.value)}
                      value={name}
                      maxLength={15}
                      autoComplete="off"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="id"
                      id="id"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      placeholder="새 아이디"
                      onChange={(e) => setId(e.target.value)}
                      value={id}
                      maxLength={15}
                      autoComplete="off"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      placeholder="새 비밀번호"
                      maxLength={15}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      onChange={(e) => setPassword(e.target.value)}
                      value={password}
                      autoComplete="off"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      name="confirm-password"
                      id="confirm-password"
                      placeholder="새 비밀번호 확인"
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
                    추가
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

export default AddUser;
