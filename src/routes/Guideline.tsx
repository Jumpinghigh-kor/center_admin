import React, { useEffect, useState } from "react";
import NoticeNav from "../components/NoticeNav";
import axios from "axios";
import { useUserStore } from "../store/store";
import GuidelineModal from "../components/GuidelineModal";

interface GuidelineType {
  gl_id: number;
  gl_desc: string;
  gl_background: string;
  gl_text: string;
}

const Guideline: React.FC = () => {
  const [guidelines, setGuidelines] = useState<GuidelineType[]>([]);
  const user = useUserStore((state) => state.user);
  const [modalToggle, setModalToggle] = useState(false);
  const [mode, setMode] = useState<string>("");
  const [selectedGuideline, setSelectedGuideline] = useState<GuidelineType>();

  const getDatas = async () => {
    try {
      const fetchUpdateLogs = await axios.get(
        `${process.env.REACT_APP_API_URL}/info/entire`
      );

      setGuidelines(fetchUpdateLogs.data.guideline);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getDatas();
  }, []);

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
                  안내사항 내용
                </th>
              </tr>
            </thead>
            <tbody>
              {guidelines.map((guideline) => (
                <tr
                  key={guideline.gl_id}
                  className="odd:bg-white even:bg-gray-50 border-b"
                  onDoubleClick={() => {
                    setMode("confirm");
                    setModalToggle(true);
                    setSelectedGuideline(guideline);
                  }}
                >
                  <th
                    scope="row"
                    className="px-6 py-4 font-medium text-gray-900"
                  >
                    <b>[안내사항]</b> {guideline.gl_desc}
                  </th>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalToggle && (
        <GuidelineModal
          setModalToggle={setModalToggle}
          fetchData={getDatas}
          mode={mode}
          selectedData={selectedGuideline}
          role={user.usr_role}
        />
      )}
    </div>
  );
};

export default Guideline;
