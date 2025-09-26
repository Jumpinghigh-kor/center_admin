import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUserStore } from "../../../store/store";
import { useLocation, useNavigate } from "react-router-dom";

interface InquiryShoppingApp {
  mem_id: number;
  inquiry_shopping_app_id: number;
  title: string;
  content: string;
  answer: string;
  mem_name: string;
  answer_dt: string;
}

const InquiryShoppingAppDetail: React.FC = () => {
  const [answer, setAnswer] = useState("");
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  const selectedInquiry: InquiryShoppingApp | null = (location.state as any)?.selectedInquiry || null;

  useEffect(() => {
    if (selectedInquiry) {
      setAnswer(selectedInquiry.answer || "");
    }
  }, [selectedInquiry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!answer.trim()) {
      alert("답변을 입력해주세요.");
      return;
    }

    try {
      if (!selectedInquiry) {
        alert("선택된 문의가 없습니다.");
        return;
      }

      await axios.post(
        `${process.env.REACT_APP_API_URL}/app/inquiryShoppingApp/updateInquiryShoppingApp`,
        {
          inquiry_shopping_app_id: selectedInquiry.inquiry_shopping_app_id,
          answer: answer,
          user_id: user.index,
        }
      );

      // 우편 메시지 발송 (베스트 에포트)
      try {
        const memId = selectedInquiry?.mem_id;
        if (memId) {
          const title = '쇼핑몰 문의 답변이 도착했습니다.';
          const content = '고객님께서 남겨주신 문의에 대한 답변이 도착했습니다.\n[쇼핑 -> 마이페이지 -> 우측 상단 메시지 아이콘]에서 확인하실 수 있습니다.';
          const postRes = await axios.post(
            `${process.env.REACT_APP_API_URL}/app/postApp/insertPostApp`,
            {
              post_type: 'ALL',
              title,
              content,
              all_send_yn: 'N',
              push_send_yn: 'Y',
              userId: user?.index,
              mem_id: String(memId),
            }
          );
          const postAppId = postRes?.data?.postAppId;
          if (postAppId) {
            await axios.post(`${process.env.REACT_APP_API_URL}/app/postApp/insertMemberPostApp`, {
              post_app_id: postAppId,
              mem_id: memId,
              userId: user?.index,
            });
          }
        }
      } catch (postErr) {
        console.error('우편 메시지 발송 오류:', postErr);
      }

      alert("답변이 성공적으로 등록되었습니다.");
      navigate(-1);
    } catch (error) {
      console.error("문의 처리 오류:", error);
      alert("문의 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">문의 답변</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">이름</td>
                <td className="px-4 py-3">{selectedInquiry?.mem_name || "-"}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold">제목</td>
                <td className="px-4 py-3">{selectedInquiry?.title || "-"}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold">문의 내용</td>
                <td className="px-4 py-3">
                  <textarea
                    value={selectedInquiry?.content || "-"}
                    disabled
                    className="h-[120px] w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md resize-none text-sm overflow-y-auto"
                    rows={5}
                  />
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold">답변</td>
                <td className="px-4 py-3">
                  <textarea
                    name="answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="답변을 입력하세요..."
                    className="h-[150px] w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={6}
                  />
                  <p className="text-sm text-gray-500 text-right mt-1">{selectedInquiry?.answer_dt || "-"}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            등록
          </button>
        </div>
      </form>
    </div>
  );
};

export default InquiryShoppingAppDetail;
