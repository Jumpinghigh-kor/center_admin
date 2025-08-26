import React, { useState, useEffect } from "react";
import { useUserStore } from "../store/store";
import axios from "axios";
import ReservationPopup from "../components/ReservationPopup";


interface Schedule {
  sch_dt: string;
  sch_id: number;
  sch_time: string;
  sch_max_cap: number;
  sch_info: string;
  registered_count: number;
  reserved_count: number;
}

const ReservationManagement: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<{ schedule: Schedule } | null>(null);

  const fetchMemberScheduleApp = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const targetDate = `${year}-${month}-01`;
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/schedule/memberScheduleApp`, {
        targetDate: targetDate,
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

  const getScheduleStatus = (registeredCount: number, reservedCount: number, maxCap: number) => {
    const totalCount = registeredCount + reservedCount;
    const percentage = (totalCount / maxCap) * 100;
    if (percentage >= 100) return { color: "bg-red-500", text: "만석" };
    if (percentage >= 80) return { color: "bg-orange-500", text: "혼잡" };
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
    <div className="px-2 py-3 lg:p-10">
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-xl">예약 관리</span>
          <div className="flex items-center gap-4">
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

        {/* 범례 */}
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
                                schedule.registered_count,
                                schedule.reserved_count,
                                schedule.sch_max_cap
                              );
                              
                              const totalCount = schedule.registered_count;
                              
                              return (
                                <div
                                  key={`schedule-${index}`}
                                  className="flex items-center justify-between text-xs p-1 hover:bg-gray-50 rounded bg-gray-300 cursor-pointer"
                                  onClick={() => handleScheduleClick(schedule, date)}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {schedule.sch_time}
                                    </span>
                                    {schedule.reserved_count > 0 && (
                                      <span className="text-white bg-red-500 px-1 rounded-md text-xs">
                                        예약
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div
                                      className={`w-2 h-2 ${status.color} rounded-full`}
                                    ></div>
                                    <span className="text-gray-500">
                                      {totalCount}/{schedule.sch_max_cap}
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

      <ReservationPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        selectedReservation={selectedReservation}
      />
    </div>
  );
};

export default ReservationManagement;
