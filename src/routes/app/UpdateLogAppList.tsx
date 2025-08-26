import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUserStore } from "../../store/store";
import UpdateLogAppModal from "../../components/app/UpdateLogAppModal";

interface UpdateLogApp {
  upAppId: number;
  upAppVersion: number;
  upAppDesc: string;
  delYn: "Y" | "N";
  regDt: string;
  regId: string;
  modDt: string;
  modId: string;
}

const UpdateLogAppList: React.FC = () => {
  const [updateLogList, setUpdateLogList] = useState<UpdateLogApp[]>([]);
  const user = useUserStore((state) => state.user);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedUpdateLog, setSelectedUpdateLog] = useState<number[]>([]);
  const [selectedLogForModal, setSelectedLogForModal] = useState<UpdateLogApp | null>(null);

  // 업데이트 로그 목록 불러오기
  const fetchUpdateLog = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/updateLogApp/selectUpdateLogAppList`
      );

      const updateLogWithVisibility = response.data.map(
        (updateLog: UpdateLogApp) => ({
          ...updateLog,
        })
      );

      setUpdateLogList(updateLogWithVisibility);
      // 체크박스 선택 초기화
      setSelectedUpdateLog([]);
    } catch (err) {
      console.error("업데이트 로그 목록 로딩 오류:", err);
    }
  };

  useEffect(() => {
    fetchUpdateLog();
  }, []);

  // 업데이트 로그 등록 모달 열기
  const handleRegisterClick = () => {
    setSelectedUpdateLog([]);
    setIsModalOpen(true);
  };

  // 업데이트 로그 등록 성공 후 처리
  const handleUpdateLogRegistered = () => {
    setIsModalOpen(false);
    // 업데이트 로그 목록 새로고침
    fetchUpdateLog();
  };

  // 일괄 삭제 처리
  const handleBatchDelete = async () => {
    if (selectedUpdateLog.length === 0) {
      alert("삭제할 업데이트 로그를 선택해주세요.");
      return;
    }

    if (window.confirm("선택한 업데이트 로그들을 삭제하시겠습니까?")) {
      try {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/app/updateLogApp/batchDeleteUpdateLogApp`,
          {
            updateLogAppIds: selectedUpdateLog,
            userId: user.index,
          }
        );

        // 목록 새로고침
        fetchUpdateLog();
        alert("선택한 업데이트 로그들이 삭제되었습니다.");
      } catch (err) {
        console.error("업데이트 로그 일괄 삭제 오류:", err);
        alert("업데이트 로그 일괄 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  // 체크박스 상태 변경 핸들러
  const handleCheckboxChange = (updateLogAppId: number) => {
    setSelectedUpdateLog((prev) => {
      if (prev.includes(updateLogAppId)) {
        return prev.filter((id) => id !== updateLogAppId);
      } else {
        return [...prev, updateLogAppId];
      }
    });
  };

  // 전체 선택 체크박스 핸들러
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // 모든 배너 ID 선택
      const allUpdateLogIds = updateLogList.map(
        (updateLog) => updateLog.upAppId
      );
      setSelectedUpdateLog(allUpdateLogIds);
    } else {
      // 선택 초기화
      setSelectedUpdateLog([]);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">업데이트 로그 관리</h2>
          <div className="flex gap-2">
            <button
              onClick={handleBatchDelete}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              삭제
            </button>
            <button
              onClick={handleRegisterClick}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              등록
            </button>
          </div>
        </div>

        {updateLogList?.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>등록된 업데이트 로그가 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="w-full h-16 border-b border-gray-200">
                  <th className="text-center px-4 w-12">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 cursor-pointer"
                      onChange={handleSelectAll}
                      checked={
                        selectedUpdateLog.length === updateLogList.length &&
                        updateLogList.length > 0
                      }
                    />
                  </th>
                  <th className="text-center pl-4 whitespace-nowrap">번호</th>
                  <th className="text-center whitespace-nowrap">버전</th>
                  <th className="text-center whitespace-nowrap hidden md:table-cell">
                    내용
                  </th>
                  <th className="text-center whitespace-nowrap">등록일</th>
                  <th className="text-center whitespace-nowrap">수정일</th>
                </tr>
              </thead>
              <tbody>
                {updateLogList.map((updateLog, index) => (
                  <tr
                    key={updateLog.upAppId}
                    className="h-16 border-b border-gray-200 hover:bg-gray-50"
                    onClick={() => {}}
                    onDoubleClick={() => {
                      setSelectedLogForModal(updateLog);
                      setIsModalOpen(true);
                    }}
                  >
                    <td
                      className="px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                      onDoubleClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 cursor-pointer"
                        checked={selectedUpdateLog.includes(updateLog.upAppId)}
                        onChange={() => handleCheckboxChange(updateLog.upAppId)}
                      />
                    </td>
                    <td className="pl-4 text-center">{updateLogList?.length - index}</td>
                    <td className="text-center px-2 max-w-[150px] truncate hidden md:table-cell">
                      {updateLog.upAppVersion}
                    </td>
                    <td className="text-center px-2 max-w-[50px] md:max-w-[70px] truncate">
                      {updateLog.upAppDesc}
                    </td>
                    <td className="text-center whitespace-nowrap">
                      {updateLog.regDt ? updateLog.regDt : '-'}
                    </td>
                    <td className="text-center whitespace-nowrap text-xs md:text-sm">
                      {updateLog.modDt ? updateLog.modDt : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 배너 등록 모달 */}
      <UpdateLogAppModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLogForModal(null);
        }}
        onSuccess={handleUpdateLogRegistered}
        selectedUpdateLog={
          selectedUpdateLog.length > 0
            ? updateLogList.find(
                (log) => log.upAppId === selectedUpdateLog[0]
              ) || selectedLogForModal
            : selectedLogForModal
        }
      />
    </>
  );
};

export default UpdateLogAppList;
