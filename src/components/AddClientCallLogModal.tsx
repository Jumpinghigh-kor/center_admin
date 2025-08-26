import axios from "axios";
import React, { useState } from "react";
import { ClientLog } from "../utils/types";

interface ModalProps {
  setModalToggle: React.Dispatch<React.SetStateAction<boolean>>;
  center_id: number;
  selectedClientCallLog: ClientLog;
  mode: string;
  fetchData: () => Promise<void>;
}

const AddClientCallLogModal: React.FC<ModalProps> = ({
  setModalToggle,
  center_id,
  selectedClientCallLog,
  mode,
  fetchData,
}) => {
  const [clientCall, setClientCall] = useState({
    clientName: mode === "add" ? "" : selectedClientCallLog?.ccl_name,
    clientPhone: mode === "add" ? "" : selectedClientCallLog?.ccl_phone,
    clientMemo: mode === "add" ? "" : selectedClientCallLog?.ccl_memo,
    center_id: center_id,
  });

  const addClientCallLog = async () => {
    try {
      if (mode === "add") {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/log/clientCall`,
          clientCall
        );
      } else if (mode === "edit") {
        await axios.patch(
          `${process.env.REACT_APP_API_URL}/log/clientCall/${selectedClientCallLog?.ccl_id}`,
          clientCall
        );
      } else {
        alert("다시 시도하시기 바랍니다.");
      }
      await fetchData();
      setModalToggle(false);
    } catch (e) {
      console.log(e);
    } finally {
    }
  };

  return (
    <div
      id="add-call-log-modal"
      className="overflow-y-hidden
        overflow-x-hidden
        fixed top-0 right-0 left-0 z-50 justify-center items-center w-full inset-0 max-h-full"
    >
      <div className="fixed top-0 right-0 left-0 w-full max-h-full min-h-screen bg-black opacity-50"></div>
      <div className="overflow-scroll absolute bottom-0 bg-white animate-openModalMobile sm:animate-openModalPC w-full sm:w-auto lg:w-full lg:max-w-screen-sm sm:h-full sm:min-h-screen sm:top-0 right-0 z-80">
        <div className="relative">
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
            <h3 className="text-xl font-semibold text-gray-900">
              상담 {mode === "add" ? "등록" : "수정"}
            </h3>
            <button
              type="button"
              className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
              data-modal-hide="authentication-modal"
              onClick={() => setModalToggle(false)}
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
          <div className="p-4 md:p-5 flex flex-col items-center">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500">
              <tbody>
                <tr className="border-b border-gray-200">
                  <th
                    scope="row"
                    className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                  >
                    이름
                  </th>
                  <td className="px-6 py-2 bg-white text-black max-w-52">
                    <input
                      type="text"
                      id="name"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-1.5"
                      placeholder="이름을 입력하세요."
                      required
                      value={clientCall.clientName}
                      maxLength={10}
                      onChange={(e) =>
                        setClientCall({
                          ...clientCall,
                          clientName: e.target.value,
                        })
                      }
                    />
                  </td>
                </tr>

                <tr className="border-b border-gray-200">
                  <th
                    scope="row"
                    className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                  >
                    전화번호
                  </th>
                  <td className="px-6 py-2 bg-white text-black">
                    <input
                      type="text"
                      id="phone"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-1.5"
                      placeholder="-없이 입력"
                      maxLength={11}
                      value={clientCall.clientPhone}
                      onChange={(e) =>
                        setClientCall({
                          ...clientCall,
                          clientPhone: e.target.value,
                        })
                      }
                    />
                  </td>
                </tr>

                <tr className="border-b border-gray-200">
                  <th
                    scope="row"
                    className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                  >
                    상담내용
                  </th>
                  <td className="px-6 py-2 bg-white text-black">
                    <textarea
                      className="h-40 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-1.5"
                      value={clientCall.clientMemo}
                      maxLength={3000}
                      onChange={(e) =>
                        setClientCall({
                          ...clientCall,
                          clientMemo: e.target.value,
                        })
                      }
                    ></textarea>
                  </td>
                </tr>

                {/* {mode === "add" ? null : (
                  <tr>
                    <th
                      scope="row"
                      className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                    >
                      상담날짜
                    </th>
                    <td className="px-6 py-2 bg-white text-black"></td>
                  </tr>
                )} */}
              </tbody>
            </table>
            <div className="p-5">
              <button
                type="button"
                className="bg-green-600 hover:bg-green-700 block rounded-full px-10 py-3 text-center text-sm text-white font-extrabold shadow-sm hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                onClick={addClientCallLog}
              >
                {mode === "add" ? "등록" : "수정"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddClientCallLogModal;
