import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUserStore } from "../../../store/store";
import { useLocation, useNavigate } from "react-router-dom";

interface InquiryShoppingApp {
  mem_id: number;
  inquiry_shopping_app_id: number;
  inquiry_phone_number: number;
  product_name: string;
  content: string;
  mem_name: string;
  reg_dt: string;
}

const InquiryShoppingAppDetail: React.FC = () => {
  const location = useLocation();
  const selectedInquiry: InquiryShoppingApp | null = (location.state as any)?.selectedInquiry || null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">문의 답변</h2>
      </div>

      <form className="space-y-6">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">이름</td>
                <td className="px-4 py-3">{selectedInquiry?.mem_name || "-"}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold">상품명</td>
                <td className="px-4 py-3">{selectedInquiry?.product_name || "-"}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold">고객센터 번호</td>
                <td className="px-4 py-3">{selectedInquiry?.inquiry_phone_number || "-"}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold">문의 내용</td>
                <td className="px-4 py-3">
                  <textarea
                    value={selectedInquiry?.content || "-"}
                    disabled
                    className="h-[120px] w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md resize-none overflow-y-auto"
                    rows={5}
                  />
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold">등록일</td>
                <td className="px-4 py-3">{selectedInquiry?.reg_dt || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </form>
    </div>
  );
};

export default InquiryShoppingAppDetail;
