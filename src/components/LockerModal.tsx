import React, { useCallback, useEffect, useState } from "react";
import dayjs from "dayjs";
import { getMonth, getYear } from "date-fns";
import DatePicker from "react-datepicker";
import { ko } from "date-fns/locale";
import { convertAmount, convertDate, convertPhone } from "../utils/formatUtils";
import MemberList from "./MemberList";
import SelectMemberPopup from "./SelectMemberPopup";
import { Member, LockerDetail, LockerType } from "../utils/types";
import axios from "axios";
import { useUserStore } from "../store/store";
import { useNavigate } from "react-router-dom";

interface ModalProps {
  modalOpen: boolean;
  setModalToggle: React.Dispatch<React.SetStateAction<boolean>>;
  center_id: number;
  locker_id: number;
  locker_number: number;
  onSuccess: () => Promise<void>;
  form: LockerType;
  free_position: number;
}

const LockerModal: React.FC<ModalProps> = ({
  modalOpen,
  setModalToggle,
  center_id,
  locker_id,
  locker_number: initialLockerNumber,
  onSuccess,
  form,
  free_position,
}) => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const [isPopup, setIsPopup] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [lockerStatus, setLockerStatus] = useState<string>("AVAILABLE");
  const [lockerDetailMemo, setLockerDetailMemo] = useState<
    string | undefined
  >();
  const [lockerNumber, setLockerNumber] = useState(
    form.sort_type === "FREE" ? "" : initialLockerNumber
  );

  // 라커 상태 옵션
  const lockerStatusOptions = [
    { id: "available", value: "AVAILABLE", label: "사용 가능" },
    { id: "occupied", value: "OCCUPIED", label: "사용 중" },
    { id: "unavailable", value: "UNAVAILABLE", label: "사용 불가" },
    { id: "owner_only", value: "OWNER_ONLY", label: "점주 전용" },
  ];

  // 날짜 옵션
  const datePickerFields = [
    {
      id: "start",
      label: "시작일자",
      selected: startDate,
      onChange: (date: Date | null) => {
        if (date) {
          setStartDate(date);
          if (endDate && endDate < date) {
            setEndDate(date);
          }
        }
      },
      selectsStart: true,
      selectsEnd: false,
      minDate: undefined,
    },
    {
      id: "end",
      label: "종료일자",
      selected: endDate,
      onChange: (date: Date | null) => {
        if (date) {
          setEndDate(date);
        }
      },
      selectsStart: false,
      selectsEnd: true,
      minDate: startDate,
    },
  ];

  // 회원 선택 핸들러
  const handleMemberSelect = (member: Member) => {
    setSelectedMember(member);
    setLockerStatus("OCCUPIED");
  };

  // 사용 여부 변경 핸들러 수정
  const handleStatusChange = (value: string) => {
    setLockerStatus(value);

    // 사옹 가능, 사용 불가 선택시 옵션 초기화
    if (value === "AVAILABLE" || value === "UNAVAILABLE") {
      setSelectedMember(null);
      setStartDate(new Date());
      setEndDate(new Date());
      setLockerDetailMemo("");
    }
  };

  // 라커 상세 정보 등록
  const modifyLockerDetail = useCallback(async () => {
    if (lockerStatus == "OCCUPIED" && !selectedMember) {
      alert("사용 중 상태일 땐 회원을 선택해주세요.");
      return;
    }

    if (form.sort_type === "FREE" && !lockerNumber) {
      alert("사물함 번호를 입력해주세요.");
      return;
    }

    const userConfirmed = window.confirm("사물함 정보를 갱신 하시겠습니까?");
    if (!userConfirmed) return;

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/locker/modifyLockerDetail`,
        {
          locker_id,
          locker_number: Number(lockerNumber),
          locker_status: lockerStatus,
          locker_detail_memo: lockerDetailMemo,
          mem_id: selectedMember?.mem_id || null,
          locker_start_dt: startDate
            ? dayjs(startDate).format("YYYY-MM-DD")
            : null,
          locker_end_dt: endDate ? dayjs(endDate).format("YYYY-MM-DD") : null,
          ...(form.sort_type === "FREE" && {
            free_position: free_position,
          }),
          center_id: user?.center_id,
        }
      );

      // 먼저 데이터를 새로고침
      await onSuccess();

      // 성공 메시지 표시
      alert("수정되었습니다.");

      // 모달 닫기
      setModalToggle(false);
    } catch (error) {
      console.error(error);
      alert("오류가 발생했습니다.");
    }
  }, [
    user,
    selectedMember,
    lockerStatus,
    startDate,
    endDate,
    locker_id,
    lockerDetailMemo,
    onSuccess,
    lockerNumber,
    form.sort_type,
    free_position,
    setModalToggle,
  ]);

  // 라커 상세 정보 조회
  const getLockerDetail = useCallback(async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/locker/getLockerDetail`,
        {
          params: user,
        }
      );

      // 현재 사물함 정보 찾기
      const currentLocker = res.data.result.find(
        (detail: LockerDetail) =>
          detail.locker_id === locker_id &&
          (form.sort_type === "FREE"
            ? detail.free_position === free_position
            : detail.locker_number === Number(lockerNumber))
      );

      // 찾은 정보가 있으면 상태 업데이트
      if (currentLocker) {
        setSelectedMember(currentLocker);
        setLockerStatus(currentLocker.locker_status || "AVAILABLE");
        setLockerDetailMemo(currentLocker.locker_detail_memo || "");

        if (currentLocker.locker_start_dt) {
          setStartDate(dayjs(currentLocker.locker_start_dt).toDate());
        }
        if (currentLocker.locker_end_dt) {
          setEndDate(dayjs(currentLocker.locker_end_dt).toDate());
        }

        // 자유 입력일 때는 실제 사물함 번호 설정
        if (form.sort_type === "FREE") {
          setLockerNumber(currentLocker.locker_number.toString());
        }
      } else {
        // 데이터가 없을 때는 오늘 날짜로 설정
        setStartDate(new Date());
        setEndDate(new Date());
      }
    } catch (e) {
      console.log(e);
    }
  }, [locker_id, lockerNumber, form.sort_type, free_position]);

  // 컴포넌트가 마운트될 때 데이터 조회
  useEffect(() => {
    getLockerDetail();
  }, [getLockerDetail]);

  // 모달 오픈시 스크롤 방지
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    // 컴포넌트 언마운트 시 스크롤 복구
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [modalOpen]);

  return (
    <div
      id="add-inquiry-modal"
      className="overflow-y-auto
      overflow-x-hidden
      fixed top-0 right-0 left-0 z-50 justify-center items-center w-full inset-0 max-h-full"
    >
      <div className="fixed top-0 right-0 left-0 w-full max-h-full min-h-screen bg-black opacity-50"></div>
      <div className="overflow-scroll absolute bottom-0 bg-white animate-openModalMobile sm:animate-openModalPC w-full sm:w-auto lg:w-full lg:max-w-screen-sm sm:h-full sm:min-h-screen sm:top-0 right-0 z-80">
        {/* Modal content */}
        <div className="relative">
          {/* Modal header */}
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
            <h3 className="text-xl font-semibold text-gray-900">
              사물함 회원 등록
            </h3>
            <button
              type="button"
              className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
              data-modal-hide="authentication-modal"
              onClick={() => setModalToggle(false)}
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
                {/* 사물함 번호 */}
                <tr className="border-b border-gray-200 h-12">
                  <td className="text-center w-32 p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4">
                    번호
                  </td>
                  <td className="px-6 py-2 bg-white text-black">
                    <div className="flex items-center">
                      {form.sort_type === "FREE" ? (
                        <input
                          type="text"
                          value={lockerNumber}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.length > 3) {
                              e.preventDefault();
                              return;
                            }
                            if (value === "" || /^[1-9]\d{0,2}$/.test(value)) {
                              setLockerNumber(value);
                            }
                          }}
                          className="w-24 px-2 py-1 border border-gray-300 rounded"
                          maxLength={3}
                          pattern="[1-9][0-9]{0,2}"
                          placeholder="번호 입력"
                          required
                        />
                      ) : (
                        <p>{lockerNumber}</p>
                      )}
                    </div>
                  </td>
                </tr>

                {/* 회원 */}
                <tr className="border-b border-gray-200 h-12">
                  <td className="text-center w-32 p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4">
                    회원
                  </td>
                  <td className="px-6 py-2 bg-white text-black flex items-center">
                    <button
                      type="button"
                      className="bg-blue-600 hover:bg-blue-700 block rounded-lg px-5 py-2 text-center text-sm text-white font-extrabold shadow-sm hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                      onClick={() => {
                        setIsPopup(true);
                      }}
                    >
                      선택
                    </button>
                    {selectedMember && lockerStatus == "OCCUPIED" && (
                      <div className="flex items-center ml-3">
                        <span className="font-medium">
                          이름 :{" "}
                          {selectedMember?.mem_name
                            ? selectedMember?.mem_name
                            : "-"}
                        </span>
                        &nbsp;/&nbsp;
                        <span className="font-medium">
                          전화번호 :{" "}
                          {selectedMember?.mem_phone
                            ? convertPhone(selectedMember?.mem_phone)
                            : "-"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMember(null);
                            setLockerStatus("AVAILABLE");
                            setStartDate(new Date());
                            setEndDate(new Date());
                            setLockerDetailMemo("");
                          }}
                          className="ml-2 w-4 h-4 relative text-gray-400 hover:text-gray-600 before:content-[''] before:absolute before:w-full before:h-0.5 before:bg-current before:top-1/2 before:-translate-y-1/2 before:rotate-45 after:content-[''] after:absolute after:w-full after:h-0.5 after:bg-current after:top-1/2 after:-translate-y-1/2 after:-rotate-45"
                        />
                      </div>
                    )}
                  </td>
                </tr>

                {/* 사용 여부 */}
                <tr className="border-b border-gray-200 h-12">
                  <td className="text-center w-32 p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4">
                    사용 여부
                  </td>
                  <td className="px-6 py-2 bg-white text-black">
                    <div className="flex items-center">
                      {lockerStatusOptions.map((option) => (
                        <div key={option.id} className="flex items-center mr-6">
                          <input
                            id={`locker_status_${option.id}`}
                            type="radio"
                            value={option.value}
                            name="locker_status"
                            checked={lockerStatus === option.value}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 focus:ring-2"
                          />
                          <label
                            htmlFor={`locker_status_${option.id}`}
                            className="ms-2 text-sm font-medium text-gray-900"
                          >
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
                {/* 시작/종료 일자 */}
                {datePickerFields.map((field) => (
                  <tr key={field.id} className="border-b border-gray-200 h-12">
                    <td className="text-center w-32 p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4">
                      {field.label}
                    </td>
                    <td className="px-6 py-2 bg-white text-black flex items-center">
                      <div className="flex items-center">
                        <div className="relative">
                          <div className="absolute z-30 inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                            <svg
                              className="w-4 h-4 text-gray-500"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
                            </svg>
                          </div>
                          <DatePicker
                            selected={field.selected}
                            onChange={field.onChange}
                            selectsStart={field.selectsStart}
                            selectsEnd={field.selectsEnd}
                            startDate={startDate}
                            endDate={endDate}
                            minDate={field.minDate}
                            dateFormat="yyyy-MM-dd"
                            locale={ko}
                            className="bg-gray-50 border cursor-pointer border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full ps-10 p-2.5"
                            renderCustomHeader={({
                              date,
                              decreaseMonth,
                              increaseMonth,
                              prevMonthButtonDisabled,
                              nextMonthButtonDisabled,
                            }) => (
                              <div className="flex items-center justify-between px-2 py-2">
                                <button
                                  type="button"
                                  onClick={decreaseMonth}
                                  disabled={prevMonthButtonDisabled}
                                  className="p-1 hover:bg-gray-100 rounded-lg"
                                >
                                  <svg
                                    className="w-4 h-4 text-gray-800"
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      stroke="currentColor"
                                      strokeWidth={2}
                                      d="m15 19-7-7 7-7"
                                    />
                                  </svg>
                                </button>
                                <span className="text-lg font-semibold">
                                  {getYear(date)}년 {getMonth(date) + 1}월
                                </span>
                                <button
                                  type="button"
                                  onClick={increaseMonth}
                                  disabled={nextMonthButtonDisabled}
                                  className="p-1 hover:bg-gray-100 rounded-lg"
                                >
                                  <svg
                                    className="w-4 h-4 text-gray-800"
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      stroke="currentColor"
                                      strokeWidth={2}
                                      d="m9 5 7 7-7 7"
                                    />
                                  </svg>
                                </button>
                              </div>
                            )}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* 사물함 메모 */}
                <tr className="border-b border-gray-200 h-12">
                  <td className="text-center w-32 p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4">
                    메모
                  </td>
                  <td className="px-6 py-2 bg-white text-black">
                    <div className="flex items-center">
                      <textarea
                        className="h-40 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-1.5"
                        value={lockerDetailMemo}
                        maxLength={3000}
                        onChange={(e) => setLockerDetailMemo(e.target.value)}
                      ></textarea>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="p-5">
              <button
                type="button"
                className="block rounded-full bg-green-600 px-10 py-3 text-center text-sm text-white font-extrabold shadow-sm hover:text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                onClick={modifyLockerDetail}
              >
                {selectedMember ? "수정" : "등록"}
              </button>
            </div>
            {isPopup && (
              <div>
                <SelectMemberPopup
                  setModalToggle={setIsPopup}
                  onMemberSelect={handleMemberSelect}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LockerModal;
