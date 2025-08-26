import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { useUserStore } from "../store/store";
import DatePicker from "react-datepicker";
import { ko } from "date-fns/locale";
import "../styles/DatePickerStyles.css";

interface MemberCheckinData {
  mem_id: number;
  mem_name: string;
  checkin_dates: string[]; // checkin_date는 배열로 묶여 있음
}

const AttendancePage: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [checkinData, setCheckinData] = useState<MemberCheckinData[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, "0");
    return `${year}-${month}`;
  });

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const daysInMonth = useMemo(() => {
    return Array.from(
      {
        length: getDaysInMonth(
          startDate?.getFullYear() || new Date().getFullYear(),
          (startDate?.getMonth() || 0) + 1
        ),
      },
      (_, i) => i + 1
    );
  }, [startDate]);

  useEffect(() => {
    if (!user) return;
    const fetchAttendanceData = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/member/attendance`,
          {
            params: { user: user, date: startDate },
          }
        );
        setCheckinData(res.data.result);
      } catch (e) {
        console.log(e);
      }
    };
    fetchAttendanceData();
  }, [user, startDate]);

  const handleDateChange = (date: Date | null) => {
    const year = date?.getFullYear();
    const month = (Number(date?.getMonth()) + 1).toString().padStart(2, "0");
    const formattedDate = `${year}-${month}`;
    setCurrentMonth(formattedDate);
    setStartDate(date);
  };

  return (
    <div className="p-3 sm:p-10">
      <div className="flex">
        <span className="font-bold text-xl">출석현황</span>
      </div>
      <div className="flex justify-center items-center my-4">
        <span className="font-bold text-3xl mb-1">
          <DatePicker
            dateFormat="yyyy년 MM월"
            showMonthYearPicker
            selected={startDate}
            onChange={handleDateChange}
            locale={ko}
            className="custom-datepicker"
          />
        </span>
      </div>
      <div className="relative overflow-x-auto overflow-y-auto shadow-md sm:rounded-lg my-4 max-h-96">
        <table className="w-full text-sm rtl:text-right text-gray-500">
          <thead className="text-xs text-white font-bold uppercase sticky top-0 bg-custom-C4C4C4">
            <tr>
              <th scope="col" className="text-center py-2 min-w-14 text-black">
                이름
              </th>
              {daysInMonth.map((date) => {
                const currentDate = new Date(
                  startDate?.getFullYear() || new Date().getFullYear(),
                  startDate?.getMonth() || new Date().getMonth(),
                  date
                );
                const dayOfWeek = currentDate.getDay();

                const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

                // 스타일 적용
                const dayStyle =
                  dayOfWeek === 0 // 일요일
                    ? "text-red-500 font-bold"
                    : dayOfWeek === 6 // 토요일
                    ? "text-blue-500 font-bold"
                    : "text-black";
                return (
                  <th
                    className={`border-x text-center min-w-5 ${dayStyle}`}
                    scope="col"
                    key={date}
                  >
                    {`${date}(${dayNames[dayOfWeek]})`}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {checkinData.map((member) => (
              <tr key={member.mem_id}>
                <td className="text-black border-y text-center py-2 min-w-14 bg-white">
                  {member.mem_name}
                </td>
                {daysInMonth.map((date) => (
                  <td
                    className="border-x border-y bg-white"
                    key={`${member.mem_id}-${date}`}
                  >
                    {member.checkin_dates.includes(
                      `${currentMonth}-${String(date).padStart(2, "0")}`
                    ) ? (
                      <div className="flex justify-center">
                        <span className="text-white bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                          {
                            member.checkin_dates.filter(
                              (checkinDate) =>
                                checkinDate ===
                                `${currentMonth}-${String(date).padStart(
                                  2,
                                  "0"
                                )}`
                            ).length
                          }
                        </span>
                      </div>
                    ) : (
                      ""
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendancePage;
