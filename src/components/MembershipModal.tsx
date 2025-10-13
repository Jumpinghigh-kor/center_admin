import axios from "axios";
import dayjs from "dayjs";
import { Datepicker } from "flowbite-react";
import React, { useState } from "react";
import { removeNonNumeric } from "../utils/formatUtils";

interface Order {
  memo_id: number;
  memo_pro_name: string;
  memo_remaining_counts: number | null;
  memo_start_date: string;
  memo_end_date: string;
  memo_purchase_date: string;
  memo_history: string;
  pro_name: string;
  pro_type: string;
}

interface ModalProps {
  setMembershipModalToggle: React.Dispatch<React.SetStateAction<boolean>>;
  selectedOrder: Order | undefined;
  fetchData: () => Promise<void>;
  setSelectedOrder: React.Dispatch<React.SetStateAction<any>>;
}

const MembershipModal: React.FC<ModalProps> = ({
  setMembershipModalToggle,
  selectedOrder,
  fetchData,
  setSelectedOrder,
}) => {
  const [remainingCounts, setRemainingCounts] = useState(
    selectedOrder?.memo_remaining_counts!
  );
  const [purchaseDate, setPurchaseDate] = useState<Date>(
    dayjs(selectedOrder?.memo_purchase_date).toDate()
  );
  const [startDate, setStartDate] = useState<Date>(
    dayjs(selectedOrder?.memo_start_date).toDate()
  );
  const [endDate, setEndDate] = useState<Date>(
    dayjs(selectedOrder?.memo_end_date).toDate()
  );

  const [reason, setReason] = useState<string | undefined>(
    selectedOrder?.memo_history
  );

  const updateMembershipOrder = async () => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/member/order/${selectedOrder?.memo_id}`,
        {
          selectedOrder: selectedOrder,
          purchaseDate: purchaseDate,
          startDate: startDate,
          endDate: endDate,
          reason: reason,
          remainingCounts: remainingCounts,
        }
      );
      setMembershipModalToggle(false);
      setSelectedOrder(undefined);
      await fetchData();
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div
      id="change-membership-modal"
      className="overflow-y-hidden
      overflow-x-hidden
      fixed top-0 right-0 left-0 z-50 justify-center items-center w-full inset-0 max-h-full"
    >
      <div className="fixed top-0 right-0 left-0 w-full max-h-full min-h-screen bg-black opacity-50"></div>
      <div className="absolute bottom-0 overflow-y-scroll bg-white animate-openModalMobile sm:animate-openModalPC w-full sm:w-full sm:max-w-screen-sm sm:h-full sm:min-h-screen sm:top-0 right-0 z-80">
        {/* Modal content */}
        <div className="relative">
          {/* Modal header */}
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
            <h3 className="text-xl font-semibold text-gray-900">회원권 수정</h3>
            <button
              type="button"
              className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
              data-modal-hide="authentication-modal"
              onClick={() => setMembershipModalToggle(false)}
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
          {/* Modal body  */}
          <div className="p-4 md:p-5 flex flex-col items-center">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500">
              <tbody>
                <tr className="border-b border-gray-200 h-12">
                  <th
                    scope="row"
                    className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                  >
                    회원권
                  </th>
                  <td className="px-6 py-2 bg-white text-black max-w-52">
                    {selectedOrder?.memo_pro_name}
                  </td>
                </tr>

                <tr className="border-b border-gray-200 h-12">
                  <th
                    scope="row"
                    className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                  >
                    회원권형태
                  </th>
                  <td className="px-6 py-2 text-black">
                    {selectedOrder?.pro_type}
                  </td>
                </tr>

                <tr className="border-b border-gray-200 h-12">
                  <th
                    scope="row"
                    className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                  >
                    구매일자
                  </th>
                  <td className="px-6 py-2 bg-white text-black flex">
                    <Datepicker
                      language="kr"
                      defaultDate={purchaseDate}
                      onSelectedDateChanged={(e: Date) => setPurchaseDate(e)}
                      labelTodayButton="오늘"
                      labelClearButton="끄기"
                      theme={{
                        popup: { root: { base: "" } },
                      }}
                    />
                  </td>
                </tr>

                <tr className="border-b border-gray-200 h-12">
                  <th
                    scope="row"
                    className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                  >
                    시작일자
                  </th>
                  <td className="px-6 py-2 text-black flex">
                    <Datepicker
                      language="kr"
                      defaultDate={startDate}
                      onSelectedDateChanged={(e: Date) => setStartDate(e)}
                      labelTodayButton="오늘"
                      labelClearButton="끄기"
                      theme={{
                        popup: { root: { base: "" } },
                      }}
                    />
                  </td>
                </tr>
                <tr className="border-b border-gray-200 h-12">
                  <th
                    scope="row"
                    className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                  >
                    만기일자
                  </th>
                  <td className="px-6 py-2 text-black flex">
                    <Datepicker
                      language="kr"
                      defaultDate={endDate}
                      onSelectedDateChanged={(e: Date) => setEndDate(e)}
                      labelTodayButton="오늘"
                      labelClearButton="끄기"
                      theme={{
                        popup: { root: { base: "" } },
                      }}
                    />
                  </td>
                </tr>
                {selectedOrder?.pro_type === "회차권" ? (
                  <tr className="border-b border-gray-200 h-12">
                    <th
                      scope="row"
                      className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                    >
                      남은횟수
                    </th>
                    <td className="px-6 py-2 bg-white text-black">
                      <input
                        type="text"
                        id="checkin_number"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-1.5"
                        placeholder="남은횟수를 입력해주세요."
                        maxLength={11}
                        value={remainingCounts}
                        onChange={(e) =>
                          setRemainingCounts(
                            Number(removeNonNumeric(e.target.value))
                          )
                        }
                      />
                    </td>
                  </tr>
                ) : null}
                <tr className="border-b border-gray-200 h-12">
                  <th
                    scope="row"
                    className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                  >
                    메모
                  </th>
                  <td className="px-6 py-2 bg-white text-black">
                    <textarea
                      className="h-40 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-1.5"
                      value={reason || ""}
                      maxLength={3000}
                      onChange={(e) => setReason(e.target.value)}
                    ></textarea>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="p-5">
              <button
                type="button"
                className="block rounded-full bg-green-600 px-10 py-3 text-center text-sm text-white font-extrabold shadow-sm hover:text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                onClick={updateMembershipOrder}
              >
                수정
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipModal;
