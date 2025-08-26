import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../store/store";
import Pagination from "../../components/Pagination";
import { usePagination } from "../../hooks/usePagination";
import InquiryShoppingAppModal from "../../components/app/InquiryShoppingAppModal";

interface CommonCode {
  common_code: string;
  common_code_name: string;
}

interface InquiryShoppingApp {
  mem_id: number;
  mem_name: string;
  inquiry_shopping_app_id: number;
  inquiry_type: string;
  title: string;
  content: string;
  answer: string;
  answer_dt: string;
  reg_dt: string;
}

const InquiryShoppingApp: React.FC = () => {
  const navigate = useNavigate();
  const [shoppingInquiryList, setShoppingInquiryList] = useState<InquiryShoppingApp[]>([]);
  const [commonCodeList, setCommonCodeList] = useState<CommonCode[]>([]);
  const user = useUserStore((state) => state.user);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedInquiryForModal, setSelectedInquiryForModal] =
    useState<InquiryShoppingApp | null>(null);

  // 검색 데이터 상태
  const [searchData, setSearchData] = useState({
    memName: "",
    inquiryType: "",
    answerStatus: ""
  });

  // 검색 조건 변경 핸들러
  const handleSearchChange = (field: string, value: string) => {
    setSearchData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 검색 처리
  const handleSearch = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/inquiryShoppingApp/selectInquiryShoppingAppList`,
        {
          center_id: user.center_id,
          ...searchData
        }
      );
      
      setShoppingInquiryList(response.data.result);
      pagination.resetPage();
    } catch (err) {
      console.error("문의 목록 검색 오류:", err);
    }
  };

  // 검색 초기화
  const handleReset = () => {
    setSearchData({
      memName: "",
      inquiryType: "",
      answerStatus: ""
    });
    selectInquiryShoppingAppList();
  };

  // 페이지네이션 훅 사용
  const pagination = usePagination({
    totalItems: shoppingInquiryList.length,
    itemsPerPage: 10,
  });

  // 현재 페이지에 표시할 데이터
  const currentInquiries = pagination.getCurrentPageData(shoppingInquiryList);

  // 공통 코드 목록 불러오기
  const selectCommonCodeList = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/common/selectCommonCodeList`,
        {
          group_code: 'SHOPPING_INQUIRY_TYPE',
        }
      );

      setCommonCodeList(response.data.result);
    } catch (err) {
      console.error("공통 코드 목록 로딩 오류:", err);
    } finally {
    }
  };

  // 리뷰 목록 불러오기
  const selectInquiryShoppingAppList = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/inquiryShoppingApp/selectInquiryShoppingAppList`,
        {
          center_id: user.center_id,
          ...searchData
        }
      );
      
      setShoppingInquiryList(response.data.result);
      pagination.resetPage(); // 데이터 새로고침 시 첫 페이지로 리셋
    } catch (err) {
      console.error("문의 목록 로딩 오류:", err);
    } finally {
    }
  };

  useEffect(() => {
    if (user && user.index) {
      selectCommonCodeList();
      selectInquiryShoppingAppList();
    }
  }, [user]);

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">쇼핑몰 문의 관리</h2>
        </div>

        {/* 검색 필터 테이블 */}
        <div className="mb-6">
          <table className="w-full border border-gray-300">
            <tbody>
              <tr>
                <th className="border border-gray-300 p-2 text-center bg-gray-50 font-medium w-[10%]">이름</th>
                <td className="border border-gray-300 p-2 w-[15%]">
                  <input
                    type="text"
                    value={searchData.memName}
                    onChange={(e) => handleSearchChange('memName', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                    placeholder="이름을 입력하세요"
                  />
                </td>
                <th className="border border-gray-300 p-2 text-center bg-gray-50 font-medium w-[10%]">문의 유형</th>
                <td className="border border-gray-300 p-2 w-[15%]">
                  <select
                    value={searchData.inquiryType}
                    onChange={(e) => handleSearchChange('inquiryType', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                  >
                    <option value="">전체</option>
                    {commonCodeList.map((code) => (
                      <option key={code.common_code} value={code.common_code}>
                        {code.common_code_name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
                             <tr>
                 <th className="border border-gray-300 p-2 text-center bg-gray-50 font-medium">답변 여부</th>
                 <td className="border border-gray-300 p-2" colSpan={3}>
                   <div className="flex items-center space-x-4 py-1">
                     <label className="flex items-center">
                       <input
                         type="radio"
                         name="answerStatus"
                         value=""
                         checked={searchData.answerStatus === ''}
                         onChange={(e) => handleSearchChange('answerStatus', e.target.value)}
                         className="mr-1"
                       />
                       <span className="text-sm">전체</span>
                     </label>
                     <label className="flex items-center">
                       <input
                         type="radio"
                         name="answerStatus"
                         value="Y"
                         checked={searchData.answerStatus === 'Y'}
                         onChange={(e) => handleSearchChange('answerStatus', e.target.value)}
                         className="mr-1"
                       />
                       <span className="text-sm">대답완료</span>
                     </label>
                     <label className="flex items-center">
                       <input
                         type="radio"
                         name="answerStatus"
                         value="N"
                         checked={searchData.answerStatus === 'N'}
                         onChange={(e) => handleSearchChange('answerStatus', e.target.value)}
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

        {shoppingInquiryList.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>등록된 문의가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="w-full h-16 border-b border-gray-200">
                    <th className="text-center pl-4 whitespace-nowrap">번호</th>
                    <th className="text-center whitespace-nowrap">이름</th>
                    <th className="text-center whitespace-nowrap hidden md:table-cell">
                      문의 유형
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
                      key={inquiry.inquiry_shopping_app_id}
                      className="h-16 border-b border-gray-200 hover:bg-gray-50"
                      onClick={() => {}}
                      onDoubleClick={() => {
                        setSelectedInquiryForModal(inquiry);
                        setIsModalOpen(true);
                      }}
                    >
                      <td className="pl-4 text-center">
                        {shoppingInquiryList.length - (pagination.startIndex + index)}
                      </td>
                      <td className="text-center px-2 truncate">
                        {inquiry.mem_name}
                      </td>
                      <td className="text-center px-2 truncate">
                        {inquiry.inquiry_type ? 
                          (commonCodeList.find(code => code.common_code === inquiry.inquiry_type)?.common_code_name || inquiry.inquiry_type) 
                          : '-'
                        }
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

      <InquiryShoppingAppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          selectInquiryShoppingAppList();
        }}
        selectedInquiry={selectedInquiryForModal ? {
          mem_id: selectedInquiryForModal.mem_id,
          inquiry_shopping_app_id: selectedInquiryForModal.inquiry_shopping_app_id,
          inquiry_type: selectedInquiryForModal.inquiry_type,
          title: selectedInquiryForModal.title || "",
          content: selectedInquiryForModal.content,
          answer: selectedInquiryForModal.answer || "",
          mem_name: selectedInquiryForModal.mem_name,
          answer_dt: selectedInquiryForModal.answer_dt || "",
          reg_dt: selectedInquiryForModal.reg_dt
        } : null}
      />
    </>
  );
};

export default InquiryShoppingApp;
