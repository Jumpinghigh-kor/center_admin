import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";


interface GuidelineType {
  gl_id: number;
  gl_desc: string;
  gl_background: string;
  gl_text: string;
}

interface ModalProps {
  setModalToggle: React.Dispatch<React.SetStateAction<boolean>>;
  fetchData: () => Promise<void>;
  mode: string;
  selectedData?: GuidelineType;
  role: string;
}

const UpdateLogsModal: React.FC<ModalProps> = ({
  setModalToggle,
  fetchData,
  mode,
  selectedData,
  role,
}) => {
  const [formData, setFormData] = useState({
    gl_desc: '',
  });

  const createNotices = useCallback(async () => {
    if (!formData?.gl_desc) {
      return alert("내용을 입력해주세요.");
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/news/createGuideline`,
        { gl_desc: formData?.gl_desc }
      );

      alert("안내사항 내용이 등록되었습니다.");
      await fetchData();
      setModalToggle(false);
    } catch (e: any) {
      alert(e?.response.data.message);
      console.log('e:::', e);
    }
  }, [formData?.gl_desc]);

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
            <h3 className="text-xl font-semibold text-gray-900">안내사항 등록</h3>
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
                <tr className="border-b border-gray-200 h-12">
                  <td className="text-center w-32 p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4">
                    내용
                  </td>
                  <td className="px-6 py-2 bg-white text-black flex items-center">
                    <textarea
                      className="h-40 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-1.5 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none"
                      value={mode === "confirm" ?  selectedData?.gl_desc : formData?.gl_desc}
                      placeholder="내용을 입력해주세요."
                      onChange={(e) =>
                        setFormData({ ...formData, gl_desc: e.target.value })
                      }
                      maxLength={1000}
                    ></textarea>
                  </td>
                </tr>
              </tbody>
            </table>

            {role === "admin" && mode === 'add' &&
              <span className="w-full text-sm text-left rtl:text-right mt-3 flex flex-col items-center">
                <div className="py-5">
                  <button
                    type="button"
                    className="block rounded-full bg-green-600 px-10 py-3 text-center text-sm text-white font-extrabold shadow-sm hover:text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                    onClick={createNotices}
                  >
                    등록
                  </button>
                </div>
              </span>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateLogsModal;
