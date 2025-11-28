import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../../store/store";
import { usePagination } from "../../../hooks/usePagination";
import { useCheckbox } from "../../../hooks/useCheckbox";
import { useSearch } from "../../../hooks/useSearch";
import Pagination from "../../../components/Pagination";
import { openInputDatePicker } from "../../../utils/commonUtils";

interface NoticesApp {
  notices_app_id: number;
  notices_type: string;
  title: string;
  content: string;
  start_dt: string;
  end_dt: string;
  view_yn: "Y" | "N";
  del_yn: "Y" | "N";
  reg_dt: string;
  mod_dt: string;
}

const NoticesAppList: React.FC = () => {
  const [noticesList, setNoticesList] = useState<NoticesApp[]>([]);
  const { checkedItems, allChecked, handleAllCheck, handleIndividualCheck, resetCheckedItems } = useCheckbox(noticesList.length);
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();

  // 페이지네이션 훅 사용
  const pagination = usePagination({
    totalItems: noticesList.length,
    itemsPerPage: 10,
  });
  
  // 현재 페이지에 표시할 데이터
  const currentNoticesList = pagination.getCurrentPageData(noticesList);

  // 공지사항 목록 불러오기
  const getNoticesAppList = async (searchParams?: any) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/noticesApp/selectNoticesAppList`,
        {
          ...searchParams
        }
      );

      setNoticesList(response.data.result || response.data || []);
      resetCheckedItems();
      pagination.resetPage();
    } catch (err) {
      console.error("공지사항 목록 로딩 오류:", err);
    } finally {
    }
  };

  // 검색 공통 훅 사용
  const { searchData, setSearchData, handleSearch, handleReset } = useSearch({
    onSearch: getNoticesAppList,
    initialSearchData: {
      title: "",
      notices_type: "",
      start_dt: "",
      end_dt: "",
      view_yn: ""
    }
  });

  // 일괄 삭제 처리
  const handleBatchDelete = async () => {
    const selectedNotices = checkedItems
      .map((checked, index) => (checked ? noticesList[index] : null))
      .filter((notice): notice is NoticesApp => notice !== null)
      .map(notice => notice.notices_app_id);

    if (selectedNotices.length === 0) {
      alert("삭제할 공지사항을 선택해주세요.");
      return;
    }

    if (window.confirm("선택한 공지사항들을 삭제하시겠습니까?")) {
      try {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/app/noticesApp/batchDeleteNoticesApp`,
          {
            notices_app_ids: selectedNotices,
            userId: user.index,
          }
        );

        // 목록 새로고침
        getNoticesAppList();
        alert("선택한 공지사항들이 삭제되었습니다.");
      } catch (err) {
        console.error("공지사항 일괄 삭제 오류:", err);
        alert("공지사항 일괄 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  // 공지사항 목록 불러오기
  useEffect(() => {
    getNoticesAppList();
  }, []);

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">공지사항 관리</h2>
          {user.usr_role === 'admin' && (
            <div className="flex gap-2">
              <button
                onClick={handleBatchDelete}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                삭제
              </button>
              <button
                onClick={() => navigate('/app/notice/noticesAppRegister')}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                등록
              </button>
            </div>
          )}
        </div>

        {/* 검색 필터 테이블 */}
        <div className="mb-6">
          <table className="w-full border border-gray-300">
            <tbody>
              <tr>
                <td className="border border-gray-300 text-center bg-gray-200 font-medium w-1/6">제목</td>
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
                <td className="border border-gray-300 p-3 text-center bg-gray-200 font-medium w-1/6">공지사항 유형</td>
                <td className="border border-gray-300 p-3">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="notices_type"
                        value=""
                        checked={searchData.notices_type === ''}
                        onChange={(e) => setSearchData({ ...searchData, notices_type: e.target.value })}
                        className="mr-1"
                      />
                      <span className="text-sm">전체</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="notices_type"
                        value="NOTICE"
                        checked={searchData.notices_type === 'NOTICE'}
                        onChange={(e) => setSearchData({ ...searchData, notices_type: e.target.value })}
                        className="mr-1"
                      />
                      <span className="text-sm">공지</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="notices_type"
                        value="EVENT"
                        checked={searchData.notices_type === 'EVENT'}
                        onChange={(e) => setSearchData({ ...searchData, notices_type: e.target.value })}
                        className="mr-1"
                      />
                      <span className="text-sm">이벤트</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="notices_type"
                        value="GUIDE"
                        checked={searchData.notices_type === 'GUIDE'}
                        onChange={(e) => setSearchData({ ...searchData, notices_type: e.target.value })}
                        className="mr-1"
                      />
                      <span className="text-sm">가이드</span>
                    </label>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-3 text-center bg-gray-200 font-medium">기간</td>
                <td className="border border-gray-300 p-3" onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target && target.tagName.toLowerCase() === 'input') return;
                  const firstInput = e.currentTarget.querySelector('input[type="datetime-local"]') as HTMLInputElement | null;
                  if (firstInput) openInputDatePicker(firstInput);
                }}>
                  <div className="flex items-center space-x-2">
                    <input
                      type="datetime-local"
                      name="start_dt"
                      value={searchData.start_dt}
                      onChange={(e) => {
                        setSearchData({ ...searchData, start_dt: e.target.value });
                        requestAnimationFrame(() => {
                          try { e.currentTarget.blur(); } catch {}
                        });
                      }}
                      onInput={(e) => {
                        const input = e.currentTarget;
                        requestAnimationFrame(() => {
                          try { input.blur(); } catch {}
                        });
                      }}
                      onClick={(e) => openInputDatePicker(e.currentTarget)}
                      onFocus={(e) => openInputDatePicker(e.currentTarget)}
                      className="px-2 py-1 border cursor-pointer border-gray-300 rounded w-1/2"
                    />
                    <span className="text-sm text-gray-500 mx-2">~</span>
                    <input
                      type="datetime-local"
                      name="end_dt"
                      value={searchData.end_dt}
                      onChange={(e) => {
                        setSearchData({ ...searchData, end_dt: e.target.value });
                        requestAnimationFrame(() => {
                          try { e.currentTarget.blur(); } catch {}
                        });
                      }}
                      onInput={(e) => {
                        const input = e.currentTarget;
                        requestAnimationFrame(() => {
                          try { input.blur(); } catch {}
                        });
                      }}
                      onClick={(e) => openInputDatePicker(e.currentTarget)}
                      onFocus={(e) => openInputDatePicker(e.currentTarget)}
                      className="px-2 py-1 border cursor-pointer border-gray-300 rounded w-1/2"
                    />
                  </div>
                </td>
                <td className="border border-gray-300 p-3 text-center bg-gray-200 font-medium">전시 여부</td>
                <td className="border border-gray-300 p-3">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="view_yn"
                        value=""
                        checked={searchData.view_yn === ''}
                        onChange={(e) => setSearchData({ ...searchData, view_yn: e.target.value })}
                        className="mr-1 cursor-pointer"
                      />
                      <span className="text-sm">전체</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="view_yn"
                        value="Y"
                        checked={searchData.view_yn === 'Y'}
                        onChange={(e) => setSearchData({ ...searchData, view_yn: e.target.value })}
                        className="mr-1 cursor-pointer"
                      />
                      <span className="text-sm">전시</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="view_yn"
                        value="N"
                        checked={searchData.view_yn === 'N'}
                        onChange={(e) => setSearchData({ ...searchData, view_yn: e.target.value })}
                        className="mr-1 cursor-pointer"
                      />
                      <span className="text-sm">미전시</span>
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

        {noticesList?.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>등록된 공지사항이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-semibold">총 {noticesList.length}건</p>
              <p>아래 목록 클릭 시 상세 페이지로 이동합니다.</p>
            </div>
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
                  <th className="text-center whitespace-nowrap">유형</th>
                  <th className="text-center whitespace-nowrap">제목</th>
                  <th className="text-center whitespace-nowrap hidden md:table-cell">
                    내용
                  </th>
                  <th className="text-center whitespace-nowrap hidden md:table-cell">
                    전시 여부
                  </th>
                  <th className="text-center whitespace-nowrap">기간</th>
                  <th className="text-center whitespace-nowrap">등록일</th>
                  <th className="text-center whitespace-nowrap">수정일</th>
                </tr>
              </thead>
              <tbody>
                {currentNoticesList.map((notice, index) => (
                  <tr
                    key={notice.notices_app_id}
                    className="h-16 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/app/notice/noticesAppDetail?noticesAppId=${notice.notices_app_id}`)}
                    onDoubleClick={() => {
                      navigate(`/app/notice/noticesAppRegister?noticesAppId=${notice.notices_app_id}`);
                    }}
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
                    <td className="pl-4 text-center">{noticesList?.length - index}</td>
                    <td className="text-center px-2 max-w-[150px] truncate hidden md:table-cell">
                      {notice.notices_type === "NOTICE"
                        ? "공지"
                        : notice.notices_type === "EVENT"
                        ? "이벤트"
                        : "가이드"}
                    </td>
                    <td className="text-center px-2 max-w-[50px] md:max-w-[70px] truncate">
                      {notice.title}
                    </td>
                    <td className="text-center px-2 max-w-[50px] md:max-w-[70px] truncate">
                      {notice.content}
                    </td>
                    <td className="text-center whitespace-nowrap">
                      {notice.view_yn === "Y" ? "전시" : "미전시"}
                    </td>
                    <td className="text-center whitespace-nowrap text-xs md:text-sm">
                      {notice.start_dt} ~<br />{notice.end_dt}
                    </td>
                    <td className="text-center whitespace-nowrap text-xs md:text-sm">
                      {notice.reg_dt}
                    </td>
                    <td className="text-center whitespace-nowrap text-xs md:text-sm">
                      {notice.mod_dt ? notice.mod_dt : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 페이지네이션 */}
        {noticesList.length > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={pagination.handlePageChange}
          />
        )}
      </div>
    </>
  );
};

export default NoticesAppList;
