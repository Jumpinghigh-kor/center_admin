import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../../store/store";
import Pagination from "../../../components/Pagination";
import { usePagination } from "../../../hooks/usePagination";
import { useCheckbox } from "../../../hooks/useCheckbox";
import { useSearch } from "../../../hooks/useSearch";

interface PointApp {
  point_app_id: number;
  mem_name: string;
  status: string;
  point_type: string;
  point_amount: number;
  point_memo: string;
  point_status: string;
  reg_dt: string;
  order_status: string;
  center_name: string;
}

interface CommonCode {
  common_code: string;
  common_code_name: string;
}

interface CenterItem {
  center_id: number;
  center_name: string;
}

interface MemberAppItem {
  mem_id: number;
  account_app_id: number;
  mem_name: string;
  mem_phone: string;
  mem_gender: string;
  status: string;
  center_name: string;
  point_amount: number;
}

const PointAppList: React.FC = () => {
  const navigate = useNavigate();
  const [pointList, setPointList] = useState<PointApp[]>([]);
  const [pointTypeCodeList, setPointTypeCodeList] = useState<CommonCode[]>([]);
  const [centerList, setCenterList] = useState<CenterItem[]>([]);
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);
  const [registerMembers, setRegisterMembers] = useState<MemberAppItem[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(new Set());
  const [isMemoOpen, setIsMemoOpen] = useState<boolean>(false);
  const [selectedMemo, setSelectedMemo] = useState<string>("");
  const [pointStatus, setPointStatus] = useState<'POINT_ADD' | 'POINT_MINUS'>('POINT_ADD');
  const [pointAmount, setPointAmount] = useState<string>("");
  const [pointMemo, setPointMemo] = useState<string>("");
  const user = useUserStore((state) => state.user);

  // 체크박스 공통 훅 사용 (목록 전체 기준)
  const { checkedItems, allChecked, handleAllCheck, handleIndividualCheck } = useCheckbox(pointList.length);

  // 페이지네이션 훅 사용
  const pagination = usePagination({
    totalItems: pointList.length,
    itemsPerPage: 10,
  });

  // 현재 페이지에 표시할 데이터
  const currentPoints = pagination.getCurrentPageData(pointList);

  // 우편함 목록 조회
  const selectPointList = async (searchParams?: any) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/pointApp/selectPointAppList`,
        {
          ...searchParams
        }
      );
      
      setPointList(response.data.result);
      pagination.resetPage();
    } catch (err) {
      console.error("포인트 목록 조회 오류:", err);
    }
  };

  // 검색 공통 훅 사용
  const { searchData, setSearchData, handleSearch, handleReset } = useSearch({
    onSearch: selectPointList,
    initialSearchData: {
      mem_name: "",
      point_type: "",
      center_id: "",
      point_amount_min: "",
      point_amount_max: "",
    }
  });

  // 공통코드: 포인트 유형 조회
  const fetchPointTypeCodes = async () => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/common/selectCommonCodeList`,
        { group_code: "POINT_TYPE" }
      );
      setPointTypeCodeList(res.data?.result || []);
    } catch (e) {
      console.error("포인트 유형 코드 조회 오류:", e);
    }
  };

  // 센터 목록 불러오기 (관리자만)
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

  // 등록 모달용 회원 목록 조회
  const fetchRegisterMembers = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/memberApp/selectMemberAppList`,
        {
          status: 'ACTIVE',
        }
      );
      const list: MemberAppItem[] = response.data?.result || [];
      setRegisterMembers(list);
    } catch (e) {
      console.error("회원 목록 조회 오류:", e);
      setRegisterMembers([]);
    }
  };

  // 선택 삭제 처리
  const handleDeleteSelected = async () => {
    const ids = pointList
      .map((point, idx) => ({ id: point.point_app_id, idx }))
      .filter((_, i) => checkedItems[i])
      .map((point) => point.id);

    if (ids.length === 0) {
      alert('삭제할 포인트를 선택하세요.');
      return;
    }

    const confirmDelete = window.confirm(`정말로 ${ids.length}건을 삭제하시겠습니까?`);
    if (!confirmDelete) return;

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/app/pointApp/deletePointApp`, {
        point_app_id: ids,
        userId: user?.index,
      });
      alert('삭제가 완료되었습니다.');
      await selectPointList();
    } catch (e) {
      console.error(e);
      alert('삭제에 실패했습니다.');
    }
  };

  useEffect(() => {
    if (user && user.index) {
      selectPointList();
    }
    // 초기 공통코드 로딩
    fetchPointTypeCodes();
    // 센터 목록 로딩 (관리자)
    if (user?.usr_role === 'admin') {
      selectCenterList();
    }
  }, [user]);

  // 모달 열릴 때 초기화 및 회원 목록 로딩
  useEffect(() => {
    if (isRegisterOpen) {
      setSelectedMemberIds(new Set());
      setPointStatus('POINT_ADD');
      setPointAmount("");
      setPointMemo("");
      fetchRegisterMembers();
    }
  }, [isRegisterOpen]);

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">포인트 관리</h2>
          <div className="flex items-center gap-2">
            <button
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              onClick={handleDeleteSelected}
            >
              삭제
            </button>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={() => setIsRegisterOpen(true)}>등록/차감</button>
          </div>
        </div>

        {/* 검색 필터 테이블 */}
        <div className="mb-6">
          <table className="w-full border border-gray-300">
            <tbody>
              <tr>
                <td className="border border-gray-300 p-3 text-center bg-gray-200 font-medium w-1/6">이름</td>
                <td className="border border-gray-300 p-3 w-2/6">
                  <input
                    type="text"
                    name="mem_name"
                    value={searchData.mem_name}
                    onChange={(e) => setSearchData({ ...searchData, mem_name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                    placeholder="이름을 입력하세요"
                  />
                </td>
                <td className="border border-gray-300 p-3 text-center bg-gray-200 font-medium w-1/6">포인트 유형</td>
                <td className="border border-gray-300 p-3 w-2/6">
                  <div className="flex items-center space-x-4">
                    <select
                      name="point_type"
                      value={searchData.point_type}
                      onChange={(e) =>
                        setSearchData({ ...searchData, point_type: e.target.value })
                      }
                      className="w-48 px-2 py-1 border border-gray-300 rounded"
                    >
                      <option value="">전체</option>
                      {pointTypeCodeList.map((code) => (
                        <option key={code.common_code} value={code.common_code}>
                          {code.common_code_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-3 text-center bg-gray-200 font-medium w-1/6">
                  센터
                </td>
                <td className="border border-gray-300 p-3">
                  <div className="flex items-center space-x-4">
                    <select
                      name="center_id"
                      value={searchData.center_id}
                      onChange={(e) =>
                        setSearchData({ ...searchData, center_id: e.target.value })
                      }
                      className="w-64 px-2 py-1 border border-gray-300 rounded"
                    >
                      <option value="">전체</option>
                      {centerList.map((center) => (
                        <option key={center.center_id} value={center.center_id}>
                          {center.center_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="border border-gray-300 p-3 text-center bg-gray-200 font-medium w-1/6">포인트 금액</td>
                <td className="border border-gray-300 p-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={searchData.point_amount_min}
                      onChange={(e) => setSearchData({ ...searchData, point_amount_min: e.target.value })}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      placeholder="최소"
                    />
                    <span className="text-sm text-gray-500">~</span>
                    <input
                      type="text"
                      value={searchData.point_amount_max}
                      onChange={(e) => setSearchData({ ...searchData, point_amount_max: e.target.value })}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      placeholder="최대"
                    />
                    <span className="text-sm text-gray-500">포인트</span>
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

        {pointList.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>등록된 포인트가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-semibold">총 {pointList.length}건</p>
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
                    <th className="text-center">이름</th>
                    <th className="text-center">회원상태</th>
                    <th className="text-center">포인트 유형</th>
                    <th className="text-center">포인트 금액</th>
                    <th className="text-center">포인트 상태</th>
                    <th className="text-center">메모</th>
                    <th className="text-center">센터명</th>
                    <th className="text-center">등록일</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPoints?.map((point, index) => (
                    <tr
                      key={point.point_app_id}
                      className="h-16 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        const absoluteIndex = pagination.startIndex + index;
                        const current = !!checkedItems[absoluteIndex];
                        handleIndividualCheck(absoluteIndex, !current);
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
                      <td className="pl-4 text-center">{pointList.length - (pagination.startIndex + index)}</td>
                      <td className="text-center px-2">{point.mem_name}</td>
                      <td className="text-center px-2">{point.status}</td>
                      <td className="text-center px-2">{point.point_type}</td>
                      <td className="text-center px-2">{point.point_amount.toLocaleString()}</td>
                      <td className="text-center px-2">{point.point_status}</td>
                      <td className="text-center px-2">
                        {point.point_memo && String(point.point_memo).trim() !== "" ? (
                          <button
                            className="px-3 py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMemo(point.point_memo);
                              setIsMemoOpen(true);
                            }}
                          >
                            보기
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="text-center px-2">{point.center_name}</td>
                      <td className="text-center whitespace-nowrap">{point.reg_dt}</td>
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

      {/* 등록 모달 */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsRegisterOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">포인트 등록</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-700"
                onClick={() => setIsRegisterOpen(false)}
              >
                <svg className="w-5 h-5" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* 추가/차감 선택 */}
              <div>
                <label className="block text-sm font-medium mb-2">지급 타입</label>
                <div className="flex items-center gap-6">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="point_status"
                      value="POINT_ADD"
                      checked={pointStatus === 'POINT_ADD'}
                      onChange={() => setPointStatus('POINT_ADD')}
                    />
                    <span>추가</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="point_status"
                      value="POINT_MINUS"
                      checked={pointStatus === 'POINT_MINUS'}
                      onChange={() => setPointStatus('POINT_MINUS')}
                    />
                    <span>차감</span>
                  </label>
                </div>
              </div>

              {/* 회원 목록 */}
              <div>
                <label className="block text-sm font-medium mb-2">회원 목록</label>
                <div className="border rounded-sm overflow-hidden">
                  <div className="overflow-x-auto overflow-y-auto h-[320px]">
                    <table className="min-w-full bg-white">
                      <thead>
                        <tr className="bg-gray-100 text-left">
                          <th className="px-4 py-2 text-center">선택</th>
                          <th className="px-4 py-2">회원명</th>
                          <th className="px-4 py-2">전화번호</th>
                          <th className="px-4 py-2">활동상태</th>
                          <th className="px-4 py-2">보유 포인트</th>
                          <th className="px-4 py-2">센터</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registerMembers.length === 0 && (
                          <tr>
                            <td className="px-4 py-6 text-center text-gray-500" colSpan={5}>
                              조회 결과가 없습니다.
                            </td>
                          </tr>
                        )}
                        {registerMembers.map((m) => {
                          const checked = selectedMemberIds.has(m.account_app_id);
                          const isMinus = pointStatus === 'POINT_MINUS';
                          const isDisabled = isMinus && (!m.point_amount || m.point_amount <= 0);
                          return (
                            <tr
                              key={m.account_app_id}
                              className={`border-t hover:bg-gray-50 ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                              onClick={() => {
                                if (isDisabled) return;
                                setSelectedMemberIds((prev) => {
                                  if (isMinus) {
                                    return new Set<number>([m.account_app_id]);
                                  }
                                  const next = new Set(prev);
                                  if (next.has(m.account_app_id)) next.delete(m.account_app_id);
                                  else next.add(m.account_app_id);
                                  return next;
                                });
                              }}
                            >
                              <td className="px-4 py-2 text-center">
                                <input
                                  type={isMinus ? "radio" : "checkbox"}
                                  name="registerMember"
                                  className={`w-4 h-4 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                  checked={checked}
                                  disabled={isDisabled}
                                  onChange={() => {
                                    if (isDisabled) return;
                                    setSelectedMemberIds((prev) => {
                                      if (isMinus) {
                                        return new Set<number>([m.account_app_id]);
                                      }
                                      const next = new Set(prev);
                                      if (next.has(m.account_app_id)) next.delete(m.account_app_id);
                                      else next.add(m.account_app_id);
                                      return next;
                                    });
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </td>
                              <td className="px-4 py-2">{m.mem_name}</td>
                              <td className="px-4 py-2">{m.mem_phone ? m.mem_phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') : '-'}</td>
                              <td className="px-4 py-2">{m.status === 'ACTIVE' ? '활동' : m.status === 'PROCEED' ? '진행중' : '탈퇴'}</td>
                              <td className="px-4 py-2">{m.point_amount ? m.point_amount.toLocaleString() : '-'}</td>
                              <td className="px-4 py-2">{m.center_name}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 금액 입력 */}
              <div>
                <label className="block text-sm font-medium mb-1">금액</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={pointAmount}
                  onChange={(e) => {
                    const onlyDigits = e.target.value.replace(/\D/g, "");
                    setPointAmount(onlyDigits);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="숫자만 입력"
                />
              </div>

              {/* 메모 입력 */}
              <div>
                <label className="block text-sm font-medium mb-1">메모</label>
                <textarea
                  value={pointMemo}
                  onChange={(e) => setPointMemo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="메모를 입력하세요"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={async () => {
                  if ((window as any).__pointSubmitting) return;
                  (window as any).__pointSubmitting = true;
                  const amountNum = Number(pointAmount || "0");

                  if (selectedMemberIds.size === 0) {
                    alert("회원을 선택하세요.");
                    (window as any).__pointSubmitting = false;
                    return;
                  }
                  if (!amountNum || amountNum <= 0) {
                    alert("금액을 숫자로 입력하세요.");
                    (window as any).__pointSubmitting = false;
                    return;
                  }

                  // 차감 시 보유 포인트 체크
                  if (pointStatus === 'POINT_MINUS') {
                    const selected = registerMembers.filter((m) => selectedMemberIds.has(m.account_app_id));
                    const hasInsufficient = selected.some((m) => {
                      const balance = Number(m.point_amount || 0);
                      return amountNum > balance;
                    });
                    if (hasInsufficient) {
                      alert("보유 포인트보다 작은 금액을 입력해주세요.");
                      (window as any).__pointSubmitting = false;
                      return;
                    }
                  }

                  // 등록/차감 컨펌
                  const actionText = pointStatus === 'POINT_ADD' ? '등록' : '차감';
                  const confirmed = window.confirm(
                    `${actionText}을(를) 진행하시겠습니까?\n대상: ${selectedMemberIds.size}명\n금액: ${amountNum.toLocaleString()}원`
                  );
                  if (!confirmed) {
                    (window as any).__pointSubmitting = false;
                    return;
                  }

                  try {
                    const uniqueIds = Array.from(selectedMemberIds);
                    await Promise.all(
                      uniqueIds.map((memId) =>
                        axios.post(`${process.env.REACT_APP_API_URL}/app/pointApp/insertPointApp`, {
                          point_type: pointStatus === 'POINT_ADD' ? 'POINT_ADMIN_ADD' : 'POINT_ADMIN_MINUS',
                          userId: user.index,
                          point_amount: amountNum,
                          point_memo: pointMemo,
                          point_status: pointStatus,
                          account_app_id: selectedMemberIds.size === 1 ? selectedMemberIds.values().next().value : null,
                        })
                      )
                    );
                    alert("등록이 완료되었습니다.");
                    setIsRegisterOpen(false);
                    setSelectedMemberIds(new Set());
                    setPointAmount("");
                    setPointMemo("");
                    await selectPointList();
                  } catch (e) {
                    console.error(e);
                    alert("등록에 실패했습니다.");
                  } finally {
                    (window as any).__pointSubmitting = false;
                  }
                }}
              >
                {pointStatus === 'POINT_ADD' ? '등록' : '차감'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isMemoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsMemoOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-xl mx-4">
            <div className="flex items-center justify-between p-4">
              <h3 className="text-lg font-semibold">메모</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-700"
                onClick={() => setIsMemoOpen(false)}
              >
                <svg className="w-5 h-5" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-words">
              {selectedMemo}
            </div>
            <div className="flex justify-end gap-2 p-4">
              <button
                type="button"
                style={{ backgroundColor: "#FF746C" }}
                className="px-4 py-2 rounded text-white hover:opacity-80"
                onClick={() => setIsMemoOpen(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PointAppList;
