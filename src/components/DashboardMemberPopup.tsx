import React, { useEffect, useState } from "react";
import Pagination from "./Pagination";
import { useUserStore } from "../store/store";
import axios from "axios";

interface Member {
  mem_id: number;
  mem_name: string;
  mem_nickname: string;
  mem_email_id: string;
  mem_phone: string;
  mem_app_status: string;
  mem_gender: string;
  mem_birthday: string;
  mem_role: string;
  app_reg_dt: string;
  app_exit_dt: string;
  month_num: string;
  member_count: number;
}

interface DashboardMemberPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: string;
  recentYn: string;
  monthRegYn: string;
}

const DashboardMemberPopup: React.FC<DashboardMemberPopupProps> = ({
  isOpen,
  onClose,
  title,
  type,
  recentYn,
  monthRegYn,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [memberList, setMemberList] = useState<Member[]>([]);
  const user = useUserStore((state) => state.user);

  // 페이지네이션 계산
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMembers = memberList.slice(indexOfFirstItem, indexOfLastItem);
                              
  // 사용자 통계 개요 조회
  const selectTotalMemberList = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/dashboard/selectMemberList`,
        {
          center_id: user.center_id,
          status_app_type: type,
          recent_yn: recentYn,
          month_reg_yn: monthRegYn,
        }
      );
  
      setMemberList(response.data.result);
    } catch (err) {
      console.error("사용자 통계 개요 조회 오류:", err);
    } finally {
    }
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    if(user) {
      selectTotalMemberList();
    }
  }, [type, user, recentYn, monthRegYn]);

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="mb-4">
            <p className="text-sm text-gray-600">총 {memberList.length}명</p>
          </div>

          {/* 회원 리스트 테이블 */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    번호
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    이름
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    닉네임
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    이메일
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    전화번호
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    상태
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    성별
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    가입일
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentMembers.map((member, index) => (
                  <tr key={member.mem_id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-center whitespace-nowrap text-sm text-gray-900 border-b">
                      {memberList?.length - (indexOfFirstItem + index)}
                    </td>
                    <td className="px-4 py-2 text-center whitespace-nowrap text-sm text-gray-900 border-b">
                      {member.mem_name ? member.mem_name : "-"}
                    </td>
                    <td className="px-4 py-2 text-center whitespace-nowrap text-sm text-gray-900 border-b">
                      {member.mem_nickname ? member.mem_nickname : "-"}
                    </td>
                    <td className="px-4 py-2 text-center whitespace-nowrap text-sm text-gray-600 border-b">
                      {member.mem_email_id ? member.mem_email_id : "-"}
                    </td>
                    <td className="px-4 py-2 text-center whitespace-nowrap text-sm text-gray-600 border-b">
                      {member.mem_phone ? member.mem_phone : "-"}
                    </td>
                    <td className="px-4 py-2 text-center whitespace-nowrap text-gray-600 border-b">
                      <span
                        className={`inline-flex px-2 py-1 text-sm rounded-full`}
                      >
                        {member.mem_app_status === "ACTIVE" ? "활성" : 
                         member.mem_app_status === "PROCEED" ? "진행중" : "탈퇴"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center whitespace-nowrap text-sm text-gray-600 border-b">
                      {member.mem_gender === "M" ? "남성" : "여성"}
                    </td>
                    <td className="px-4 py-2 text-center whitespace-nowrap text-sm text-gray-600 border-b">
                      {member.app_reg_dt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {memberList.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={memberList.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              showInfo={true}
            />
          )}

          {memberList.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">등록된 회원이 없습니다.</p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardMemberPopup; 