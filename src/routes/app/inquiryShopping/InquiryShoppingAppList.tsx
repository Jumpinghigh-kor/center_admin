import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../../store/store";
import Pagination from "../../../components/Pagination";
import { usePagination } from "../../../hooks/usePagination";
import { useSearch } from "../../../hooks/useSearch";

interface CommonCode {
  common_code: string;
  common_code_name: string;
}

interface InquiryShoppingApp {
  mem_id: number;
  mem_name: string;
  product_name: string;
  inquiry_phone_number: string;
  inquiry_shopping_app_id: number;
  content: string;
  reg_dt: string;
}

const InquiryShoppingAppList: React.FC = () => {
  const navigate = useNavigate();
  const [shoppingInquiryList, setShoppingInquiryList] = useState<InquiryShoppingApp[]>([]);
  const user = useUserStore((state) => state.user);
  const pagination = usePagination({
    totalItems: shoppingInquiryList.length,
    itemsPerPage: 10,
  });
  const currentInquiries = pagination.getCurrentPageData(shoppingInquiryList);

  // 쇼핑몰 문의 목록 불러오기
  const selectInquiryShoppingAppList = async (searchParams?: any) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/inquiryShoppingApp/selectInquiryShoppingAppList`,
        {
          center_id: user.center_id,
          ...searchParams
        }
      );
      
      setShoppingInquiryList(response.data.result);
      pagination.resetPage();
    } catch (err) {
      console.error("문의 목록 로딩 오류:", err);
    } finally {
    }
  };

  // 검색 공통 훅 사용
  const { searchData, setSearchData, handleSearch, handleReset } = useSearch({
    onSearch: selectInquiryShoppingAppList,
    initialSearchData: {
      memName: "",
      productName: "",
    }
  });

  useEffect(() => {
    if (user && user.index) {
      selectInquiryShoppingAppList();
    }
  }, [user]);

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">쇼핑몰 문의 관리</h2>
        </div>

        {/* 검색 필터 테이블 */}
        <div className="mb-6">
          <table className="w-full border border-gray-300">
            <tbody>
              <tr>
                <th className="border border-gray-300 p-2 text-center bg-gray-200 font-medium w-1/6">이름</th>
                <td className="border border-gray-300 p-2 w-2/6">
                  <input
                    type="text"
                    value={searchData.memName}
                    onChange={(e) => setSearchData({ ...searchData, memName: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                    placeholder="이름을 입력하세요"
                    />
                </td>
                <th className="border border-gray-300 p-2 text-center bg-gray-200 font-medium w-1/6">상품명</th>
                <td className="border border-gray-300 p-2 w-2/6">
                  <input
                    type="text"
                    value={searchData.productName}
                    onChange={(e) => setSearchData({ ...searchData, productName: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                    placeholder="상품명을 입력하세요"
                    />
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

        <div className="mb-4 border border-gray-500 text-sm rounded-lg p-4">
          <p>1. 해당 페이지는 고객님이 쇼핑 문의를 남겼을 경우 <strong>데이터 수집</strong>을 위한 페이지이다.</p>
          <p>2. 답장은 따로 하지 않고 고객님이 직접 고객센터로 전화를 한다.</p>
        </div>

        {shoppingInquiryList.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>등록된 문의가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm font-bold">총 {shoppingInquiryList.length}건</p>
              <p>아래 목록 클릭 시 상세 페이지로 이동합니다.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="w-full h-16 border-b border-gray-200 bg-gray-200">
                    <th className="text-center pl-4 whitespace-nowrap">번호</th>
                    <th className="text-center whitespace-nowrap">이름</th>
                    <th className="text-center whitespace-nowrap hidden md:table-cell">
                      상품명
                    </th>
                    <th className="text-center whitespace-nowrap hidden md:table-cell">
                      고객센터 번호
                    </th>
                    <th className="text-center whitespace-nowrap hidden md:table-cell">
                      내용
                    </th>
                    <th className="text-center whitespace-nowrap">등록일</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInquiries?.map((inquiry, index) => (
                    <tr
                      key={inquiry.inquiry_shopping_app_id}
                      className="h-16 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        navigate("/app/inquiryShoppingAppDetail", { state: { selectedInquiry: inquiry } });
                      }}
                    >
                      <td className="pl-4 text-center">
                        {shoppingInquiryList.length - (pagination.startIndex + index)}
                      </td>
                      <td className="text-center px-2 truncate">
                        {inquiry.mem_name}
                      </td>
                      <td className="text-center px-2 truncate">
                        {inquiry.product_name}
                      </td>
                      <td className="text-center px-2 truncate">
                        {inquiry.inquiry_phone_number}
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

export default InquiryShoppingAppList;
