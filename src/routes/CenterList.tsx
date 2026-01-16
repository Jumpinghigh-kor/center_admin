import axios from "axios";
import React, { useEffect, useState } from "react";
import { useUserStore } from "../store/store";
import {
  convertAmount,
  convertDateMonth,
  convertDateYear,
} from "../utils/formatUtils";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { Center } from "../utils/types";
import { useSearch } from "../hooks/useSearch";

const CenterList: React.FC = () => {
  const current = dayjs().format("YYYY-MM");
  const [allCenters, setAllCenters] = useState<Center[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [selectedCenters, setSelectedCenters] = useState<number[]>([]);
  const [editingCenterId, setEditingCenterId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    // user가 아직 로드되지 않았으면 대기
    if (!user || !user.usr_role) {
      return;
    }

    // user가 로드되었고 admin이 아니면 리다이렉트
    if (user.usr_role !== "admin") {
      navigate("/");
      return;
    }

    const getData = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/center/list`,
          {
            params: user,
          }
        );
        setAllCenters(res.data.result);
        setCenters(res.data.result);
      } catch (e) {
        console.log(e);
      }
    };
    getData();
  }, [user, navigate]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCenters(centers.map((center) => center.center_id));
    } else {
      setSelectedCenters([]);
    }
  };

  const handleSelectCenter = (centerId: number) => {
    setSelectedCenters((prev) =>
      prev.includes(centerId)
        ? prev.filter((id) => id !== centerId)
        : [...prev, centerId]
    );
  };

  const handleDelete = async () => {
    if (selectedCenters.length === 0) {
      alert("삭제할 센터를 선택해주세요.");
      return;
    }

    if (!window.confirm(`선택한 ${selectedCenters.length}개의 센터를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      for (const centerId of selectedCenters) {
        await axios.delete(`${process.env.REACT_APP_API_URL}/center/`, {
          data: { center_id: centerId },
        });
      }
      setSelectedCenters([]);
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/center/list`,
        {
          params: user,
        }
      );
      setAllCenters(res.data.result);
      setCenters(res.data.result);
      alert("삭제가 완료되었습니다.");
    } catch (e) {
      console.log(e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleEditStart = (centerId: number, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCenterId(centerId);
    setEditingName(currentName);
  };

  const handleEditCancel = () => {
    setEditingCenterId(null);
    setEditingName("");
  };

  const handleEditSave = async (centerId: number) => {
    if (!editingName.trim()) {
      alert("센터명을 입력해주세요.");
      return;
    }

    try {
      await axios.patch(`${process.env.REACT_APP_API_URL}/center/name`, {
        center_id: centerId,
        center_name: editingName.trim(),
      });
      
      setCenters((prev) =>
        prev.map((center) =>
          center.center_id === centerId
            ? { ...center, center_name: editingName.trim() }
            : center
        )
      );
      setEditingCenterId(null);
      setEditingName("");
      alert("센터명이 변경되었습니다.");
    } catch (e) {
      console.log(e);
      alert("센터명 변경 중 오류가 발생했습니다.");
    }
  };

  // 검색 기능
  const { searchData, setSearchData, handleSearch, handleReset } = useSearch({
    onSearch: (searchParams) => {
      let filtered = [...allCenters];

      // 계정 아이디 필터
      if (searchParams.usr_id && searchParams.usr_id.trim()) {
        filtered = filtered.filter((center) =>
          center.usr_id?.toLowerCase().includes(searchParams.usr_id.toLowerCase().trim())
        );
      }

      // 센터명 필터
      if (searchParams.center_name && searchParams.center_name.trim()) {
        filtered = filtered.filter((center) =>
          center.center_name?.toLowerCase().includes(searchParams.center_name.toLowerCase().trim())
        );
      }

      // 월 매출 필터
      if (searchParams.monthly_sales_min) {
        const min = parseFloat(searchParams.monthly_sales_min);
        if (!isNaN(min)) {
          filtered = filtered.filter((center) => (center.monthly_sales ?? 0) >= min);
        }
      }
      if (searchParams.monthly_sales_max) {
        const max = parseFloat(searchParams.monthly_sales_max);
        if (!isNaN(max)) {
          filtered = filtered.filter((center) => (center.monthly_sales ?? 0) <= max);
        }
      }

      // 년 매출 필터
      if (searchParams.annual_sales_min) {
        const min = parseFloat(searchParams.annual_sales_min);
        if (!isNaN(min)) {
          filtered = filtered.filter((center) => (center.annual_sales ?? 0) >= min);
        }
      }
      if (searchParams.annual_sales_max) {
        const max = parseFloat(searchParams.annual_sales_max);
        if (!isNaN(max)) {
          filtered = filtered.filter((center) => (center.annual_sales ?? 0) <= max);
        }
      }

      setCenters(filtered);
    },
    initialSearchData: {
      usr_id: "",
      center_name: "",
      monthly_sales_min: "",
      monthly_sales_max: "",
      annual_sales_min: "",
      annual_sales_max: "",
    },
  });

  const isAllSelected = centers.length > 0 && selectedCenters.length === centers.length;

  return (
    <div className="p-3 sm:p-10">
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <span className="font-bold text-xl">전체 센터 리스트</span>
          <button
            onClick={handleDelete}
            disabled={selectedCenters.length === 0}
            style={{ backgroundColor: selectedCenters.length === 0 ? "#C4C4C4" : "#FF2400" }}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              selectedCenters.length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : " text-white"
            }`}
          >
            삭제
          </button>
        </div>
      </div>

      {/* 검색 필터 테이블 */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-6">
        <table className="w-full">
          <tbody>
            <tr>
              <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium w-1/6">계정 아이디</td>
              <td className="border border-gray-300 p-2">
                <input
                  type="text"
                  value={searchData.usr_id}
                  onChange={(e) => setSearchData({ ...searchData, usr_id: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  className="w-full px-2 py-1 border border-gray-300 rounded"
                  placeholder="계정 아이디를 입력하세요"
                />
              </td>
              <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium w-1/6">센터명</td>
              <td className="border border-gray-300 p-2">
                <input
                  type="text"
                  value={searchData.center_name}
                  onChange={(e) => setSearchData({ ...searchData, center_name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  className="w-full px-2 py-1 border border-gray-300 rounded"
                  placeholder="센터명을 입력하세요"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium w-1/6">월 매출</td>
              <td className="border border-gray-300 p-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={searchData.monthly_sales_min}
                    onChange={(e) => setSearchData({ ...searchData, monthly_sales_min: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                    className="w-20 px-2 py-1 border border-gray-300 rounded"
                    placeholder="최소"
                  />
                  <span className="text-sm text-gray-500">~</span>
                  <input
                    type="text"
                    value={searchData.monthly_sales_max}
                    onChange={(e) => setSearchData({ ...searchData, monthly_sales_max: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                    className="w-20 px-2 py-1 border border-gray-300 rounded"
                    placeholder="최대"
                  />
                  <span className="text-sm text-gray-500">원</span>
                </div>
              </td>
              <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium w-1/6">년 매출</td>
              <td className="border border-gray-300 p-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={searchData.annual_sales_min}
                    onChange={(e) => setSearchData({ ...searchData, annual_sales_min: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                    className="w-20 px-2 py-1 border border-gray-300 rounded"
                    placeholder="최소"
                  />
                  <span className="text-sm text-gray-500">~</span>
                  <input
                    type="text"
                    value={searchData.annual_sales_max}
                    onChange={(e) => setSearchData({ ...searchData, annual_sales_max: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                    className="w-20 px-2 py-1 border border-gray-300 rounded"
                    placeholder="최대"
                  />
                  <span className="text-sm text-gray-500">원</span>
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
            style={{ backgroundColor: "#008CC1" }}
            className="px-4 py-2 text-sm font-medium text-white border border-transparent rounded hover:bg-008CC1"
          >
            검색
          </button>
        </div>
      </div>

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg my-4">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500">
          <thead className="text-xs text-white font-bold uppercase bg-custom-C4C4C4">
            <tr>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                ID
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                계정 아이디
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                센터명
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                {`${convertDateMonth(current)}월 매출`}
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                {`${convertDateYear(current)}년 매출`}
              </th>
            </tr>
          </thead>
          <tbody>
            {centers?.map((center, index) => (
              <tr
                key={center.center_id}
                className={`bg-white border-b hover:bg-gray-100 cursor-pointer`}
                onClick={() => handleSelectCenter(center.center_id)}
              >
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-center">
                  <input
                    type="checkbox"
                    checked={selectedCenters.includes(center.center_id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectCenter(center.center_id);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {centers.length - index}
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {center.usr_id}
                </td>
                <td 
                  className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base"
                  onClick={(e) => e.stopPropagation()}
                >
                  {editingCenterId === center.center_id ? (
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleEditSave(center.center_id);
                          } else if (e.key === "Escape") {
                            handleEditCancel();
                          }
                        }}
                        className="px-2 py-1 border border-gray-300 rounded text-center text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={() => handleEditSave(center.center_id)}
                        className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        저장
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="px-2 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>{center.center_name}</span>
                      <button
                        onClick={(e) => handleEditStart(center.center_id, center.center_name, e)}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="편집"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {convertAmount(center?.monthly_sales ?? 0)}원
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {convertAmount(center?.annual_sales ?? 0)}원
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CenterList;
