import React, { useState } from "react";
import axios, { AxiosError, AxiosResponse } from "axios";
import { ko } from "date-fns/locale"; //한국어 설정
import DatePicker from "react-datepicker";
import { checkinNumberRegex } from "../utils/regexUtils";
import {
  convertDate,
  convertPhone,
  removeNonNumeric,
} from "../utils/formatUtils";
import { NavLink } from "react-router-dom";
import { Schedule } from "../utils/types";

interface Member {
  mem_id?: number;
  mem_name?: string;
  mem_phone?: string;
  mem_birth: any;
  mem_sch_id?: number;
  mem_gender?: boolean | number;
  mem_locker?: boolean | number;
  mem_locker_number?: string;
  mem_checkin_number?: string;
  mem_manager?: string;
  mem_memo?: string;
  center_id?: number;
}

type ScheduleOmit = Omit<Schedule, "current_count">;

interface ModalProps {
  setModalToggle: React.Dispatch<React.SetStateAction<boolean>>;
  center_id: number | undefined;
  schedules: ScheduleOmit[];
  mode: String;
  selectedMember: Member | undefined | null;
  setSelectedMember: React.Dispatch<React.SetStateAction<any>>;
}

const AddMemberModal: React.FC<ModalProps> = ({
  setModalToggle,
  center_id,
  schedules,
  mode,
  selectedMember,
  setSelectedMember,
}) => {
  const [member, setMember] = useState<Member>({
    mem_name: mode === "add" ? "" : selectedMember?.mem_name,
    mem_phone: mode === "add" ? "" : selectedMember?.mem_phone,
    mem_birth:
      mode === "add"
        ? Math.floor(new Date().getTime() / 1000)
        : selectedMember &&
          Math.floor(new Date(selectedMember?.mem_birth).getTime() / 1000),
    mem_sch_id: mode === "add" ? 0 : selectedMember?.mem_sch_id,
    mem_gender: mode === "add" ? 1 : selectedMember?.mem_gender,
    mem_locker:
      mode === "add" ? false : selectedMember?.mem_locker === 1 ? true : false,
    mem_locker_number: mode === "add" ? "" : selectedMember?.mem_locker_number,
    mem_checkin_number:
      mode === "add" ? "" : selectedMember?.mem_checkin_number,
    mem_manager: mode === "add" ? "" : selectedMember?.mem_manager,
    mem_memo: mode === "add" ? "" : selectedMember?.mem_memo,
    center_id: center_id,
  });
  const [confirm, setConfirm] = useState<Boolean>(false);

  const addMember = async () => {
    if (member.mem_name === "") {
      return alert("이름을 입력해주세요");
    }

    if (
      !member.mem_checkin_number ||
      member.mem_checkin_number?.length < 4 ||
      !checkinNumberRegex.test(member.mem_checkin_number)
    ) {
      return alert("출입번호를 4자리 이상 숫자로만 입력해주세요.");
    }

    if (!member.mem_sch_id) {
      return alert("수업시간을 선택해주세요.");
    }

    try {
      if (mode === "add") {
        await axios.post(`${process.env.REACT_APP_API_URL}/member`, member);
        setSelectedMember(null);
      } else if (mode === "edit") {
        await axios.patch(
          `${process.env.REACT_APP_API_URL}/member/${selectedMember?.mem_id}`,
          member
        );
      } else {
        return alert("다시 시도하시기 바랍니다.");
      }
      window.location.reload();
    } catch (error) {
      const errorResponse = (error as AxiosError).response;
      if (errorResponse) {
        const data = (errorResponse as AxiosResponse).data;
        alert(data.message);
      }
    }
  };

  return (
    <div
      id="add-user-modal"
      className="overflow-y-hidden
      overflow-x-hidden
      fixed top-0 right-0 left-0 z-50 justify-center items-center w-full inset-0 max-h-full"
    >
      <div className="fixed top-0 right-0 left-0 w-full max-h-full min-h-screen bg-black opacity-50"></div>
      <div className="overflow-scroll absolute bottom-0 bg-white animate-openModalMobile sm:animate-openModalPC w-full sm:w-auto lg:w-full lg:max-w-screen-sm sm:h-full sm:min-h-screen sm:top-0 right-0 z-80">
        {/* Modal content */}
        <div className="relative">
          {/* Modal header */}
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
            <h3 className="text-xl font-semibold text-gray-900">
              회원 {mode === "add" ? "등록" : "수정"}
            </h3>
            <button
              type="button"
              className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
              data-modal-hide="authentication-modal"
              onClick={() => setModalToggle(false)}
            >
              <svg
                className="w-3 h-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                />
              </svg>
              <span className="sr-only">Close modal</span>
            </button>
          </div>
          {/* Modal body  */}
          <div className="p-4 md:p-5 flex flex-col items-center">
            {schedules.length === 0 ? (
              <NavLink to="/schedules">
                <span className="bg-pink-500 text-white p-2">
                  <b>시간표 관리</b>에서 시간표를 먼저 등록해주세요.
                </span>
              </NavLink>
            ) : null}
            <table className="mt-4 w-full text-sm text-left rtl:text-right text-gray-500">
              <tbody>
                <tr className="border-b border-gray-200">
                  <th
                    scope="row"
                    className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                  >
                    이름
                  </th>
                  <td className="px-6 py-2 bg-white text-black max-w-52">
                    <input
                      type="text"
                      id="name"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-1.5"
                      placeholder="이름을 입력하세요."
                      required
                      value={member.mem_name}
                      maxLength={10}
                      onChange={(e) =>
                        setMember({ ...member, mem_name: e.target.value })
                      }
                      autoComplete="off"
                    />
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th
                    scope="row"
                    className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                  >
                    생년월일
                  </th>
                  <td className="px-6 py-2 bg-white text-black max-w-52 flex items-center">
                    <DatePicker
                      locale={ko}
                      onChange={(date: any) => {
                        setMember({
                          ...member,
                          mem_birth: new Date(date).getTime() / 1000,
                        });
                      }}
                      selected={new Date(member.mem_birth * 1000)}
                      dateFormat="yyyy-MM-dd"
                      className="bg-gray-50 border cursor-pointer border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
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
                              {date.getFullYear()}년 {date.getMonth() + 1}월
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
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th
                    scope="row"
                    className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                  >
                    전화번호
                  </th>
                  <td className="px-6 py-2 bg-white text-black">
                    <input
                      type="text"
                      id="phone"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-1.5"
                      placeholder="-없이 입력"
                      maxLength={11}
                      value={member.mem_phone}
                      onChange={(e) =>
                        setMember({
                          ...member,
                          mem_phone: removeNonNumeric(e.target.value),
                        })
                      }
                      autoComplete="off"
                    />
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th
                    scope="row"
                    className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                  >
                    출입번호
                  </th>
                  <td className="px-6 py-2 bg-white text-black">
                    <input
                      type="text"
                      id="checkin_number"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-1.5"
                      placeholder="출입번호 4자리 이상을 입력하세요."
                      maxLength={11}
                      value={member.mem_checkin_number}
                      onChange={(e) =>
                        setMember({
                          ...member,
                          mem_checkin_number: removeNonNumeric(e.target.value),
                        })
                      }
                    />
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th
                    scope="row"
                    className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                  >
                    담당자
                  </th>
                  <td className="px-6 py-2 bg-white text-black">
                    <input
                      type="text"
                      id="manager"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-1.5"
                      placeholder="담당자 이름을 입력하세요."
                      maxLength={11}
                      value={member.mem_manager}
                      onChange={(e) =>
                        setMember({ ...member, mem_manager: e.target.value })
                      }
                    />
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th
                    scope="row"
                    className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                  >
                    수업시간
                  </th>
                  <td className="px-6 py-2 bg-white text-black">
                    <select
                      id="schedules"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      onChange={(e) =>
                        setMember({
                          ...member,
                          mem_sch_id: Number(e.target.value),
                        })
                      }
                      value={member.mem_sch_id}
                    >
                      <option value={0}>
                        {schedules.length === 0
                          ? "시간표를 추가해주세요"
                          : "수업시간을 선택하세요"}
                      </option>
                      {schedules.map((schedule) => (
                        <option value={schedule.sch_id} key={schedule.sch_id}>
                          {schedule.sch_time} {schedule.sch_info}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th
                    scope="row"
                    className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                  >
                    성별
                  </th>
                  <td className="px-6 py-2 bg-white text-black">
                    <div className="flex">
                      <div className="flex items-center mr-2">
                        <input
                          id="man"
                          type="radio"
                          value={1}
                          checked={member.mem_gender === 1}
                          name="man"
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                          onChange={(e) =>
                            setMember({
                              ...member,
                              mem_gender: Number(e.target.value),
                            })
                          }
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
                          value={0}
                          checked={member.mem_gender === 0}
                          name="woman"
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                          onChange={(e) =>
                            setMember({
                              ...member,
                              mem_gender: Number(e.target.value),
                            })
                          }
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
                {/* <tr className="border-b border-gray-200">
                  <th
                    scope="row"
                    className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                  >
                    사물함
                  </th>
                  <td className="px-6 py-2 bg-white text-black">
                    <div className="flex">
                      <div className="flex items-center mr-2">
                        <input
                          id="locker-true"
                          type="radio"
                          checked={member.mem_locker === true}
                          value="true"
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                          onChange={(e) =>
                            setMember({
                              ...member,
                              mem_locker: JSON.parse(e.target.value),
                            })
                          }
                        />
                        <label
                          htmlFor="locker-true"
                          className="ms-1 text-sm font-medium text-gray-900"
                        >
                          등록
                        </label>
                      </div>
                      {member.mem_locker === true ? (
                        <div>
                          사물함 번호 :
                          <input
                            type="text"
                            className="ml-2 w-16 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg px-2.5 py-1.5"
                            maxLength={5}
                            onChange={(e) =>
                              setMember({
                                ...member,
                                mem_locker_number: e.target.value,
                              })
                            }
                            value={member.mem_locker_number || ""}
                          />
                        </div>
                      ) : null}
                      <div className="flex items-center mx-2">
                        <input
                          id="locker-false"
                          type="radio"
                          checked={member.mem_locker === false}
                          value="false"
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                          onChange={(e) =>
                            setMember({
                              ...member,
                              mem_locker: JSON.parse(e.target.value),
                            })
                          }
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
                </tr> */}
                <tr>
                  <th
                    scope="row"
                    className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                  >
                    메모
                  </th>
                  <td className="px-6 py-2 bg-white text-black">
                    <textarea
                      className="h-40 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-1.5"
                      maxLength={3000}
                      value={member.mem_memo || ""}
                      onChange={(e) =>
                        setMember({ ...member, mem_memo: e.target.value })
                      }
                    ></textarea>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="p-5">
              <button
                type="button"
                disabled={member.mem_sch_id === 0 || member.mem_name === ""}
                className={`${
                  member.mem_sch_id === 0 || member.mem_name === ""
                    ? "bg-gray-300"
                    : "bg-green-600 hover:bg-green-700"
                } block rounded-full px-10 py-3 text-center text-sm text-white font-extrabold shadow-sm hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600`}
                onClick={() => setConfirm(true)}
              >
                {mode === "add" ? "등록" : "수정"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* 확인 모달 */}
      <div
        tabIndex={-1}
        className={`${
          confirm ? "block" : "hidden"
        } overflow-y-auto overflow-x-hidden flex z-50 justify-center w-full md:inset-0 h-modal md:h-full`}
      >
        <div className="relative p-4 w-full max-w-md h-full md:h-auto">
          <div className="relative p-4 text-center bg-white rounded-lg shadow sm:p-5">
            <button
              type="button"
              className="text-gray-400 absolute top-2.5 right-2.5 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
              onClick={() => setConfirm(false)}
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
            <p className="mb-4 text-gray-500">회원 정보가 일치합니까?</p>
            <p className="mb-1 text-gray-500">이름 : {member.mem_name}</p>
            <p className="mb-1 text-gray-500">
              생년월일 : {convertDate(member.mem_birth * 1000)}
            </p>
            <p className="mb-4 text-gray-500">
              {`전화번호 : ${convertPhone(member.mem_phone)}`}
            </p>
            <div className="flex justify-center items-center space-x-4">
              <button
                data-modal-toggle="deleteModal"
                type="button"
                className="py-2 px-3 text-sm font-medium text-gray-500 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-primary-300 hover:text-gray-900 focus:z-10"
                onClick={() => setConfirm(false)}
              >
                아니요. 취소할래요
              </button>
              <button
                type="submit"
                className="py-2 px-3 text-sm font-medium text-center text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-red-300"
                onClick={addMember}
              >
                {mode === "add" ? "네. 등록할게요" : "네. 수정할게요"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;
