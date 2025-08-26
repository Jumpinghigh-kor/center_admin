import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useUserStore } from "../store/store";
import "./../styles/Members.css";
import { Center, Member } from "../utils/types";
import { useNavigate } from "react-router-dom";

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

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMembers = filteredMembers.slice(startIndex, endIndex);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 페이지 번호 그룹 계산 (10개씩)
  const pageGroupSize = 10;
  const currentPageGroup = Math.ceil(currentPage / pageGroupSize);
  const startPage = (currentPageGroup - 1) * pageGroupSize + 1;
  const endPage = Math.min(startPage + pageGroupSize - 1, totalPages);
  const pageNumbers = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

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
                      setCurrentPage(1);
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
                    {filteredMembers.length - (startIndex + index)}
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

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-4 space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이전
          </button>

          {startPage > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700"
              >
                1
              </button>
              {startPage > 2 && <span className="px-2 text-gray-500">...</span>}
            </>
          )}

          {pageNumbers.map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-2 text-sm font-medium rounded-lg ${
                currentPage === page
                  ? "text-white bg-blue-600 border border-blue-600"
                  : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              {page}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span className="px-2 text-gray-500">...</span>
              )}
              <button
                onClick={() => handlePageChange(totalPages)}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700"
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
          </button>
        </div>
      )}

      {/* 페이지 정보 */}
      <div className="flex justify-center mt-2 text-sm text-gray-600">
        총 {filteredMembers.length}개 중 {startIndex + 1}-
        {Math.min(endIndex, filteredMembers.length)}개 표시 (페이지{" "}
        {currentPage}/{totalPages})
      </div>
    </div>
  );
};

export default AllCenterMembers;
