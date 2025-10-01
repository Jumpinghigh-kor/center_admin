import axios from "axios";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { useUserStore } from "../store/store";
import {
  convertDateTime,
  convertDate,
  convertPhone,
} from "../utils/formatUtils";
import { Datepicker } from "flowbite-react";
import { openInputDatePicker } from "../utils/commonUtils";
import DeleteCheckinLogModal from "../components/DeleteCheckinLogModal";

type Log = {
  mem_name: string;
  mem_phone: string;
  mem_checkin_number: string;
  sch_time: string;
  ci_date: string;
  ci_id: number;
};

const MembersCheckInList: React.FC = () => {
  const [deleteModalToggle, setDeleteModalToggle] = useState<boolean>(false);
  const [addModalToggle, setAddModalToggle] = useState<boolean>(false);
  const user = useUserStore((state) => state.user);
  console.log(user);
  const [logs, setLogs] = useState<Log[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [selectedLog, setSelectedLog] = useState<Number>(0);
  const [checkinNumber, setCheckinNumber] = useState<string>("");
  const [checkinDate, setCheckinDate] = useState<string>("");
  const [memberName, setMemberName] = useState<string>("");
  const [memberships, setMemberships] = useState<any[]>([]);
  const [isSearched, setIsSearched] = useState<boolean>(false);
  const [selectedMembership, setSelectedMembership] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [memberSearchResults, setMemberSearchResults] = useState<any[]>([]);
  const [searchType, setSearchType] = useState<string>("number");
  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number>(-1);
  const [memberSearchPerformed, setMemberSearchPerformed] =
    useState<boolean>(false);
  const checkinDateInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const result = await axios.get(
        `${process.env.REACT_APP_API_URL}/log/checkin`,
        {
          params: { user: user },
        }
      );
      setSelectedLog(0);
      setLogs(result.data.result);
    } catch (e) {
      console.log(e);
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      await fetchData();
    };

    loadData();
  }, [fetchData]);

  const onSelectedDateChanged = async (e: Date) => {
    setDate(e);
    setSelectedLog(0);
    try {
      const result = await axios.get(
        `${process.env.REACT_APP_API_URL}/log/checkin`,
        {
          params: { user: user, date: e },
        }
      );
      setLogs(result.data.result);
    } catch (e) {
      console.log(e);
    }
  };

  const handleSearch = async () => {
    if (searchType === "number" && (!checkinNumber || !checkinDate)) {
      alert("회원 번호와 출입 시간을 입력해주세요");
      return;
    }

    if (searchType === "name" && (!memberName || !checkinDate)) {
      alert("회원 이름과 출입 시간을 입력해주세요");
      return;
    }

    if (
      searchType === "name" &&
      memberSearchResults.length > 0 &&
      selectedMemberIndex === -1
    ) {
      alert("회원을 선택해주세요");
      return;
    }

    try {
      const result = await axios.post(
        `${process.env.REACT_APP_API_URL}/log/checkin/target`,
        {
          checkinNumber: checkinNumber,
          checkinDate: checkinDate,
          center_id: user.center_id,
        }
      );
      setMemberships(result.data.result);
      setIsSearched(true);
    } catch (e) {
      console.log(e);
      setMemberships([]);
      setIsSearched(true);
    }
  };

  const handleRegister = async () => {
    try {
      const selectedMembershipData = memberships.find(
        (m) => m.memo_id == selectedMembership
      );

      const result = await axios.post(
        `${process.env.REACT_APP_API_URL}/log/checkin/members`,
        [
          [
            {
              mem_id: selectedMembershipData.mem_id,
              memo_id: selectedMembershipData.memo_id,
              pro_type: selectedMembershipData.pro_type,
            },
          ],
          { center_id: user.center_id },
          checkinDate,
        ]
      );
      alert("등록이 완료되었습니다.");
      setAddModalToggle(false);
      setCheckinNumber("");
      setCheckinDate("");
      setSelectedMembership("");
      setMemberships([]);
      setIsSearched(false);
      setMemberName("");
      setDate(new Date());
      onSelectedDateChanged(new Date());
    } catch (e) {
      console.log(e);
      alert("등록 중 오류가 발생했습니다.");
    }
  };

  const handleMemberSearch = async () => {
    if (!memberName.trim()) {
      alert("회원 이름을 입력해주세요");
      return;
    }

    try {
      const result = await axios.post(
        `${process.env.REACT_APP_API_URL}/member/allMemberList`,
        {
          params: {
            user: user,
            center_id: user.center_id,
            mem_name: memberName,
            mem_gender: "",
          },
        }
      );
      setMemberSearchResults(result.data.result);
      setMemberSearchPerformed(true);
    } catch (e) {
      console.log(e);
      setMemberSearchResults([]);
      setMemberSearchPerformed(true);
    }
  };

  return (
    <div className="p-3 sm:p-10">
      <div className="flex justify-between items-center">
        <span className="font-bold text-xl">회원 출입 내역</span>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
          onClick={() => {
            setIsEditMode(false);
            setCheckinNumber("");
            setCheckinDate("");
            setMemberName("");
            setSelectedMembership("");
            setMemberships([]);
            setIsSearched(false);
            setMemberSearchResults([]);
            setSelectedMemberIndex(-1);
            setMemberSearchPerformed(false);
            setAddModalToggle(true);
          }}
        >
          추가 등록
        </button>
      </div>
      <div className="flex justify-center items-center my-4">
        <span className="font-bold text-3xl mb-1 cursor-pointer">
          <Datepicker
            key={date.getTime()}
            language="kr"
            defaultDate={date}
            onSelectedDateChanged={onSelectedDateChanged}
            labelTodayButton="오늘"
            labelClearButton="끄기"
            className="cursor-pointer"
          />
        </span>
      </div>
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg my-4">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500">
          <thead className="text-xs text-white font-bold uppercase bg-custom-C4C4C4">
            <tr>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              ></th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                이름
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                휴대폰
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                수업시간
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                출입시간
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr className="bg-white border-b">
                <td
                  className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base"
                  colSpan={5}
                >
                  조회된 내용이 없습니다
                </td>
              </tr>
            ) : (
              logs.map((log, index) => (
                <tr
                  key={index}
                  className={`${
                    selectedLog === log.ci_id ? `bg-gray-100` : `bg-white`
                  } border-b hover:bg-gray-100`}
                  onClick={() => setSelectedLog(log.ci_id)}
                >
                  <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                    {index + 1}
                  </td>
                  <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                    {log.mem_name}
                  </td>
                  <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                    {convertPhone(log.mem_phone)}
                  </td>
                  <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                    {log.sch_time}
                  </td>
                  <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                    {convertDateTime(log.ci_date)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end space-x-2">
        <button
          disabled={!selectedLog}
          className={`${
            !selectedLog
              ? "bg-gray-400"
              : "bg-blue-600 cursor-pointer hover:bg-blue-700"
          } block rounded-2xl px-4 py-1 text-center text-sm text-white font-extrabold shadow-sm hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600`}
          onClick={() => {
            const selectedLogData = logs.find(
              (log) => log.ci_id === selectedLog
            );
            if (selectedLogData) {
              setCheckinNumber(selectedLogData.mem_checkin_number);
              const dateObj = new Date(selectedLogData.ci_date);
              dateObj.setHours(dateObj.getHours() + 9);
              setCheckinDate(dateObj.toISOString().slice(0, 16));
              setMemberName(selectedLogData.mem_name);
              setSearchType("number");
              setIsEditMode(true);
              setAddModalToggle(true);
            }
          }}
        >
          변경
        </button>
        <button
          disabled={!selectedLog}
          className={`${
            !selectedLog
              ? "bg-gray-400"
              : "bg-red-600 cursor-pointer hover:bg-red-700"
          } block rounded-2xl px-4 py-1 text-center text-sm text-white font-extrabold shadow-sm hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600`}
          onClick={() => {
            setDeleteModalToggle(true);
          }}
        >
          삭제
        </button>
      </div>
      {deleteModalToggle ? (
        <DeleteCheckinLogModal
          setDeleteModalToggle={setDeleteModalToggle}
          selectedLog={selectedLog}
          fetchData={fetchData}
        />
      ) : null}

      {addModalToggle ? (
        <div className="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-full max-h-full flex">
          <div className="fixed top-0 right-0 left-0 w-full max-h-full min-h-screen bg-black opacity-50"></div>
          <div className="relative p-4 w-full max-w-md max-h-full">
            <div className="relative bg-white rounded-lg shadow">
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
                <h3 className="text-lg font-semibold text-gray-900">
                  출입 내역 {isEditMode ? "변경" : "추가 등록"}
                </h3>
                <button
                  type="button"
                  className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm h-8 w-8 ms-auto inline-flex justify-center items-center"
                  onClick={() => setAddModalToggle(false)}
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
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center space-x-4 mb-3">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="searchType"
                          value="number"
                          checked={searchType === "number"}
                          onChange={(e) => {
                            setSearchType(e.target.value);
                            setMemberName("");
                            setCheckinNumber("");
                            setMemberSearchResults([]);
                            setMemberships([]);
                            setIsSearched(false);
                            setSelectedMembership("");
                            setSelectedMemberIndex(-1);
                            setMemberSearchPerformed(false);
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          회원 번호로 찾기
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="searchType"
                          value="name"
                          checked={searchType === "name"}
                          onChange={(e) => {
                            setSearchType(e.target.value);
                            setMemberName("");
                            setCheckinNumber("");
                            setMemberSearchResults([]);
                            setMemberships([]);
                            setIsSearched(false);
                            setSelectedMembership("");
                            setSelectedMemberIndex(-1);
                            setMemberSearchPerformed(false);
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          회원 이름으로 찾기
                        </span>
                      </label>
                    </div>
                    {searchType === "name" ? (
                      <div>
                        <label className="block mb-2 text-base font-medium text-gray-900">
                          회원 이름
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="회원 이름을 입력하세요"
                            value={memberName}
                            onChange={(e) => setMemberName(e.target.value)}
                          />
                          <button
                            type="button"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                            onClick={handleMemberSearch}
                          >
                            확인
                          </button>
                        </div>
                        {memberSearchResults.length > 0 && (
                          <div className="mt-2 border border-gray-300 rounded-lg max-h-40 overflow-y-auto">
                            {memberSearchResults.map((member, index) => (
                              <div
                                key={index}
                                className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 ${
                                  selectedMemberIndex === index
                                    ? "border-l-4 border-l-blue-500 bg-blue-50"
                                    : ""
                                }`}
                                onClick={() => {
                                  setMemberName(member.mem_name);
                                  setCheckinNumber(member.mem_checkin_number);
                                  setSelectedMemberIndex(index);
                                  setMemberships([]);
                                  setIsSearched(false);
                                  setSelectedMembership("");
                                }}
                              >
                                <div className="text-sm font-medium text-gray-900">
                                  {member.mem_name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  회원번호: {member.mem_checkin_number}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {memberSearchPerformed &&
                          memberSearchResults.length === 0 && (
                            <div className="mt-2 px-3 py-2 text-red-500 text-sm">
                              검색한 회원이 없습니다.
                            </div>
                          )}
                      </div>
                    ) : (
                      <div>
                        <label className="block mb-2 text-base font-medium text-gray-900">
                          회원 번호
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="회원 번호를 입력하세요"
                          maxLength={12}
                          value={checkinNumber}
                          onChange={(e) => {
                            setCheckinNumber(e.target.value);
                            setMemberships([]);
                            setIsSearched(false);
                            setSelectedMembership("");
                            setMemberName("");
                          }}
                          onInput={(e) => {
                            const target = e.target as HTMLInputElement;
                            target.value = target.value.replace(/[^0-9]/g, "");
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block mb-2 text-base font-medium text-gray-900">
                      출입 시간
                    </label>
                    <input
                      onClick={() => openInputDatePicker(checkinDateInputRef.current)}
                      type="datetime-local"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      ref={checkinDateInputRef}
                      value={checkinDate}
                      onChange={(e) => {
                        setCheckinDate(e.target.value);
                        setMemberships([]);
                        setIsSearched(false);
                        setSelectedMembership("");
                        try {
                          e.currentTarget.blur();
                        } catch {}
                      }}
                    />
                  </div>
                  <div className="flex justify-center mt-4">
                    <button
                      type="button"
                      className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                      onClick={handleSearch}
                    >
                      검색
                    </button>
                  </div>
                  <div>
                    <label className="block mb-2 text-base font-medium text-gray-900">
                      회원권 <br />
                      <span className="text-sm text-gray-500">
                        선택하신 출입날짜에 당시 등록됐던 회원권이 노출 됩니다.
                      </span>
                    </label>
                    {isSearched ? (
                      memberships.length > 0 ? (
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={selectedMembership}
                          onChange={(e) =>
                            setSelectedMembership(e.target.value)
                          }
                        >
                          <option value="">회원권을 선택하세요</option>
                          {memberships.map((membership, index) => (
                            <option
                              key={index}
                              value={membership.memo_id}
                              disabled={
                                membership.pro_type === "회차권" &&
                                membership.memo_remaining_counts === 0
                              }
                            >
                              {membership.memo_pro_name || membership.pro_name}
                              {membership.pro_type === "회차권"
                                ? ` (남은횟수: ${membership.memo_remaining_counts}회)`
                                : ` (${convertDate(
                                    membership.memo_start_date
                                  )} ~ ${convertDate(
                                    membership.memo_end_date
                                  )})`}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                          당시 등록되었던 회원권 내역이 없습니다.
                        </div>
                      )
                    ) : (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                        회원 번호랑 출입시간을 먼저 입력해주세요
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-100"
                    onClick={() => setAddModalToggle(false)}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    disabled={
                      !checkinNumber || !checkinDate || !selectedMembership
                    }
                    className={`px-4 py-2 text-sm font-medium rounded-lg ${
                      !checkinNumber || !checkinDate || !selectedMembership
                        ? "text-gray-400 bg-gray-300 cursor-not-allowed"
                        : "text-white bg-blue-600 hover:bg-blue-700"
                    }`}
                    onClick={handleRegister}
                  >
                    {isEditMode ? "변경" : "등록"}
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

export default MembersCheckInList;
