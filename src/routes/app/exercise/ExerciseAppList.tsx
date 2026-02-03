import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../../store/store";
import Pagination from "../../../components/Pagination";
import { usePagination } from "../../../hooks/usePagination";
import { useSearch } from "../../../hooks/useSearch";
import { formatExerciseTime } from "../../../utils/formatUtils";
import { openInputDatePicker } from "../../../utils/commonUtils";

interface ExerciseApp {
  exercise_app_id: number;
  mem_id: number;
  mem_gender: string;
  mem_name: string;
  exercise_dt: string;
  member_type: string;
  reg_dt: string;
  reg_id: string;
  account_app_id: string;
  total_jumping_calory: number;
  total_other_calory: number;
}

interface CommonCode {
  common_code: string;
  common_code_name: string;
}

const ExerciseAppList: React.FC = () => {
  const [exerciseAppList, setExerciseAppList] = useState<ExerciseApp[]>([]);
  const [commonCodeList, setCommonCodeList] = useState<CommonCode[]>([]);
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();
  
  // 페이지네이션 훅 사용
  const pagination = usePagination({
    totalItems: exerciseAppList.length,
    itemsPerPage: 10,
  });

  // 현재 페이지에 표시할 데이터
  const currentInquiries = pagination.getCurrentPageData(exerciseAppList);

  // 공통 코드 목록 불러오기
  const selectCommonCodeList = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/common/selectCommonCodeList`,
        {
          group_code: 'EXERCISE_TYPE',
        }
      );

      setCommonCodeList(response.data.result);
    } catch (err) {
      console.error("공통 코드 목록 로딩 오류:", err);
    } finally {
    }
  };

  // 운동 목록 불러오기
  const selectExerciseAppList = async (searchParams?: any) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/exerciseApp/selectExerciseAppList`,
        {
          center_id: user.center_id,
          ...searchParams
        }
      );
      
      setExerciseAppList(response.data.result);
      pagination.resetPage();
    } catch (err) {
      console.error("운동 목록 로딩 오류:", err);
    } finally {
    }
  };

  // 검색 공통 훅 사용
  const { searchData, setSearchData, handleSearch, handleReset } = useSearch({
    onSearch: (searchParams) => {
      // 날짜 유효성 검사
      if (searchParams.exercise_start_dt && searchParams.exercise_end_dt) {
        const startDate = searchParams.exercise_start_dt.replace(/-/g, '');
        const endDate = searchParams.exercise_end_dt.replace(/-/g, '');
        
        if (startDate > endDate) {
          alert('시작일은 종료일보다 이전이어야 합니다.');
          return;
        }
      }
      
      selectExerciseAppList(searchParams);
    },
    initialSearchData: {
      mem_name: '',
      mem_gender: '',
      exercise_start_dt: '',
      exercise_end_dt: '',
      member_type: '',
      total_jumping_calory_min: '',
      total_jumping_calory_max: '',
      total_other_calory_min: '',
      total_other_calory_max: '',
    }
  });

  useEffect(() => {
    if (user && user.index) {
      selectCommonCodeList();
      selectExerciseAppList();
    }
  }, [user]);

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">운동 관리</h2>
        </div>

        {/* 검색 필터 테이블 */}
        <div className="mb-6">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium w-1/6">이름</td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="text"
                    value={searchData.mem_name}
                    onChange={(e) => setSearchData({ ...searchData, mem_name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                    placeholder="이름을 입력하세요"
                  />
                </td>
                <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium w-1/6">성별</td>
                <td className="border border-gray-300 p-2">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="mem_gender"
                        value=""
                        checked={searchData.mem_gender === ''}
                        onChange={(e) => setSearchData({ ...searchData, mem_gender: e.target.value })}
                        className="mr-1"
                      />
                      <span className="text-sm">전체</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="mem_gender"
                        value="1"
                        checked={searchData.mem_gender === '1'}
                        onChange={(e) => setSearchData({ ...searchData, mem_gender: e.target.value })}
                        className="mr-1"
                      />
                      <span className="text-sm">남성</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="mem_gender"
                        value="0"
                        checked={searchData.mem_gender === '0'}
                        onChange={(e) => setSearchData({ ...searchData, mem_gender: e.target.value })}
                        className="mr-1"
                      />
                      <span className="text-sm">여성</span>
                    </label>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium w-1/6">운동일시</td>
                <td
                  className="border p-2 flex items-center justify-between"
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target && target.tagName.toLowerCase() === 'input') return;
                    const firstInput = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement | null;
                    if (firstInput) openInputDatePicker(firstInput);
                  }}
                >
                  <input
                    type="date"
                    value={searchData.exercise_start_dt}
                    onChange={(e) => setSearchData({ ...searchData, exercise_start_dt: e.target.value })}
                    onClick={(e) => openInputDatePicker(e.currentTarget)}
                    onFocus={(e) => openInputDatePicker(e.currentTarget)}
                    className="w-1/2 px-2 py-1 border border-gray-300 rounded cursor-pointer"
                  />
                  ~
                  <input
                    type="date"
                    value={searchData.exercise_end_dt}
                    onChange={(e) => setSearchData({ ...searchData, exercise_end_dt: e.target.value })}
                    onClick={(e) => openInputDatePicker(e.currentTarget)}
                    onFocus={(e) => openInputDatePicker(e.currentTarget)}
                    className="w-1/2 px-2 py-1 border border-gray-300 rounded cursor-pointer"
                  />
                </td>
                <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium w-1/6">점핑 운동 유형</td>
                <td className="border border-gray-300 p-2">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="member_type"
                        value=""
                        checked={searchData.member_type === ''}
                        onChange={(e) => setSearchData({ ...searchData, member_type: e.target.value })}
                        className="mr-1"
                      />
                      <span className="text-sm">전체</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="member_type"
                        value="NORMAL_MEMBER"
                        checked={searchData.member_type === 'NORMAL_MEMBER'}
                        onChange={(e) => setSearchData({ ...searchData, member_type: e.target.value })}
                        className="mr-1"
                      />
                      <span className="text-sm">일반 회원</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="member_type"
                        value="TUTOR"
                        checked={searchData.member_type === 'TUTOR'}
                        onChange={(e) => setSearchData({ ...searchData, member_type: e.target.value })}
                        className="mr-1"
                      />
                      <span className="text-sm">수업 강사</span>
                    </label>
                  </div>
                </td>
              </tr>
              <tr>
              <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium w-1/6">점핑핑 운동 칼로리</td>
                <td className="border border-gray-300 p-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={searchData.total_jumping_calory_min}
                      onChange={(e) => setSearchData({ ...searchData, total_jumping_calory_min: e.target.value })}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      placeholder="최소"
                    />
                    <span className="text-sm text-gray-500">~</span>
                    <input
                      type="text"
                      value={searchData.total_jumping_calory_max}
                      onChange={(e) => setSearchData({ ...searchData, total_jumping_calory_max: e.target.value })}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      placeholder="최대"
                    />
                    <span className="text-sm text-gray-500">kcal</span>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium w-1/6">기타 운동 칼로리</td>
                <td className="border border-gray-300 p-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={searchData.total_other_calory_min}
                      onChange={(e) => setSearchData({ ...searchData, total_other_calory_min: e.target.value })}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      placeholder="최소"
                    />
                    <span className="text-sm text-gray-500">~</span>
                    <input
                      type="text"
                      value={searchData.total_other_calory_max}
                      onChange={(e) => setSearchData({ ...searchData, total_other_calory_max: e.target.value })}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      placeholder="최대"
                    />
                    <span className="text-sm text-gray-500">kcal</span>
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

        {exerciseAppList.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>등록된 운동이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="mt-4 mb-4 flex justify-between items-center">
                <p className="text-sm font-bold">총 {exerciseAppList.length}건</p>
                <p>아래 목록 클릭 시 상세 페이지로 이동합니다.</p>
              </div>
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="w-full h-16 border-b border-gray-200 bg-gray-200">
                    <th className="text-center pl-4 whitespace-nowrap">번호</th>
                    <th className="text-center whitespace-nowrap">이름</th>
                    <th className="text-center whitespace-nowrap">성별</th>
                    <th className="text-center whitespace-nowrap">운동 일자</th>
                    <th className="text-center whitespace-nowrap">운동 회원 유형</th>
                    <th className="text-center whitespace-nowrap">점핑 전체<br />소모 칼로리</th>
                    <th className="text-center whitespace-nowrap">기타 운동 전체<br />소모 칼로리</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInquiries?.map((exercise, index) => (
                    <tr
                      key={exercise.exercise_app_id}
                      className="h-16 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        navigate(`/app/exerciseApp/exerciseAppDetail?exercise_app_id=${exercise.exercise_app_id}`);
                      }}
                    >
                      <td className="pl-4 text-center">
                        {exerciseAppList.length - (pagination.startIndex + index)}
                      </td>
                      <td className="text-center px-2 truncate">
                        {exercise.mem_name}
                      </td>
                      <td className="text-center px-2 truncate">
                        {exercise.mem_gender == '1' ? '남자' : exercise.mem_gender == '0' ? '여자' : '-'}
                      </td>
                      <td className="text-center px-2 truncate">
                        {exercise.exercise_dt}
                      </td>
                      <td className="text-center px-2 truncate">
                        {exercise.member_type == 'NORMAL_MEMBER' ? '일반 회원' : exercise.member_type == 'TUTOR' ? '수업 강사' : '-'}
                      </td>
                      <td className="text-center px-2 max-w-[70px] hidden md:table-cell">
                        {exercise.total_jumping_calory ? exercise.total_jumping_calory : 0} kcal
                      </td>
                      <td className="text-center whitespace-nowrap">
                        {exercise.total_other_calory ? exercise.total_other_calory : 0} kcal
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

export default ExerciseAppList;
