import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../../store/store";
import Pagination from "../../../components/Pagination";
import { usePagination } from "../../../hooks/usePagination";
import { useSearch } from "../../../hooks/useSearch";

interface InquiryApp {
  inquiry_app_id: number;
  title: string;
  content: string;
  answer: string;
  answer_dt: string;
  mem_name: string;
  mem_app_status: string;
  reg_dt: string;
}

const CenterInquiryAppList: React.FC = () => {
  const navigate = useNavigate();
  const [inquiryList, setInquiryList] = useState<InquiryApp[]>([]);
  const user = useUserStore((state) => state.user);

  // 페이지네이션 훅 사용
  const pagination = usePagination({
    totalItems: inquiryList.length,
    itemsPerPage: 10,
  });

  // 현재 페이지에 표시할 데이터
  const currentInquiries = pagination.getCurrentPageData(inquiryList);

  // 문의 목록 불러오기
  const selectInquiryAppList = async (searchParams?: any) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/inquiryApp/selectInquiryAppList`,
        {
          center_id: user.center_id,
          inquiry_type: 'FRANCHISE',
          ...searchParams
        }
      );
      
      setInquiryList(response.data.result);
      pagination.resetPage();
    } catch (err) {
      console.error("문의 목록 로딩 오류:", err);
    } finally {
    }
  };

  // 검색 공통 훅 사용
  const { searchData, setSearchData, handleSearch, handleReset } = useSearch({
    onSearch: selectInquiryAppList,
    initialSearchData: {
      mem_name: "",
      mem_app_status: "",
      answer: ""
    }
  });

  useEffect(() => {
    if (user && user.index) {
      selectInquiryAppList();
    }
  }, [user]);

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">센터 문의 관리</h2>
        </div>

        {/* 검색 필터 테이블 */}
        <div className="mb-6">
          <table className="w-full border border-gray-300">
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium">이름</td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="text"
                    value={searchData.mem_name}
                    onChange={(e) => setSearchData({ ...searchData, mem_name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                    placeholder="이름을 입력하세요"
                  />
                </td>
                <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium">앱 회원상태</td>
                <td className="border border-gray-300 p-2">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="mem_app_status"
                        value=""
                        checked={searchData.mem_app_status === ''}
                        onChange={(e) => setSearchData({ ...searchData, mem_app_status: e.target.value })}
                        className="mr-1"
                      />
                      <span className="text-sm">전체</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="mem_app_status"
                        value="ACTIVE"
                        checked={searchData.mem_app_status === 'ACTIVE'}
                        onChange={(e) => setSearchData({ ...searchData, mem_app_status: e.target.value })}
                        className="mr-1"
                      />
                      <span className="text-sm">활동회원</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="mem_app_status"
                        value="EXIT"
                        checked={searchData.mem_app_status === 'EXIT'}
                        onChange={(e) => setSearchData({ ...searchData, mem_app_status: e.target.value })}
                        className="mr-1"
                      />
                      <span className="text-sm">탈퇴회원</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="mem_app_status"
                        value="SLEEP"
                        checked={searchData.mem_app_status === 'SLEEP'}
                        onChange={(e) => setSearchData({ ...searchData, mem_app_status: e.target.value })}
                        className="mr-1"
                      />
                      <span className="text-sm">휴면회원</span>
                    </label>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium">답변여부</td>
                <td className="border border-gray-300 p-2" colSpan={3}>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="answer"
                        value=""
                        checked={searchData.answer === ''}
                        onChange={(e) => setSearchData({ ...searchData, answer: e.target.value })}
                        className="mr-1"
                      />
                      <span className="text-sm">전체</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="answer"
                        value="Y"
                        checked={searchData.answer === 'Y'}
                        onChange={(e) => setSearchData({ ...searchData, answer: e.target.value })}
                        className="mr-1"
                      />
                      <span className="text-sm">대답완료</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="answer"
                        value="N"
                        checked={searchData.answer === 'N'}
                        onChange={(e) => setSearchData({ ...searchData, answer: e.target.value })}
                        className="mr-1"
                      />
                      <span className="text-sm">미대답</span>
                    </label>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* 검색 버튼 */}
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              초기화
            </button>
            <button
              onClick={handleSearch}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded hover:bg-blue-700"
            >
              검색
            </button>
          </div>
        </div>

        {inquiryList.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>등록된 문의가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="mt-4 mb-4">
              <p className="text-sm font-bold">총 {inquiryList.length}건</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="w-full h-16 border-b border-gray-200 bg-gray-200">
                    <th className="text-center pl-4 whitespace-nowrap">번호</th>
                    <th className="text-center whitespace-nowrap">이름</th>
                    <th className="text-center whitespace-nowrap hidden md:table-cell">
                      앱 회원 상태
                    </th>
                    <th className="text-center whitespace-nowrap hidden md:table-cell">
                      제목
                    </th>
                    <th className="text-center whitespace-nowrap hidden md:table-cell">
                      내용
                    </th>
                    <th className="text-center whitespace-nowrap hidden md:table-cell">
                      답변 여부
                    </th>
                    <th className="text-center whitespace-nowrap">등록일</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInquiries?.map((inquiry, index) => (
                    <tr
                      key={inquiry.inquiry_app_id}
                      className="h-16 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        navigate("/app/commonInquiryAppDetail", { state: { selectedInquiry: inquiry } });
                      }}
                    >
                      <td className="pl-4 text-center">
                        {inquiryList.length - (pagination.startIndex + index)}
                      </td>
                      <td className="text-center px-2 truncate">
                        {inquiry.mem_name}
                      </td>
                      <td className="text-center px-2 truncate">
                        {inquiry.mem_app_status}
                      </td>
                      <td className="text-center px-2 max-w-[70px] hidden md:table-cell">
                        <div style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {inquiry.title}
                        </div>
                      </td>
                      <td className="text-center px-2 max-w-[70px] hidden md:table-cell">
                        <div style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {inquiry.content}
                        </div>
                      </td>
                      <td className="text-center px-2 truncate">
                        {inquiry.answer ? '대답완료' : '미대답'}
                      </td>
                      <td className="text-center whitespace-nowrap">
                        {inquiry.reg_dt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            <Pagination
              currentPage={pagination.currentPage}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={pagination.handlePageChange}
            />
          </>
        )}
      </div>
    </>
  );
};

export default CenterInquiryAppList;
