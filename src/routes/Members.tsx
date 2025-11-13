import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import AddMemberModal from "../components/AddMemberModal";
import { useUserStore } from "../store/store";
import DeleteMemberModal from "../components/DeleteMemberModal";
import { convertDate, convertPhone } from "../utils/formatUtils";
import MembershipModal from "../components/MembershipModal";
import "./../styles/Members.css";
import { Member, Schedule } from "../utils/types";
import MemberList from "../components/MemberList";
import MemberActions from "../components/MemberActions";
import CreateAppAccountPopup from "../components/app/CreateAppAccountPopup";

type ScheduleOmit = Omit<Schedule, "current_count">;

interface Order {
  memo_id: number;
  memo_pro_name: string;
  memo_pro_price: number;
  memo_remaining_counts: number | null;
  memo_start_date: string;
  memo_end_date: string;
  memo_purchase_date: string;
  memo_history: string;
  pro_name: string;
  pro_type: string;
  pro_price: number;
}


const Members: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const [sortOption, setSortOption] = useState(() => {
    const savedFilters = localStorage.getItem("tableFilters");
    return savedFilters ? JSON.parse(savedFilters) : "최신 등록순";
  });
  const [modalToggle, setModalToggle] = useState<boolean>(false);
  const [deleteModalToggle, setDeleteModalToggle] = useState<boolean>(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [schedules, setSchedules] = useState<ScheduleOmit[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member>();
  const [selectedOrder, setSelectedOrder] = useState<Order>();
  const [mode, setMode] = useState<String>("");
  const [membershipModalToggle, setMembershipModalToggle] =
  useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [popupToggle, setPopupToggle] = useState<boolean>(false);
  const [popupMode, setPopupMode] = useState<string>("");
  const [priceInputs, setPriceInputs] = useState<Record<number, string>>({});
  const [memoPopupOpen, setMemoPopupOpen] = useState<boolean>(false);
  const [memoContent, setMemoContent] = useState<string>("");
  
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

const fetchData = useCallback(async () => {
  try {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/member`, {
      params: { user: user, sortOption: sortOption },
    });
    
    setMembers(res.data.result);
    
    const foundItem = res.data.result.find(
      (item: Member) => item.mem_id === selectedMember?.mem_id
    );
    setSelectedMember(foundItem);
    
    const result = await axios.get(
      `${process.env.REACT_APP_API_URL}/member/order`,
      {
        params: foundItem,
      }
    );
    setOrders(result.data.result);
  } catch (err) {
    console.log(err);
  }
}, [user, selectedMember?.mem_id, sortOption]);

useEffect(() => {
  const loadData = async () => {
    await fetchData();
  };
  
  loadData();
}, [fetchData, sortOption]);

//회원 등록 시 스케줄 표시
useEffect(() => {
  const getSchedule = async () => {
    try {
      const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/schedule`,
          {
            params: user,
          }
        );
        setSchedules(res.data.result);
      } catch (err) {
        console.log(err);
      }
    };
    getSchedule();
  }, [user]);

  // 주문 목록이 바뀌면 입력값 초기화
  useEffect(() => {
    const initial: Record<number, string> = {};
    orders.forEach((o) => {
      initial[o.memo_id] = String(o.memo_pro_price ?? "");
    });
    setPriceInputs(initial);
  }, [orders]);

  const getMemberInfo = async (member: Member) => {
    try {
      setSelectedMember(member);
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/member/order`,
        {
          params: member,
        }
      );
      setSelectedOrder(undefined);
      setOrders(res.data.result);
    } catch (err) {
      console.log(err);
    }
  };
  
  if (modalToggle || deleteModalToggle || membershipModalToggle) {
    //모달 오픈시 스크롤 방지
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }

  //결제 금액 수정
  const updateMemberOrderPrice = async (id: number, price: number) => {
    if(!window.confirm("기존의 결제 금액은 삭제되며 복구 불가능 합니다.\n정말로 결제 금액을 수정하겠습니까?")) {
      return;
    }

    if(!price) {
      alert("결제 금액을 입력해주세요.");
      return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/member/orderPrice`, {
        memo_id: id,
        memo_pro_price: price,
      });
      
      alert("결제 금액이 수정되었습니다.");
      await fetchData();
    } catch (err) {
      console.log(err);
    }
  };

  //회원권 삭제
  const deleteOrder = async () => {
    const doDelete = window.confirm("회원권을 삭제하겠습니까?");
    if (!doDelete) return;

    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/member/order/${selectedOrder?.memo_id}`
      );
      setSelectedOrder(undefined);
      await fetchData();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="px-2 py-3 lg:p-10">
      <div className="flex flex-col-reverse lg:flex-row">
        <div className="flex flex-col mx-5 min-w-48">
          <div className="flex">
            <span className="font-bold text-xl">회원 관리</span>
          </div>
          <div className="flex justify-between">
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
                <option value="회원권 등록자">회원권 등록자</option>
                <option value="활동 회원">활동 회원</option>
                <option value="비활동 회원">비활동 회원</option>
                {schedules?.map((schedule) => (
                  <option value={schedule.sch_id} key={schedule.sch_id}>
                    {schedule.sch_info}
                  </option>
                ))}
              </select>
            </form>
            <div className="max-w-sm my-2">
              <div className="relative">
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
          </div>
          <MemberList
            filteredMembers={filteredMembers}
            onSelect={getMemberInfo}
          />
        </div>
        <div className="flex flex-col mx-5 flex-1 mb-10">
          <MemberActions
            selectedMember={selectedMember}
            onAddClick={() => {
              setMode("add");
              setModalToggle(true);
            }}
            onEditClick={() => {
              setMode("edit");
              setModalToggle(true);
            }}
            onDeleteClick={() => setDeleteModalToggle(true)}
          />

          {(!selectedMember?.mem_app_status || selectedMember?.mem_app_status === 'EXIT') ?
            (<div className="flex justify-end">
              <div className="flex flex-col items-end">
                <button
                  className={`rounded-2xl mt-3 px-4 py-1 text-center text-sm text-white font-extrabold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 ${
                    selectedMember
                    ? "cursor-pointer"
                    : "cursor-not-allowed"
                  }`}
                  onClick={() => {
                    if (selectedMember) {
                      setPopupMode("create");
                      setPopupToggle(true);
                    }
                  }}
                  disabled={!selectedMember}
                  style={{ backgroundColor: !selectedMember ? '#ADB5BD' : '#6F7297' }}
                >
                  어플 계정 생성
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <div className="flex flex-col items-end">
                <button
                  className={`rounded-2xl mt-3 px-4 py-1 text-center text-sm text-white font-extrabold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 ${
                    selectedMember
                    ? "cursor-pointer"
                    : "cursor-not-allowed"
                  }`}
                  onClick={() => {
                    if (selectedMember) {
                      setPopupMode("emailChange");
                      setPopupToggle(true);
                    }
                  }}
                  disabled={!selectedMember}
                  style={{ backgroundColor: !selectedMember ? '#ADB5BD' : '#5F9EA0' }}
                >
                  어플 정보 변경
                </button>
              </div>
            </div>
          )}

          {selectedMember ? (
            <>
              <div className="flex flex-col items-center p-10">
                <img
                  alt="panelImage"
                  src="/img/profile.png"
                  style={{ width: "6rem", height: "6rem" }}
                  className="rounded-full"
                />
                <span className="mt-5 text-black text-3xl font-bold">
                  {selectedMember?.mem_name}
                </span>
              </div>
              <div>
                <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                  <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <th
                          scope="row"
                          className="text-base text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                        >
                          이름
                        </th>
                        <td className="px-1 sm:px-2 lg:px-6 py-2 bg-white text-black max-w-52">
                          {selectedMember?.mem_name}
                        </td>
                        <td className="text-base text-center bg-custom-C4C4C4 text-white">
                          성별
                        </td>
                        <td className="px-1 sm:px-2 lg:px-6 py-2 bg-white text-black">
                          <div className="flex">
                            <div className="flex items-center mr-2">
                              <input
                                id="man"
                                type="radio"
                                checked={selectedMember?.mem_gender === 1}
                                name="gender"
                                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                                disabled
                              />
                              <label
                                htmlFor="man"
                                className="ms-1 text-sm font-medium text-gray-900"
                              >
                                남
                              </label>
                            </div>
                            <div className="flex items-center mr-2">
                              <input
                                id="woman"
                                type="radio"
                                checked={selectedMember?.mem_gender === 0}
                                name="gender"
                                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                                disabled
                              />
                              <label
                                htmlFor="woman"
                                className="ms-1 text-sm font-medium text-gray-900"
                              >
                                여
                              </label>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <th
                          scope="row"
                          className="text-base text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                        >
                          생년월일
                        </th>
                        <td className="px-1 sm:px-2 lg:px-6 py-2 bg-white text-black max-w-52">
                          {convertDate(selectedMember?.mem_birth) ===
                          "Invalid Date"
                            ? "-"
                            : convertDate(selectedMember?.mem_birth)}
                        </td>
                        <td className="text-base text-center bg-custom-C4C4C4 text-white">
                          사물함
                        </td>
                        <td className="px-1 sm:px-2 lg:px-6 py-2 bg-white text-black">
                          <div className="flex">
                            <div className="flex items-center mr-2">
                              <input
                                id="locker-true"
                                type="radio"
                                checked={selectedMember?.mem_locker === 1}
                                name="locker"
                                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                                disabled
                              />
                              <label
                                htmlFor="locker-true"
                                className="ms-1 text-sm font-medium text-gray-900"
                              >
                                등록
                              </label>
                            </div>
                            <div className="flex items-center mr-2">
                              <input
                                id="locker-false"
                                type="radio"
                                checked={selectedMember?.mem_locker === 0}
                                name="locker"
                                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                                disabled
                              />
                              <label
                                htmlFor="locker-false"
                                className="ms-1 text-sm font-medium text-gray-900"
                              >
                                미등록
                              </label>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <th
                          scope="row"
                          className="text-base text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                        >
                          등록일자
                        </th>
                        <td className="px-1 sm:px-2 lg:px-6 py-2 bg-white text-black">
                          {selectedMember?.mem_regist_date
                            ? convertDate(selectedMember?.mem_regist_date)
                            : "-"}
                        </td>
                        <td className="text-base text-center p-2 bg-custom-C4C4C4 text-white">
                          사물함 번호
                        </td>
                        <td className="px-1 sm:px-2 lg:px-6 py-2 bg-white text-black">
                          {selectedMember?.mem_locker_number_old
                            ? `기존 번호 : ${selectedMember?.mem_locker_number_old}`
                            : ""}{" "}
                          {selectedMember?.mem_locker_number_old &&
                          selectedMember?.mem_locker_number_new
                            ? `/ 새로운 번호 - `
                            : "-"}
                          {selectedMember?.mem_locker_number_new}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <th
                          scope="row"
                          className="text-base text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                        >
                          전화번호
                        </th>
                        <td className="px-1 sm:px-2 lg:px-6 py-2 bg-white text-black">
                          {selectedMember?.mem_phone
                            ? convertPhone(selectedMember?.mem_phone)
                            : "-"}
                        </td>
                        <td className="text-base text-center p-2 bg-custom-C4C4C4 text-white">
                          담당자
                        </td>
                        <td className="px-1 sm:px-2 lg:px-6 py-2 bg-white text-black">
                          {selectedMember?.mem_manager
                            ? selectedMember?.mem_manager
                            : "-"}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <th
                          scope="row"
                          className="text-base text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                        >
                          출입번호
                        </th>
                        <td className="px-1 sm:px-2 lg:px-6 py-2 bg-white text-black max-w-52">
                          {selectedMember?.mem_checkin_number
                            ? selectedMember?.mem_checkin_number
                            : "-"}
                        </td>
                        <td className="text-base text-center p-2 bg-custom-C4C4C4 text-white">
                          수업시간
                        </td>
                        <td className="px-1 sm:px-2 lg:px-6 py-2 bg-white text-black">
                          {selectedMember?.sch_time
                            ? selectedMember?.sch_time
                            : "-"}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <th
                          scope="row"
                          className="text-base text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                        >
                          메모
                        </th>
                        <td className="px-1 sm:px-2 lg:px-6 py-2 bg-white text-black max-w-52">
                          {selectedMember?.mem_memo
                            ? selectedMember?.mem_memo
                            : "-"}
                        </td>
                        <td className="text-base text-center p-2 bg-custom-C4C4C4 text-white"></td>
                        <td className="px-1 sm:px-2 lg:px-6 py-2 bg-white text-black"></td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <th
                          scope="row"
                          className="text-base text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                        >
                          어플 아이디
                        </th>
                        <td className="px-1 sm:px-2 lg:px-6 py-2 bg-white text-black max-w-52">
                          {selectedMember?.mem_app_id
                            ? selectedMember?.mem_app_id
                            : "-"}
                        </td>
                        <td className="text-base text-center p-2 bg-custom-C4C4C4 text-white">
                          어플 회원 상태
                        </td>
                        <td className="px-1 sm:px-2 lg:px-6 py-2 bg-white text-black">
                          {selectedMember?.mem_app_status === 'ACTIVE' ? '활동'
                                                                        : selectedMember?.mem_app_status === 'PROCEED' ? '진행중' 
                                                                        : selectedMember?.mem_app_status === 'EXIT' ? '탈퇴' : '-'}
                        </td>
                      </tr>
                      <tr>
                        <th
                          scope="row"
                          className="text-base text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                        >
                          어플 가입일시
                        </th>
                        <td className="px-1 sm:px-2 lg:px-6 py-2 bg-white text-black max-w-52">
                          {selectedMember?.app_reg_dt
                            ? selectedMember?.app_reg_dt
                            : "-"}
                        </td>
                        <th
                          scope="row"
                          className="text-base text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                        >
                          어플 권한
                        </th>
                        <td className="px-1 sm:px-2 lg:px-6 py-2 bg-white text-black max-w-52">
                          {selectedMember?.mem_role === 'ADMIN' ? '관리자'
                                                                        : selectedMember?.mem_role === 'USER' ? '일반회원'
                                                                        : selectedMember?.mem_role === 'FRANCHISEE' ? '가맹점주'
                                                                        : '-'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="my-10">
                  {members.length === 0 ? null : (
                    <>
                      <div className="flex justify-end my-4">
                        <NavLink to="/join" state={selectedMember}>
                          <span
                            className="block rounded-2xl hover:opacity-80 mr-3 px-4 py-1 text-center text-sm text-white font-extrabold shadow-sm hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                            style={{ backgroundColor: '#03AFDE' }}
                          >
                            회원권 등록
                          </span>
                        </NavLink>
                        <button
                          onClick={() => {
                            setMembershipModalToggle(true);
                          }}
                          className={`block rounded-2xl mr-3 hover:opacity-80 px-4 py-1 text-center text-sm text-white font-extrabold shadow-sm hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600`}
                          disabled={!selectedOrder}
                          style={{ backgroundColor: !selectedOrder ? '#ADB5BD' : '#82B2C0' }}
                        >
                          회원권 수정
                        </button>
                        <button
                          disabled={!selectedOrder}
                          className={`block rounded-2xl px-4 py-1 hover:opacity-80 text-center text-sm text-white font-extrabold shadow-sm hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600`}
                          style={{ backgroundColor: !selectedOrder ? '#ADB5BD' : '#FF746C' }}
                          onClick={deleteOrder}
                        >
                          회원권 삭제
                        </button>
                      </div>
                      <div className="flex justify-end mb-4">
                        <p>아래의 회원권 목록을 더블클릭하면 회원권 정보를 수정할 수 있습니다.</p>
                      </div>
                    </>
                  )}
                  <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                    <table className="w-full text-sm text-left rtl:text-right text-gray-500 rounded-lg">
                      <thead className="text-xs text-white font-bold uppercase bg-custom-C4C4C4">
                        <tr>
                          <th
                            scope="col"
                            className="text-base px-1 sm:px-2 lg:px-6 py-3 text-center"
                          >
                            회원권
                          </th>
                          <th
                            scope="col"
                            className="text-base px-1 sm:px-2 lg:px-6 py-3 text-center"
                          >
                            회원권 가격
                          </th>
                          <th
                            scope="col"
                            className="text-base px-1 sm:px-2 lg:px-6 py-3 text-center"
                          >
                            결제금액
                          </th>
                          <th
                            scope="col"
                            className="text-base px-1 sm:px-2 lg:px-6 py-3 text-center"
                          >
                            구매일자
                          </th>
                          <th
                            scope="col"
                            className="text-base px-1 sm:px-2 lg:px-6 py-3 text-center"
                          >
                            시작일자
                          </th>
                          <th
                            scope="col"
                            className="text-base px-1 sm:px-2 lg:px-6 py-3 text-center"
                          >
                            만기일자
                          </th>
                          <th
                            scope="col"
                            className="text-base px-1 sm:px-2 lg:px-6 py-3 text-center"
                          >
                            남은횟수
                          </th>
                          <th
                            scope="col"
                            className="text-base px-1 sm:px-2 lg:px-6 py-3 text-center"
                          >
                            메모
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr
                            className={`${
                              selectedOrder?.memo_id === order.memo_id
                                ? "bg-gray-100"
                                : "bg-white"
                            } border-b hover:bg-gray-50 cursor-pointer`}
                            key={order.memo_id}
                            onClick={() => {
                              setSelectedOrder(order);
                            }}
                            onDoubleClick={() => {
                              setMembershipModalToggle(true);
                            }}
                          >
                            <td className="px-1 sm:px-2 lg:px-6 py-4 font-medium text-center text-black whitespace-nowrap">
                              {order.memo_pro_name}
                            </td>
                            <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center">
                              {order.pro_price.toLocaleString()} 원
                            </td>
                            <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  className="border border-gray-300 rounded-md px-2 py-1 w-24 text-right"
                                  value={priceInputs[order.memo_id] ?? ""}
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(/[^0-9]/g, "");
                                    setPriceInputs((prev) => ({ ...prev, [order.memo_id]: raw }));
                                  }}
                                  inputMode="numeric"
                                />
                                <p>원</p>
                                <button
                                  className="text-white px-4 py-2 rounded-md"
                                  style={{ backgroundColor: '#3065AC' }}
                                  onClick={() => {
                                    const newPrice = Number(priceInputs[order.memo_id] ?? order.memo_pro_price);
                                    updateMemberOrderPrice(order.memo_id, newPrice);
                                  }}
                                >
                                  수정
                                </button>
                              </div>
                            </td>
                            <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center">
                              {order.memo_purchase_date
                                ? convertDate(order.memo_purchase_date)
                                : "-"}
                            </td>
                            <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center">
                              {order.memo_start_date
                                ? convertDate(order.memo_start_date)
                                : "-"}
                            </td>
                            <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center">
                              {order.memo_end_date
                                ? convertDate(order.memo_end_date)
                                : "-"}
                            </td>
                            <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center">
                              {order.pro_type === "회차권"
                                ? order.memo_remaining_counts
                                : "-"}
                            </td>
                            <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center">
                              {order.memo_history ?
                                <button
                                  className="text-white px-4 py-2 rounded-md"
                                  style={{ backgroundColor: '#779ECB' }}
                                  onClick={() => {
                                    setMemoContent(order.memo_history);
                                  setMemoPopupOpen(true);
                                }}>
                                  보기
                                </button>
                                : '-'
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
      {modalToggle ? (
        <AddMemberModal
          setModalToggle={setModalToggle}
          center_id={user?.center_id}
          schedules={schedules}
          mode={mode}
          selectedMember={selectedMember}
          setSelectedMember={setSelectedMember}
        />
      ) : null}
      {deleteModalToggle ? (
        <DeleteMemberModal
          setDeleteModalToggle={setDeleteModalToggle}
          member={selectedMember}
          fetchData={fetchData}
          setSelectedMember={setSelectedMember}
          setSelectedOrder={setSelectedOrder}
        />
      ) : null}
      {membershipModalToggle ? (
        <MembershipModal
          setMembershipModalToggle={setMembershipModalToggle}
          selectedOrder={selectedOrder}
          fetchData={fetchData}
          setSelectedOrder={setSelectedOrder}
        />
      ) : null}
      {popupToggle ? (
        <CreateAppAccountPopup
          isOpen={popupToggle}
          onClose={() => setPopupToggle(false)}
          onSuccess={() => {
            setPopupToggle(false);
          }}
          selectedMember={selectedMember}
          mode={popupMode}
        />
      ) : null}
      {memoPopupOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-11/12 p-6">
            <h3 className="text-lg font-semibold mb-4">메모</h3>
            <div className="mb-4 max-h-80 overflow-auto whitespace-pre-wrap text-gray-800">
              <p>{memoContent}</p>
            </div>
            <div className="flex justify-end mt-8">
              <button
                className="rounded-2xl px-4 py-1 text-center text-sm text-white font-extrabold hover:bg-red-700"
                style={{ backgroundColor: '#FF746C' }}
                onClick={() => setMemoPopupOpen(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Members;
