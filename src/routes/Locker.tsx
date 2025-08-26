import React, { useCallback, useEffect, useState } from "react";
import { useUserStore } from "../store/store";
import axios from "axios";
import LockerForm from "../components/LockerForm";
import LockerModal from "../components/LockerModal";
import { LockerBasData, LockerType, LockerDetail } from "../utils/types";

const Locker: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const [lockerDetail, setLockerDetail] = useState<LockerDetail[]>([]);
  const [modalToggle, setModalToggle] = useState<boolean>(false);
  const [expandedTables, setExpandedTables] = useState<{
    [key: number]: boolean;
  }>({});
  const [selectedLocker, setSelectedLocker] = useState<{
    locker_id: number;
    locker_number: number;
    free_position: number;
  }>({
    locker_id: 0,
    locker_number: 0,
    free_position: 0,
  });
  const [lockerForms, setLockerForms] = useState<LockerType[]>([
    {
      order_seq: 1,
      locker_id: 0,
      center_id: user?.center_id,
      rows: 0,
      cols: 0,
      locker_type: "",
      locker_memo: "",
      locker_gender: "",
      array_type: "FREE",
      array_form: "",
      array_direction: "",
      del_yn: "",
      table: null,
      sort_type: "FREE",
      direction: "RIGHT",
    },
  ]);
  const [lockerBasData, setLockerBasData] = useState<LockerBasData[]>([]);

  // 테이블 펼치기/접기
  const toggleTable = useCallback((orderSeq: number) => {
    setExpandedTables((prev) => ({
      ...prev,
      [orderSeq]: !prev[orderSeq],
    }));
  }, []);

  // 입력 폼 추가
  const addLayoutForm = () => {
    if (lockerForms.length >= 7) {
      alert("최대 7개까지만 추가할 수 있습니다.");
      return;
    }

    const lastForm = lockerForms[lockerForms.length - 1];
    const newOrderSeq = lastForm ? lastForm.order_seq + 1 : 1;

    const newForm: LockerType = {
      order_seq: newOrderSeq,
      locker_id: 0,
      center_id: user?.center_id,
      rows: 0,
      cols: 0,
      locker_type: "",
      locker_memo: "",
      locker_gender: "W",
      array_type: "FREE",
      array_form: "",
      array_direction: "",
      del_yn: "",
      table: null,
      sort_type: "FREE",
      direction: "RIGHT",
    };

    setLockerForms((prevForms) => [...prevForms, newForm]);

    // 새로 추가된 표의 expandedTables 상태를 true로 설정
    setExpandedTables((prev) => ({
      ...prev,
      [newOrderSeq]: true,
    }));
  };

  // 입력 폼 삭제
  const deleteLayoutForm = (orderSeq: number) => {
    setLockerForms((prevForms) => {
      const updatedForms = prevForms.filter(
        (form) => form.order_seq !== orderSeq
      );
      return updatedForms.map((form, index) => ({
        ...form,
        order_seq: index + 1,
      }));
    });
  };

  // 입력 폼 수정
  const generateSortedNumbers = (
    rows: number,
    cols: number,
    sortType: string
  ): number[][] => {
    const total = rows * cols;
    let numbers: number[] = Array.from({ length: total }, (_, i) => i + 1);

    const result: number[][] = Array(rows)
      .fill(0)
      .map(() => Array(cols).fill(0));

    switch (sortType) {
      case "LEFT_TOP":
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            result[i][j] = numbers[i * cols + j];
          }
        }
        break;
      case "RIGHT_TOP":
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            result[i][cols - 1 - j] = numbers[i * cols + j];
          }
        }
        break;
      case "BOTTOM_LEFT":
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            result[rows - 1 - i][j] = numbers[i * cols + j];
          }
        }
        break;
      case "BOTTOM_RIGHT":
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            result[rows - 1 - i][cols - 1 - j] = numbers[i * cols + j];
          }
        }
        break;
      default:
        return result;
    }

    return result;
  };

  const updateLayoutForm = (
    orderSeq: number,
    field: keyof LockerType,
    value: number | string
  ) => {
    setLockerForms((prevForms) =>
      prevForms.map((form) => {
        if (form.order_seq === orderSeq) {
          const updatedForm = { ...form, [field]: value };

          // sort_type이 변경될 때 기본 direction과 array 관련 값들 설정
          if (field === "sort_type") {
            switch (value) {
              case "LEFT_TOP":
                updatedForm.direction = "RIGHT";
                updatedForm.array_type = "AUTO";
                updatedForm.array_form = "LEFT_TOP";
                updatedForm.array_direction = "RIGHT";
                break;
              case "RIGHT_TOP":
                updatedForm.direction = "LEFT";
                updatedForm.array_type = "AUTO";
                updatedForm.array_form = "RIGHT_TOP";
                updatedForm.array_direction = "LEFT";
                break;
              case "BOTTOM_LEFT":
                updatedForm.direction = "RIGHT";
                updatedForm.array_type = "AUTO";
                updatedForm.array_form = "BOTTOM_LEFT";
                updatedForm.array_direction = "RIGHT";
                break;
              case "BOTTOM_RIGHT":
                updatedForm.direction = "LEFT";
                updatedForm.array_type = "AUTO";
                updatedForm.array_form = "BOTTOM_RIGHT";
                updatedForm.array_direction = "LEFT";
                break;
              case "FREE":
                updatedForm.array_type = "FREE";
                updatedForm.array_form = "";
                updatedForm.array_direction = "";
                break;
            }
          }

          // direction이 변경될 때 array_direction 업데이트
          if (field === "direction") {
            updatedForm.array_direction = value as string;
          }

          return updatedForm;
        }
        return form;
      })
    );
  };

  // 등록 버튼
  const handleSubmit = (formId: number) => async (e: React.FormEvent) => {
    e.preventDefault();
    const form = lockerForms.find((f) => f.order_seq === formId);
    const originalData = lockerBasData.find(
      (bas) => bas.locker_id === form?.locker_id
    );

    if (form && form.rows > 0 && form.cols > 0 && form.locker_type) {
      // 정렬 방식이 변경되었을 때만 confirm 창 표시
      if (
        originalData &&
        ((originalData.array_type === "AUTO" && form.sort_type === "FREE") ||
          (originalData.array_type === "FREE" && form.sort_type !== "FREE"))
      ) {
        const confirmed = window.confirm(
          "기존에 저장했던 사물함 정보는 삭제됩니다. 표 수정을 진행하시겠습니까?"
        );
        if (!confirmed) return;

        // 확인을 눌렀을 때는 바로 modifyLockerBas 호출
        await modifyLockerBas(form, true); // true는 confirm 창을 띄우지 않는다는 의미
      } else {
        // 정렬 방식이 변경되지 않았을 때는 일반적인 confirm 창 표시
        await modifyLockerBas(form, false);
      }

      setLockerForms((prevForms) =>
        prevForms.map((f) => {
          if (f.order_seq === formId) {
            return {
              ...f,
              table: true as const,
            };
          }
          return f;
        })
      );
    } else {
      alert("가로, 세로, 유형을 입력해주세요.");
    }
  };

  // 테이블 저장 및 수정
  const modifyLockerBas = useCallback(
    async (formData: LockerType, skipConfirm: boolean = false) => {
      // skipConfirm이 false일 때만 confirm 창 표시
      if (!skipConfirm) {
        const doDelete = window.confirm(
          `표를 ${formData?.del_yn == "N" ? "수정" : "등록"} 하시겠습니까?`
        );
        if (!doDelete) return;
      }

      try {
        const requestData = {
          locker_id: formData.locker_id,
          locker_type: formData.locker_type,
          locker_memo: formData.locker_memo,
          locker_gender: formData.locker_gender,
          array_type: formData.sort_type === "FREE" ? "FREE" : "AUTO",
          array_form: formData.sort_type === "FREE" ? "" : formData.sort_type,
          array_direction: formData.direction,
          rows: formData.rows,
          cols: formData.cols,
          center_id: user?.center_id,
          usr_id: user?.usr_id,
        };

        console.log("Request data:", requestData);

        await axios.post(
          `${process.env.REACT_APP_API_URL}/locker/modifyLockerBas`,
          requestData
        );

        alert(
          `사물함 표가 ${formData?.del_yn == "N" ? "수정" : "등록"}되었습니다.`
        );

        const detailResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/locker/getLockerDetail`,
          {
            params: user,
          }
        );
        setLockerDetail(detailResponse.data.result);
        setExpandedTables((prev) => ({
          ...prev,
          [formData.order_seq]: true,
        }));
      } catch (e) {
        console.log(e);
      }
    },
    [lockerForms]
  );

  // 테이블 삭제
  const deleteLockerBas = useCallback(
    async (formData: LockerBasData) => {
      if (formData?.locker_id > 0) {
        if (formData) {
          const doDelete = window.confirm("사물함 표를 삭제하시겠습니까?");
          if (!doDelete) return;
        }
      }

      try {
        await axios.patch(
          `${process.env.REACT_APP_API_URL}/locker/deleteLockerBas`,
          { locker_id: formData.locker_id, usr_id: user?.center_id }
        );

        if (formData?.locker_id > 0) {
          alert("사물함 표가 삭제되었습니다.");
        }

        deleteLayoutForm(formData?.order_seq);
      } catch (e) {
        console.log(e);
      }
    },
    [lockerForms]
  );

  // 로커 상세 정보 조회
  useEffect(() => {
    const getLockerDetail = async () => {
      try {
        const detailResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/locker/getLockerDetail`,
          {
            params: user,
          }
        );
        setLockerDetail(detailResponse.data.result);
      } catch (error) {
        console.error(error);
      }
    };

    getLockerDetail();
  }, [user]);

  // 로커 기본 정보 조회
  useEffect(() => {
    const getLockerBas = async () => {
      try {
        const basResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/locker/getLockerBas`,
          {
            params: user,
          }
        );
        const lockerDataList = basResponse.data.result;
        setLockerBasData(lockerDataList);

        if (lockerDataList && lockerDataList.length > 0) {
          const initialForms = lockerDataList.map(
            (item: LockerBasData, index: number) => {
              // array_type에 따른 sort_type과 direction 설정
              let sort_type: LockerType["sort_type"] = "FREE";
              let direction: LockerType["direction"] = "RIGHT";

              if (item.array_type === "AUTO") {
                // array_form과 array_direction 값을 기반으로 sort_type과 direction 설정
                sort_type = item.array_form as LockerType["sort_type"];
                direction = item.array_direction as LockerType["direction"];
              }

              return {
                order_seq: index + 1,
                locker_id: item.locker_id,
                center_id: item.center_id,
                rows: item.rows,
                cols: item.cols,
                locker_type: item.locker_type,
                locker_memo: item.locker_memo,
                locker_gender: item.locker_gender,
                array_type: item.array_type,
                array_form: item.array_form,
                array_direction: item.array_direction,
                del_yn: item.del_yn,
                table: true,
                sort_type, // 계산된 sort_type 사용
                direction, // 계산된 direction 사용
              };
            }
          );
          setLockerForms(initialForms);
        }
      } catch (error) {
        console.error(error);
      }
    };

    getLockerBas();
  }, [user, lockerDetail]);

  // 기본정보 재렌더링 함수
  const refreshLockerData = useCallback(async () => {
    try {
      const detailResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/locker/getLockerDetail`,
        {
          params: user,
        }
      );
      setLockerDetail(detailResponse.data.result);
    } catch (error) {
      console.error(error);
    }
  }, [user]);

  // lockerForms가 업데이트될 때마다 expandedTables도 업데이트
  useEffect(() => {
    const initialExpandedState = lockerForms.reduce((acc, form) => {
      return {
        ...acc,
        [form.order_seq]: true, // 모든 폼을 펼친 상태로 초기화
      };
    }, {});
    setExpandedTables(initialExpandedState);
  }, [lockerForms]);

  return (
    <div className="p-3 sm:p-10">
      <div className="flex justify-between">
        <span className="font-bold text-xl">사물함 관리</span>

        <div className="ml-auto mr-10 flex items-center gap-4">
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 border border-gray-300 rounded-md" />
            <p className="text-center text-sm text-gray-700">사용 가능</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-green-300 w-7 h-7 rounded-md" />
            <p className="text-center text-sm text-gray-700">사용중</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-gray-300 w-7 h-7 rounded-md" />
            <p className="text-center text-sm text-gray-700">사용 불가</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-red-300 w-7 h-7 border rounded-md" />
            <p className="text-center text-sm text-gray-700">점주 전용</p>
          </div>
        </div>

        <button
          onClick={addLayoutForm}
          className="block rounded-2xl bg-green-600 px-4 py-1 text-center text-sm text-white font-extrabold shadow-sm hover:text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
        >
          표 추가
        </button>
      </div>

      <div className="mt-10 space-y-8">
        {lockerForms.map((form, idx) => (
          <LockerForm
            key={idx}
            form={form}
            idx={idx}
            expandedTables={expandedTables}
            lockerDetail={lockerDetail}
            lockerBasData={lockerBasData}
            updateLayoutForm={updateLayoutForm}
            handleSubmit={handleSubmit}
            deleteLockerBas={deleteLockerBas}
            toggleTable={toggleTable}
            setModalToggle={setModalToggle}
            setSelectedLocker={setSelectedLocker}
          />
        ))}
      </div>

      {/* 모달은 여기서만 렌더링 */}
      {modalToggle && (
        <LockerModal
          modalOpen={modalToggle}
          setModalToggle={setModalToggle}
          center_id={user?.center_id || 0}
          locker_id={selectedLocker.locker_id}
          locker_number={selectedLocker.locker_number}
          onSuccess={refreshLockerData}
          form={
            lockerForms.find((f) => f.locker_id === selectedLocker.locker_id)!
          }
          free_position={selectedLocker.free_position}
        />
      )}
    </div>
  );
};

export default Locker;
