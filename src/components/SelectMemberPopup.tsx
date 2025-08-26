import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useUserStore } from "../store/store";
import "./../styles/Members.css";
import { Member, Schedule } from "../utils/types";
import MemberList from "../components/MemberList";
import { convertAmount, convertDate, convertPhone } from "../utils/formatUtils";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Product } from "../utils/types";
import dayjs from "dayjs";
import { getMonth, getYear } from "date-fns";
import DatePicker from "react-datepicker";
import { ko } from "date-fns/locale"; //한국어 설정


interface ModalProps {
  setModalToggle: (value: boolean) => void;
  onMemberSelect: (member: Member) => void;
}

const SelectMemberPopup: React.FC<ModalProps> = ({ setModalToggle, onMemberSelect }) => {
  const user = useUserStore((state) => state.user);
  const [sortOption, setSortOption] = useState(() => {
    const savedFilters = localStorage.getItem("tableFilters");
    return savedFilters ? JSON.parse(savedFilters) : "최신 등록순";
  });

  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Member[]>([]);

  const filteredMembers = searchTerm
    ? members.filter((member) =>
        member.mem_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : members;

    const fetchData = useCallback(async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/member`, {
          params: { user: user, sortOption: sortOption },
        });
        setMembers(res.data.result);
      } catch (err) {
        console.log(err);
      }
  }, [user, sortOption]);
  
  const toggleCheck = (member: Member) => {
    setSelectedIds((prevSelectedIds) => {
      return [member];
    });
  
    setSelectedMember((prevSelected) => {
      return [member];
    });
  };
  
  const handleComplete = () => {
    if (selectedMember.length > 0) {
      onMemberSelect(selectedMember[0]);  // 선택된 첫 번째 회원 데이터 전달
      setModalToggle(false);  // 팝업 닫기
    } else {
      alert('회원을 선택해주세요.');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchData();
    };

    loadData();
  }, [fetchData, sortOption]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl w-4/5 max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">회원 선택</h3>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg 
                className="w-5 h-5 text-gray-400" 
                aria-hidden="true" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 20 20"
              >
                <path 
                  stroke="currentColor" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="이름으로 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="px-6 pb-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-white uppercase bg-green-600">
              <tr>
                <th className="px-6 py-3 text-center"></th>
                <th className="px-6 py-3 text-center">NO</th>
                <th className="px-6 py-3 text-center">이름</th>
                <th className="px-6 py-3 text-center">성별</th>
                <th className="px-6 py-3 text-center">생년월일</th>
                <th className="px-6 py-3 text-center">등록일자</th>
                <th className="px-6 py-3 text-center">전화번호</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member, index) => (
                <tr
                  key={member.mem_id}
                  className="bg-white border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleCheck(member)}
                >
                  <td className="w-4 p-4">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.some((selected) => selected.mem_id === member.mem_id)}
                        onChange={() => toggleCheck(member)}  // onChange 핸들러 추가
                        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-gray-900 whitespace-nowrap">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-900">
                    {member.mem_name}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-900">
                    {member.mem_gender === 0 ? '여자' : '남자'}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-900">
                    {member.mem_birth ? convertDate(member.mem_birth) : '-'}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-900">
                    {member.mem_regist_date ? convertDate(member.mem_regist_date) : '-'}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-900">
                    {member.mem_phone ? convertPhone(member.mem_phone) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer with Buttons */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-200"
            onClick={() => setModalToggle(false)} 
          >
            닫기
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300"
            onClick={handleComplete}
          >
            선택 완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectMemberPopup;
