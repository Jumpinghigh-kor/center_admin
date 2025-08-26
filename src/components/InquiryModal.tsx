import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import packageJson from "./../../package.json";
import { formatToTimestamp } from "../utils/formatUtils";

interface InquiryType {
  inq_id: number;
  inq_title: string;
  inq_body: string;
  inq_regist_date: string;
  center_name: string;
  web_version: string;
}

interface ReplyType {
  reply_id: number;
  reply_body: string;
  reply_date: string;
}

interface AdditionalInquiryType {
  inq_id: number;
  content: string;
  inq_add_dt: string;
}

interface ModalProps {
  setModalToggle: React.Dispatch<React.SetStateAction<boolean>>;
  center_id: number;
  inquiry?: InquiryType;
  mode: string;
  fetchData: () => Promise<void>;
  role: string;
}

const InquiryModal: React.FC<ModalProps> = ({
  setModalToggle,
  center_id,
  inquiry,
  mode,
  fetchData,
  role,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    center_id: center_id ?? 0,
    version: packageJson.version,
  });

  const [answer, setAnswer] = useState("");
  const [additionalInquiry, setAdditionalInquiry] = useState("");
  const [replies, setReplies] = useState<ReplyType[]>([]);
  const [additionalInquiries, setAdditionalInquiries] = useState<
    AdditionalInquiryType[]
  >([]);

  const submitAdditionalInquiry = async () => {
    if (additionalInquiry.trim() === "") {
      return alert("추가 문의 내용을 입력해주세요.");
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/inquiry/inquiryAdd`, {
        inq_id: inquiry?.inq_id,
        content: additionalInquiry,
      });
      setAdditionalInquiry("");
      alert("추가 문의가 등록되었습니다.");
      await fetchData();
      fetchAdditionalInquiries(); // Fetch additional inquiries after adding a new one
    } catch (e) {
      console.log(e);
      alert("추가 문의 등록에 실패했습니다.");
    }
  };

  const fetchAdditionalInquiries = async () => {
    if (!inquiry?.inq_id || mode === "add") return;

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/inquiry/inquiryAdd/${inquiry?.inq_id}`
      );
      setAdditionalInquiries(res.data.result || []);
    } catch (e) {
      console.log(e);
    }
  };

  const submitAnswer = useCallback(async () => {
    if (answer === "") {
      return alert("답변을 적어주세요.");
    }
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/admin/inquiry/answer`,
        { answer: answer, inquiry: inquiry }
      );
      setAnswer("");
      alert("답변이 작성되었습니다.");
    } catch (e) {
      console.log(e);
    }
  }, [answer, inquiry]);

  useEffect(() => {
    if (mode === "add") {
      return setReplies([]);
    }
    const getAnswers = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/inquiry/${inquiry?.inq_id}`
        );
        setReplies(res.data.result);
      } catch (e) {
        console.log(e);
      }
    };
    getAnswers();
  }, [inquiry?.inq_id, mode, submitAnswer]);

  // Fetch additional inquiries when modal opens
  useEffect(() => {
    if (mode === "confirm") {
      fetchAdditionalInquiries();
    }
  }, [inquiry?.inq_id, mode]);

  const addInquiry = async () => {
    if (!Object.values(formData).every((x) => x !== "")) {
      return alert("입력칸을 다 채워주세요.");
    }

    const userConfirmed = window.confirm(
      "문의를 등록하면 내용을 수정하거나 삭제할 수 없습니다. 등록하시겠습니까?"
    );
    if (!userConfirmed) return;

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/inquiry`, formData);
      await fetchData();
      setModalToggle(false);
    } catch (e) {
      console.log(e);
    }
  };

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
            <h3 className="text-xl font-semibold text-gray-900">문의하기</h3>
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
                  <td className="text-center p-2 w-32 font-medium text-white whitespace-nowrap bg-custom-C4C4C4">
                    문의제목
                  </td>
                  <td className="px-6 py-2 bg-white text-black max-w-52">
                    <input
                      type="text"
                      id="inquiry_title"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-1.5 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none"
                      placeholder="문의제목 입력"
                      required
                      value={
                        mode === "add" ? formData.title : inquiry?.inq_title
                      }
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      disabled={mode === "confirm"}
                    />
                  </td>
                </tr>
                <tr className="border-b border-gray-200 h-12">
                  <td className="text-center w-32 p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4">
                    문의내용
                  </td>
                  <td className="px-6 py-2 bg-white text-black flex flex-col">
                    <textarea
                      className="h-40 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-1.5 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none"
                      value={mode === "add" ? formData.body : inquiry?.inq_body}
                      onChange={(e) =>
                        setFormData({ ...formData, body: e.target.value })
                      }
                      disabled={mode === "confirm"}
                    ></textarea>
                    {mode === "confirm" && inquiry?.inq_regist_date && (
                      <div className="text-end mt-1">
                        <span className="text-sm text-black-500">
                          {formatToTimestamp(inquiry.inq_regist_date)}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 추가 문의 목록 */}
            {additionalInquiries.length > 0 && (
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 mt-4">
                <thead></thead>
                <tbody>
                  {additionalInquiries.map((item, index) => (
                    <tr className="border-b border-gray-200 h-12" key={index}>
                      <td className="text-center w-32 p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4">
                        추가 문의
                      </td>
                      <td className="px-6 py-2 bg-white text-black flex flex-col">
                        <div className="border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-1.5 bg-slate-50 text-slate-500 border-slate-200 shadow-none">
                          {item.content}
                        </div>
                        <span className="text-end">
                          {formatToTimestamp(item.inq_add_dt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {mode === "add" ? (
              <div className="p-5">
                <button
                  type="button"
                  className="block rounded-full bg-green-600 px-10 py-3 text-center text-sm text-white font-extrabold shadow-sm hover:text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                  onClick={addInquiry}
                >
                  등록
                </button>
              </div>
            ) : (
              <>
                <table className="w-full mt-10 text-sm text-left rtl:text-right text-gray-500">
                  <tbody>
                    {replies.map((reply) => (
                      <tr
                        className="border-b border-gray-200 h-12"
                        key={reply.reply_id}
                      >
                        <td className="text-center w-32 p-2 font-medium text-white whitespace-nowrap bg-green-600">
                          답변내용
                        </td>
                        <td className="px-6 py-2 bg-white text-black flex flex-col">
                          <div className="border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-1.5 bg-slate-50 text-slate-500 border-slate-200 shadow-none">
                            {reply.reply_body}
                          </div>
                          <span className="text-end">
                            {formatToTimestamp(reply.reply_date)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 추가 문의 입력 UI */}
                {mode === "confirm" && role !== "admin" && (
                  <span className="w-full text-sm text-left rtl:text-right mt-3 flex flex-col items-center">
                    <span className="text-black text-lg">
                      ✨추가 문의하기✨
                    </span>
                    <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                      <tbody>
                        <tr>
                          <td className="text-center w-32 p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4">
                            추가 문의
                          </td>
                          <td className="px-6 py-2 bg-white text-black flex items-center">
                            <textarea
                              className="h-40 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-1.5"
                              value={additionalInquiry}
                              onChange={(e) =>
                                setAdditionalInquiry(e.target.value)
                              }
                              placeholder="추가 문의 내용을 입력하세요."
                            ></textarea>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="py-5">
                      <button
                        type="button"
                        className="block rounded-full bg-green-600 px-10 py-3 text-center text-sm text-white font-extrabold shadow-sm hover:text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                        onClick={submitAdditionalInquiry}
                      >
                        추가 문의 등록
                      </button>
                    </div>
                  </span>
                )}
              </>
            )}

            {/* 관리자 답변 */}
            {role === "admin" && mode === "confirm" ? (
              <span className="w-full text-sm text-left rtl:text-right mt-3 flex flex-col items-center">
                <span className="text-black text-lg">✨답변하기✨</span>
                <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                  <tbody>
                    <tr>
                      <td className="text-center w-32 p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4">
                        답변내용
                      </td>
                      <td className="px-6 py-2 bg-white text-black flex items-center">
                        <textarea
                          className="h-40 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-1.5 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none"
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                        ></textarea>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="py-5">
                  <button
                    type="button"
                    className="block rounded-full bg-green-600 px-10 py-3 text-center text-sm text-white font-extrabold shadow-sm hover:text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                    onClick={submitAnswer}
                  >
                    등록
                  </button>
                </div>
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InquiryModal;
