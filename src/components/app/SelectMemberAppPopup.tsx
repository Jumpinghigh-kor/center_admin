import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUserStore } from "../../store/store";
import Pagination from "../../components/Pagination";
import { usePagination } from "../../hooks/usePagination";

interface MemberAppItem {
  center_id: number;
  center_name: string;
  mem_id: number;
  mem_name: string;
  mem_phone: string;
  mem_gender: string;
  mem_app_status: string;
}

interface CenterItem {
  center_id: number;
  center_name: string;
}

interface SelectMemberAppPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (members: MemberAppItem[]) => void;
  multi?: boolean;
  preselectedIds?: number[]; // 추가: 미리 선택할 mem_id 배열
}

const SelectMemberAppPopup: React.FC<SelectMemberAppPopupProps> = ({
  isOpen,
  onClose,
  onSelect,
  multi = true,
  preselectedIds,
}) => {
  const user = useUserStore((state) => state.user);

  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [memName, setMemName] = useState<string>("");
  const [memAppStatus, setMemAppStatus] = useState<string>("");

  const [members, setMembers] = useState<MemberAppItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  // 페이지네이션 훅 사용
  const pagination = usePagination({
    totalItems: members.length,
    itemsPerPage: 10,
  });

  const [centers, setCenters] = useState<CenterItem[]>([]);
  const [centerId, setCenterId] = useState<number | "">("");

  // Modal open/close effects
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);

    if (isOpen) {
      document.body.style.overflow = "hidden";
      setIsAnimating(true);
      // 이전 검색/선택값 초기화 후 초기 조회
      setMemName("");
      setMemAppStatus("");
      setSelectedIds(new Set(preselectedIds || []));
      setErrorMessage("");
      setCenterId("");

      // 센터 리스트 로드 (관리자만)
      if (user?.usr_role === "admin") {
        axios
          .get(`${process.env.REACT_APP_API_URL}/center/list`, { params: user })
          .then((res) => {
            setCenters(res?.data?.result || []);
          })
          .catch(() => {
            setCenters([]);
          });
      } else {
        setCenters([]);
      }

      fetchMembers({ memName: "", memAppStatus: "" });
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => {
        clearTimeout(timer);
      };
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // 회원 목록 불러오기
  const fetchMembers = async (override?: { memName?: string; memAppStatus?: string }) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/memberApp/selectMemberAppList`,
        {
          center_id: centerId || undefined,
          mem_name: (override?.memName ?? memName) || undefined,
          mem_app_status: (override?.memAppStatus ?? memAppStatus) || undefined,
        },
      );

      setMembers(response.data.result);
      pagination.resetPage(); // 데이터 새로고침 시 첫 페이지로 리셋
    } catch (err) {
      console.error("문의 목록 로딩 오류:", err);
    } finally {
    }
  };

  const toggleSelect = (memId: number) => {
    setSelectedIds((prev) => {
      if (multi) {
        const next = new Set(prev);
        if (next.has(memId)) next.delete(memId); else next.add(memId);
        return next;
      }
      return new Set<number>([memId]);
    });
  };

  const handleConfirm = () => {
    const selected = members.filter((m) => selectedIds.has(m.mem_id));
    onSelect(selected);
    onClose();
  };

  const handleResetFilters = () => {
    setMemName("");
    setMemAppStatus("");
  };

  if (!isOpen && !isAnimating) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

      <div
        className={`relative bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 transform transition-transform duration-300 ${
          isOpen ? "scale-100" : "scale-95"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">회원 선택</h3>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-700"
            onClick={onClose}
          >
            <svg className="w-5 h-5" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Filters */}
          <div className="mb-16">
            <table className="min-w-full bg-white border border-gray-200">
              <tbody>
                {user?.usr_role === "admin" && (
                  <tr className="border-b border-gray-200">
                    <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">센터 선택</td>
                    <td className="px-4 py-3">
                      <select
                        value={centerId}
                        onChange={(e) => {
                          const v = e.target.value;
                          setCenterId(v === "" ? "" : Number(v));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">전체</option>
                        {centers.map((c) => (
                          <option key={c.center_id} value={c.center_id}>
                            {c.center_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">회원명</td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={memName}
                        onChange={(e) => setMemName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="회원명을 입력하세요"
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => fetchMembers()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={isLoading}
              >
                조회
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                초기화
              </button>
            </div>
          </div>

          {/* List */}
          <div className="border rounded-sm overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto max-h-[60vh] min-h-[400px]">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="px-4 py-2 text-center">선택</th>
                    <th className="px-4 py-2">회원명</th>
                    <th className="px-4 py-2">전화번호</th>
                    <th className="px-4 py-2">성별</th>
                    <th className="px-4 py-2">센터</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>
                        조회 결과가 없습니다.
                      </td>
                    </tr>
                  )}
                  {members.map((m) => {
                    const checked = selectedIds.has(m.mem_id);
                    return (
                      <tr
                        key={m.mem_id}
                        className="border-t hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          if (!multi) {
                            setSelectedIds(new Set([m.mem_id]));
                            handleConfirm();
                          } else {
                            toggleSelect(m.mem_id);
                          }
                        }}
                      >
                        <td className="px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 cursor-pointer"
                            checked={checked}
                            onChange={() => toggleSelect(m.mem_id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-4 py-2">{m.mem_name}</td>
                        <td className="px-4 py-2">{m.mem_phone ? m.mem_phone : '-'}</td>
                        <td className="px-4 py-2">{m.mem_gender}</td>
                        <td className="px-4 py-2">{m.center_name}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={selectedIds.size === 0}
          >
            선택 완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectMemberAppPopup;

export {};


