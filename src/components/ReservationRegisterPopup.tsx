import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useUserStore } from "../store/store";
import { openInputDatePicker } from "../utils/commonUtils";
import { useCheckbox } from "../hooks/useCheckbox";

interface MemberAppItem {
  center_id: number;
  center_name: string;
  mem_id: number;
  mem_name: string;
  mem_phone: string;
  mem_gender: string;
  status: string;
  mem_sch_id: number;
  sch_time: string;
  account_app_id: number;
}

interface ReservationRegisterPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (date: string, members: MemberAppItem[]) => void;
}

const ReservationRegisterPopup: React.FC<ReservationRegisterPopupProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const user = useUserStore((state) => state.user);
  const [date, setDate] = useState<string>(() => {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [members, setMembers] = useState<MemberAppItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [schedules, setSchedules] = useState<{ sch_id: number; sch_time: string; sch_info: string }[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | "">("");
  const { checkedItems, allChecked, handleAllCheck, handleIndividualCheck, resetCheckedItems } = useCheckbox(members.length);
  const [duplicateWarning, setDuplicateWarning] = useState<string>("");
  const todayStr = useMemo(() => {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);
  
  const isScheduleTimePast = (schTime: string): boolean => {
    if (date !== todayStr) return false;
    try {
      const [timePart, meridiemRaw] = (schTime || '').split(' ');
      const meridiem = (meridiemRaw || '').toUpperCase();
      const [hhStr, mmStr] = (timePart || '').split(':');
      let hours = parseInt(hhStr || '0', 10);
      const minutes = parseInt(mmStr || '0', 10);
      if (meridiem === 'PM' && hours < 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
      const now = new Date();
      const compare = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
      return compare.getTime() <= Date.now();
    } catch {
      return false;
    }
  };

  const selectedMembers = useMemo(
    () => members.filter((_, idx) => checkedItems[idx]),
    [members, checkedItems]
  );

  useEffect(() => {
    const fetchMembers = async () => {
      if (!isOpen) return;
      try {
        setIsLoading(true);
        const res = await axios.post(
          `${process.env.REACT_APP_API_URL}/app/memberApp/selectMemberAppList`,
          { 
            center_id: user?.center_id
            , status: 'ACTIVE'
            , is_reservation: true
          }
        );
        setMembers(res.data?.result || []);
      } catch (e) {
        console.error("회원 목록 로드 오류:", e);
        setMembers([]);
      } finally {
        setIsLoading(false);
      }
    };
    const fetchSchedules = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/schedule`, {
          params: { center_id: user?.center_id },
        });
        const list = (res.data?.result || []).map((s: any) => ({ sch_id: s.sch_id, sch_time: s.sch_time, sch_info: s.sch_info }));
        setSchedules(list);
      } catch (e) {
        console.error("시간표 로드 오류:", e);
        setSchedules([]);
      }
    };
    fetchMembers();
    fetchSchedules();
  }, [isOpen, user?.center_id]);

  useEffect(() => {
    if (!isOpen) return;
    if (!date || selectedMembers.length === 0) {
      setDuplicateWarning("");
      return;
    }
    const schDt = date.replace(/-/g, '');
    let active = true;
    (async () => {
      try {
        const dupRes = await axios.post(`${process.env.REACT_APP_API_URL}/schedule/getReservationMemberListByDate`, {
          sch_dt: schDt,
        });
        const alreadyReserved: Array<{ account_app_id: number; mem_name: string }> = dupRes.data?.result || [];
        const reservedIdSet = new Set(alreadyReserved.map((r) => r.account_app_id));
        const duplicatedNames = selectedMembers.filter((m) => reservedIdSet.has(m.account_app_id)).map((m) => m.mem_name);
        if (!active) return;
        setDuplicateWarning(
          duplicatedNames.length > 0
            ? `이미 해당 일자에 예약된 회원이 있습니다: [${duplicatedNames.join(', ')}]님을 체크 해제 후 이용해주세요.`
            : ""
        );
      } catch {
        if (!active) return;
        setDuplicateWarning("");
      }
    })();
    return () => {
      active = false;
    };
  }, [isOpen, date, selectedMembers]);

  useEffect(() => {
    if (!isOpen) return;
    setDate(todayStr);
    setSelectedScheduleId("");
    resetCheckedItems();
    setDuplicateWarning("");
  }, [isOpen, todayStr]);

  // 선택은 공통 useCheckbox 훅으로 관리

  const formatPhone344 = (phone?: string) => {
    const digits = String(phone || '').replace(/[^0-9]/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return digits.replace(/(\d{3})(\d+)/, '$1-$2');
    return digits.replace(/(\d{3})(\d{4})(\d{4}).*/, '$1-$2-$3');
  };

  const handleRegister = async () => {
    if (!date || !selectedScheduleId || selectedMembers.length === 0) return;
    const schDt = date.replace(/-/g, '');
    try {
      setDuplicateWarning("");
      // 0) 중복 예약 사전 검사: 해당 날짜/시간표에 이미 예약된 회원 제외
      const dupRes = await axios.post(`${process.env.REACT_APP_API_URL}/schedule/getReservationMemberListByDate`, {
        sch_dt: schDt,
      });
      const alreadyReserved: Array<{ account_app_id: number; mem_name: string }> = dupRes.data?.result || [];
      if (Array.isArray(alreadyReserved) && alreadyReserved.length > 0) {
        const reservedIdSet = new Set(alreadyReserved.map((r) => r.account_app_id));
        const duplicatedNames = selectedMembers.filter((m) => reservedIdSet.has(m.account_app_id)).map((m) => m.mem_name);
        if (duplicatedNames.length > 0) {
          setDuplicateWarning(`이미 해당 일자에 예약된 회원이 있습니다: ${duplicatedNames.join(', ')}님`);
          return;
        }
      }

      // 1) 회원별 예약 등록
      await Promise.all(
        selectedMembers.map((m) =>
          axios.post(`${process.env.REACT_APP_API_URL}/schedule/insertMemberScheduleApp`, {
            account_app_id: m.account_app_id,
            original_sch_id: m.mem_sch_id || null,
            reservation_sch_id: selectedScheduleId,
            sch_dt: schDt,
            userId: user?.index,
          })
        )
      );

      // 2) 우편/푸시 발송 (선택 회원 전원)
      try {
        const selectedMemIds = selectedMembers.map((m) => m.account_app_id);
        const [yyyy, mm, dd] = date.split('-');
        const krDate = yyyy && mm && dd ? `${yyyy}년 ${mm}월 ${dd}일` : date;
        const actionText = '등록';

        const postRes = await axios.post(
          `${process.env.REACT_APP_API_URL}/app/postApp/insertPostApp`,
          {
            post_type: 'JUMPING',
            title: `${krDate}에 수업 예약이 ${actionText} 되었습니다.`,
            content: `회원님께서 ${krDate}에 수업이 ${actionText} 되었습니다. 자세한 내용이 궁금하시다면 가맹점에 문의하시기 바랍니다.`,
            all_send_yn: 'N',
            push_send_yn: 'Y',
            userId: user?.index,
            account_app_id: selectedMemIds.join(','),
          }
        );

        const postAppId = postRes.data?.postAppId;
        if (postAppId && Array.isArray(selectedMemIds) && selectedMemIds.length > 0) {
          await Promise.all(
            selectedMemIds.map((accountAppId) =>
              axios.post(`${process.env.REACT_APP_API_URL}/app/postApp/insertMemberPostApp`, {
                post_app_id: postAppId,
                account_app_id: accountAppId,
                userId: user?.index,
              })
            )
          );
        }
      } catch (postErr) {
        console.error('우편/푸시 발송 오류:', postErr);
      }

      alert('등록되었습니다.');

      // 부모 콜백 유지 (기존 동작과 호환)
      try {
        onSubmit(date, selectedMembers);
      } catch {}
    } catch (err) {
      console.error('회원 예약 등록 오류:', err);
      alert('예약 등록 중 오류가 발생했습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">예약 등록</h3>
          <button type="button" className="text-gray-400 hover:text-gray-700" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <table className="w-full border border-gray-200">
            <tbody>
              <tr className="border-b">
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/4">예약일</td>
                <td className="px-4 py-3">
                  <input
                    type="date"
                    value={date}
                    min={todayStr}
                    onChange={(e) => {
                      const v = e.target.value;
                      // 과거 선택 방지: 브라우저에서 min 처리되지만, 방어적으로 클램프
                      if (v && v < todayStr) setDate(todayStr); else setDate(v);
                    }}
                    onClick={(e) => openInputDatePicker(e.currentTarget)}
                    onFocus={(e) => openInputDatePicker(e.currentTarget)}
                    className="px-3 cursor-pointer py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
              </tr>
              <tr className="border-b">
                <td className="bg-gray-100 px-4 py-3 font-semibold">시간표</td>
                <td className="px-4 py-3">
                  <select
                    value={selectedScheduleId}
                    onChange={(e) => setSelectedScheduleId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full cursor-pointer px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택</option>
                    {schedules.map((s) => {
                      const disabled = isScheduleTimePast(s.sch_time);
                      return (
                        <option key={s.sch_id} value={s.sch_id} disabled={disabled}>
                          {s.sch_time} - {s.sch_info}{disabled ? ' (지남)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  {duplicateWarning && (
                    <p className="text-sm text-red-600 mt-2">
                      {(() => {
                        const m = duplicateWarning.match(/^(.*)\[(.*)\](.*)$/);
                        if (!m) return duplicateWarning;
                        const [, pre, names, post] = m;
                        return (
                          <>
                            {pre}
                            <span className="text-black">[{names}]</span>
                            {post}
                          </>
                        );
                      })()}
                    </p>
                  )}
                </td>
              </tr>
              <tr>
                <td className="bg-gray-100 px-4 py-3 font-semibold">회원 선택</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">선택 {selectedMembers.length}명</span>
                    <button
                      type="button"
                      className="text-sm text-gray-600 hover:text-gray-800"
                      onClick={() => resetCheckedItems()}
                    >
                      전체 해제
                    </button>
                  </div>
                  <div className="border rounded overflow-y-auto max-h-[70vh]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left">
                          <th className="px-3 py-2 text-center w-12">
                            <input
                              type="checkbox"
                              className="w-4 h-4 cursor-pointer"
                              checked={allChecked}
                              onChange={(e) => handleAllCheck(e.target.checked)}
                            />
                          </th>
                          <th className="px-3 py-2">이름</th>
                          <th className="px-3 py-2">전화번호</th>
                          <th className="px-3 py-2">시간표</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr>
                            <td className="px-3 py-6 text-center text-gray-500" colSpan={4}>불러오는 중...</td>
                          </tr>
                        ) : members.length === 0 ? (
                          <tr>
                            <td className="px-3 py-6 text-center text-gray-500" colSpan={4}>회원이 없습니다.</td>
                          </tr>
                        ) : (
                          members.map((m, idx) => {
                            const checked = checkedItems[idx] || false;
                            return (
                              <tr key={m.account_app_id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => handleIndividualCheck(idx, !checked)}>
                                <td className="px-3 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 cursor-pointer"
                                    checked={checked}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => handleIndividualCheck(idx, e.target.checked)}
                                  />
                                </td>
                                <td className="px-3 py-2">{m.mem_name}</td>
                                <td className="px-3 py-2">{m.mem_phone ? formatPhone344(m.mem_phone) : '-'}</td>
                                <td className="px-3 py-2">{m.sch_time || '-'}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
            취소
          </button>
          <button
            type="button"
            onClick={handleRegister}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={!date || !selectedScheduleId || selectedMembers.length === 0 || !!duplicateWarning}
          >
            등록
          </button>
        </div>
      </div>

      {/* 회원 선택 팝업 제거: 내부 목록으로 대체 */}
    </div>
  );
};

export default ReservationRegisterPopup;


