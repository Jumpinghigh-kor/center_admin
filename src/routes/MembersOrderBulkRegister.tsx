import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useUserStore } from "../store/store";
import "./../styles/Members.css";
import { Member, Schedule } from "../utils/types";
import { convertAmount, convertDate, convertPhone } from "../utils/formatUtils";
import { NavLink } from "react-router-dom";
import { Product } from "../utils/types";
import dayjs from "dayjs";
import { getMonth, getYear } from "date-fns";
import DatePicker from "react-datepicker";
import { ko } from "date-fns/locale"; //한국어 설정
import DescriptionPopover from "../components/DescriptionPopover";
import MembersOrderBulkNav from "../components/MemberOrderBulkNav";

type ScheduleOmit = Omit<Schedule, "current_count">;

const MembersBulkRegister: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const [isConfirm, setIsConfirm] = useState<Boolean>(false);
  const [sortOption, setSortOption] = useState(() => {
    const savedFilters = localStorage.getItem("tableFilters");
    return savedFilters ? JSON.parse(savedFilters) : "최신 등록순";
  });

  const [members, setMembers] = useState<Member[]>([]);
  const [schedules, setSchedules] = useState<ScheduleOmit[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Member[]>([]);
  const [allChecked, setAllChecked] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedProduct, setSelectedProduct] = useState<Product>();
  const [currentTime, setCurrentTime] = useState<Date | null>();
  const [startDate, setStartDate] = useState<String>("");
  const [endDate, setEndDate] = useState<String | any>("");

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
    } catch (err) {
      console.log(err);
    }
  }, [user, sortOption]);

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
        (selected) => selected.mem_id === member.mem_id
      );

      if (isSelected) {
        return prevSelectedIds.filter(
          (selected) => selected.mem_id !== member.mem_id
        );
      } else {
        return [...prevSelectedIds, member];
      }
    });

    setSelectedMember((prevSelected) => {
      const isSelected = prevSelected.some((m) => m.mem_id === member.mem_id);

      if (isSelected) {
        return prevSelected.filter((m) => m.mem_id !== member.mem_id);
      } else {
        return [...prevSelected, member];
      }
    });

    // 개별 체크박스 클릭 시 전체 선택 상태를 다시 계산
    setAllChecked(
      members.length > 0 && selectedIds.length + 1 === members.length
    );
  };

  // 회원 일괄 등록
  const createBulkMemberOrder = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/member/bulkOrder`, [
        selectedMember,
        selectedProduct,
        startDate,
        user?.center_id,
      ]);

      setIsConfirm(false);
      alert("등록이 완료되었습니다.");

      await fetchData();

      // 초기화
      setSelectedMember([]);
      setSelectedIds([]);
      setAllChecked(false);
      setSelectedProduct(undefined);
      setSearchTerm("");
    } catch (e) {
      console.log(e);
    } finally {
    }
  };

  useEffect(() => {
    //회원 등록 시 스케줄 표시
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

    // 상품 데이터 조회
    const getProducts = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/product`,
          {
            params: user,
          }
        );
        setProducts(res.data.result);
      } catch (err) {
        console.log(err);
      }
    };
    getProducts();
  }, [user]);

  useEffect(() => {
    // 시간 조회
    const getTime = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/time`);
        setCurrentTime(res.data.result);
        setStartDate(res.data.result);
      } catch {}
    };
    getTime();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchData();
    };

    loadData();
  }, [fetchData, sortOption]);

  return (
    <div className="px-2 py-3 lg:p-10">
      <div className="flex flex-col-reverse lg:flex-row">
        <div className="flex flex-col mx-5 w-full">
          <div className="flex">
            <span className="font-bold text-xl">회원 일괄 등록</span>
          </div>

          <div>
            <MembersOrderBulkNav />
          </div>

          <div className="mt-10">
            {products.length === 0 ? (
              <NavLink to="/products">
                <span className="bg-pink-500 text-white p-2">
                  <b>회원권 관리</b>에서 회원권을 먼저 등록해주세요.
                </span>
              </NavLink>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 mt-3 gap-4">
                {products.map((product) => (
                  <div
                    className={`max-w-sm bg-white border-2 ${
                      product.pro_id === selectedProduct?.pro_id
                        ? "border-green-600"
                        : "border-gray-200"
                    } rounded-xl shadow
                  hover:bg-gray-100
                `}
                    key={product.pro_id}
                    onClick={() => {
                      setSelectedProduct(product);

                      const durationType = product?.pro_week ? "week" : "month";
                      const durationValue =
                        product?.pro_week || product?.pro_months;

                      setEndDate(
                        dayjs(convertDate(startDate))
                          .add(Number(durationValue), durationType)
                          .subtract(1, "day")
                          .format("YYYY-MM-DD")
                      );
                    }}
                  >
                    <div className="bg-custom-C4C4C4 text-center py-2 rounded-t-xl">
                      <h5 className="text-xl font-bold tracking-tight text-black">
                        {product.pro_name}
                      </h5>
                    </div>
                    <p className="text-2xl pt-6 font-bold text-black text-center">
                      {product.pro_type === "회차권"
                        ? `${product.pro_remaining_counts}회`
                        : product.pro_type === "개월권"
                        ? `${product.pro_months}개월`
                        : `${product.pro_week}주`}
                    </p>
                    <p className="text-2xl py-6 font-bold text-green-600 text-center">
                      {convertAmount(product.pro_price)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-10 mb-10 flex justify-between flex-col lg:flex-row">
            <div className="text-xl">
              <>
                <div className="flex items-center">
                  <span className="font-bold mr-3">시작일자 :&nbsp;</span>
                  <div className="relative max-w-sm">
                    <div className="absolute z-30 inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                      <svg
                        className="w-4 h-4 text-gray-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
                      </svg>
                    </div>
                  </div>
                  <DatePicker
                    selected={currentTime}
                    locale={ko}
                    onChange={(date: any) => {
                      setCurrentTime(date);
                      setStartDate(convertDate(date));

                      const durationType = selectedProduct?.pro_week
                        ? "week"
                        : "month";
                      const durationValue =
                        selectedProduct?.pro_week ||
                        selectedProduct?.pro_months;

                      setEndDate(
                        dayjs(date)
                          .add(Number(durationValue), durationType)
                          .subtract(1, "day")
                          .format("YYYY-MM-DD")
                      );
                    }}
                    dateFormat="yyyy-MM-dd"
                    className="bg-gray-50 border cursor-pointer border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5"
                    renderCustomHeader={({
                      date,
                      decreaseMonth,
                      increaseMonth,
                      prevMonthButtonDisabled,
                      nextMonthButtonDisabled,
                    }) => (
                      <div>
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={decreaseMonth}
                            disabled={prevMonthButtonDisabled}
                          >
                            <svg
                              className="w-4 h-4 text-gray-800"
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke="currentColor"
                                strokeWidth={2}
                                d="m15 19-7-7 7-7"
                              />
                            </svg>
                          </button>
                          <span>
                            {getYear(date)}년 {getMonth(date) + 1}월
                          </span>
                          <button
                            type="button"
                            onClick={increaseMonth}
                            disabled={nextMonthButtonDisabled}
                          >
                            <svg
                              className="w-4 h-4 text-gray-800"
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke="currentColor"
                                strokeWidth={2}
                                d="m9 5 7 7-7 7"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  />
                </div>

                <div className="mt-2 flex items-center">
                  <span className="font-bold">만기일자 :&nbsp; </span>
                  {endDate === "Invalid Date" || !endDate ? (
                    <span className="text-red-800 font-bold">
                      회원권을 선택해주세요.
                    </span>
                  ) : (
                    <div className="ml-1 mr-3 flex items-center">
                      <div className="relative max-w-sm">
                        <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                          <svg
                            className="w-4 h-4 text-gray-500"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
                          </svg>
                        </div>
                      </div>
                      <DatePicker
                        selected={new Date(dayjs(endDate).format("YYYY-MM-DD"))}
                        locale={ko}
                        disabled
                        dateFormat="yyyy-MM-dd"
                        className="bg-gray-200 font-bold border border-gray-300 text-gray-500 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5"
                      />
                    </div>
                  )}
                </div>
              </>
            </div>

            <div className="text-2xl">
              선택 상품&nbsp;
              <span className="font-bold text-green-600">
                {!!selectedProduct
                  ? convertAmount(Number(selectedProduct?.pro_price))
                  : "0"}
              </span>
              &nbsp;원
            </div>
          </div>

          <div className="flex justify-between">
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
                  <option value="회원권 등록자">회원권 등록자</option>
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

            <div className="max-w-sm my-2">
              <button
                type="button"
                className="block rounded-full bg-green-600 px-10 py-3 text-center text-sm text-white font-extrabold shadow-sm hover:text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                onClick={() => {
                  if (!selectedProduct) {
                    alert("회원권을 선택해주세요.");
                    return;
                  } else if (!selectedMember.length) {
                    alert("회원을 선택해주세요.");
                    return;
                  }

                  setIsConfirm(true);
                }}
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
                  <th>
                    <div className="flex items-center justify-center">
                      <span>최근 회원권</span>
                      <DescriptionPopover
                        tip={
                          "가장 최근 구매한 회원권만 노출됩니다. 모든 회원권을 보고 싶으시면 회원 관리에서 확인 할 수 있습니다."
                        }
                      />
                    </div>
                  </th>
                  <th className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base">
                    <div className="flex items-center justify-center">
                      <span>최근 구매일자</span>
                      <DescriptionPopover
                        tip={
                          "가장 최근 구매한 회원권만 노출됩니다. 모든 회원권을 보고 싶으시면 회원 관리에서 확인 할 수 있습니다."
                        }
                      />
                    </div>
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
                {filteredMembers.map((member, index) => (
                  <tr
                    key={member.mem_id}
                    className="bg-white border-b hover:bg-gray-50"
                    onClick={() => {
                      toggleCheck(member);
                    }}
                  >
                    <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                      <input
                        type="checkbox"
                        checked={selectedIds.some(
                          (selected) => selected.mem_id === member.mem_id
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 확인 모달 */}
      {isConfirm ? (
        <div className="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full h-screen md:inset-0 h-modal md:h-full">
          <div className="fixed top-0 right-0 left-0 w-full max-h-full min-h-screen md:inset-0 bg-black opacity-50"></div>
          <div
            tabIndex={-1}
            className="overflow-y-auto overflow-x-hidden absolute z-50 w-full md:inset-0 h-modal md:h-full"
          >
            <div className="flex justify-center p-4 h-full md:h-auto">
              <div className="relative p-4 text-center bg-white rounded-lg shadow sm:p-5">
                <button
                  type="button"
                  className="text-gray-400 absolute top-2.5 right-2.5 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                  onClick={() => setIsConfirm(false)}
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"></path>
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
                <svg
                  className="text-gray-400 w-11 h-11 mb-3.5 mx-auto"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M14 2a3.963 3.963 0 0 0-1.4.267 6.439 6.439 0 0 1-1.331 6.638A4 4 0 1 0 14 2Zm1 9h-1.264A6.957 6.957 0 0 1 15 15v2a2.97 2.97 0 0 1-.184 1H19a1 1 0 0 0 1-1v-1a5.006 5.006 0 0 0-5-5ZM6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Z" />
                </svg>
                <p className="mb-4 text-gray-500">등록 정보가 일치합니까?</p>
                <p className="mb-1 text-gray-500">
                  이름 :
                  {selectedMember.map((e, i) => (
                    <span key={i}>
                      {" "}
                      {e.mem_name} {i !== selectedMember.length - 1 && " / "}{" "}
                    </span>
                  ))}
                </p>
                <p className="mb-1 text-gray-500">
                  회원권 : {selectedProduct?.pro_name}
                </p>
                <p className="mb-4 text-gray-500">
                  상품금액 : {convertAmount(Number(selectedProduct?.pro_price))}
                  원
                </p>
                <div className="flex justify-center items-center space-x-4">
                  <button
                    data-modal-toggle="deleteModal"
                    type="button"
                    className="py-2 px-3 text-sm font-medium text-gray-500 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-primary-300 hover:text-gray-900 focus:z-10"
                    onClick={() => setIsConfirm(false)}
                  >
                    아니요. 취소할래요
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-3 text-sm font-medium text-center text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-red-300"
                    onClick={createBulkMemberOrder}
                  >
                    네. 등록할게요
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MembersBulkRegister;
