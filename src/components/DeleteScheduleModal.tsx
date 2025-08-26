import axios from "axios";
import React from "react";
import { Schedule } from "../utils/types";

type SchedulePick = Pick<Schedule, "sch_id" | "sch_time" | "sch_info">;

interface ModalProps {
  setDeleteModalToggle: React.Dispatch<React.SetStateAction<boolean>>;
  schedule: SchedulePick;
  fetchData: () => Promise<void>;
}

const DeleteScheduleModal: React.FC<ModalProps> = ({
  setDeleteModalToggle,
  schedule,
  fetchData,
}) => {
  const deleteSchedule = async () => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/schedule/${schedule.sch_id}`
      );
      await fetchData();
      setDeleteModalToggle(false);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div
      id="deleteModal"
      tabIndex={-1}
      className="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full h-screen md:inset-0 h-modal md:h-full"
    >
      <div className="fixed top-0 right-0 left-0 w-full max-h-full min-h-screen md:inset-0 bg-black opacity-50"></div>
      <div className="absolute left-1/2 transform -translate-x-1/2 p-4 w-full max-w-md h-full md:h-auto">
        <div className="relative p-4 text-center bg-white rounded-lg shadow sm:p-5">
          <button
            type="button"
            className="text-gray-400 absolute top-2.5 right-2.5 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
            data-modal-toggle="deleteModal"
            onClick={() => setDeleteModalToggle(false)}
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              ></path>
            </svg>
            <span className="sr-only">Close modal</span>
          </button>
          <svg
            className="text-gray-400 w-11 h-11 mb-3.5 mx-auto"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            ></path>
          </svg>
          <p className="mb-4 text-gray-500">
            시간 {schedule.sch_time} 수업을 삭제하시겠습니까?
          </p>
          <p className="mb-4 text-gray-500">수업정보 : {schedule.sch_info}</p>
          <div className="flex justify-center items-center space-x-4">
            <button
              data-modal-toggle="deleteModal"
              type="button"
              className="py-2 px-3 text-sm font-medium text-gray-500 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-primary-300 hover:text-gray-900 focus:z-10"
              onClick={() => setDeleteModalToggle(false)}
            >
              아니요
            </button>
            <button
              type="submit"
              className="py-2 px-3 text-sm font-medium text-center text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300"
              onClick={deleteSchedule}
            >
              삭제해주세요
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteScheduleModal;
