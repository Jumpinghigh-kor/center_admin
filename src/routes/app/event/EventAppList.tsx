import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../../store/store";
import Pagination from "../../../components/Pagination";
import { openInputDatePicker } from "../../../utils/commonUtils";
import { usePagination } from "../../../hooks/usePagination";
import { useSearch } from "../../../hooks/useSearch";
import { useCheckbox } from "../../../hooks/useCheckbox";

interface EventApp {
  event_app_id: number;
  title: string;
  reg_dt: string;
  navigation_path: string;
}

const EventAppList: React.FC = () => {
  const navigate = useNavigate();
  const [eventList, setEventList] = useState<EventApp[]>([]);
  const [navigationPathList, setNavigationPathList] = useState<{ common_code: string; common_code_name: string }[]>([]);
  const user = useUserStore((state) => state.user);
  const pagination = usePagination({
    totalItems: eventList.length,
    itemsPerPage: 10,
  });
  const currentEvents = pagination.getCurrentPageData(eventList);
  const { checkedItems, allChecked, handleAllCheck, handleIndividualCheck, resetCheckedItems } = useCheckbox(eventList.length); 

  const selectEventAppList = async (searchParams?: any) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/eventApp/selectEventAppList`,
        {
          ...searchParams,
        }
      );
      
      setEventList(response.data.result);
      pagination.resetPage();
      resetCheckedItems();
    } catch (err) {
      console.error("이벤트 목록 로딩 오류:", err);
    } finally {
    }
  };

  // 네비게이션 경로(이동 경로) 공통코드 목록 조회
  const fetchNavigationPathList = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/common/selectCommonCodeList`,
        {
          group_code: "APP_NAVIGATION_PATH",
        }
      );
      setNavigationPathList(response.data.result || []);
    } catch (err) {
      console.error("네비게이션 경로 목록 로딩 오류:", err);
    }
  };

  const { searchData, setSearchData, handleSearch, handleReset } = useSearch({
    onSearch: selectEventAppList,
    initialSearchData: {
      title: "",
      navigation_path: "",
      start_reg_dt: "",
      end_reg_dt: "",
    },
  });

  const handleBatchDelete = async () => {
    const selectedIds = eventList
      .map((item, idx) => (checkedItems[idx] ? item.event_app_id : null))
      .filter((v): v is number => v !== null);

    if (selectedIds.length === 0) {
      alert("삭제할 항목을 선택하세요.");
      return;
    }

    if (!window.confirm("선택한 이벤트를 삭제하시겠습니까?")) return;

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/app/eventApp/deleteEventApp`,
        {
          event_app_id: selectedIds,
          mod_id: user.index,
        }
      );
      await selectEventAppList();
    } catch (err) {
      console.error("이벤트 삭제 오류:", err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    if (user && user.index) {
      selectEventAppList();
    }
  }, [user]);

  useEffect(() => {
    fetchNavigationPathList();
  }, []);

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">이벤트 관리</h2>
          <div className="flex gap-2">
            <button
              onClick={handleBatchDelete}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              삭제
            </button>
            <button
              onClick={() => navigate("/app/eventApp/eventAppRegister")}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              등록
            </button>
          </div>
        </div>

        <div className="mb-6">
          <table className="w-full border border-gray-300">
            <tbody>
              <tr>
                <td className="border border-gray-300 text-center bg-gray-200 font-medium w-1/6">제목</td>
                <td className="border border-gray-300 p-2 w-2/6">
                  <input
                    type="text"
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                    name="title"
                    value={searchData.title}
                    onChange={(e) => setSearchData({ ...searchData, title: e.target.value })}
                  />
                </td>
                <td className="border border-gray-300 text-center bg-gray-200 font-medium w-1/6">이동 경로</td>
                <td className="border border-gray-300 p-2">
                  <select
                    name="navigation_path"
                    value={searchData.navigation_path}
                    onChange={(e) => setSearchData({ ...searchData, navigation_path: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded bg-white"
                  >
                    <option value="">전체</option>
                    {navigationPathList.map((path) => (
                      <option key={path.common_code} value={path.common_code}>
                        {path.common_code_name}
                      </option>
                    ))}
                    <option value="NONE">미사용</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium">등록일</td>
                <td
                  className="border p-2"
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target && target.tagName.toLowerCase() === 'input') return;
                    const firstInput = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement | null;
                    if (firstInput) openInputDatePicker(firstInput);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <input
                      type="date"
                      value={searchData.start_reg_dt}
                      onChange={(e) => setSearchData({ ...searchData, start_reg_dt: e.target.value })}
                      onClick={(e) => openInputDatePicker(e.currentTarget)}
                      onFocus={(e) => openInputDatePicker(e.currentTarget)}
                      className="w-1/2 px-2 py-1 border border-gray-300 rounded cursor-pointer"
                    />
                    &nbsp;~&nbsp;
                    <input
                      type="date"
                      value={searchData.end_reg_dt}
                      onChange={(e) => setSearchData({ ...searchData, end_reg_dt: e.target.value })}
                      onClick={(e) => openInputDatePicker(e.currentTarget)}
                      onFocus={(e) => openInputDatePicker(e.currentTarget)}
                      className="w-1/2 px-2 py-1 border border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

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

        {eventList.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>등록된 이벤트가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-start items-center mb-2">
              <p className="text-sm font-semibold">총 {eventList.length}건</p>
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
                    <th className="text-center">번호</th>
                    <th className="text-center">제목</th>
                    <th className="text-center">이동 경로</th>
                    <th className="text-center">등록일</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEvents?.map((event, index) => (
                    <tr
                      key={event.event_app_id}
                      className="h-16 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        navigate(`/app/eventApp/eventAppDetail?eventAppId=${event.event_app_id}`);
                      }}
                    >
                      <td
                        className="px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="form-checkbox h-5 w-5 cursor-pointer"
                          checked={checkedItems[pagination.startIndex + index] || false}
                          onChange={(e) => handleIndividualCheck(pagination.startIndex + index, e.target.checked)}
                        />
                      </td>
                      <td className="text-center">
                          {eventList.length - (pagination.startIndex + index)}
                      </td>
                      <td className="text-center">
                        {event.title}
                      </td>
                      <td className="text-center">
                        {navigationPathList.find(p => p.common_code === event.navigation_path)?.common_code_name ?? (event.navigation_path || "-")}
                      </td>
                      <td className="text-center">
                        {event.reg_dt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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

export default EventAppList;
