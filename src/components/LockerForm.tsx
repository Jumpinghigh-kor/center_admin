import React, { useEffect } from "react";
import { LockerType, LockerDetail, LockerBasData } from "../utils/types";
import DescriptionPopover from "./DescriptionPopover";

interface LockerFormProps {
  form: LockerType;
  idx: number;
  expandedTables: { [key: number]: boolean };
  lockerDetail: LockerDetail[];
  lockerBasData: LockerBasData[];
  updateLayoutForm: (
    orderSeq: number,
    field: keyof LockerType,
    value: number | string
  ) => void;
  handleSubmit: (formId: number) => (e: React.FormEvent) => Promise<void>;
  deleteLockerBas: (form: LockerType) => void;
  toggleTable: (orderSeq: number) => void;
  setModalToggle: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedLocker: (locker: {
    locker_id: number;
    locker_number: number;
    free_position: number;
  }) => void;
}

// directionOptions 타입 정의 추가
type DirectionOptionType = {
  [key in "FREE" | "LEFT_TOP" | "RIGHT_TOP" | "BOTTOM_LEFT" | "BOTTOM_RIGHT"]: {
    value: "RIGHT" | "LEFT" | "UP" | "DOWN";
    label: string;
  }[];
};

const LockerForm: React.FC<LockerFormProps> = ({
  form,
  idx,
  expandedTables,
  lockerDetail,
  lockerBasData,
  updateLayoutForm,
  handleSubmit,
  deleteLockerBas,
  toggleTable,
  setModalToggle,
  setSelectedLocker,
}) => {
  // 라커 성별 옵션
  const genderOptions = [
    { id: "woman", value: "W", label: "여성" },
    { id: "man", value: "M", label: "남성" },
    { id: "unisex", value: "U", label: "공용" },
  ];

  // 정렬 방식에 따른 번호 생성 함수
  const getNumber = (row: number, col: number): number => {
    switch (form.sort_type) {
      case "LEFT_TOP":
        if (form.direction === "RIGHT") {
          return row * form.cols + col + 1;
        } else {
          // down
          return col * form.rows + row + 1;
        }
      case "RIGHT_TOP":
        if (form.direction === "LEFT") {
          return row * form.cols + (form.cols - col);
        } else {
          // down - 오른쪽 위에서 아래로
          return row + 1 + (form.cols - col - 1) * form.rows;
        }
      case "BOTTOM_LEFT":
        if (form.direction === "RIGHT") {
          return (form.rows - 1 - row) * form.cols + col + 1;
        } else {
          // up - 맨 아래부터 위로 올라가는 순서
          return form.rows - row + col * form.rows;
        }
      case "BOTTOM_RIGHT":
        if (form.direction === "LEFT") {
          return (form.rows - 1 - row) * form.cols + (form.cols - col);
        } else {
          // up
          return (form.cols - 1 - col) * form.rows + (form.rows - row);
        }
      default:
        return row * form.cols + col + 1;
    }
  };

  // 사물함 상태에 따른 배경색 클래스 반환 함수
  const getBgColorClass = (lockerInfo: LockerDetail | undefined): string => {
    if (!lockerInfo) return "bg-white";

    switch (lockerInfo.locker_status) {
      case "OCCUPIED":
        return "bg-green-300";
      case "UNAVAILABLE":
        return "bg-gray-300";
      case "OWNER_ONLY":
        return "bg-red-300";
      default:
        return "bg-white";
    }
  };

  // 기존 데이터와 현재 폼 데이터를 비교하는 함수
  const isFormChanged = (currentForm: LockerType) => {
    const originalLocker = lockerBasData.find(
      (bas) => bas.locker_id === currentForm.locker_id
    );

    if (!originalLocker) return false;

    return (
      currentForm.rows !== originalLocker.rows ||
      currentForm.cols !== originalLocker.cols ||
      currentForm.locker_type !== originalLocker.locker_type ||
      currentForm.locker_gender !== originalLocker.locker_gender ||
      currentForm.locker_memo !== originalLocker.locker_memo ||
      currentForm.sort_type !==
        (originalLocker.array_type === "AUTO"
          ? originalLocker.array_form
          : "FREE")
    );
  };

  const createTable = (locker_id: number, rows: number, cols: number) => {
    const tableRows = [];

    for (let i = 0; i < rows; i++) {
      const cells = [];
      for (let j = 0; j < cols; j++) {
        // 자유 입력일 때는 free_position으로 위치를 찾음
        const currentLockerInfo = lockerDetail.find(
          (detail: LockerDetail) =>
            detail.locker_id === locker_id &&
            (form.sort_type === "FREE"
              ? detail.free_position === i * cols + j + 1 // 자유 입력일 때는 free_position으로만 체크
              : detail.locker_number === getNumber(i, j) &&
                !detail.free_position) // 자동 정렬일 때는 free_position이 없는 데이터만
        );

        // displayNumber의 타입을 명시적으로 지정
        let displayNumber: number | string;
        if (form.sort_type === "FREE") {
          // 자유 입력일 때는 실제 저장된 사물함 번호를 표시
          displayNumber = currentLockerInfo?.locker_number || "";
        } else {
          // 자동 정렬일 때는 계산된 번호를 표시
          displayNumber = getNumber(i, j);
        }

        cells.push(
          <td key={j} className="w-40 h-40 p-2 align-middle">
            <div
              className={`p-5 ${getBgColorClass(
                currentLockerInfo
              )} border border-gray-300 rounded-lg shadow-sm w-full h-full hover:border-green-500 hover:shadow-md transition-all duration-200`}
              onClick={() => {
                if (!form.del_yn) {
                  alert("표를 먼저 생성한 후 클릭해주세요.");
                  return;
                }

                // 기존 데이터가 있고, 폼이 변경되었을 경우
                if (form.locker_id > 0 && isFormChanged(form)) {
                  alert(
                    "기존의 사물함 정보와 다릅니다.\n표 수정 버튼을 누른 후 진행하세요."
                  );
                  return;
                }

                setModalToggle(true);
                setSelectedLocker({
                  locker_id: locker_id || 0,
                  locker_number:
                    form.sort_type === "FREE"
                      ? currentLockerInfo?.locker_number || 0
                      : (displayNumber as number),
                  free_position: i * cols + j + 1,
                });
              }}
            >
              <p className="text-gray-600 font-medium text-center">
                {displayNumber}
              </p>
              {currentLockerInfo?.locker_status === "OCCUPIED" ? (
                <>
                  <p className="mb-2 mt-5 text-gray-600 text-sm text-center">
                    이름 : {currentLockerInfo?.mem_name || ""}
                  </p>
                  <p className="mb-2 text-gray-600 text-sm text-center">
                    성별 :{" "}
                    {currentLockerInfo?.mem_gender
                      ? currentLockerInfo?.mem_gender == "W"
                        ? "여자"
                        : "남자"
                      : ""}
                  </p>
                </>
              ) : (
                <>
                  {currentLockerInfo?.locker_detail_memo && (
                    <div className="flex justify-center items-center w-full">
                      <p className="truncate mb-2 mt-5 text-gray-600 text-sm w-24 text-center">
                        {currentLockerInfo?.locker_detail_memo}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </td>
        );
      }
      tableRows.push(
        <tr key={i} className="h-24">
          {cells}
        </tr>
      );
    }

    return (
      <table className="border-collapse w-full text-sm text-left rtl:text-right text-gray-500">
        <tbody className="gap-4">{tableRows}</tbody>
      </table>
    );
  };

  useEffect(() => {
    if (!form.locker_gender) {
      updateLayoutForm(form.order_seq, "locker_gender", "W");
    }
  }, [form.order_seq]);

  return (
    <div key={idx + 1} className="">
      <table className="shadow-md w-full text-sm text-left rtl:text-right text-gray-500 my-4 bg-white rounded-lg">
        <tbody>
          <tr className="border-b border-gray-200">
            <th className="w-48 text-base text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4 rounded-tl-lg">
              <label htmlFor={`cols_label_00${form.order_seq}`}>가로</label>
            </th>
            <td className="w-1/3 p-2 flex items-center text-black">
              <input
                type="text"
                value={form.cols || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length > 3) {
                    e.preventDefault();
                    return;
                  }
                  if (value === "" || /^[1-9]\d{0,2}$/.test(value)) {
                    updateLayoutForm(
                      form.order_seq,
                      "cols",
                      Number(value) || 0
                    );
                  }
                }}
                className="w-24 px-2 py-1 border border-gray-300 rounded"
                maxLength={3}
                pattern="[1-9][0-9]{0,2}"
                placeholder="가로 입력"
                required
              />
            </td>
            <th className="w-48 text-base text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4">
              <label htmlFor={`rows_label_00${form.order_seq}`}>세로</label>
            </th>
            <td className="w-1/3 p-2 flex items-center text-black">
              <input
                type="text"
                value={form.rows || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length > 3) {
                    e.preventDefault();
                    return;
                  }
                  if (value === "" || /^[1-9]\d{0,2}$/.test(value)) {
                    updateLayoutForm(
                      form.order_seq,
                      "rows",
                      Number(value) || 0
                    );
                  }
                }}
                className="w-24 px-2 py-1 border border-gray-300 rounded"
                maxLength={3}
                pattern="[1-9][0-9]{0,2}"
                placeholder="세로 입력"
                required
              />
            </td>
          </tr>

          <tr className="border-b border-gray-200">
            <th className="w-48 text-base text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4">
              <label htmlFor={`locker_type_00${form.order_seq}`}>유형</label>
            </th>
            <td className="w-1/3 p-2 flex items-center text-black">
              <select
                id={`locker_type_00${form.order_seq}`}
                className="block w-32 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none cursor-pointer shadow-sm"
                value={form.locker_type}
                onChange={(e) =>
                  updateLayoutForm(
                    form.order_seq,
                    "locker_type",
                    e.target.value
                  )
                }
              >
                <option value="">선택</option>
                <option value="SHOES">신발장</option>
                <option value="CLOTHES">옷장</option>
                <option value="ETC">기타</option>
              </select>
            </td>
            <th className="w-48 text-base text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4">
              <span>성별</span>
            </th>
            <td className="w-1/3 p-2 flex items-center text-black">
              <div className="flex items-center gap-4">
                {genderOptions.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center whitespace-nowrap"
                  >
                    <input
                      id={`locker_gender_${form.order_seq}_${option.id}`}
                      type="radio"
                      value={option.value}
                      name={`locker_gender_${form.order_seq}`}
                      checked={
                        form.locker_gender
                          ? form.locker_gender === option.value
                          : option.value === "W"
                      }
                      onChange={(e) =>
                        updateLayoutForm(
                          form.order_seq,
                          "locker_gender",
                          e.target.value
                        )
                      }
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 focus:ring-2"
                    />
                    <label
                      htmlFor={`locker_gender_${form.order_seq}_${option.id}`}
                      className="ms-2 text-sm font-medium text-gray-900"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </td>
          </tr>

          <tr>
            <th className="w-48 text-base text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4">
              <label htmlFor={`memo_00${form.order_seq}`}>메모</label>
            </th>
            <td className="w-1/3 p-2">
              <input
                type="text"
                id={`memo_00${form.order_seq}`}
                className="w-full border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-4 py-2"
                maxLength={100}
                value={form.locker_memo || ""}
                onChange={(e) =>
                  updateLayoutForm(
                    form.order_seq,
                    "locker_memo",
                    e.target.value
                  )
                }
                placeholder="메모를 남길 수 있습니다."
              />
            </td>

            <th className="w-48 text-base text-center p-2 font-medium text-white  bg-custom-C4C4C4">
              <div className="flex items-center justify-center">
                <span>번호 정렬</span>
                <DescriptionPopover
                  tip={
                    "자유 입력 옵션을 선택할 경우 각각의 네모칸에 사물함 번호를 입력하여 자유롭게 사용할 수 있습니다."
                  }
                />
              </div>
            </th>
            <td className="w-1/3 p-2 text-black">
              <div className="flex items-center">
                <input
                  type="radio"
                  id={`free-${form.order_seq}`}
                  name={`sort-${form.order_seq}`}
                  value="FREE"
                  checked={form.sort_type === "FREE"}
                  onChange={(e) =>
                    updateLayoutForm(
                      form.order_seq,
                      "sort_type",
                      e.target.value
                    )
                  }
                  className="mr-2 w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 focus:ring-2"
                />
                <label htmlFor={`free-${form.order_seq}`} className="mr-2">
                  자유 입력
                </label>
                <input
                  type="radio"
                  id={`auto-${form.order_seq}`}
                  name={`sort-${form.order_seq}`}
                  value="auto"
                  checked={form.sort_type !== "FREE"}
                  onChange={(e) =>
                    updateLayoutForm(form.order_seq, "sort_type", "LEFT_TOP")
                  }
                  className="ml-2 w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 focus:ring-2"
                />
                <label htmlFor={`auto-${form.order_seq}`} className="ml-1 mr-3">
                  자동 정렬
                </label>

                {form.sort_type !== "FREE" && (
                  <div className="flex items-center gap-2">
                    <select
                      className="px-2 py-1 border border-gray-300 rounded"
                      value={form.sort_type}
                      onChange={(e) =>
                        updateLayoutForm(
                          form.order_seq,
                          "sort_type",
                          e.target.value
                        )
                      }
                    >
                      <option value="LEFT_TOP">좌측상단</option>
                      <option value="RIGHT_TOP">우측상단</option>
                      <option value="BOTTOM_LEFT">좌측하단</option>
                      <option value="BOTTOM_RIGHT">우측하단</option>
                    </select>

                    <select
                      className="px-2 py-1 border border-gray-300 rounded"
                      value={form.direction}
                      onChange={(e) =>
                        updateLayoutForm(
                          form.order_seq,
                          "direction",
                          e.target.value
                        )
                      }
                    >
                      {form.sort_type === "LEFT_TOP" && (
                        <>
                          <option value="RIGHT">오른쪽으로</option>
                          <option value="DOWN">아래로</option>
                        </>
                      )}
                      {form.sort_type === "RIGHT_TOP" && (
                        <>
                          <option value="LEFT">왼쪽으로</option>
                          <option value="DOWN">아래로</option>
                        </>
                      )}
                      {form.sort_type === "BOTTOM_LEFT" && (
                        <>
                          <option value="RIGHT">오른쪽으로</option>
                          <option value="UP">위로</option>
                        </>
                      )}
                      {form.sort_type === "BOTTOM_RIGHT" && (
                        <>
                          <option value="LEFT">왼쪽으로</option>
                          <option value="UP">위로</option>
                        </>
                      )}
                    </select>
                  </div>
                )}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="flex items-center gap-4 justify-end">
        <button
          type="button"
          onClick={handleSubmit(form.order_seq)}
          className="block rounded-2xl bg-green-600 px-4 py-1 text-center text-sm text-white font-extrabold shadow-sm hover:text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
        >
          표 {form?.del_yn == "N" ? "수정" : "생성"}
        </button>
        <button
          type="button"
          onClick={() => deleteLockerBas(form)}
          className="text-red-600 hover:text-red-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {(form.rows > 0 || form.cols > 0) && (
          <button
            type="button"
            onClick={() => toggleTable(form.order_seq)}
            className="text-gray-600 hover:text-gray-800 flex-col justify-items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-6 w-6 transition-transform duration-200 ${
                expandedTables[form.order_seq] ? "transform rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
            {expandedTables[form.order_seq] ? "표 접기" : "표 펼치기"}
          </button>
        )}
      </div>

      {(form.rows > 0 || form.cols > 0) && (
        <div
          className={`mt-4 ${
            expandedTables[form.order_seq] ? "block" : "hidden"
          }`}
        >
          {createTable(
            form.locker_id || 0,
            form.rows || 1, // rows가 0이면 1로 설정
            form.cols || 1 // cols가 0이면 1로 설정
          )}
        </div>
      )}
    </div>
  );
};

export default LockerForm;
