import React, { useState } from "react";
import { convertDate } from "../utils/formatUtils";
import axios from "axios";

interface Message {
  status: boolean;
  message: string;
}

interface Membership {
  memo_id: number;
  memo_remaining_counts: number;
  memo_start_date: string;
  memo_end_date: string;
  pro_name: string;
  pro_type: string;
}

const initialMembership: Membership = {
  memo_id: 0,
  memo_remaining_counts: 0,
  memo_start_date: "",
  memo_end_date: "",
  pro_name: "",
  pro_type: "",
};

interface ModalProps {
  setSelectionModal: React.Dispatch<React.SetStateAction<boolean>>;
  setModal: React.Dispatch<React.SetStateAction<boolean>>;
  setMessage: React.Dispatch<React.SetStateAction<Message | undefined>>;
  memberships: Membership[];
  name: string;
  onSuccess: () => void;
}

const MembershipSelectionModal: React.FC<ModalProps> = ({
  setSelectionModal,
  setModal,
  setMessage,
  memberships,
  name,
  onSuccess,
}) => {
  const [selectedMembership, setSelectedMembership] =
    useState<Membership>(initialMembership);
  const submitSelectedMembership = async () => {
    if (selectedMembership.memo_id === 0) {
      return;
    }
    try {
      const result = await axios.post(
        `${process.env.REACT_APP_API_URL}/log/checkin/selection`,
        { order: selectedMembership, name: name }
      );
      setMessage(result.data);
      setModal(true);

      // 출석이 성공적으로 완료되었을 때 소리 재생
      if (result.data.status) {
        onSuccess();
      }

      setTimeout(() => {
        setModal(false);
      }, 3000);
    } catch (e) {
      console.log(e);
    } finally {
      setSelectionModal(false);
      setSelectedMembership(initialMembership);
    }
  };
  return (
    <div>
      <div className="fixed top-0 right-0 left-0 w-full max-h-full min-h-screen bg-black opacity-50"></div>
      <div
        id="select-modal"
        className="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full"
      >
        <div className="relative p-4 w-full max-w-md max-h-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative bg-white rounded-lg shadow">
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
              <h3 className="text-lg font-semibold text-gray-900">
                회원권 선택
              </h3>
              <button
                type="button"
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm h-8 w-8 ms-auto inline-flex justify-center items-center"
                data-modal-toggle="select-modal"
                onClick={() => setSelectionModal(false)}
              >
                <svg
                  className="w-3 h-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 14"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                  />
                </svg>
                <span className="sr-only">Close modal</span>
              </button>
            </div>
            <div className="p-4 md:p-5">
              <p className="text-gray-500 mb-4">
                {name}님, 이용하실 회원권을 선택해주세요.
              </p>
              <ul className="space-y-4 mb-4">
                {memberships.map((membership) => (
                  <li
                    key={membership.memo_id}
                    onClick={() => setSelectedMembership(membership)}
                  >
                    <input
                      type="radio"
                      id={`membership_${membership.memo_id}`}
                      name="job"
                      value={`membership_${membership.memo_id}`}
                      className="hidden peer"
                      required
                    />
                    <label
                      htmlFor={`membership_${membership.memo_id}`}
                      className="inline-flex items-center justify-between w-full p-5 text-gray-900 bg-white border border-gray-200 rounded-lg cursor-pointer peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-gray-900 hover:bg-gray-100"
                    >
                      <div className="block">
                        <div className="w-full text-lg font-semibold">
                          {membership.pro_name}
                        </div>
                        <div className="w-full text-gray-500">
                          {membership.pro_type === "회차권"
                            ? `남은횟수 : ${membership.memo_remaining_counts}`
                            : `${convertDate(
                                membership.memo_start_date
                              )} ~ ${convertDate(membership.memo_end_date)}`}
                        </div>
                      </div>
                      <svg
                        className="w-4 h-4 ms-3 rtl:rotate-180 text-gray-500"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 14 10"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M1 5h12m0 0L9 1m4 4L9 9"
                        />
                      </svg>
                    </label>
                  </li>
                ))}
              </ul>
              <button
                onClick={submitSelectedMembership}
                className="text-white inline-flex w-full justify-center bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
              >
                선택
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipSelectionModal;
