import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUserStore } from "../../../store/store";
import { useCheckbox } from "../../../hooks/useCheckbox";
import { usePagination } from "../../../hooks/usePagination";
import { useSearch } from "../../../hooks/useSearch";
import Pagination from "../../../components/Pagination";

interface Review {
  review_app_id: number;
  mem_name: string;
  title: string;
  content: string;
  star_point: number;
  delYn: "Y" | "N";
  admin_del_yn: "Y" | "N";
  reg_dt: string;
  product_title: string;
  brand_name: string;
}

interface ReviewImg {
  fileId: number;
  fileName: string;
  filePath: string;
  fileDivision: string;
  imageUrl?: string;
}

const MemberReviewApp: React.FC = () => {
  const [reviewList, setReviewList] = useState<Review[]>([]);
  const [reviewImgList, setReviewImgList] = useState<ReviewImg[]>([]);
  const user = useUserStore((state) => state.user);
  const [showImagePopup, setShowImagePopup] = useState<boolean>(false);
  const [truncatedMap, setTruncatedMap] = useState<Record<number, boolean>>({});
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});
  const { checkedItems, allChecked, handleAllCheck, handleIndividualCheck, resetCheckedItems } = useCheckbox(reviewList.length);
  
  // 페이지네이션 훅 사용
  const pagination = usePagination({
    totalItems: reviewList.length,
    itemsPerPage: 10,
  });
  
  // 현재 페이지에 표시할 데이터
  const currentReviewList = pagination.getCurrentPageData(reviewList);

  // 리뷰 목록 조회
  const selectMemberReviewAppList = async () => {
    if (!user || !user.index) {
      return;
    }
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/MemberReviewApp/selectMemberReviewAppList`,
        {
          ...searchData
        }
      );

      setReviewList(response.data.result || response.data || []);
      resetCheckedItems();
      pagination.resetPage();
    } catch (err) {
      console.error("리뷰 목록 조회 오류:", err);
      setReviewList([]);
    } finally {
    }
  };

  // 리뷰 사진 목록 조회
  const selectMemberReviewAppImgList = async (reviewAppId:number) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/MemberReviewApp/selectMemberReviewAppImgList`,
        {
          review_app_id: reviewAppId
        }
      );

      const reviewImgs = response.data.map((review: Review) => ({
        ...review,
      }));

      setReviewImgList(reviewImgs);
    } catch (err) {
      alert("리뷰 목록을 불러오는 도중 오류가 발생했습니다.");
    } finally {
    }
  };

  // 리뷰 삭제
  const deleteMemberReviewApp = async () => {
    const selectedReview = checkedItems
      .map((checked, index) => (checked ? reviewList[index] : null))
      .filter((review): review is Review => review !== null)
      .map(review => review.review_app_id);

    if (selectedReview.length === 0) {
       alert("삭제할 리뷰를 선택해주세요.");
       return;
    }

    const confirm = window.confirm("정말 삭제하시겠습니까?");
    if (!confirm) {
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/MemberReviewApp/deleteMemberReviewApp`,
        {
          review_app_id: selectedReview,
          user_id: user?.index
        }
      );

      selectMemberReviewAppList();
    } catch (err) {
      alert("리뷰 목록을 불러오는 도중 오류가 발생했습니다.");
    } finally {
    }
  };

  // 검색 공통 훅 사용
  const { searchData, setSearchData, handleSearch, handleReset } = useSearch({
    onSearch: selectMemberReviewAppList,
    initialSearchData: {
      mem_name: "",
      brand_name: "",
      product_title: "",
      title: "",
      content: "",
      min_star_point: "",
      max_star_point: ""
    }
  });

  // 리뷰 목록 불러오기
  useEffect(() => {
    if (user && user.index) {
      selectMemberReviewAppList();
    }
  }, [user?.index]);

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">리뷰 관리</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                deleteMemberReviewApp();
              }}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              삭제
            </button>
          </div>
        </div>

        {/* 검색 필터 테이블 */}
        <div className="mb-6">
          <table className="w-full border border-gray-300">
            <tbody>
              <tr>
                 <td className="border border-gray-300 text-center bg-gray-200 font-medium w-1/6">회원명</td>
                 <td className="border border-gray-300 p-3 w-2/6">
                   <input
                     type="text"
                     name="mem_name"
                     value={searchData.mem_name}
                     onChange={(e) => setSearchData({ ...searchData, mem_name: e.target.value })}
                     className="w-full px-2 py-1 border border-gray-300 rounded"
                     placeholder="회원명을 입력하세요"
                   />
                 </td>
                 <td className="border border-gray-300 p-3 text-center bg-gray-200 font-medium w-1/6">브랜드명</td>
                 <td className="border border-gray-300 p-3 w-2/6">
                   <input
                     type="text"
                     name="brand_name"
                     value={searchData.brand_name}
                     onChange={(e) => setSearchData({ ...searchData, brand_name: e.target.value })}
                     className="w-full px-2 py-1 border border-gray-300 rounded"
                     placeholder="브랜드명을 입력하세요"
                   />
                 </td>
              </tr>
              <tr>
                 <td className="border border-gray-300 text-center bg-gray-200 font-medium w-1/6">상품명</td>
                 <td className="border border-gray-300 p-3 w-2/6">
                   <input
                     type="text"
                    name="product_title"
                     value={searchData.product_title}
                     onChange={(e) => setSearchData({ ...searchData, product_title: e.target.value })}
                     className="w-full px-2 py-1 border border-gray-300 rounded"
                     placeholder="상품명을 입력하세요"
                   />
                 </td>
                 <td className="border border-gray-300 p-3 text-center bg-gray-200 font-medium w-1/6">제목</td>
                 <td className="border border-gray-300 p-3 w-2/6">
                   <input
                     type="text"
                     name="title"
                     value={searchData.title}
                     onChange={(e) => setSearchData({ ...searchData, title: e.target.value })}
                     className="w-full px-2 py-1 border border-gray-300 rounded"
                     placeholder="제목을 입력하세요"
                   />
                 </td>
              </tr>
              <tr>
                 <td className="border border-gray-300 text-center bg-gray-200 font-medium w-1/6">내용</td>
                 <td className="border border-gray-300 p-3 w-2/6">
                    <input
                      type="text"
                      name="content"
                      value={searchData.content}
                      onChange={(e) => setSearchData({ ...searchData, content: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      placeholder="내용을 입력하세요"
                    />
                 </td>
                 <td className="border border-gray-300 text-center bg-gray-200 font-medium w-1/6">별점</td>
                 <td className="border border-gray-300 p-3 w-2/6">
                   <div className="flex items-center space-x-2">
                       <input
                         type="number"
                         min="1"
                         max="5"
                         step="1"
                         value={searchData.min_star_point}
                         onChange={(e) => {
                           const value = e.target.value;
                           if (value && (parseFloat(value) <= 0 || parseFloat(value) > 5)) {
                             alert("최소 별점은 1이상 5이하로 입력해주세요.");
                             return;
                           }
                           if (value && searchData.max_star_point && parseFloat(value) > parseFloat(searchData.max_star_point)) {
                             alert("최소 별점은 최대 별점보다 작거나 같아야 합니다.");
                             return;
                           }
                           setSearchData({ ...searchData, min_star_point: value });
                         }}
                         className="w-20 px-2 py-1 border border-gray-300 rounded"
                         placeholder="최소"
                       />
                       <span className="text-sm text-gray-500">~</span>
                       <input
                         type="number"
                         min="1"
                         max="5"
                         step="1"
                         value={searchData.max_star_point}
                         onChange={(e) => {
                           const value = e.target.value;
                           if (value && (parseFloat(value) <= 0 || parseFloat(value) > 5)) {
                             alert("최대 별점은 1이상 5이하로 입력해주세요.");
                             return;
                           }
                           if (value && searchData.min_star_point && parseFloat(value) < parseFloat(searchData.min_star_point)) {
                             alert("최대 별점은 최소 별점보다 크거나 같아야 합니다.");
                             return;
                           }
                           setSearchData({ ...searchData, max_star_point: value });
                         }}
                         className="w-20 px-2 py-1 border border-gray-300 rounded"
                         placeholder="최대"
                       />
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

        {reviewList?.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>등록된 리뷰 내역이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-semibold">총 {reviewList.length}건</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="w-full h-16 border-b border-gray-200 bg-gray-200">
                    <th className="text-center px-4 w-12">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 cursor-pointer"
                        onChange={(e) => handleAllCheck(e.target.checked)}
                        checked={allChecked}
                      />
                    </th>
                    <th className="text-center pl-4 whitespace-nowrap">번호</th>
                    <th className="text-center whitespace-nowrap">회원명</th>
                    <th className="text-center whitespace-nowrap">브랜드이름</th>
                    <th className="text-center whitespace-nowrap">상품이름</th>
                    <th className="text-center whitespace-nowrap">제목</th>
                    <th className="text-center whitespace-nowrap hidden md:table-cell">
                      내용
                    </th>
                    <th className="text-center whitespace-nowrap">별점</th>
                    <th className="text-center whitespace-nowrap hidden md:table-cell">
                      회원 삭제여부
                    </th>
                    <th className="text-center whitespace-nowrap">등록일</th>
                    <th className="text-center whitespace-nowrap">사진</th>
                  </tr>
                </thead>
                <tbody>
                  {currentReviewList.map((review, index) => (
                    <tr
                      key={review.review_app_id}
                      className="h-16 border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td
                        className="px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="form-checkbox h-5 w-5 cursor-pointer"
                          checked={checkedItems[index] || false}
                          onChange={(e) => handleIndividualCheck(index, e.target.checked)}
                        />
                      </td>
                      <td className="pl-4 text-center">{reviewList.length - index}</td>
                      <td className="text-center max-w-[100px] md:max-w-[200px]">
                        {review.mem_name}
                      </td>
                      <td className="text-center max-w-[100px] md:max-w-[200px]">
                        {review.brand_name}
                      </td>
                      <td className="text-center max-w-[100px] md:max-w-[200px]">
                        {review.product_title}
                      </td>
                      <td className="text-center max-w-[150px] md:max-w-[200px]">
                        {review.title}
                      </td>
                      <td className="text-center max-w-[200px] hidden md:table-cell">
                        <div className="inline-block text-left max-w-[200px]">
                          <div
                            ref={(el) => {
                              if (!el) return;
                              const isTruncated = el.scrollHeight > el.clientHeight + 1;
                              const id = review.review_app_id;
                              setTruncatedMap((prev) => (prev[id] === isTruncated ? prev : { ...prev, [id]: isTruncated }));
                            }}
                            style={expandedMap[review.review_app_id]
                              ? { whiteSpace: 'pre-wrap', wordBreak: 'break-word' }
                              : {
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical' as any,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word'
                                }
                            }
                          >
                            {review.content}
                          </div>
                          {truncatedMap[review.review_app_id] && !expandedMap[review.review_app_id] && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedMap((prev) => ({ ...prev, [review.review_app_id]: true }));
                              }}
                              className="ml-1 text-blue-500 hover:underline text-sm align-baseline"
                            >
                              [더보기]
                            </button>
                          )}
                          {expandedMap[review.review_app_id] && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedMap((prev) => ({ ...prev, [review.review_app_id]: false }));
                              }}
                              className="ml-1 text-blue-500 hover:underline text-sm align-baseline"
                            >
                              [접기]
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        {review.star_point}
                      </td>
                      <td className="text-center hidden md:table-cell">
                        {review.delYn === "Y" ? "네" : "아니오"}
                      </td>
                      <td className="text-center hidden md:table-cell">
                        {review.reg_dt}
                      </td>
                      <td className="text-center hidden md:table-cell">
                        <button
                          onClick={() => { 
                            selectMemberReviewAppImgList(review.review_app_id);
                            setShowImagePopup(true);
                          }}
                          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                          보기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* 페이지네이션 */}
        {reviewList.length > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={pagination.handlePageChange}
          />
        )}
      </div>

      {/* 이미지 팝업 */}
      {showImagePopup && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowImagePopup(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">리뷰 사진</h3>
              <button
                onClick={() => setShowImagePopup(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {reviewImgList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">등록된 사진이 없습니다.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reviewImgList.map((img, index) => (
                  <div key={img.fileId} className="border rounded-lg overflow-hidden">
                    {img.imageUrl ? (
                      <img 
                        src={img.imageUrl} 
                        alt={`리뷰 사진 ${index + 1}`}
                        className="w-full h-56 object-contain"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">이미지 없음</span>
                      </div>
                    )}
                    <div className="p-2 text-center">
                      <p className="text-sm text-gray-600 truncate">사진 {index + 1}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MemberReviewApp;
