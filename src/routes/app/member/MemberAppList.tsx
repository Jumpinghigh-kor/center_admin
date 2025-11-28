import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../../store/store";
import Pagination from "../../../components/Pagination";
import { usePagination } from "../../../hooks/usePagination";
import { useSearch } from "../../../hooks/useSearch";
import { openInputDatePicker } from "../../../utils/commonUtils";
import CreateAppAccountPopup from "../../../components/app/CreateAppAccountPopup";
import { Member } from "../../../utils/types";

interface MemberApp {
  mem_id: number;
  center_name: string;
  mem_phone: string;
  mem_gender: string;
  mem_sch_id: number;
  mem_name: string;
  mem_app_status: string;
  point_amount: number;
  recent_dt: string;
  app_reg_dt: string; 
  app_exit_dt: string;
}

interface CenterItem {
  center_id: number;
  center_name: string;
}

const MemberList: React.FC = () => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const [memberList, setMemberList] = useState<MemberApp[]>([]);
  const [centerList, setCenterList] = useState<CenterItem[]>([]);
  const [popupMode, setPopupMode] = useState<string>("");
  const [popupToggle, setPopupToggle] = useState<boolean>(false);
  const [selectedMember, setSelectedMember] = useState<MemberApp>();
  const pagination = usePagination({
    totalItems: memberList.length,
    itemsPerPage: 10,
  });

  // 현재 페이지에 표시할 데이터
  const currentMemberList = pagination.getCurrentPageData(memberList);

  // 회원 목록 불러오기
  const selectMemberAppList = async (searchParams?: any) => {
    try {
      const { center_id: searchCenterId, ...restSearchParams } = searchParams || {};
      const payload: any = {
        usr_role: user.usr_role,
        ...restSearchParams
      };
      if (user.usr_role !== 'admin') {
        payload.center_id = user.center_id;
      } else if (searchCenterId) {
        payload.center_id = searchCenterId;
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/memberApp/selectMemberAppList`,
        payload
      );

      setMemberList(response.data.result);
      pagination.resetPage();
    } catch (err) {
      console.error("회원 목록 로딩 오류:", err);
    } finally {
    }
  };

  // 센터 목록 불러오기
  const selectCenterList = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/center/list`,
        {
          params: user
        }
      );

      setCenterList(response.data.result);
    } catch (err) {
      console.error("센터 목록 로딩 오류:", err);
    } finally {
    }
  };

  // 검색 공통 훅 사용
  const { searchData, setSearchData, handleSearch, handleReset } = useSearch({
    onSearch: selectMemberAppList,
    initialSearchData: {
      mem_name: "",
      mem_app_status: "",
      mem_gender: "",
      start_recent_dt: "",
      end_recent_dt: "",
      start_app_reg_dt: "",
      end_app_reg_dt: "",
      center_id: ""
    }
  });

  useEffect(() => {
    if (user && user.index) {
      selectMemberAppList();
      selectCenterList();
    }
  }, [user]);

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">회원 관리</h2>
          <button
            onClick={() => {
              if (!selectedMember) {
                alert("회원을 선택하세요.");
                return;
              }
              setPopupMode(selectedMember?.mem_app_status ? "emailChange" : "create");
              setPopupToggle(true);
            }}
            className={`px-4 py-2 text-sm font-medium text-white ${selectedMember?.mem_app_status ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"} border border-transparent rounded`}
          >
            {selectedMember?.mem_app_status ? "어플 계정 변경" : "어플 계정 생성"}
          </button>
        </div>

        {/* 검색 필터 테이블 */}
        <div className="mb-6">
          <table className="w-full border border-gray-300">
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium w-1/6">이름</td>
                <td className="border border-gray-300 p-2 w-2/6">
                  <input
                    type="text"
                    value={searchData.mem_name}
                    onChange={(e) => setSearchData({ ...searchData, mem_name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                    placeholder="이름을 입력하세요"
                  />
                </td>
                <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium w-1/6">앱 회원상태</td>
                <td className="border border-gray-300 p-2 w-2/6">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="mem_app_status"
                        value=""
                        checked={searchData.mem_app_status === ''}
                        onChange={(e) => setSearchData({ ...searchData, mem_app_status: e.target.value })}
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
                        onChange={(e) => setSearchData({ ...searchData, mem_app_status: e.target.value })}
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
                        onChange={(e) => setSearchData({ ...searchData, mem_app_status: e.target.value })}
                        className="mr-1"
                      />
                      <span className="text-sm">탈퇴회원</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="mem_app_status"
                        value="PROCEED"
                        checked={searchData.mem_app_status === 'PROCEED'}
                        onChange={(e) => setSearchData({ ...searchData, mem_app_status: e.target.value })}
                        className="mr-1"
                      />
                      <span className="text-sm">가입중 회원</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="mem_app_status"
                        value="NON_MEMBER"
                        checked={searchData.mem_app_status === 'NON_MEMBER'}
                        onChange={(e) => setSearchData({ ...searchData, mem_app_status: e.target.value })}
                        className="mr-1"
                      />
                      <span className="text-sm">미가입 회원</span>
                    </label>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 py-3 text-center bg-gray-200 font-medium w-1/6">성별</td>
                <td className="border border-gray-300 p-2 w-2/6">
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
                      <span className="text-sm">남자</span>
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
                      <span className="text-sm">여자</span>
                    </label>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium">최근 로그인일시</td>
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
                    value={searchData.start_recent_dt}
                    onChange={(e) => setSearchData({ ...searchData, start_recent_dt: e.target.value })}
                    onClick={(e) => openInputDatePicker(e.currentTarget)}
                    onFocus={(e) => openInputDatePicker(e.currentTarget)}
                    className="w-1/2 px-2 py-1 border border-gray-300 rounded cursor-pointer"
                  />
                  ~
                  <input
                    type="date"
                    value={searchData.end_recent_dt}
                    onChange={(e) => setSearchData({ ...searchData, end_recent_dt: e.target.value })}
                    onClick={(e) => openInputDatePicker(e.currentTarget)}
                    onFocus={(e) => openInputDatePicker(e.currentTarget)}
                    className="w-1/2 px-2 py-1 border border-gray-300 rounded cursor-pointer"
                  />
                </td>
              </tr>
              <tr>
              <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium w-1/6">어플 가입일시</td>
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
                    value={searchData.start_app_reg_dt}
                    onChange={(e) => setSearchData({ ...searchData, start_app_reg_dt: e.target.value })}
                    onClick={(e) => openInputDatePicker(e.currentTarget)}
                    onFocus={(e) => openInputDatePicker(e.currentTarget)}
                    className="w-1/2 px-2 py-1 border border-gray-300 rounded cursor-pointer"
                  />
                  ~
                  <input
                    type="date"
                    value={searchData.end_app_reg_dt}
                    onChange={(e) => setSearchData({ ...searchData, end_app_reg_dt: e.target.value })}
                    onClick={(e) => openInputDatePicker(e.currentTarget)}
                    onFocus={(e) => openInputDatePicker(e.currentTarget)}
                    className="w-1/2 px-2 py-1 border border-gray-300 rounded cursor-pointer"
                  />
                </td>
                {user.usr_role === 'admin' &&
                  <>
                    <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium w-1/6">등록 센터(관리자만 노출)</td>
                    <td className="border border-gray-300 p-2 w-2/6">
                      <select
                        value={searchData.center_id}
                        onChange={(e) => setSearchData({ ...searchData, center_id: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value="">전체</option>
                        {centerList.map((center) => (
                          <option key={center.center_id} value={center.center_id}>{center.center_name}</option>
                        ))}
                      </select>
                    </td>
                  </>
                }
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

        {memberList.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>등록된 회원이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="mt-4 mb-4 flex justify-between items-center">
              <p className="text-sm font-bold">총 {memberList.length}건</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="w-full h-16 border-b border-gray-200 bg-gray-200">
                    <th className="text-center pl-4">선택</th>
                    <th className="text-center pl-4">번호</th>
                    <th className="text-center">이름</th>
                    <th className="text-center">
                      <span className="inline-flex items-center justify-center">
                        회원 어플 상태
                        <span className="relative group ml-1 inline-flex items-center">
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-400 text-white text-[10px] font-bold cursor-pointer">?</span>
                          <div className="absolute left-1/2 -translate-x-1/2 top-5 z-10 w-56 px-2 py-3 text-xs text-white bg-gray-900 rounded shadow opacity-0 invisible group-hover:opacity-100 group-hover:visible">
                            <div className="space-y-1 text-left">
                              <p>활동 회원 : 계정 생성 후 로그인을 한 회원</p>
                              <p>가입 진행중 회원 : 계정만 생성한 회원</p>
                              <p>미가입 회원 : 계정을 생성하지 않은 회원</p>
                            </div>
                          </div>
                        </span>
                      </span>
                    </th>
                    <th className="text-center">성별</th>
                    <th className="text-center">전화번호</th>
                    <th className="text-center">포인트 잔액</th>
                    <th className="text-center">최근 로그인일시</th>
                    <th className="text-center">어플 가입일시</th>
                    <th className="text-center">탈퇴 일시</th>
                    {user.usr_role === 'admin' && <th className="text-center">등록 센터<br />(관리자만 노출)</th>}
                  </tr>
                </thead>
                <tbody>
                  {currentMemberList?.map((member, index) => (
                    <tr
                      key={member.mem_id}
                      className="h-16 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedMember(member)}
                    >
                      <td className="pl-4 text-center">
                        <input
                          type="radio"
                          name="memberRowSelect"
                          value={member.mem_id}
                          className="h-5 w-5 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => setSelectedMember(member)}
                          checked={selectedMember?.mem_id === member.mem_id}
                          aria-label="멤버 선택"
                        />
                      </td>
                      <td className="pl-4 text-center">
                        {memberList.length - (pagination.startIndex + index)}
                      </td>
                      <td className="text-center px-2">{member.mem_name}</td>
                      <td className="text-center px-2">
                        {member.mem_app_status === 'ACTIVE' ? '활동 회원' : member.mem_app_status === 'PROCEED' ? '가입 진행중 회원' : member.mem_app_status === 'EXIT' ? '탈퇴 회원' : '미가입 회원'}
                      </td>
                      <td className="text-center px-2">{member.mem_gender ? member.mem_gender : '-'}</td>
                      <td className="text-center px-2">{member.mem_phone ? member.mem_phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') : '-'}</td>
                      <td className="text-center px-2">{member.point_amount ? member.point_amount.toLocaleString() : '-'}</td>
                      <td className="text-center">{member.recent_dt ? member.recent_dt : '-'}</td>
                      <td className="text-center">{member.app_reg_dt ? member.app_reg_dt : '-'}</td>
                      <td className="text-center">{member.app_exit_dt ? member.app_exit_dt : '-'}</td>
                      {user.usr_role === 'admin' && (
                        <td className="text-center px-2">{member.center_name ? member.center_name : '-'}</td>
                      )}
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
      {popupToggle ? (
        <CreateAppAccountPopup
          isOpen={popupToggle}
          onClose={() => setPopupToggle(false)}
          onSuccess={() => {
            setPopupToggle(false);
            setSelectedMember(undefined);
            selectMemberAppList(searchData);
          }}
          selectedMember={selectedMember as Member | undefined}
          mode={popupMode}
        />
      ) : null}
      </>
  );
};

export default MemberList;
