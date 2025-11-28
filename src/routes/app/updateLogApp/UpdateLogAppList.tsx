import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUserStore } from "../../../store/store";
import Pagination from "../../../components/Pagination";
import { usePagination } from "../../../hooks/usePagination";
import { useCheckbox } from "../../../hooks/useCheckbox";
import { useSearch } from "../../../hooks/useSearch";
import { useNavigate } from "react-router-dom";

interface UpdateLogApp {
  up_app_id: number;
  up_app_version: string;
  up_app_desc: string;
  del_yn: "Y" | "N";
  reg_dt: string;
  reg_id: string;
  mod_dt: string;
  mod_id: string;
}

const UpdateLogAppList: React.FC = () => {
  const [updateLogList, setUpdateLogList] = useState<UpdateLogApp[]>([]);
  const { checkedItems, allChecked, handleAllCheck, handleIndividualCheck, resetCheckedItems } = useCheckbox(updateLogList.length);
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();

  // 페이지네이션 훅 사용
  const pagination = usePagination({
    totalItems: updateLogList.length,
    itemsPerPage: 10,
  });

  // 현재 페이지에 표시할 데이터
  const currentUpdateLogList = pagination.getCurrentPageData(updateLogList);

  // 업데이트 로그 목록 불러오기
  const getUpdateLogAppList = async (searchParams?: any) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/updateLogApp/selectUpdateLogAppList`,
        {
          ...searchParams
        }
      );

      setUpdateLogList(response.data.result || response.data || []);
      resetCheckedItems();
      pagination.resetPage();
    } catch (err) {
      console.error("업데이트 로그 목록 로딩 오류:", err);
    }
  };

  // 검색 공통 훅 사용
  const { searchData, setSearchData, handleSearch, handleReset } = useSearch({
    onSearch: getUpdateLogAppList,
    initialSearchData: {
      up_app_version: "",
      up_app_desc: "",
    }
  });

  // 일괄 삭제 처리
  const handleBatchDelete = async () => {
    const selectedUpdateLog = checkedItems
      .map((checked, index) => (checked ? updateLogList[index] : null))
      .filter((updateLog): updateLog is UpdateLogApp => updateLog !== null)
      .map(updateLog => updateLog.up_app_id);

    if (selectedUpdateLog.length === 0) {
      alert("삭제할 업데이트 로그를 선택해주세요.");
      return;
    }

    if (window.confirm("선택한 업데이트 로그들을 삭제하시겠습니까?")) {
      try {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/app/updateLogApp/batchDeleteUpdateLogApp`,
          {
            updateLogAppIds: selectedUpdateLog,
            userId: user.index,
          }
        );

        // 목록 새로고침
        getUpdateLogAppList();
      } catch (err) {
        console.error("업데이트 로그 일괄 삭제 오류:", err);
        alert("업데이트 로그 일괄 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  useEffect(() => {
    getUpdateLogAppList();
  }, []);

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">업데이트 로그 관리</h2>
          {user.usr_role === 'admin' && (
            <div className="flex gap-2">
              <button
                onClick={handleBatchDelete}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                삭제
              </button>
              <button
                onClick={() => navigate("/app/updateLogApp/updateLogAppRegister")}
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
                <td className="border border-gray-300 text-center bg-gray-200 font-medium w-1/6">버전</td>
                <td className="border border-gray-300 p-3 w-2/6">
                  <input
                    type="text"
                    name="up_app_version"
                    value={searchData.up_app_version}
                    onChange={(e) => setSearchData({ ...searchData, up_app_version: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                    placeholder="버전을 입력하세요"
                  />
                </td>
                <td className="border border-gray-300 p-3 text-center bg-gray-200 font-medium w-1/6">내용</td>
                <td className="border border-gray-300 p-3 w-2/6">
                  <input
                    type="text"
                    name="up_app_desc"
                    value={searchData.up_app_desc}
                    onChange={(e) => setSearchData({ ...searchData, up_app_desc: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                    placeholder="내용을 입력하세요"
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

        {updateLogList?.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>등록된 업데이트 로그가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-semibold">총 {updateLogList.length}건</p>
              <p>아래 목록 클릭 시 상세 페이지로 이동합니다.</p>
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
                    <th className="text-center whitespace-nowrap">버전</th>
                    <th className="text-center whitespace-nowrap hidden md:table-cell">
                      내용
                    </th>
                    <th className="text-center whitespace-nowrap">등록일</th>
                    <th className="text-center whitespace-nowrap">수정일</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUpdateLogList.map((updateLog, index) => (
                    <tr
                      key={updateLog.up_app_id}
                      className="h-16 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/app/updateLogApp/updateLogAppDetail?upAppId=${updateLog.up_app_id}`)}
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
                      <td className="pl-4 text-center">{updateLogList?.length - index}</td>
                      <td className="text-center">
                        {updateLog.up_app_version}
                      </td>
                      <td className="text-center max-w-[150px] truncate hidden md:table-cell whitespace-nowrap">
                        {updateLog.up_app_desc}
                      </td>
                      <td className="text-center">
                        {updateLog.reg_dt ? updateLog.reg_dt : '-'}
                      </td>
                      <td className="text-center">
                        {updateLog.mod_dt ? updateLog.mod_dt : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      {/* 페이지네이션 */}
      {updateLogList.length > 0 && (
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

export default UpdateLogAppList;
