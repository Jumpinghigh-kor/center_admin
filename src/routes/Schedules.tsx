import React, { useCallback, useEffect, useState } from "react";
import AddScheduleModal from "../components/AddScheduleModal";
import axios from "axios";
import { useUserStore } from "../store/store";
import DeleteScheduleModal from "../components/DeleteScheduleModal";
import { Schedule } from "../utils/types";
import { useNavigate } from "react-router-dom";

const initialSchedule: Schedule = {
  sch_id: 0,
  sch_time: "",
  sch_info: "",
  sch_max_cap: 0,
  current_count: 0,
  upcoming_count: 0,
};

const Schedules: React.FC = () => {
  const navigate = useNavigate();
  const [modalToggle, setModalToggle] = useState<boolean>(false);
  const [deleteModalToggle, setDeleteModalToggle] = useState<boolean>(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] =
    useState<Schedule>(initialSchedule);
  const user = useUserStore((state) => state.user);
  const [mode, setMode] = useState<String>("");

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/schedule`, {
        params: user,
      });
      setSelectedSchedule(initialSchedule);
      setSchedules(res.data.result);
    } catch (err) {
      console.log(err);
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      await fetchData();
    };

    loadData();
  }, [fetchData]);

  return (
    <div className="p-3 sm:p-10">
      <div className="flex justify-between">
        <span className="font-bold text-xl">시간표 관리</span>
        <button
          type="submit"
          className="block rounded-2xl bg-green-600 px-4 py-1 text-center text-sm text-white font-extrabold shadow-sm hover:text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          onClick={() => {
            setMode("add");
            setModalToggle(true);
          }}
        >
          등록
        </button>
      </div>
      <p className="text-base">
        등록예정인원이란, 첫 출석일이 되지않아 현재인원에는 빠져있으나 결제를
        완료한 인원을 말합니다.
      </p>
      <p className="text-base">
        현재인원+등록예정인원이 최대인원과 같거나 많을 경우 신규등록에
        주의하시기 바랍니다.
      </p>
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg my-4">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500">
          <thead className="text-xs text-white font-bold uppercase bg-custom-C4C4C4">
            <tr>
              <th scope="col" className="sm:px-2 lg:px-6 py-3 text-center"></th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                시간표이름
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
                현재인원수(+등록예정인원)
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                최대 인원
              </th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((schedule, index) => (
              <tr
                key={schedule.sch_id}
                className={`${
                  selectedSchedule?.sch_id === schedule.sch_id
                    ? `bg-gray-100`
                    : `bg-white`
                } border-b hover:bg-gray-100`}
                onClick={() => setSelectedSchedule(schedule)}
                onDoubleClick={() => {
                  navigate(`/schedules/${selectedSchedule.sch_id}`, {
                    state: selectedSchedule.sch_info,
                  });
                }}
              >
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {index + 1}
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {schedule.sch_info}
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {schedule.sch_time}
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {schedule.current_count}
                  <span className="text-red-500">
                    (+{schedule.upcoming_count})
                  </span>
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {schedule.sch_max_cap}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <button
          disabled={selectedSchedule.sch_id === 0}
          onClick={() => {
            navigate(`/schedules/${selectedSchedule.sch_id}`, {
              state: selectedSchedule.sch_info,
            });
          }}
          className={`${
            selectedSchedule.sch_id === 0
              ? "bg-gray-400"
              : "bg-gray-900 cursor-pointer hover:bg-gray-700"
          } block rounded-2xl mr-3 px-4 py-1 text-center text-sm text-white font-extrabold shadow-sm hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600`}
        >
          자세히 보기
        </button>
        <button
          disabled={selectedSchedule.sch_id === 0}
          className={`${
            selectedSchedule.sch_id === 0
              ? "bg-gray-400"
              : "bg-blue-600 cursor-pointer hover:bg-blue-700"
          } block rounded-2xl mr-3 px-4 py-1 text-center text-sm text-white font-extrabold shadow-sm hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600`}
          onClick={() => {
            setMode("edit");
            setModalToggle(true);
          }}
        >
          수정
        </button>
        <button
          disabled={selectedSchedule.sch_id === 0}
          onClick={() => {
            setDeleteModalToggle(true);
          }}
          className={`${
            selectedSchedule.sch_id === 0
              ? "bg-gray-400"
              : "bg-red-600 cursor-pointer hover:bg-red-700"
          } block rounded-2xl px-4 py-1 text-center text-sm text-white font-extrabold shadow-sm hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600`}
        >
          삭제
        </button>
      </div>
      {modalToggle ? (
        <AddScheduleModal
          setModalToggle={setModalToggle}
          selectedSchedule={selectedSchedule}
          mode={mode}
          fetchData={fetchData}
        />
      ) : null}
      {deleteModalToggle ? (
        <DeleteScheduleModal
          setDeleteModalToggle={setDeleteModalToggle}
          schedule={selectedSchedule}
          fetchData={fetchData}
        />
      ) : null}
    </div>
  );
};

export default Schedules;
