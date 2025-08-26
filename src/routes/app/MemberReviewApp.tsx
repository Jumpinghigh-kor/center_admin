import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUserStore } from "../../store/store";

interface Review {
  review_app_id: number;
  title: string;
  content: string;
  star_point: string;
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
  const [selectedReview, setSelectedReview] = useState<number[]>([]);
  const [showImagePopup, setShowImagePopup] = useState<boolean>(false);

  // 리뷰 목록 불러오기
  useEffect(() => {
    if (user && user.index) {
      selectMemberReviewAppList();
    }
  }, [user]);

  // 리뷰 목록 조회
  const selectMemberReviewAppList = async () => {
    if (!user || !user.index) {
      return;
    }
    
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/app/MemberReviewApp/selectMemberReviewAppList`
      );

      setReviewList(response.data.result);
      setSelectedReview([]);
    } catch (err) {
      alert("리뷰 목록을 불러오는 도중 오류가 발생했습니다.");
    } finally {
    }
  };

  // 체크박스 상태 변경 핸들러
  const handleCheckboxChange = (reviewAppId: number) => {
    setSelectedReview((prev) => {
      if (prev.includes(reviewAppId)) {
        return prev.filter((id) => id !== reviewAppId);
      } else {
        return [...prev, reviewAppId];
      }
    });
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

  // 전체 선택 체크박스 핸들러
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // 모든 배너 ID 선택
      const allReviewIds = reviewList.map((review) => review.review_app_id);
      setSelectedReview(allReviewIds);
    } else {
      // 선택 초기화
      setSelectedReview([]);
    }
  };

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
              관리자 삭제
            </button>
          </div>
        </div>

        {reviewList.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>등록된 리뷰 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="w-full h-16 border-b border-gray-200">
                  <th className="text-center px-4 w-12">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 cursor-pointer"
                      onChange={handleSelectAll}
                      checked={
                        selectedReview.length === reviewList.length &&
                        reviewList.length > 0
                      }
                    />
                  </th>
                  <th className="text-center pl-4 whitespace-nowrap">번호</th>
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
                {reviewList.map((review, index) => (
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
                        checked={selectedReview.includes(review.review_app_id)}
                        onChange={() =>
                          handleCheckboxChange(review.review_app_id)
                        }
                      />
                    </td>
                    <td className="pl-4 text-center">{reviewList.length - index}</td>
                    <td className="text-center px-2 max-w-[100px] md:max-w-[200px]">
                      {review.brand_name}
                    </td>
                    <td className="text-center px-2 max-w-[100px] md:max-w-[200px]">
                      {review.product_title}
                    </td>
                    <td className="text-center px-2 max-w-[150px] md:max-w-[200px]">
                      {review.title}
                    </td>
                    <td className="text-center px-2 max-w-[200px] hidden md:table-cell">
                      <div style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {review.content}
                      </div>
                    </td>
                    <td className="text-center px-2">
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
