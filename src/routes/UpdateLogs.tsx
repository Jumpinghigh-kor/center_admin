import axios from "axios";
import React, { useEffect, useCallback, useState } from "react";
import { UpdateLog } from "../utils/types";
import NoticeNav from "../components/NoticeNav";
import UpdateLogsModal from "../components/UpdateLogsModal";
import { useUserStore } from "../store/store";

interface UpdateLogsType {
  up_id: number;
  up_ver: string;
  up_desc: string;
}

const UpdateLogs: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const [updateLogs, setUpdateLogs] = useState<UpdateLog[]>([]);
  const [modalToggle, setModalToggle] = useState(false);
  const [mode, setMode] = useState<string>("");
  const [selectedUpdateLogs, setSelectedUpdateLogs] =
    useState<UpdateLogsType>();

  const getDatas = async () => {
    try {
      const fetchUpdateLogs = await axios.get(
        `${process.env.REACT_APP_API_URL}/info/entire`
      );
      setUpdateLogs(fetchUpdateLogs.data.updateLog);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getDatas();
  }, []);

  useEffect(() => {
    //모달 오픈시 스크롤 방지
    if (modalToggle) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [modalToggle]);

  return (
    <div className="p-3 sm:p-10">
      <div className="flex flex-col">
        <div className="flex justify-between">
          <span className="font-bold text-xl">새 소식</span>
          {user?.usr_role === "admin" && (
            <button
              type="submit"
              className="block rounded-2xl bg-green-600 px-4 py-1 text-center text-sm  text-white font-extrabold shadow-sm hover:text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
              onClick={() => {
                setMode("add");
                setModalToggle(true);
              }}
            >
              등록
            </button>
          )}
        </div>
        <NoticeNav />
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">
                  업데이트 내용
                </th>
                <th scope="col" className="px-6 py-3 text-center">
                  버전
                </th>
              </tr>
            </thead>
            <tbody>
              {updateLogs.map((update, idx) => (
                <tr
                  key={update.up_id}
                  className="odd:bg-white even:bg-gray-50 border-b"
                  onDoubleClick={() => {
                    setMode("confirm");
                    setModalToggle(true);
                    setSelectedUpdateLogs(update);
                  }}
                >
                  <th
                    scope="row"
                    className="px-6 py-4 font-medium text-gray-900"
                  >
                    <b>[업데이트]</b> {update.up_desc}
                  </th>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {update.up_ver}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalToggle && (
        <UpdateLogsModal
          setModalToggle={setModalToggle}
          fetchData={getDatas}
          mode={mode}
          selectedData={selectedUpdateLogs}
          role={user.usr_role}
        />
      )}
    </div>
  );
};

export default UpdateLogs;
