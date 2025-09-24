import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useUserStore } from "../store/store";
import "./../styles/Members.css";
import { Center, Member } from "../utils/types";
import { useNavigate } from "react-router-dom";
import { usePagination } from "../hooks/usePagination";
import Pagination from "../components/Pagination";

const AllCenterMembers: React.FC = () => {
  const user = useUserStore((state) => state.user);

  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedCenter, setSelectedCenter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [centers, setCenters] = useState<Center[]>([]);
  const navigate = useNavigate();

  const filteredMembers = members;

  // 공통 페이지네이션 훅 사용
  const pagination = usePagination({
    totalItems: filteredMembers.length,
    itemsPerPage,
  });
  const currentMembers = pagination.getCurrentPageData(filteredMembers);

  // 검색/필터 변경 후 페이지 범위 보정 (현재 페이지가 총 페이지보다 클 경우 1페이지로 이동)
  useEffect(() => {
    const total = filteredMembers.length;
    const totalPagesCalc = Math.max(1, Math.ceil(total / itemsPerPage));
    if (pagination.currentPage > totalPagesCalc) {
      pagination.handlePageChange(1);
    }
  }, [filteredMembers.length]);

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/member/allMemberList`,
        {
          params: {
            user: null,
            center_id: selectedCenter,
            mem_name: searchTerm,
            mem_gender: selectedGender,
          },
        }
      );
      setMembers(res.data.result);
    } catch (err) {
      console.log(err);
    }
  }, [selectedCenter, selectedGender, searchTerm]);

  useEffect(() => {
    const getData = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/center/list`,
          {
            params: user,
          }
        );
        setCenters(res.data.result);
      } catch (e) {
        console.log(e);
      }
    };

    // user 데이터가 유효할 때만 getData 실행
    if (user && user.center_id) {
      getData();
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  return (
    <div className="p-3 sm:p-10">
      <div className="flex justify-between">
        <span className="font-bold text-xl">전체 매장 회원</span>
      </div>

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg my-4 border border-gray-300">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500">
          <tbody>
            <tr className="border-b border-gray-300">
              <td className="px-4 py-3 bg-custom-C4C4C4 border-r border-gray-300 font-medium text-gray-700 w-24">
                매장
              </td>
              <td className="px-4 py-3 border-r border-gray-300 w-48">
                <select
                  value={selectedCenter}
                  onChange={(e) => setSelectedCenter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">전체 매장</option>
                  {centers.map((center) => (
                    <option key={center.center_id} value={center.center_id}>
                      {center.center_name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 bg-custom-C4C4C4 border-r border-gray-300 font-medium text-gray-700 w-24">
                성별
              </td>
              <td className="px-4 py-3 w-64">
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value=""
                      checked={selectedGender === ""}
                      onChange={(e) => setSelectedGender(e.target.value)}
                      className="mr-2"
                    />
                    전체
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="1"
                      checked={selectedGender === "1"}
                      onChange={(e) => setSelectedGender(e.target.value)}
                      className="mr-2"
                    />
                    남자
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="0"
                      checked={selectedGender === "0"}
                      onChange={(e) => setSelectedGender(e.target.value)}
                      className="mr-2"
                    />
                    여자
                  </label>
                </div>
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 bg-custom-C4C4C4 border-r border-gray-300 font-medium text-gray-700 w-24">
                이름
              </td>
              <td className="px-4 py-3" colSpan={1}>
                <input
                  type="text"
                  placeholder="회원 이름을 입력하세요."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      pagination.resetPage();
                      fetchData();
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mb-4">
        <span className="text-gray-600">
          회원 수 : {filteredMembers.length}명
        </span>
      </div>

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg my-4">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500">
          <thead className="text-xs text-white font-bold uppercase bg-custom-C4C4C4">
            <tr>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                번호
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                이름
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                생년월일
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                성별
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                휴대폰 번호
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                등록 센터명
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                등록일
              </th>
            </tr>
          </thead>
          <tbody>
            {!currentMembers.length ? (
              <tr className={`bg-white border-b hover:bg-gray-50`}>
                <td
                  className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base"
                  colSpan={7}
                >
                  조회 내용이 없습니다.
                </td>
              </tr>
            ) : (
              currentMembers.map((member, index) => (
                <tr
                  key={member.mem_id}
                  className={`bg-white border-b hover:bg-gray-50`}
                >
                  <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                    {filteredMembers.length - (((pagination.currentPage - 1) * itemsPerPage) + index)}
                  </td>
                  <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                    {member.mem_name ? member.mem_name : "-"}
                  </td>
                  <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                    {member.mem_birth ? member.mem_birth : "-"}
                  </td>
                  <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                    {member.mem_gender ? member.mem_gender : "-"}
                  </td>
                  <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                    {member.mem_phone ? member.mem_phone : "-"}
                  </td>
                  <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                    {member.center_name ? member.center_name : "-"}
                  </td>
                  <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                    {member.mem_regist_date ? member.mem_regist_date : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 공통 페이지네이션 */}
      {filteredMembers.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={pagination.handlePageChange}
        />
      )}

      {/* 페이지 정보: Pagination 컴포넌트에 통합되어 있어 별도 표시 제거 */}
    </div>
  );
};

export default AllCenterMembers;
