import axios from "axios";
import React, { useState } from "react";
import { useTokenStore, useUserStore } from "../store/store";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const [isFirstLoginSuccessful, setIsFirstLoginSuccessful] = useState(false);
  const [modal, setModal] = useState(false);
  const [targetPage, setTargetPage] = useState("/");
  const navigate = useNavigate();
  const [id, setId] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [secondPassword, setSecondPassword] = useState("");
  const setAccessToken = useTokenStore((state) => state.setAccessToken);
  const setUser = useUserStore((state) => state.setUser);

  const onSubmitFirstLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const result = await axios.post(
        `${process.env.REACT_APP_API_URL}/login/primary`,
        {
          id: id,
          password: password,
        },
        { withCredentials: true }
      );
      if (result.data.login === false) {
        return alert(result.data.message);
      }
      setIsFirstLoginSuccessful(true);
    } catch (e) {
      setIsFirstLoginSuccessful(false);
      console.log(e);
    }
  };

  const onSubmitSecondLogin = async () => {
    try {
      const result = await axios.post(
        `${process.env.REACT_APP_API_URL}/login/secondary`,
        {
          id: id,
          password: secondPassword,
        },
        { withCredentials: true }
      );
      if (result.data.login === false) {
        return alert(result.data.message);
      }
      setUser(result.data.result);
      localStorage.setItem("accessToken", result.data.access_token);
      setAccessToken(result.data.access_token);
      navigate(targetPage);
    } catch (e) {
      console.log(e);
    }
  };

  const handleShowModal = (page: string) => {
    setTargetPage(page);
    setModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-400 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20 min-w-96 max-w-96 min-h-96 max-h-96">
          <div className="max-w-md mx-auto">
            <div>
              <h1 className="text-2xl font-semibold">로그인</h1>
            </div>
            {isFirstLoginSuccessful ? (
              <div className="flex flex-col py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <button
                  type="button"
                  className="text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center me-2"
                  onClick={() => handleShowModal("/")}
                >
                  <svg
                    className={`text-black w-4 h-4 transition duration-75 group-hover:text-gray-900 mr-1`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 18"
                  >
                    <path d="M14 2a3.963 3.963 0 0 0-1.4.267 6.439 6.439 0 0 1-1.331 6.638A4 4 0 1 0 14 2Zm1 9h-1.264A6.957 6.957 0 0 1 15 15v2a2.97 2.97 0 0 1-.184 1H19a1 1 0 0 0 1-1v-1a5.006 5.006 0 0 0-5-5ZM6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Z" />
                  </svg>
                  점핑하이 관리 페이지
                </button>
                {/* <button
                  type="button"
                  // className="hidden text-gray-900  bg-whit hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center me-2"
                  className="text-gray-900  bg-whit hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center me-2"
                  onClick={() => handleShowModal("/app")}
                >
                  <svg
                    className={`text-black w-4 h-4 transition duration-75 group-hover:text-gray-900 mr-1`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z" />
                  </svg>
                  회원 어플 관리 페이지
                </button> */}
                <button
                  type="button"
                  className="text-white bg-[#050708] hover:bg-[#050708]/80 focus:ring-4 focus:outline-none focus:ring-[#050708]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center me-2 mb-2"
                  onClick={() => navigate("/videos")}
                >
                  <svg
                    className={`text-white w-4 h-4 transition duration-75 group-hover:text-gray-900 mr-1`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M21.7 8.037a4.26 4.26 0 0 0-.789-1.964 2.84 2.84 0 0 0-1.984-.839c-2.767-.2-6.926-.2-6.926-.2s-4.157 0-6.928.2a2.836 2.836 0 0 0-1.983.839 4.225 4.225 0 0 0-.79 1.965 30.146 30.146 0 0 0-.2 3.206v1.5a30.12 30.12 0 0 0 .2 3.206c.094.712.364 1.39.784 1.972.604.536 1.38.837 2.187.848 1.583.151 6.731.2 6.731.2s4.161 0 6.928-.2a2.844 2.844 0 0 0 1.985-.84 4.27 4.27 0 0 0 .787-1.965 30.12 30.12 0 0 0 .2-3.206v-1.516a30.672 30.672 0 0 0-.202-3.206Zm-11.692 6.554v-5.62l5.4 2.819-5.4 2.801Z" />
                  </svg>{" "}
                  비상 영상 페이지
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                <form
                  onSubmit={onSubmitFirstLogin}
                  className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7"
                >
                  <div className="relative">
                    <input
                      autoComplete="off"
                      id="id"
                      name="id"
                      type="text"
                      className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:borer-rose-600"
                      placeholder="아이디"
                      onChange={(e) => setId(e.target.value)}
                      value={id}
                    />
                    <label
                      htmlFor="id"
                      className="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
                    >
                      아이디
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      autoComplete="off"
                      id="password"
                      name="password"
                      type="password"
                      className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:borer-rose-600"
                      placeholder="비밀번호"
                      onChange={(e) => setPassword(e.target.value)}
                      value={password}
                    />
                    <label
                      htmlFor="password"
                      className="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
                    >
                      비밀번호
                    </label>
                  </div>
                  <div className="relative">
                    <button
                      className="bg-green-600 hover:bg-green-700 w-full text-white rounded-md px-2 py-1"
                      type="submit"
                    >
                      로그인
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
      {modal ? (
        <div
          id="add-schedule-modal"
          className={`${modal ? "block" : "hidden"} overflow-y-hidden
        overflow-x-hidden 
        fixed top-0 right-0 left-0 z-50 justify-center items-center w-full inset-0 max-h-full`}
        >
          <div className="fixed top-0 right-0 left-0 w-full max-h-full min-h-screen inset-0 bg-black opacity-50"></div>
          <div
            tabIndex={-1}
            className={`overflow-y-auto overflow-x-hidden flex justify-center z-50 w-full md:inset-0 h-modal md:h-full`}
          >
            <div className="relative p-4 w-full max-w-md h-full md:h-auto">
              <div className="relative p-4 text-center bg-white rounded-lg shadow sm:p-5">
                <button
                  type="button"
                  className="text-gray-400 absolute top-2.5 right-2.5 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                  onClick={() => {
                    setSecondPassword("");
                    setModal(false);
                  }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"></path>
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
                <svg
                  className="w-11 h-11 mb-3.5 mx-auto text-gray-400"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 10V7a4 4 0 1 1 8 0v3h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h1Zm2-3a2 2 0 1 1 4 0v3h-4V7Zm2 6a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0v-3a1 1 0 0 1 1-1Z"
                    clipRule="evenodd"
                  />
                </svg>

                <p className="text-gray-400">2차 비밀번호를 입력하세요</p>
                <div className="flex justify-center items-center space-x-4 my-2">
                  <div>
                    <input
                      autoComplete="new-password"
                      type="text"
                      name="second_password"
                      id="second_password"
                      placeholder="••••••"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      required
                      maxLength={6}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setSecondPassword(e.target.value);
                      }}
                      value={secondPassword}
                    />
                  </div>
                  <button
                    type="submit"
                    className="py-2 px-3 text-sm font-medium text-center text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-red-300"
                    onClick={onSubmitSecondLogin}
                  >
                    로그인
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Login;
