import React, { useCallback, useEffect, useState } from "react";
import AddClientCallLogModal from "../components/AddClientCallLogModal";
import { useUserStore } from "../store/store";
import axios from "axios";
import DeleteClientCallLogModal from "../components/DeleteClientCallLogModal";
import { convertPhone, formatToTimestamp } from "../utils/formatUtils";
import { ClientLog } from "../utils/types";

const initialClientCallLog: ClientLog = {
  ccl_id: 0,
  ccl_name: "",
  ccl_phone: "",
  ccl_memo: "",
  ccl_date: "",
};

const ClientCallLog: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const [mode, setMode] = useState<string>("");
  const [modalToggle, setModalToggle] = useState<boolean>(false);
  const [deleteModalToggle, setDeleteModalToggle] = useState<boolean>(false);
  const [callLogs, setCallLogs] = useState<ClientLog[]>([]);
  const [selectedClientCallLog, setSelectedClientCallLog] =
    useState<ClientLog>(initialClientCallLog);

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/log/clientCall`,
        {
          params: user,
        }
      );
      setSelectedClientCallLog(initialClientCallLog);
      setCallLogs(res.data.result);
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

  if (modalToggle || deleteModalToggle) {
    //모달 오픈시 스크롤 방지
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }

  return (
    <div className="p-3 sm:p-10">
      <div className="flex justify-between">
        <span className="font-bold text-xl">상담 기록</span>
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
      </div>
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg my-4">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500">
          <thead className="text-xs text-white font-bold uppercase bg-custom-C4C4C4">
            <tr>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                성함
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                전화번호
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                상담일자
              </th>
            </tr>
          </thead>
          <tbody>
            {callLogs.map((callLog) => (
              <tr
                className={`${
                  selectedClientCallLog?.ccl_id === callLog.ccl_id
                    ? `bg-gray-100`
                    : `bg-white`
                }
                  border-b hover:bg-gray-50`}
                key={callLog.ccl_id}
                onClick={() => setSelectedClientCallLog(callLog)}
                onDoubleClick={() => {
                  setMode("edit");
                  setModalToggle(true);
                }}
              >
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {callLog.ccl_name}
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {convertPhone(callLog.ccl_phone)}
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {formatToTimestamp(callLog.ccl_date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <button
          disabled={selectedClientCallLog.ccl_id === 0}
          className={`${
            selectedClientCallLog.ccl_id === 0
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
          disabled={selectedClientCallLog.ccl_id === 0}
          onClick={() => {
            setDeleteModalToggle(true);
          }}
          className={`${
            selectedClientCallLog.ccl_id === 0
              ? "bg-gray-400"
              : "bg-red-600 cursor-pointer hover:bg-red-700"
          } block rounded-2xl px-4 py-1 text-center text-sm text-white font-extrabold shadow-sm hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600`}
        >
          삭제
        </button>
      </div>
      {modalToggle ? (
        <AddClientCallLogModal
          setModalToggle={setModalToggle}
          center_id={user.center_id}
          selectedClientCallLog={selectedClientCallLog}
          mode={mode}
          fetchData={fetchData}
        />
      ) : null}
      {deleteModalToggle ? (
        <DeleteClientCallLogModal
          setDeleteModalToggle={setDeleteModalToggle}
          clientCallLog={selectedClientCallLog}
          fetchData={fetchData}
        />
      ) : null}
    </div>
  );
};

export default ClientCallLog;
