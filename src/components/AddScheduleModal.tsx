import React, { useState } from "react";
import DatePicker from "react-datepicker";
import dayjs from "dayjs";
import axios from "axios";
import { removeNonNumeric } from "../utils/formatUtils";
import { useUserStore } from "../store/store";
import { Schedule } from "../utils/types";

type SchedulePick = Pick<Schedule, "sch_max_cap" | "sch_info">;

interface ModalProps {
  setModalToggle: React.Dispatch<React.SetStateAction<boolean>>;
  selectedSchedule: Schedule;
  mode: String;
  fetchData: () => Promise<void>;
}

const AddScheduleModal: React.FC<ModalProps> = ({
  setModalToggle,
  selectedSchedule,
  mode,
  fetchData,
}) => {
  const user = useUserStore((state) => state.user);
  const [startDate, setStartDate] = useState(new Date());
  const [confirm, setConfirm] = useState<Boolean>(false);
  const [schedule, setSchedule] = useState<SchedulePick>({
    sch_max_cap: mode === "add" ? 0 : selectedSchedule.sch_max_cap,
    sch_info: mode === "add" ? "" : selectedSchedule?.sch_info,
  });

  const addSchedule = async () => {
    if (Number(schedule.sch_max_cap) <= 0) {
      return alert("최대 인원을 1명 이상으로 입력해주세요");
    }
    try {
      if (mode === "add") {
        await axios.post(`${process.env.REACT_APP_API_URL}/schedule`, [
          startDate,
          schedule,
          user.center_id,
        ]);
      } else if (mode === "edit") {
        await axios.patch(
          `${process.env.REACT_APP_API_URL}/schedule/${selectedSchedule?.sch_id}`,
          [startDate, schedule]
        );
      } else {
        return alert("다시 시도하시기 바랍니다.");
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
      id="add-schedule-modal"
      className="overflow-y-hidden
        overflow-x-hidden 
        fixed top-0 right-0 left-0 z-50 justify-center items-center w-full inset-0 max-h-full"
    >
      <div className="fixed top-0 right-0 left-0 w-full max-h-full min-h-screen md:inset-0 bg-black opacity-50"></div>
      <div className="absolute bottom-0 bg-white animate-openModalMobile sm:animate-openModalPC w-full sm:w-auto lg:w-full lg:max-w-screen-sm sm:h-full sm:min-h-screen sm:top-0 right-0 z-80">
        {/* Modal content */}
        <div className="relative">
          {/* Modal header */}
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
            <h3 className="text-xl font-semibold text-gray-900">
              시간표 {mode === "add" ? "등록" : "수정"}
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
          {/* Modal body  */}
          <div className="p-4 md:p-5 flex flex-col items-center">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500">
              <tbody>
                <tr className="border-b border-gray-200">
                  <th
                    scope="row"
                    className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                  >
                    시간표 이름
                  </th>
                  <td className="px-6 py-2 bg-white text-black max-w-52">
                    <input
                      type="text"
                      id="info"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-1.5"
                      placeholder="시간표 이름을 입력해 주세요"
                      value={schedule.sch_info}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSchedule({
                          ...schedule,
                          sch_info: e.target.value,
                        })
                      }
                    />
                  </td>
                </tr>

                {mode === "edit" ? (
                  <tr className="border-b border-gray-200">
                    <th
                      scope="row"
                      className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                    >
                      기존시간
                    </th>
                    <td className="px-6 py-2 bg-white text-black">
                      {selectedSchedule?.sch_time}
                    </td>
                  </tr>
                ) : null}
                <tr className="border-b border-gray-200">
                  <th
                    scope="row"
                    className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                  >
                    수업 시작 시간
                  </th>
                  <td className="px-6 py-2 bg-white text-black">
                    <div className="relative max-w-52">
                      <div className="border leading-none border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                        <DatePicker
                          selected={startDate}
                          onChange={(date: any) => setStartDate(date)}
                          showTimeSelect
                          showTimeSelectOnly
                          timeIntervals={15}
                          timeCaption="Time"
                          dateFormat="h:mm aa"
                          className="w-full"
                        />
                      </div>
                      <div className="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-gray-500"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fillRule="evenodd"
                            d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4a1 1 0 1 0-2 0v4a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V8Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                    {mode === "edit" ? (
                      <span className="text-red-600">
                        시간을 재입력 하시기 바랍니다.
                      </span>
                    ) : null}
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th
                    scope="row"
                    className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                  >
                    최대 인원
                  </th>
                  <td className="px-6 py-2 bg-white text-black flex items-center">
                    <input
                      type="text"
                      id="maximum capacity"
                      className="bg-gray-50 border border-gray-300 max-w-52 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-1.5"
                      placeholder="숫자만 입력하세요"
                      maxLength={3}
                      value={schedule.sch_max_cap}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSchedule({
                          ...schedule,
                          sch_max_cap: Number(removeNonNumeric(e.target.value)),
                        })
                      }
                    />
                    명
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="p-5">
              <button
                type="button"
                className="block rounded-full bg-green-600 px-10 py-3 text-center text-sm text-white font-extrabold shadow-sm hover:text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                onClick={() => setConfirm(true)}
              >
                {mode === "add" ? "등록" : "수정"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* 확인 모달 */}
      <div
        tabIndex={-1}
        className={`${
          confirm ? "block" : "hidden"
        } overflow-y-auto overflow-x-hidden flex justify-center z-50 w-full md:inset-0 h-modal md:h-full`}
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
              className="w-11 h-11 mb-3.5 mx-auto text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm14-7.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm0 4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm-5-4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm0 4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm-5-4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm0 4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1ZM20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4Z" />
            </svg>
            <p className="mb-4 text-gray-500">시간표 정보가 일치합니까?</p>
            <p className="mb-1 text-gray-500">
              수업 시간 : {dayjs(startDate).format("h:mm A")}
            </p>
            <p className="mb-1 text-gray-500">
              최대 인원 : {schedule.sch_max_cap}명
            </p>
            <p className="mb-1 text-gray-500">정보 : {schedule.sch_info}</p>
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
                onClick={addSchedule}
              >
                {mode === "add" ? "네. 등록할게요" : "네. 수정할게요"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddScheduleModal;
