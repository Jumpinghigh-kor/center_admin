import React, { memo } from "react";
import axios from "axios";
import { useState, useEffect } from "react";
import { useCheckbox } from "../hooks/useCheckbox"; 
import { useUserStore } from "../store/store";

interface Schedule {
  sch_dt: string;
  sch_id: number;
  sch_time: string;
  sch_max_cap: number;
  sch_info: string;
  registered_count: number;
  reserved_count: number;
  sch_app_id: number;
}

interface MemberScheduleApp {
  schedule: Schedule;
}

interface MemberScheduleAppDetail {
  mem_id: number;
  mem_name: string;
  mem_gender: string;
  sch_dt: string;
  original_sch_id: number;
  original_sch_time: string;
  original_sch_info: string;
  reservation_sch_id: number;
  reservation_sch_time: string;
  reservation_sch_info: string;
  agree_yn: string;
  mem_sch_id: number;
  mem_phone: string;
  mem_birth: string;
  sch_app_id: number;
  admin_memo: string;
}

interface ReservationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReservation: MemberScheduleApp | null;
  onUpdated: () => void;
}

const ReservationPopup: React.FC<ReservationPopupProps> = ({
  isOpen,
  onClose,
  selectedReservation,
  onUpdated,
}) => {
  const [reservationMember, setReservationMember] = useState<MemberScheduleAppDetail[]>([]);
  const [registeredMember, setRegisteredMember] = useState<MemberScheduleAppDetail[]>([]);
  const [memo, setMemo] = useState<string>("");
  const user = useUserStore((state) => state.user);
  const { checkedItems, allChecked, handleAllCheck, handleIndividualCheck, resetCheckedItems } = useCheckbox(reservationMember.length);
  
  const isReservationTimePassed = React.useMemo(() => {
    if (!selectedReservation?.schedule?.sch_dt || !selectedReservation?.schedule?.sch_time) return false;
    try {
      const dateStr = selectedReservation.schedule.sch_dt; // YYYY-MM-DD
      const timeStr = selectedReservation.schedule.sch_time; // h:mm AM/PM
      const [yearStr, monthStr, dayStr] = dateStr.split('-');
      const [timePart, meridiem] = timeStr.split(' ');
      const [hourStr, minuteStr] = timePart.split(':');
      let hours = parseInt(hourStr || '0', 10);
      const minutes = parseInt(minuteStr || '0', 10);
      if ((meridiem || '').toUpperCase() === 'PM' && hours < 12) hours += 12;
      if ((meridiem || '').toUpperCase() === 'AM' && hours === 12) hours = 0;
      const year = parseInt(yearStr || '0', 10);
      const month = parseInt(monthStr || '1', 10) - 1;
      const day = parseInt(dayStr || '1', 10);
      const scheduled = new Date(year, month, day, hours, minutes, 0, 0);
      return scheduled.getTime() < Date.now();
    } catch {
      return false;
    }
  }, [selectedReservation]);

  useEffect(() => {
    if (isOpen && selectedReservation) {
      // 초기화
      setMemo("");
      resetCheckedItems();
      selectReservationMember();
      selectRegisteredMember();
    }
  }, [isOpen, selectedReservation]);  

  const selectReservationMember = async () => {
    const formatted_sch_dt = selectedReservation?.schedule.sch_dt.replace(/-/g, '');
    
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/schedule/getReservationMemberList`, {
        sch_dt: formatted_sch_dt,
        sch_id: selectedReservation?.schedule.sch_id,
      });
      
      setReservationMember(response.data.result);
    } catch (error) {
      console.error("Failed to fetch member schedule apps:", error);
    }
  };

  const selectRegisteredMember = async () => {
    const formatted_sch_dt = selectedReservation?.schedule.sch_dt.replace(/-/g, '');
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/schedule/getRegisteredMemberList`, {
        sch_id: selectedReservation?.schedule.sch_id,
        sch_dt: formatted_sch_dt,
      });
      
      setRegisteredMember(response.data.result);
    } catch (error) {
      console.error("Failed to fetch member schedule apps:", error);
    }
  };  
    
  // 예약 승인/거절 업데이트
  const handleReservationUpdate = async (agreeStatus: "Y" | "N") => {
    if (!selectedReservation) return;

    const selectedIds = reservationMember
      .filter((_, index) => checkedItems[index])
      .map((m) => m.sch_app_id);

    if (selectedIds.length === 0) {
      alert("예약 회원을 선택해주세요.");
      return;
    }

    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/schedule/updateMemberScheduleApp`,
        {
          sch_app_id: selectedIds,
          agree_yn: agreeStatus,
          mem_id: user?.index,
        }
      );

      selectReservationMember();
      selectRegisteredMember();

      alert(agreeStatus === "Y" ? "승인되었습니다." : "거절되었습니다.");
      onUpdated();
    } catch (error) {
      console.error("Failed to update reservation:", error);
      alert("예약 처리 중 오류가 발생했습니다.");
    }
  };

  // 메모 업데이트
  const handleMemoUpdate = async () => {
    const selectedIndex = checkedItems.findIndex(item => item);
    const selectedMember = reservationMember[selectedIndex];
    
    if (!selectedMember) return;

    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/schedule/updateMemberScheduleAppMemo`,
        {
          sch_app_id: selectedMember.sch_app_id,
          mem_id: selectedMember.mem_id,
          memo: memo,
        }
      );

      selectReservationMember();
      selectRegisteredMember();
      alert("메모가 저장되었습니다.");
    } catch (error) {
      console.error("Failed to update memo:", error);
      alert("메모 처리 중 오류가 발생했습니다.");
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 pt-24 pb-24 pl-32 pr-32"
      onClick={onClose}
    >
      <div 
        className="rounded-lg shadow-2xl w-full h-full" 
        style={{ backgroundColor: '#353535' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="text-white px-6 py-4 rounded-t-lg" style={{borderBottom: '1px solid #4A4A4A'}}>
          <div className="flex justify-between items-center">
            <div></div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div className="flex" style={{height: '85%'}}>
          {/* 왼쪽 영역 */}
          <div className="w-1/4 p-6" style={{borderRight: '1px solid #4A4A4A'}}>
            <div>
              <div className="mb-6">
                <p className="text-white text-lg font-bold">수업 정보</p>
              </div>
              <div className="mb-4">
                <p className="text-white text-sm mb-2" style={{color: '#9D9D9D'}}>수업 이름</p>
                <p className="text-white font-medium">{selectedReservation?.schedule.sch_info}</p>
              </div>
              <div className="mb-4">
                <p className="text-white text-sm mb-2" style={{color: '#9D9D9D'}}>수업 일시</p>
                <p className="text-white font-medium">
                  {selectedReservation?.schedule.sch_dt} {selectedReservation?.schedule.sch_time}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-white text-sm mb-2" style={{color: '#9D9D9D'}}>수업 정원</p>
                <p className="text-white font-medium">{selectedReservation?.schedule.sch_max_cap}명</p>
              </div>
              <div className="mb-4">
                <p className="text-white text-sm mb-2" style={{color: '#9D9D9D'}}>등록 인원</p>
                <p className="text-white font-medium">{selectedReservation?.schedule.registered_count}명</p>
              </div>
              <div className="mb-4">
                <p className="text-white text-sm mb-2" style={{color: '#9D9D9D'}}>예약 인원</p>
                <p className="text-white font-medium">{selectedReservation?.schedule.reserved_count}명</p>
              </div>
            </div>
          </div>

          {/* 중간 영역 */}
          <div className="w-2/4 flex flex-col" style={{borderRight: '1px solid #4A4A4A'}}>
            <div className="p-4">
              <div className="mb-4 pl-2">
                <p className="text-white text-lg font-bold">회원 목록</p>
              </div>
            </div>
            
            {/* 예약 회원 섹션 */}
            <div className="px-4 overflow-y-auto mb-4" style={{height: '41%', borderBottom: '1px solid #4A4A4A'}}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center text-white text-lg font-bold p-2" style={{width: '20%'}}>
                  <input 
                    type="checkbox" 
                    className="mr-4 w-4 h-4 cursor-pointer" 
                    checked={allChecked}
                    onChange={(e) => handleAllCheck(e.target.checked)}
                  />
                  <p>예약 회원</p>
                </div>
                <p className="text-white text-sm" style={{color: '#9D9D9D', width: '20%'}}>이름</p>
                <p className="text-white text-sm" style={{color: '#9D9D9D', width: '20%'}}>성별</p>
                <p className="text-white text-sm" style={{color: '#9D9D9D', width: '20%'}}>연락처</p>
                <p className="text-white text-sm" style={{color: '#9D9D9D', width: '20%'}}>생년월일</p>
              </div>
              {reservationMember.length > 0 ? (
                <div>
                  {reservationMember.map((item, index) => (
                    <div key={index + 1}>
                      <div className="mt-4">
                        <div
                          className={`flex justify-between items-center cursor-pointer hover:bg-gray-700 p-2 ${checkedItems[index] ? 'bg-gray-700' : ''}`}
                          onClick={() => {
                            const next = !checkedItems[index];
                            handleIndividualCheck(index, next);
                            setMemo(item.admin_memo || "");
                          }}
                        >
                          <div className="flex items-center text-white" style={{width: '20%'}}>
                            <input 
                              type="checkbox" 
                              className="mr-4 w-4 h-4 cursor-pointer" 
                              checked={checkedItems[index] || false}
                              onChange={(e) => handleIndividualCheck(index, e.target.checked)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <p>{index + 1}. <span className={`${item.agree_yn ? item.agree_yn === 'Y' ? 'text-green-500' : 'text-red-500' : 'text-gray-400'} ml-2`}>{item.agree_yn ? item.agree_yn === 'Y' ? '승인' : '거절' : '예약대기'}</span></p>
                          </div>
                          <p className="text-white" style={{width: '20%'}}>{item.mem_name ? item.mem_name : '-'}</p>
                          <p className="text-white" style={{width: '20%'}}>{item.mem_gender ? item.mem_gender : '-'}</p>
                          <p className="text-white" style={{width: '20%'}}>{item.mem_phone ? item.mem_phone : '-'}</p>
                          <p className="text-white" style={{width: '20%'}}>{item.mem_birth ? item.mem_birth : '-'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-20 text-center text-white">
                  <p>예약 회원이 없습니다.</p>
                </div>
              )}
            </div>
            
            {/* 등록 회원 섹션 */}
            <div className="px-4 overflow-y-auto mb-4" style={{height: '41%', borderBottom: '1px solid #4A4A4A'}}>
              <div className="flex justify-between items-center mb-4 p-2">
                <p className="text-white text-lg font-bold" style={{width: '20%'}}>등록 회원</p>
                <p className="text-white text-sm" style={{color: '#9D9D9D', width: '20%'}}>이름</p>
                <p className="text-white text-sm" style={{color: '#9D9D9D', width: '20%'}}>성별</p>
                <p className="text-white text-sm" style={{color: '#9D9D9D', width: '20%'}}>연락처</p>
                <p className="text-white text-sm" style={{color: '#9D9D9D', width: '20%'}}>생년월일</p>
              </div>
              {registeredMember.length > 0 ? (
                <div>
                  {registeredMember.map((item, index) => (
                    <div key={index + 1}>
                      <div className="mt-4">
                        <div className="flex justify-between items-center p-2">
                          <p className="text-white" style={{width: '20%'}}>{index + 1}.</p>
                          <p className="text-white" style={{width: '20%'}}>{item.mem_name ? item.mem_name : '-'}</p>
                          <p className="text-white" style={{width: '20%'}}>{item.mem_gender ? item.mem_gender : '-'}</p>
                          <p className="text-white" style={{width: '20%'}}>{item.mem_phone ? item.mem_phone : '-'}</p>
                          <p className="text-white" style={{width: '20%'}}>{item.mem_birth ? item.mem_birth : '-'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-20 text-center text-white">
                  <p>등록 회원이 없습니다.</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mr-4">
              <button
                className="bg-green-700 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleReservationUpdate("Y")}
                disabled={isReservationTimePassed}
              >
                예약 수락
              </button>
              <button
                className="bg-red-700 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ml-4 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleReservationUpdate("N")}
                disabled={isReservationTimePassed}
              >
                예약 거절
              </button>
            </div>
            {isReservationTimePassed && (
              <div className="flex justify-end mr-4 mt-3">
                <span className="text-red-500 text-sm font-semibold">이미 예약시간이 지났습니다.</span>
              </div>
            )}
          </div>

          {/* 오른쪽 영역 */}
          <div className="flex p-6 w-1/4">
            <div className="w-full">
              <div className="mb-4">
                <p className="text-white text-lg font-bold">메모(예약 전용)</p>
              </div>
              <div className="space-y-4 mb-6 rounded-lg" style={{border: '1px solid #4A4A4A', height: '80%'}}>
                <textarea
                  className="w-full h-full rounded-lg text-white p-4"
                  style={{backgroundColor: '#353535'}}
                  placeholder="회원 한 명의 체크 박스를 선택 후 메모를 입력해주세요."
                  disabled={checkedItems.filter(item => item).length !== 1}
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button 
                  className={`font-bold py-2 px-4 rounded ${
                    checkedItems.filter(item => item).length === 1 && memo.trim() !== "" 
                      ? "bg-green-700 hover:bg-green-800 text-white" 
                      : "bg-gray-600 text-gray-400 cursor-not-allowed"
                  }`}
                  disabled={checkedItems.filter(item => item).length !== 1 || memo.trim() === ""}
                  onClick={handleMemoUpdate}
                >
                  메모 저장
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationPopup; 