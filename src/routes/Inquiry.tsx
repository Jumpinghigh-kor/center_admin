import React, { useCallback, useEffect, useState } from "react";
import InquiryModal from "../components/InquiryModal";
import { useUserStore } from "../store/store";
import axios from "axios";
import { convertDate } from "../utils/formatUtils";

interface InquiryType {
  inq_id: number;
  inq_title: string;
  inq_body: string;
  inq_regist_date: string;
  is_responded: number;
  center_name: string;
  web_version: string;
}

const Inquiry: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const [mode, setMode] = useState<string>("");
  const [modalToggle, setModalToggle] = useState(false);
  const [inquiries, setInquiries] = useState<InquiryType[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryType>();

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/inquiry`, {
        params: user,
      });
      setInquiries(res.data.result);
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

  if (modalToggle) {
    //모달 오픈시 스크롤 방지
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }

  return (
    <div className="p-3 sm:p-10">
      <div className="flex justify-between">
        <span className="font-bold text-xl">문의 내역</span>
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
      <p className="text-base">
        관리 사이트의 오류를 찾았거나 필요한 기능이 있으면 작성해주세요.
      </p>
      <p className="text-base">문의를 보려면 더블 클릭을 하세요.</p>
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg my-4">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500">
          <thead className="text-xs text-white font-bold uppercase bg-custom-C4C4C4">
            <tr>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              ></th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                문의 제목
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                문의 날짜
              </th>
              {
                //관리자
                user?.usr_role === "admin" ? (
                  <>
                    <th className="px-6 py-4 text-center text-base">센터명</th>
                    <th className="px-6 py-4 text-center text-base">버전</th>
                  </>
                ) : null
              }
            </tr>
          </thead>
          <tbody>
            {inquiries.map((inquiry, index) => (
              <tr
                key={inquiry.inq_id}
                className={`bg-white border-b hover:bg-gray-50`}
                onClick={() => setSelectedInquiry(inquiry)}
                onDoubleClick={() => {
                  setMode("confirm");
                  setModalToggle(true);
                }}
              >
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {index + 1}
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {inquiry.inq_title}{" "}
                  {inquiry.is_responded === 1 ? (
                    <span className="text-red-600">(답변 완료)</span>
                  ) : null}
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {convertDate(inquiry.inq_regist_date)}
                </td>
                {
                  //관리자
                  user?.usr_role === "admin" ? (
                    <>
                      <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                        {inquiry.center_name}
                      </td>
                      <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                        {inquiry.web_version}
                      </td>
                    </>
                  ) : null
                }
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalToggle ? (
        <InquiryModal
          setModalToggle={setModalToggle}
          center_id={user?.center_id}
          inquiry={selectedInquiry}
          mode={mode}
          fetchData={fetchData}
          role={user.usr_role}
        />
      ) : null}
    </div>
  );
};

export default Inquiry;
