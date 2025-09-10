import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../store/store";
import Pagination from "../../components/Pagination";
import { usePagination } from "../../hooks/usePagination";

interface PostApp {
  post_app_id: number;
  title: string;
  content: string;
  mem_id: string;
  reg_dt: string;
}

const PostApp: React.FC = () => {
  const navigate = useNavigate();
  const [postList, setPostList] = useState<PostApp[]>([]);
  const user = useUserStore((state) => state.user);

  // 검색 데이터 상태
  const [searchData, setSearchData] = useState({
    mem_name: "",
    mem_app_status: "",
    answer: ""
  });

  // 페이지네이션 훅 사용
  const pagination = usePagination({
    totalItems: postList.length,
    itemsPerPage: 10,
  });

  // 현재 페이지에 표시할 데이터
  const currentPosts = pagination.getCurrentPageData(postList);

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
        `${process.env.REACT_APP_API_URL}/app/postApp/selectPostAppList`,
        {
          ...searchData
        }
      );
      
      setPostList(response.data.result);
      pagination.resetPage();
    } catch (err) {
      console.error("문의 목록 검색 오류:", err);
    }
  };

  // 검색 초기화
  const handleReset = () => {
    setSearchData({
      mem_name: "",
      mem_app_status: "",
      answer: ""
    });
    selectPostList();
  };

  // 리뷰 목록 불러오기
  const selectPostList = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/postApp/selectPostAppList`,
        {
        }
      );
      
      setPostList(response.data.result);
      pagination.resetPage(); // 데이터 새로고침 시 첫 페이지로 리셋
    } catch (err) {
      console.error("문의 목록 로딩 오류:", err);
    } finally {
    }
  };

  useEffect(() => {
    if (user && user.index) {
      selectPostList();
    }
  }, [user]);

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">우편함 관리</h2>
          <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded hover:bg-green-700" onClick={() => navigate('/app/postApp/postAppDetail')}>우편함 등록</button>
        </div>

        {/* 검색 필터 테이블 */}
        <div className="mb-6">
          <table className="w-full border border-gray-300">
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 text-center bg-gray-50 font-medium">이름</td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="text"
                    value={searchData.mem_name}
                    onChange={(e) => handleSearchChange('mem_name', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                    placeholder="이름을 입력하세요"
                  />
                </td>
                <td className="border border-gray-300 p-2 text-center bg-gray-50 font-medium">앱 회원상태</td>
                <td className="border border-gray-300 p-2">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="mem_app_status"
                        value=""
                        checked={searchData.mem_app_status === ''}
                        onChange={(e) => handleSearchChange('mem_app_status', e.target.value)}
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
                        onChange={(e) => handleSearchChange('mem_app_status', e.target.value)}
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
                        onChange={(e) => handleSearchChange('mem_app_status', e.target.value)}
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
                        onChange={(e) => handleSearchChange('mem_app_status', e.target.value)}
                        className="mr-1"
                      />
                      <span className="text-sm">휴면회원</span>
                    </label>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 text-center bg-gray-50 font-medium">답변여부</td>
                <td className="border border-gray-300 p-2" colSpan={3}>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="answer"
                        value=""
                        checked={searchData.answer === ''}
                        onChange={(e) => handleSearchChange('answer', e.target.value)}
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
                        onChange={(e) => handleSearchChange('answer', e.target.value)}
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
                        onChange={(e) => handleSearchChange('answer', e.target.value)}
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

        {postList.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>등록된 우편함이 없습니다.</p>
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
                  {currentPosts?.map((post, index) => (
                    <tr
                      key={post.post_app_id}
                      className="h-16 border-b border-gray-200 hover:bg-gray-50"
                      onClick={() => {}}
                    >
                      <td className="text-center px-2 max-w-[70px] hidden md:table-cell">
                        <div style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {post.title}
                        </div>
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

export default PostApp;
