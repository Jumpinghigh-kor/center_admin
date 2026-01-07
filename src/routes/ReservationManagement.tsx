import React, { useState, useEffect } from "react";
import { useUserStore } from "../store/store";
import axios from "axios";
import ReservationPopup from "../components/ReservationPopup";
import ReservationRegisterPopup from "../components/ReservationRegisterPopup";
import { useLocation } from "react-router-dom";


interface Schedule {
  sch_dt: string;
  sch_id: number;
  sch_time: string;
  sch_max_cap: number;
  sch_info: string;
  registered_count: number;
  reserved_count: number;
  sch_app_id: number;
  current_count: number;
}

const ReservationManagement: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const location = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<{ schedule: Schedule } | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const nowLocation = location.pathname.startsWith("/app")
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // 설명 모달 ESC 닫기
  useEffect(() => {
    if (!isGuideOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsGuideOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isGuideOpen]);

  const fetchMemberScheduleApp = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const start_date = `${year}-${month}-01`;
      const end_date = `${year}-${month}-${new Date(year, Number(month), 0).getDate()}`;
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/schedule/memberScheduleApp`, {
        start_date: start_date,
        end_date: end_date,
        center_id: user?.center_id,
      });

      setSchedules(response.data.result || []);
    } catch (error) {
      console.error("Failed to fetch member schedule apps:", error);
    }
  };  

  // 스케줄 목록 조회
  useEffect(() => {
    if (user?.center_id) {
      fetchMemberScheduleApp();
    }
  }, [user, currentDate]);

  // 달력 관련 함수들
  const getFirstDayOfMonth = () => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  };

  const getLastDayOfMonth = () => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  };

  const getDaysInMonth = () => {
    const firstDay = getFirstDayOfMonth();
    const lastDay = getLastDayOfMonth();
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDay = new Date(startDate);

    while (currentDay <= lastDay || days.length < 35) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return days;
  };

  const formatMonth = () => {
    return `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`;
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1)
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getScheduleStatus = (currentCount: number, maxCap: number) => {
    const percentage = (currentCount / maxCap) * 100;
    if (percentage >= 100) return { color: "bg-red-500", text: "만석" };
    if (percentage >= 70) return { color: "bg-orange-500", text: "혼잡" };
    return { color: "bg-green-500", text: "여유" };
  };

  // 스케줄 클릭 핸들러
  const handleScheduleClick = (schedule: Schedule, date: Date) => {
    setSelectedReservation({ schedule: schedule });
    setIsPopupOpen(true);
  };

  // 달력 생성
  const days = getDaysInMonth();
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className={`${nowLocation ? "p-6 bg-white rounded-lg shadow-lg overflow-hidden" : "px-2 py-3 lg:p-10"}`}>
      <div className="flex flex-col">
        {isGuideOpen ? (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
            onClick={() => setIsGuideOpen(false)}
          >
            <div
              className="w-[min(92vw,700px)] rounded-lg bg-white p-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="text-base font-bold text-gray-900">설명보기</div>
              </div>
              <div className="mt-3">
                <p className="text-base">현재 페이지는 회원의 예약을 관리할 수 있습니다.</p>
                <p className="text-base">어플을 통해 사용자가 예약을 할 경우 달력에 예약 표시가 나오고 상단에 종 모양에 알림이 옵니다.</p>
                <p className="text-base">달력안에 표시된 시간표를 클릭하여, 예약 목록을 확인할 수 있으며,</p>
                <p className="text-base">시간표 옆 각 숫자가 의미하는 것은 [참여 확정 회원수/예약 신청 회원수/최대 수용 인원수] 입니다.</p>
                <p className="text-base">우측 상단의 예약 등록 버튼을 누를 경우, 점주님께서 직접 원하는 시간표에 회원을 예약할 수 있습니다.</p>
                <p className="text-base font-bold mt-10">1. 예약 회원</p>
                <p className="text-base">- 사용자가 어플에서 원하는 시간표에 예약을 한 경우입니다.</p>
                <p className="text-base">- 예약 회원 목록에서 체크박스를 선택하여 예약 수락/거절을 할 수 있습니다.</p>
                <p className="text-base font-bold mt-10">2. 고정 회원</p>
                <p className="text-base">- 점주님이 설정한 시간표에 등록된 고정 회원입니다.</p>
                <p className="text-base font-bold mt-10">3. 참여 확정 회원</p>
                <p className="text-base">- 예약 회원에서 예약이 수락된 경우입니다.</p>
                <p className="text-base">- 사용자가 어플에서 기본 시간표에 예약을 한 경우로 참여 확정 회원에 추가됩니다.</p>
              </div>
              <div className="flex justify-end mt-10">
                <button
                  type="button"
                  style={{ backgroundColor: '#5C6B7A' }}
                  className="text-white rounded px-4 py-2 text-sm"
                  onClick={() => setIsGuideOpen(false)}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-xl">예약 관리</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded"
              onClick={() => setIsGuideOpen(true)}
            >
              설명
            </button>
            <button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded"
              onClick={() => setIsRegisterOpen(true)}
            >
              예약 등록
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <span className="text-xl font-semibold min-w-[120px] text-center">
                {formatMonth()}
              </span>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className={`${nowLocation ? "overflow-hidden" : "overflow-hidden p-6 bg-white rounded-lg shadow-lg"}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm">만석</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm">혼잡</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">여유</span>
            </div>
          </div>

          {/* 달력 */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 bg-gray-800 text-white">
              {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
                <div
                  key={index}
                  className="p-4 text-center font-bold border-r border-gray-600 last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 달력 본체 */}
            <div className="grid grid-cols-7">
              {weeks.map((week, weekIndex) =>
                week.map((date, dayIndex) => {

                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`border border-gray-300 min-h-[150px] ${
                        !isCurrentMonth(date) ? "bg-gray-100" : "bg-white"
                      } ${isToday(date) ? "bg-blue-50" : ""}`}
                    >
                      {/* 날짜 헤더 */}
                      <div className="p-2 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                          <span
                            className={`font-bold ${
                              !isCurrentMonth(date)
                                ? "text-gray-400"
                                : isToday(date)
                                ? "text-blue-600"
                                : "text-black"
                            }`}
                          >
                            {date.getDate()}일
                          </span>
                        </div>
                      </div>

                      {/* 스케줄 목록 */}
                      <div className="p-1 space-y-1 overflow-y-auto max-h-[120px]">
                        {isCurrentMonth(date) && (
                          <>
                            {schedules.length === 0 && (
                              <div className="text-xs text-gray-400">데이터 없음</div>
                            )}
                            {schedules
                              .filter((schedule) => {
                                const scheduleDate = new Date(schedule.sch_dt);
                                const isMatch = scheduleDate.toDateString() === date.toDateString();
                                return isMatch;
                              })
                              .map((schedule, index) => {
                                const status = getScheduleStatus(
                                  schedule.reserved_count,
                                  schedule.sch_max_cap
                                );
                                // const totalCount = schedule.registered_count - schedule.current_count;
                                const reservedCount = schedule.reserved_count;
                                const timeParts = (schedule.sch_time || '').split(' ');
                                const hm = (timeParts[0] || '').split(':');
                                let hours = parseInt(hm[0] || '0', 10);
                                const minutes = parseInt(hm[1] || '0', 10);
                                const meridiem = (timeParts[1] || '').toUpperCase();
                                if (meridiem === 'PM' && hours < 12) hours += 12;
                                if (meridiem === 'AM' && hours === 12) hours = 0;
                                const scheduledDateTime = new Date(date);
                                scheduledDateTime.setHours(hours, minutes, 0, 0);
                                const isPast = scheduledDateTime.getTime() < Date.now();
                                
                                return (
                                  <div
                                    key={`schedule-${index}`}
                                    className="flex items-center justify-between text-xs p-1 hover:bg-gray-50 rounded bg-gray-200 cursor-pointer"
                                    onClick={() => handleScheduleClick(schedule, date)}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        {schedule.sch_time}
                                      </span>
                                      {schedule.reserved_count > schedule.registered_count && (
                                        isPast ? (
                                          <span className="text-gray-700 bg-gray-300 px-1 rounded-md text-xs">예약마감</span>
                                        ) : (
                                          <span className="text-white bg-red-500 px-1 rounded-md text-xs">예약</span>
                                        )
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <div
                                        className={`w-2 h-2 ${status.color} rounded-full`}
                                      ></div>
                                      <span className="text-gray-600">
                                        {schedule.current_count}/{reservedCount}/{schedule.sch_max_cap} 
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <ReservationPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        selectedReservation={selectedReservation}
        onUpdated={fetchMemberScheduleApp}
      />
      <ReservationRegisterPopup
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSubmit={(date, members) => {
          setIsRegisterOpen(false);
          fetchMemberScheduleApp();
        }}
      />
    </div>
  );
};

export default ReservationManagement;
