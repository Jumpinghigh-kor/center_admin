import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../store/store";
import BannerModal from "../../components/app/BannerModal";

interface Banner {
  bannerAppId: number;
  bannerType: string;
  title: string;
  content: string;
  startDate: string;
  endDate: string;
  bannerLocate: string;
  useYn: "Y" | "N";
  delYn: "Y" | "N";
  orderSeq: number;
  regDate: string;
  fileId: number;
  imageUrl?: string;
}

interface CommonCode {
  common_code: string;
  group_code: string;
  common_code_name: string;
  common_code_memo: string;
}

const BannerList: React.FC = () => {
  const navigate = useNavigate();
  const [bannersList, setBannersList] = useState<Banner[]>([]);
  const user = useUserStore((state) => state.user);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedBanners, setSelectedBanners] = useState<number[]>([]);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [commonCodeList, setCommonCodeList] = useState<CommonCode[]>([]);

  // 검색 데이터 상태
  const [searchData, setSearchData] = useState({
    bannerLocate: "",
    bannerType: "",
    startDate: "",
    endDate: "",
    useYn: ""
  });

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
        `${process.env.REACT_APP_API_URL}/app/bannerApp/selectBannerAppList`,
        searchData
      );
      
      const bannersWithVisibility = response.data.map((banner: Banner) => ({
        ...banner,
      }));

      setBannersList(bannersWithVisibility);
      setSelectedBanners([]);
    } catch (err) {
      console.error("배너 목록 검색 오류:", err);
    }
  };

  // 검색 초기화
  const handleReset = () => {
    setSearchData({
      bannerLocate: "",
      bannerType: "",
      startDate: "",
      endDate: "",
      useYn: ""
    });
    fetchBanners();
  };

  // 배너 목록 불러오기
  useEffect(() => {
    fetchBanners();
    fetchCommonCodeList();
  }, []);

  // 배너 등록 모달 열기
  const handleRegisterClick = () => {
    setSelectedBanner(null);
    setIsModalOpen(true);
  };

  // 배너 등록 성공 후 처리
  const handleBannerRegistered = () => {
    setIsModalOpen(false);
    // 배너 목록 새로고침
    fetchBanners();
  };
  
  // 배너 목록 새로고침
  const fetchBanners = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/bannerApp/selectBannerAppList`,
        {
          ...searchData
        }
      );

      const bannersWithVisibility = response.data.map((banner: Banner) => ({
        ...banner,
      }));

      setBannersList(bannersWithVisibility);
      setSelectedBanners([]);
    } catch (err) {
      console.error("배너 목록 로딩 오류:", err);
    } finally {
    }
  };

  // 공통 코드 목록 조회회
  const fetchCommonCodeList = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/common/selectCommonCodeList`
        , {
          group_code: "BANNER_TYPE"
        }
      );

      setCommonCodeList(response.data.result);
    } catch (err) {
      console.error("공통 코드 목록 로딩 오류:", err);
    } finally {
    }
  };

  // 일괄 삭제 처리
  const handleBatchDelete = async () => {
    if (selectedBanners.length === 0) {
      alert("삭제할 배너를 선택해주세요.");
      return;
    }

    if (window.confirm("선택한 배너들을 삭제하시겠습니까?")) {
      try {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/app/bannerApp/batchDeleteBannerApp`,
          {
            bannerAppIds: selectedBanners,
            userId: user.index,
          }
        );

        // 목록 새로고침
        fetchBanners();
        alert("선택한 배너들이 삭제되었습니다.");
      } catch (err) {
        console.error("배너 일괄 삭제 오류:", err);
        alert("배너 일괄 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  // 체크박스 상태 변경 핸들러
  const handleCheckboxChange = (bannerId: number) => {
    setSelectedBanners((prev) => {
      if (prev.includes(bannerId)) {
        return prev.filter((id) => id !== bannerId);
      } else {
        return [...prev, bannerId];
      }
    });
  };

  // 전체 선택 체크박스 핸들러
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // 모든 배너 ID 선택
      const allBannerIds = bannersList.map((banner) => banner.bannerAppId);
      setSelectedBanners(allBannerIds);
    } else {
      // 선택 초기화
      setSelectedBanners([]);
    }
  };

  // 날짜 형식 변환 (YYYYMMDDHHMMSS -> YYYY-MM-DD HH:MM:SS)
  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr.length !== 14) return dateStr;

    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(8, 10);
    const minute = dateStr.substring(10, 12);
    const second = dateStr.substring(12, 14);

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">배너 관리</h2>
          <div className="flex gap-2">
            <button
              onClick={handleBatchDelete}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              일괄 삭제
            </button>
            <button
              onClick={handleRegisterClick}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              배너 등록
            </button>
          </div>
        </div>

        {/* 검색 필터 테이블 */}
        <div className="mb-6">
          <table className="w-full border border-gray-300">
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 text-center bg-gray-50 font-medium">위치</td>
                <td className="border border-gray-300 p-2">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="bannerLocate"
                        value=""
                        checked={searchData.bannerLocate === ''}
                        onChange={(e) => handleSearchChange('bannerLocate', e.target.value)}
                        className="mr-1"
                      />
                      <span className="text-sm">전체</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="bannerLocate"
                        value="HOME"
                        checked={searchData.bannerLocate === 'HOME'}
                        onChange={(e) => handleSearchChange('bannerLocate', e.target.value)}
                        className="mr-1"
                      />
                      <span className="text-sm">홈</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="bannerLocate"
                        value="SHOP"
                        checked={searchData.bannerLocate === 'SHOP'}
                        onChange={(e) => handleSearchChange('bannerLocate', e.target.value)}
                        className="mr-1"
                      />
                      <span className="text-sm">쇼핑</span>
                    </label>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 text-center bg-gray-50 font-medium">타입</td>
                <td className="border border-gray-300 p-2">
                  <select
                    value={searchData.bannerType}
                    onChange={(e) => handleSearchChange('bannerType', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                  >
                    <option value="">전체</option>
                    {commonCodeList.map((code) => (
                      <option key={code.common_code} value={code.common_code}>
                        {code.common_code_name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 text-center bg-gray-50 font-medium w-1/6">전시 일시</td>
                <td className="border border-gray-300 p-2 flex items-center justify-between">
                  <input
                    type="date"
                    value={searchData.startDate}
                    onChange={(e) => handleSearchChange('startDate', e.target.value)}
                    className="w-1/2 px-2 py-1 border border-gray-300 rounded cursor-pointer"
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                  />
                  <span>~</span>
                  <input
                    type="date"
                    value={searchData.endDate}
                    onChange={(e) => handleSearchChange('endDate', e.target.value)}
                    className="w-1/2 px-2 py-1 border border-gray-300 rounded cursor-pointer"
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                  />
                </td>
                <td className="border border-gray-300 p-2 text-center bg-gray-50 font-medium w-1/6">사용여부</td>
                <td className="border border-gray-300 p-2">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="useYn"
                        value=""
                        checked={searchData.useYn === ''}
                        onChange={(e) => handleSearchChange('useYn', e.target.value)}
                        className="mr-1"
                      />
                      <span className="text-sm">전체</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="useYn"
                        value="Y"
                        checked={searchData.useYn === 'Y'}
                        onChange={(e) => handleSearchChange('useYn', e.target.value)}
                        className="mr-1"
                      />
                      <span className="text-sm">사용</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="useYn"
                        value="N"
                        checked={searchData.useYn === 'N'}
                        onChange={(e) => handleSearchChange('useYn', e.target.value)}
                        className="mr-1"
                      />
                      <span className="text-sm">미사용</span>
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

        {bannersList.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>등록된 배너가 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="w-full h-16 border-b border-gray-200">
                  <th className="text-center px-4 w-12">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5"
                      onChange={handleSelectAll}
                      checked={
                        selectedBanners.length === bannersList.length &&
                        bannersList.length > 0
                      }
                    />
                  </th>
                  <th className="text-center pl-4 whitespace-nowrap">번호</th>
                  <th className="text-center whitespace-nowrap">위치</th>
                  <th className="text-center whitespace-nowrap">타입</th>
                  <th className="text-center whitespace-nowrap">제목</th>
                  <th className="text-center whitespace-nowrap">시작일</th>
                  <th className="text-center whitespace-nowrap">종료일</th>
                  <th className="text-center whitespace-nowrap hidden md:table-cell">
                    사용여부
                  </th>
                  <th className="text-center whitespace-nowrap">등록일</th>
                </tr>
              </thead>
              <tbody>
                {bannersList.map((banner, index) => (
                  <tr
                    key={banner.bannerAppId}
                    className="h-16 border-b border-gray-200 hover:bg-gray-50"
                    onClick={() => setSelectedBanner(banner)}
                    onDoubleClick={() => {
                      setSelectedBanner(banner);
                      setIsModalOpen(true);
                    }}
                  >
                    <td
                      className="px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5"
                        checked={selectedBanners.includes(banner.bannerAppId)}
                        onChange={() =>
                          handleCheckboxChange(banner.bannerAppId)
                        }
                      />
                    </td>
                    <td className="pl-4 text-center">{bannersList?.length - index}</td>
                    <td className="text-center whitespace-nowrap">
                      {banner.bannerLocate === "HOME" ? "홈" : "쇼핑"}
                    </td>
                    <td className="text-center whitespace-nowrap">
                      {commonCodeList?.length > 0 && commonCodeList?.find(code => code.common_code === banner.bannerType)?.common_code_name}
                    </td>
                    <td className="text-center px-2 max-w-[100px] md:max-w-[200px] truncate">
                      {banner.title}
                    </td>
                    <td className="text-center whitespace-nowrap">
                      {banner.startDate}
                    </td>
                    <td className="text-center whitespace-nowrap">
                      {banner.endDate}
                    </td>
                    <td className="text-center hidden md:table-cell">
                      {banner.useYn === "Y" ? "사용" : "미사용"}
                    </td>
                    <td className="text-center whitespace-nowrap">
                      {banner.regDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 배너 등록 모달 */}
      <BannerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleBannerRegistered}
        selectedBanner={selectedBanner}
        commonCodeList={commonCodeList}
      />
    </>
  );
};

export default BannerList;
