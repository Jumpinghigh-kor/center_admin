import React, { useEffect, useState } from "react";
import NoticeNav from "../components/NoticeNav";
import axios from "axios";
import { useUserStore } from "../store/store";
import NoticeModal from "../components/NoticeModal";

interface NoticesType {
  no_id: number;
  no_desc: string;
  no_date: string;
  no_background: string;
  no_text: string;
}

const Notice: React.FC = () => {
  const [notices, setNotices] = useState<NoticesType[]>([]);
  const user = useUserStore((state) => state.user);
  const [modalToggle, setModalToggle] = useState(false);
  const [mode, setMode] = useState<string>("");
  const [selectedNotices, setSelectedNotices] = useState<NoticesType>();

  const getDatas = async () => {
    try {
      const fetchUpdateLogs = await axios.get(
        `${process.env.REACT_APP_API_URL}/info/entire`
      );

      setNotices(fetchUpdateLogs.data.notice);
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
                  공지사항 내용
                </th>
              </tr>
            </thead>
            <tbody>
              {notices.map((notice) => (
                <tr
                  key={notice.no_id}
                  className="odd:bg-white even:bg-gray-50 border-b"
                  onDoubleClick={() => {
                    setMode("confirm");
                    setModalToggle(true);
                    setSelectedNotices(notice);
                  }}
                >
                  <th
                    scope="row"
                    className="px-6 py-4 font-medium text-gray-900"
                  >
                    <b>[공지사항]</b> {notice.no_desc}
                  </th>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalToggle && (
        <NoticeModal
          setModalToggle={setModalToggle}
          fetchData={getDatas}
          mode={mode}
          selectedData={selectedNotices}
          role={user.usr_role}
        />
      )}
    </div>
  );
};

export default Notice;
