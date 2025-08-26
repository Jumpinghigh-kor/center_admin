import axios from "axios";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useUserStore } from "../store/store";
import { convertDate, convertPhone } from "../utils/formatUtils";
import { Datepicker } from "flowbite-react";
import dayjs from "dayjs";

type Members = {
  mem_id: number;
  sch_info: string;
  memo_id: number;
  mem_name: string;
  mem_phone: string;
  memo_start_date: string;
  memo_end_date: string;
  pro_type: string;
  memo_remaining_counts: number | null;
};

const ScheduleDetail: React.FC = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [members, setMembers] = useState<Members[]>([]);
  const [selectedIds, setSelectedIds] = useState<Members[]>([]);
  const [allChecked, setAllChecked] = useState(false);
  const [confirm, setConfirm] = useState<Boolean>(false);

  useEffect(() => {
    const getDetail = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/schedule/${id}`,
          { params: user }
        );
        setMembers(res.data.result);
      } catch (e) {
        console.log(e);
      }
    };
    getDetail();
  }, [id, user]);

  const onSelectedDateChanged = (e: Date) => {
    setDate(dayjs(e).format("YYYY-MM-DD"));
  };

  const toggleCheck = (order: Members) => {
    setSelectedIds((prevSelectedIds) =>
      prevSelectedIds.some((selected) => selected.memo_id === order.memo_id)
        ? prevSelectedIds.filter(
            (selected) => selected.memo_id !== order.memo_id
          )
        : [...prevSelectedIds, order]
    );
  };

  const toggleAllChecks = () => {
    if (allChecked) {
      setSelectedIds([]); // 전체 해제
    } else {
      setSelectedIds(members.map((member) => member)); // 전체 선택
    }
    setAllChecked(!allChecked);
  };

  const handleAttendance = async () => {
    if (selectedIds.length === 0) {
      return alert("인원을 선택해 주세요.");
    }
    setConfirm(true);
  };

  const addAttendance = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/log/checkin/members`, [
        selectedIds,
        user,
        date,
      ]);
      alert("출석체크가 정상적으로 되었습니다.");
      setSelectedIds([]); // 출석 전송 후 체크 상태 초기화
      setAllChecked(false);
      navigate("/members/checkinlist");
    } catch (error) {
      console.error("출석 정보 전송 실패:", error);
    }
  };

  if (confirm) {
    //모달 오픈시 스크롤 방지
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }

  return (
    <div className="p-3 sm:p-10">
      <div className="flex justify-between">
        <span className="font-bold text-xl">{state} 수업 현황</span>
        <div className="flex items-center">
          <Datepicker
            language="kr"
            onSelectedDateChanged={onSelectedDateChanged}
            labelTodayButton="오늘"
            labelClearButton="끄기"
          />
          <button
            type="submit"
            className={`${
              selectedIds.length === 0
                ? "bg-gray-400"
                : "bg-green-600 hover:bg-green-700"
            } ml-2 block rounded-2xl px-4 py-1 text-center text-sm text-white font-extrabold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600`}
            onClick={handleAttendance}
            disabled={selectedIds.length === 0}
          >
            출석
          </button>
        </div>
      </div>

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg my-4">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500">
          <thead className="text-xs text-white font-bold uppercase bg-custom-C4C4C4">
            <tr onClick={toggleAllChecks}>
              <th scope="col" className="sm:px-2 lg:px-6 py-3 text-center">
                <input type="checkbox" checked={allChecked} readOnly />
              </th>
              <th scope="col" className="sm:px-2 lg:px-6 py-3 text-center">
                NO
              </th>
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
                연락처
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                시작일
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                만기일자
              </th>
              <th
                scope="col"
                className="text-base px-1 sm:px-2 lg:px-6 py-3 text-center"
              >
                남은횟수
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, index) => (
              <tr
                key={member.memo_id}
                className={`bg-white border-b hover:bg-gray-100`}
                onClick={() => toggleCheck(member)}
              >
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  <input
                    type="checkbox"
                    checked={selectedIds.some(
                      (selected) => selected.memo_id === member.memo_id
                    )}
                    readOnly
                  />
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {index + 1}
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {member.mem_name}
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {convertPhone(member.mem_phone)}
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {convertDate(member.memo_start_date)}
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {convertDate(member.memo_end_date)}
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center">
                  {member.pro_type === "회차권"
                    ? member.memo_remaining_counts
                    : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* 확인 모달 */}
      <div
        id="add-schedule-modal"
        className={`${confirm ? "block" : "hidden"} overflow-y-hidden
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
                onClick={() => setConfirm(false)}
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
                className={`w-11 h-11 mb-3.5 mx-auto text-gray-400`}
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm14-7.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm0 4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm-5-4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm0 4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm-5-4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm0 4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1ZM20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4Z" />
              </svg>
              <p className="mb-4 text-gray-500">
                {date} 출석체크 하시겠습니까?
              </p>
              <p className="text-gray-400">가맹점주가 출석처리 하는 경우</p>
              <p className="mb-4 text-gray-400">
                출입시간은 기록되지 않습니다.
              </p>
              <div className="flex justify-center items-center space-x-4">
                <button
                  data-modal-toggle="deleteModal"
                  type="button"
                  className="py-2 px-3 text-sm font-medium text-gray-500 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-primary-300 hover:text-gray-900 focus:z-10"
                  onClick={() => setConfirm(false)}
                >
                  아니요. 취소할래요
                </button>
                <button
                  type="submit"
                  className="py-2 px-3 text-sm font-medium text-center text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-red-300"
                  onClick={addAttendance}
                >
                  네. 등록할게요
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleDetail;
