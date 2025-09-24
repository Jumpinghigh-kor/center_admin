import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useUserStore } from "../store/store";
import "./../styles/Members.css";
import { Member, Schedule } from "../utils/types";
import { convertDate, convertPhone } from "../utils/formatUtils";
import DescriptionPopover from "../components/DescriptionPopover";
import MembersOrderBulkNav from "../components/MemberOrderBulkNav";

type ScheduleOmit = Omit<Schedule, "current_count">;

const MembersBulkExtend: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const [sortOption, setSortOption] = useState(() => {
    const savedFilters = localStorage.getItem("tableFilters");
    return savedFilters ? JSON.parse(savedFilters) : "최신 등록순";
  });

  const [members, setMembers] = useState<Member[]>([]);
  const [schedules, setSchedules] = useState<ScheduleOmit[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member[]>([]);
  const [selectedIds, setSelectedIds] = useState<Member[]>([]);
  const [extendDay, setExtendDay] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [allChecked, setAllChecked] = useState(false);

  const filteredMembers = searchTerm
    ? members.filter((member) =>
        member.mem_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : members;

  // select 변경 핸들러
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    localStorage.setItem("tableFilters", JSON.stringify(event.target.value));
    setSortOption(event.target.value);
  };

  // 체크 박스 전체 선택
  const toggleAllChecks = () => {
    if (filteredMembers.length === 0) return;

    if (allChecked) {
      setSelectedIds([]);
      setSelectedMember([]); // 전체 회원 데이터 삭제
    } else {
      setSelectedIds(members.map((member) => member));
      setSelectedMember(filteredMembers); // 전체 회원 데이터 삽입
    }

    setAllChecked(!allChecked);
  };

  // 체크 박스 토글
  const toggleCheck = (member: Member) => {
    setSelectedIds((prevSelectedIds) => {
      const isSelected = prevSelectedIds.some(
        (selected) => selected.order_seq === member.order_seq
      );

      if (isSelected) {
        return prevSelectedIds.filter(
          (selected) => selected.order_seq !== member.order_seq
        );
      } else {
        return [...prevSelectedIds, member];
      }
    });

    setSelectedMember((prevSelected) => {
      const isSelected = prevSelected.some(
        (m) => m.order_seq === member.order_seq
      );

      if (isSelected) {
        return prevSelected.filter((m) => m.order_seq !== member.order_seq);
      } else {
        return [...prevSelected, member];
      }
    });
  };

  // 회원 일괄 등록
  const updateBulkMemoEndDt = async () => {
    if (!selectedMember.length) {
      alert("회원을 선택해주세요.");
      return;
    } else if (!extendDay) {
      alert("일수를 입력해주세요.");
      return;
    }

    const userConfirmed = window.confirm(
      `입력하신 ${extendDay}일을 연장 하시겠습니까?`
    );
    if (!userConfirmed) return;

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/member/bulkMemoEndDt`,
        [selectedMember, extendDay, user?.center_id]
      );

      alert("등록이 완료되었습니다.");
      setSelectedIds([]);
      setSelectedMember([]);
      setAllChecked(false);
      setSearchTerm("");
      setExtendDay(0);
      await fetchData();
    } catch (e) {
      console.log(e);
    } finally {
    }
  };

  // 회원 목록 조회
  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/member/validOrder`,
        {
          params: { user: user, sortOption: sortOption },
        }
      );
      setMembers(res.data.result);
    } catch (err) {
      console.log(err);
    }
  }, [user, sortOption]);

  useEffect(() => {
    const loadData = async () => {
      await fetchData();
    };

    loadData();
  }, [fetchData, sortOption]);

  return (
    <div className="px-2 py-3 lg:p-10">
      <div className="">
        <div className="mx-5 w-full">
          <div>
            <span className="font-bold text-xl">회원권 일괄 등록</span>
          </div>
          <div>
            <MembersOrderBulkNav />
          </div>
        </div>

        <div className="flex justify-between mt-20">
          <div className="flex items-center">
            <form className="max-w-sm my-2 mr-1">
              <select
                id="filter"
                className="bg-gray-50 border h-full border-gray-300 text-gray-900 text-sm rounded-lg block p-2"
                onChange={handleSelectChange}
                value={sortOption}
              >
                <option value="최신 등록순">최신 등록순</option>
                <option value="이름순">이름순</option>
                <option value="최초 등록순">최초 등록순</option>
                {schedules?.map((schedule) => (
                  <option value={schedule.sch_id} key={schedule.sch_id}>
                    {schedule.sch_info}
                  </option>
                ))}
              </select>
            </form>

            <div className="relative ml-1">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                  />
                </svg>
              </div>
              <input
                type="search"
                id="default-search"
                className="block w-48 p-2.5 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50"
                placeholder="이름 검색"
                onChange={(e) => setSearchTerm(e.target.value)}
                required
                maxLength={20}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="my-2 flex items-center">
            <div className="flex items-center">
              <p>일수 입력</p>
              <DescriptionPopover
                tip={"만기일자가 입력한 일자만큼 연장됩니다."}
              />
              <input
                type="text"
                id="name"
                className="ml-5 mr-10 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-2.5 py-1.5"
                placeholder="0"
                required
                value={extendDay ? extendDay : ""}
                maxLength={3}
                onChange={(e) => setExtendDay(parseInt(e.target.value) || 0)}
              />
            </div>
            <button
              type="button"
              className="block rounded-full bg-green-600 px-10 py-3 text-center text-sm text-white font-extrabold shadow-sm hover:text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
              onClick={updateBulkMemoEndDt}
            >
              등록
            </button>
          </div>
        </div>

        {/* 멤버 목록 테이블 */}
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg my-4">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500">
            <thead className="text-xs text-white font-bold uppercase bg-custom-C4C4C4">
              <tr
                onClick={() => {
                  toggleAllChecks();
                }}
              >
                <th scope="col" className="sm:px-2 lg:px-6 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={members.length > 0 && allChecked}
                    readOnly
                    disabled={!members.length}
                  />
                </th>
                <th className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base">
                  NO
                </th>
                <th className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base">
                  이름
                </th>
                <th className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base">
                  성별
                </th>
                <th className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base">
                  생년월일
                </th>
                <th className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base">
                  등록일자
                </th>
                <th className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base">
                  전화번호
                </th>
                <th className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base">
                  회원권
                </th>
                <th className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base">
                  구매일자
                </th>
                <th className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base">
                  시작일자
                </th>
                <th className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base">
                  만기일자
                </th>
                <th className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base">
                  남은횟수
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member, index) => {
                return (
                  <tr
                    key={member.order_seq}
                    className="bg-white border-b hover:bg-gray-50"
                    onClick={() => {
                      toggleCheck(member);
                    }}
                  >
                    <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                      <input
                        type="checkbox"
                        checked={selectedIds.some(
                          (selected) => selected.order_seq === member.order_seq
                        )}
                        readOnly
                      />
                    </td>
                    <td className="px-1 sm:px-2 lg:px-6 py-4 text-base font-medium text-center text-black whitespace-nowrap">
                      {index + 1}
                    </td>
                    <td className="px-1 sm:px-2 lg:px-6 py-4 text-base text-black text-center">
                      {member.mem_name}
                    </td>
                    <td className="px-1 sm:px-2 lg:px-6 py-4 text-base text-black text-center">
                      {member.mem_gender == 0 ? "여자" : "남자"}
                    </td>
                    <td className="px-1 sm:px-2 lg:px-6 py-4 text-base text-black text-center">
                      {member.mem_birth ? convertDate(member.mem_birth) : "-"}
                    </td>
                    <td className="px-1 sm:px-2 lg:px-6 py-4 text-base text-black text-center">
                      {member.mem_regist_date
                        ? convertDate(member.mem_regist_date)
                        : "-"}
                    </td>
                    <td className="px-1 sm:px-2 lg:px-6 py-4 text-base text-black text-center">
                      {member.mem_phone ? convertPhone(member.mem_phone) : "-"}
                    </td>
                    <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center">
                      {member.memo_pro_name ? member.memo_pro_name : "-"}
                    </td>
                    <td className="px-1 sm:px-2 lg:px-6 py-4 font-medium text-center text-black whitespace-nowrap">
                      {member.memo_purchase_date
                        ? convertDate(member.memo_purchase_date)
                        : "-"}
                    </td>
                    <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center">
                      {member.memo_start_date
                        ? convertDate(member.memo_start_date)
                        : "-"}
                    </td>
                    <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center">
                      {member.memo_end_date
                        ? convertDate(member.memo_end_date)
                        : "-"}
                    </td>
                    <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center">
                      {member.memo_remaining_counts
                        ? member.memo_remaining_counts
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MembersBulkExtend;
