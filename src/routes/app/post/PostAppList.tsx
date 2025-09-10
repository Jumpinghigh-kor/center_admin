import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../../store/store";
import Pagination from "../../../components/Pagination";
import { usePagination } from "../../../hooks/usePagination";
import { useCheckbox } from "../../../hooks/useCheckbox";

interface PostApp {
  post_app_id: number;
  title: string;
  content: string;
  post_type: string;
  all_send_yn: string;
  push_send_yn: string;
  mem_id: string;
  reg_dt: string;
}

const PostAppList: React.FC = () => {
  const navigate = useNavigate();
  const [postList, setPostList] = useState<PostApp[]>([]);
  const user = useUserStore((state) => state.user);

  // 체크박스 공통 훅 사용 (목록 전체 기준)
  const { checkedItems, allChecked, handleAllCheck, handleIndividualCheck } = useCheckbox(postList.length);

  // 검색 데이터 상태
  const [searchData, setSearchData] = useState({
    title: "",
    post_type: "",
    all_send_yn: "",
    push_send_yn: ""
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
      console.error("우편함 목록 검색 오류:", err);
    }
  };

  // 검색 초기화
  const handleReset = () => {
    setSearchData({
      title: "",
      post_type: "",
      all_send_yn: "",
      push_send_yn: ""
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
      console.error("우편함 목록 로딩 오류:", err);
    } finally {
    }
  };

  // 선택 삭제 처리
  const handleDeleteSelected = async () => {
    const ids = postList
      .map((p, idx) => ({ id: p.post_app_id, idx }))
      .filter((_, i) => checkedItems[i])
      .map((p) => p.id);

    if (ids.length === 0) {
      alert('삭제할 우편함을 선택하세요.');
      return;
    }

    const confirmDelete = window.confirm(`이미 읽은 회원이 있을 수 있습니다.\n정말로 ${ids.length}건을 삭제하시겠습니까?`);
    if (!confirmDelete) return;

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/app/postApp/deletePostApp`, {
        post_app_id: ids,
        userId: user?.index,
      });
      alert('삭제가 완료되었습니다.');
      await selectPostList();
    } catch (e) {
      console.error(e);
      alert('삭제에 실패했습니다.');
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
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded hover:bg-red-700"
              onClick={handleDeleteSelected}
            >
              우편함 삭제
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded hover:bg-green-700" onClick={() => navigate('/app/postApp/postAppRegister')}>우편함 등록</button>
          </div>
        </div>

        {/* 검색 필터 테이블 */}
        <div className="mb-6">
          <table className="w-full border border-gray-300">
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 text-center bg-gray-50 font-medium">제목</td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="text"
                    name="title"
                    value={searchData.title}
                    onChange={(e) => handleSearchChange('title', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                    placeholder="제목을 입력하세요"
                  />
                </td>
                <td className="border border-gray-300 p-2 text-center bg-gray-50 font-medium">우편 유형</td>
                <td className="border border-gray-300 p-2">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="post_type"
                        value=""
                        checked={searchData.post_type === ''}
                        onChange={(e) => handleSearchChange('post_type', e.target.value)}
                        className="mr-1"
                      />
                      <span className="text-sm">전체</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="post_type"
                        value="ALL"
                        checked={searchData.post_type === 'ALL'}
                        onChange={(e) => handleSearchChange('post_type', e.target.value)}
                        className="mr-1"
                      />
                      <span className="text-sm">전체 섹션</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="post_type"
                        value="SHOPPING"
                        checked={searchData.post_type === 'SHOPPING'}
                        onChange={(e) => handleSearchChange('post_type', e.target.value)}
                        className="mr-1"
                      />
                      <span className="text-sm">쇼핑몰 섹션</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="post_type"
                        value="JUMPING"
                        checked={searchData.post_type === 'JUMPING'}
                        onChange={(e) => handleSearchChange('post_type', e.target.value)}
                        className="mr-1"
                      />
                      <span className="text-sm">점핑하이 섹션</span>
                    </label>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 text-center bg-gray-50 font-medium">전체 발송 여부</td>
                <td className="border border-gray-300 p-2">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="all_send_yn"
                        value=""
                        checked={searchData.all_send_yn === ''}
                        onChange={(e) => handleSearchChange('all_send_yn', e.target.value)}
                        className="mr-1"
                      />
                      <span className="text-sm">전체</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="all_send_yn"
                        value="Y"
                        checked={searchData.all_send_yn === 'Y'}
                        onChange={(e) => handleSearchChange('all_send_yn', e.target.value)}
                        className="mr-1"
                      />
                      <span className="text-sm">전체 발송</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="all_send_yn"
                        value="N"
                        checked={searchData.all_send_yn === 'N'}
                        onChange={(e) => handleSearchChange('all_send_yn', e.target.value)}
                        className="mr-1"
                      />
                      <span className="text-sm">개별 발송</span>
                    </label>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 text-center bg-gray-50 font-medium">푸쉬 발송 여부</td>
                <td className="border border-gray-300 p-2">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="push_send_yn"
                        value=""
                        checked={searchData.push_send_yn === ''}
                        onChange={(e) => handleSearchChange('push_send_yn', e.target.value)}
                        className="mr-1"
                      />
                      <span className="text-sm">전체</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="push_send_yn"
                        value="Y"
                        checked={searchData.push_send_yn === 'Y'}
                        onChange={(e) => handleSearchChange('push_send_yn', e.target.value)}
                        className="mr-1"
                      />
                      <span className="text-sm">네</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="push_send_yn"
                        value="N"
                        checked={searchData.push_send_yn === 'N'}
                        onChange={(e) => handleSearchChange('push_send_yn', e.target.value)}
                        className="mr-1"
                      />
                      <span className="text-sm">아니오</span>
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
            <div className="flex justify-start items-center mb-2">
              <p className="text-sm font-semibold">총 {postList.length}건</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="w-full h-16 border-b border-gray-200 bg-gray-200">
                    <th className="text-center px-4 w-12">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5"
                        onChange={(e) => handleAllCheck(e.target.checked)}
                        checked={allChecked}
                      />
                    </th>
                    <th className="text-center pl-4 whitespace-nowrap">번호</th>
                    <th className="text-center whitespace-nowrap hidden md:table-cell">제목</th>
                    <th className="text-center whitespace-nowrap hidden md:table-cell">내용</th>
                    <th className="text-center">우편 유형</th>
                    <th className="text-center">전체 발송 여부</th>
                    <th className="text-center">푸쉬 발송 여부</th>
                    <th className="text-center">등록일</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPosts?.map((post, index) => (
                    <tr
                      key={post.post_app_id}
                      className="h-16 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        navigate(`/app/postApp/postAppDetail?post_app_id=${post.post_app_id}`);
                      }}
                    >
                      <td
                        className="px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="form-checkbox h-5 w-5"
                          checked={checkedItems[pagination.startIndex + index] || false}
                          onChange={(e) => handleIndividualCheck(pagination.startIndex + index, e.target.checked)}
                        />
                      </td>
                      <td className="pl-4 text-center">{postList.length - (pagination.startIndex + index)}</td>
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
                      <td className="text-center px-2 max-w-[70px] hidden md:table-cell">
                        <div style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {post.content}
                        </div>
                      </td>
                      <td className="text-center px-2 max-w-[70px] hidden md:table-cell">
                        {post.post_type === 'ALL' ? '전체 섹션' : post.post_type === 'SHOPPING' ? '쇼핑몰 섹션' : '점핑하이 섹션'}
                      </td>
                      <td className="text-center px-2 max-w-[70px] hidden md:table-cell">
                        {post.all_send_yn === 'Y' ? '전체 발송' : '개별 발송'}
                      </td>
                      <td className="text-center px-2 max-w-[70px] hidden md:table-cell">
                        {post.push_send_yn === 'Y' ? '네' : '아니오'}
                      </td>
                      <td className="text-center whitespace-nowrap">
                        {post.reg_dt}
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

export default PostAppList;
