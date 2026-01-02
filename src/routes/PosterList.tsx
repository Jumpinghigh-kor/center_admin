import React, { useCallback, useEffect, useState } from "react";
import { useUserStore } from "../store/store";
import axios from "axios";
import { convertDate } from "../utils/formatUtils";
import { isAllSelected, toggleSelectAll, toggleSelectOne } from "../utils/commonUtils";
import { useNavigate } from "react-router-dom";
import { usePagination } from "../hooks/usePagination";
import Pagination from "../components/Pagination";

interface PosterListType {
  poster_id: number;
  poster_type: "WEB" | "PRINT";
  title: string;
  start_dt: string;
  end_dt: string;
  reg_dt: string;
  reg_id: string;
}

const PosterList: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();
  const [posterList, setPosterList] = useState<PosterListType[]>([]);
  const [selectedPosterIds, setSelectedPosterIds] = useState<number[]>([]);
  const allPosterIds = posterList.map((p) => p.poster_id);
  const [itemsPerPage] = useState(10);

  // 공통 페이지네이션 훅 사용
  const pagination = usePagination({
    totalItems: posterList.length,
    itemsPerPage,
  });
  const currentPosters = pagination.getCurrentPageData(posterList);

  // 목록 변경 시 페이지 범위 보정
  useEffect(() => {
    const total = posterList.length;
    const totalPagesCalc = Math.max(1, Math.ceil(total / itemsPerPage));
    if (pagination.currentPage > totalPagesCalc) {
      pagination.handlePageChange(1);
    }
  }, [posterList.length]);

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/poster`);

      setPosterList(res.data.result);
    } catch (e) {
      console.log(e);
    }
  }, [user]);

  const deleteSelectedPosters = useCallback(async () => {
    if (user?.usr_role !== "admin") return;
    if (!selectedPosterIds.length) return alert("삭제할 포스터를 선택해주세요.");
    const ok = window.confirm(`선택한 포스터 ${selectedPosterIds.length}개를 삭제할까요?`);
    if (!ok) return;

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/poster/deletePosterBase`, {
        poster_id: selectedPosterIds,
        userId: user.index,
      });
      setSelectedPosterIds([]);
      await fetchData();
      alert("삭제되었습니다.");
    } catch (e) {
      console.log(e);
      alert("삭제에 실패했습니다.");
    }
  }, [fetchData, selectedPosterIds, user]);

  useEffect(() => {
    const loadData = async () => {
      await fetchData();
    };

    loadData();
  }, [fetchData]);

  return (
    <div className="p-3 sm:p-10">
      <div className="flex justify-between">
        <span className="font-bold text-xl">포스터 관리</span>
        {user?.usr_role === "admin" ? (
          <div className="flex items-center gap-2">
            <button
              className="block rounded-2xl px-4 py-2 text-center text-sm text-white font-extrabold shadow-sm hover:text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#C4302B' }}
              disabled={!selectedPosterIds.length}
              onClick={deleteSelectedPosters}
            >
              삭제
            </button>
            <button
              className="block rounded-2xl px-4 py-2 text-center text-sm  text-white font-extrabold shadow-sm hover:text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 hover:opacity-80"
              style={{ backgroundColor: '#5F9EA0' }}
              onClick={() => {
                navigate("/poster/register");
              }}
            >
              등록
            </button>
          </div>
        ) : null}
      </div>
      <div className="text-sm mt-4 mb-2 flex flex-row justify-between">
        <p className="font-bold">총 {posterList.length}개</p>
        <p className="text-base">목록을 클릭하여 상세 화면으로 이동 후 포스터를 다운로드 해주세요.</p>
      </div>
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500">
          <thead className="text-xs text-white font-bold uppercase bg-custom-C4C4C4">
            <tr>
              {user?.usr_role === "admin" ? (
                <th
                  scope="col"
                  className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
                >
                  <input
                    type="checkbox"
                    aria-label="전체 선택"
                    className="h-4 w-4"
                    disabled={!posterList.length}
                    checked={isAllSelected(allPosterIds, selectedPosterIds)}
                    onChange={(e) => {
                      setSelectedPosterIds(toggleSelectAll(allPosterIds, e.target.checked));
                    }}
                  />
                </th>
              ) : null}
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                번호
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                유형
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                제목
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                다운로드 기간
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                등록일
              </th>
            </tr>
          </thead>
          <tbody>
            {!posterList.length ? (
              <tr className="text-center py-10 text-gray-500">
                <td colSpan={user?.usr_role === "admin" ? 6 : 5} className="p-4">
                  등록된 포스터가 없습니다.
                </td>
              </tr>
            ) : (
              <>
                {currentPosters.map((ele, index) => (
                  <tr
                    key={ele.poster_id}
                    className={`bg-white border-b hover:bg-gray-50 cursor-pointer`}
                    onClick={() => {
                      navigate(`/poster/detail/${ele.poster_id}`);
                    }}
                  >
                    {user?.usr_role === "admin" ? (
                      <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                        <input
                          type="checkbox"
                          aria-label="선택"
                          className="h-4 w-4"
                          checked={selectedPosterIds.includes(ele.poster_id)}
                          onChange={(e) => {
                            setSelectedPosterIds((prev) =>
                              toggleSelectOne(prev, ele.poster_id, e.target.checked)
                            );
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onDoubleClick={(e) => e.stopPropagation()}
                        />
                      </td>
                    ) : null}
                    <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                      {posterList.length -
                        (((pagination.currentPage - 1) * itemsPerPage) + index)}
                    </td>
                    <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                      {ele.poster_type === "WEB" ? "웹용" : ele.poster_type === "PRINT" ? "인쇄용" : "전체(웹용, 인쇄용)"}
                    </td>
                    <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                      {ele.title}
                    </td>
                    <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                      {String(ele.end_dt ?? "").startsWith("2999") ? "무기한" : ele.start_dt + " ~ " + ele.end_dt}
                    </td>
                    <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                      {ele.reg_dt}
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* 공통 페이지네이션 */}
      {posterList.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={pagination.handlePageChange}
        />
      )}
    </div>
  );
};

export default PosterList;
