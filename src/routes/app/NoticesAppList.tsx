import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../store/store";
import NoticesAppModal from "../../components/app/NoticesAppModal";

interface NoticesApp {
  noticesAppId: number;
  noticesType: string;
  title: string;
  content: string;
  viewYn: "Y" | "N";
  delYn: "Y" | "N";
  regDate: string;
  modDate: string;
}

const NoticesAppList: React.FC = () => {
  const [noticesList, setNoticesList] = useState<NoticesApp[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const user = useUserStore((state) => state.user);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedNotices, setSelectedNotices] = useState<number[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<NoticesApp | null>(null);

  // 공지사항 목록 불러오기
  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/noticesApp/selectNoticesAppList`
      );

      setNoticesList(response.data);
      setError(null);
      // 체크박스 선택 초기화
      setSelectedNotices([]);
    } catch (err) {
      console.error("공지사항 목록 로딩 오류:", err);
      setError("공지사항 목록을 불러오는 도중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 공지사항 목록 불러오기
  useEffect(() => {
    fetchNotices();
  }, []);

  // 공지사항 등록 모달 열기
  const handleRegisterClick = () => {
    setSelectedNotice(null);
    setIsModalOpen(true);
  };

  // 공지사항 등록 성공 후 처리
  const handleNoticesRegistered = () => {
    setIsModalOpen(false);
    // 공지사항 목록 새로고침
    fetchNotices();
  };

  // 일괄 삭제 처리
  const handleBatchDelete = async () => {
    if (selectedNotices.length === 0) {
      alert("삭제할 공지사항을 선택해주세요.");
      return;
    }

    if (window.confirm("선택한 공지사항들을 삭제하시겠습니까?")) {
      try {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/app/noticesApp/batchDeleteNoticesApp`,
          {
            noticesAppIds: selectedNotices,
            userId: user.index,
          }
        );

        // 목록 새로고침
        fetchNotices();
        alert("선택한 공지사항들이 삭제되었습니다.");
      } catch (err) {
        console.error("공지사항 일괄 삭제 오류:", err);
        alert("공지사항 일괄 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  // 체크박스 상태 변경 핸들러
  const handleCheckboxChange = (noticesAppId: number) => {
    setSelectedNotices((prev) => {
      if (prev.includes(noticesAppId)) {
        return prev.filter((id) => id !== noticesAppId);
      } else {
        return [...prev, noticesAppId];
      }
    });
  };

  // 전체 선택 체크박스 핸들러
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // 모든 배너 ID 선택
      const allNoticesIds = noticesList.map((notice) => notice.noticesAppId);
      setSelectedNotices(allNoticesIds);
    } else {
      // 선택 초기화
      setSelectedNotices([]);
    }
  };

  // 날짜 형식 변환 (YYYYMMDDHHMMSS -> YYYY-MM-DD HH:MM:SS)
  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr.length !== 14) return dateStr;

    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(8, 10);
    const minute = dateStr.substring(10, 12);
    const second = dateStr.substring(12, 14);

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  };

  if (loading) {
    return <div className="text-center py-10">로딩 중...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">공지사항 관리</h2>
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

        {noticesList?.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>등록된 공지사항이 없습니다.</p>
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
                        selectedNotices.length === noticesList.length &&
                        noticesList.length > 0
                      }
                    />
                  </th>
                  <th className="text-center pl-4 whitespace-nowrap">번호</th>
                  <th className="text-center whitespace-nowrap">유형</th>
                  <th className="text-center whitespace-nowrap">제목</th>
                  <th className="text-center whitespace-nowrap hidden md:table-cell">
                    내용
                  </th>
                  <th className="text-center whitespace-nowrap hidden md:table-cell">
                    전시 여부
                  </th>
                  <th className="text-center whitespace-nowrap">등록일</th>
                  <th className="text-center whitespace-nowrap">수정일</th>
                </tr>
              </thead>
              <tbody>
                {noticesList.map((notice, index) => (
                  <tr
                    key={notice.noticesAppId}
                    className="h-16 border-b border-gray-200 hover:bg-gray-50"
                    onClick={() => setSelectedNotice(notice)}
                    onDoubleClick={() => {
                      setSelectedNotice(notice);
                      setIsModalOpen(true);
                    }}
                  >
                    <td
                      className="px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 cursor-pointer"
                        checked={selectedNotices.includes(notice.noticesAppId)}
                        onChange={() =>
                          handleCheckboxChange(notice.noticesAppId)
                        }
                      />
                    </td>
                    <td className="pl-4 text-center">{noticesList?.length - index}</td>
                    <td className="text-center px-2 max-w-[150px] truncate hidden md:table-cell">
                      {notice.noticesType === "NOTICE"
                        ? "공지"
                        : notice.noticesType === "EVENT"
                        ? "이벤트"
                        : "가이드"}
                    </td>
                    <td className="text-center px-2 max-w-[50px] md:max-w-[70px] truncate">
                      {notice.title}
                    </td>
                    <td className="text-center px-2 max-w-[50px] md:max-w-[70px] truncate">
                      {notice.content}
                    </td>
                    <td className="text-center whitespace-nowrap">
                      {notice.viewYn === "Y" ? "전시" : "미전시"}
                    </td>
                    <td className="text-center whitespace-nowrap text-xs md:text-sm">
                      {formatDate(notice.regDate)}
                    </td>
                    <td className="text-center whitespace-nowrap text-xs md:text-sm">
                      {formatDate(notice.modDate)
                        ? formatDate(notice.modDate)
                        : "-"}
                      <button
                        className="ml-2 md:hidden bg-gray-200 text-xs rounded px-1 py-0.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNotice(notice);
                          setIsModalOpen(true);
                        }}
                      >
                        상세
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 배너 등록 모달 */}
      <NoticesAppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleNoticesRegistered}
        selectedNotice={selectedNotice}
      />
    </>
  );
};

export default NoticesAppList;
