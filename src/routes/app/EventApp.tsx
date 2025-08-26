import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../store/store";
import Pagination from "../../components/Pagination";
import { usePagination } from "../../hooks/usePagination";
import EventAppModal from "../../components/app/EventAppModal";

interface EventApp {
  event_app_id: number;
  title: string;
  use_yn: string;
  del_yn: string;
  reg_dt: string;
  navigation_path: string;
}

const EventApp: React.FC = () => {
  const navigate = useNavigate();
  const [eventList, setEventList] = useState<EventApp[]>([]);
  const user = useUserStore((state) => state.user);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedEventForModal, setSelectedEventForModal] =
    useState<EventApp | null>(null);

  // 페이지네이션 훅 사용
  const pagination = usePagination({
    totalItems: eventList.length,
    itemsPerPage: 10,
  });

  // 현재 페이지에 표시할 데이터
  const currentEvents = pagination.getCurrentPageData(eventList);

  // 리뷰 목록 불러오기
  const selectEventAppList = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/eventApp/selectEventAppList`
      );
      
      setEventList(response.data.result);
      pagination.resetPage(); // 데이터 새로고침 시 첫 페이지로 리셋
    } catch (err) {
      console.error("이벤트 목록 로딩 오류:", err);
    } finally {
    }
  };

  useEffect(() => {
    if (user && user.index) {
      selectEventAppList();
    }
  }, [user]);

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">이벤트 관리</h2>
          <button
            onClick={() => {
              setSelectedEventForModal(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            등록
          </button>
        </div>

        {eventList.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>등록된 이벤트가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="w-full h-16 border-b border-gray-200">
                    <th className="text-center pl-4 whitespace-nowrap">번호</th>
                    <th className="text-center whitespace-nowrap">제목</th>
                    <th className="text-center whitespace-nowrap hidden md:table-cell">
                      사용 여부
                    </th>
                    <th className="text-center whitespace-nowrap hidden md:table-cell">
                      등록일
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentEvents?.map((event, index) => (
                    <tr
                      key={event.event_app_id}
                      className="h-16 border-b border-gray-200 hover:bg-gray-50"
                      onClick={() => {}}
                      onDoubleClick={() => {
                        setSelectedEventForModal(event);
                        setIsModalOpen(true);
                      }}
                    >
                      <td className="pl-4 text-center">
                          {eventList.length - (pagination.startIndex + index)}
                      </td>
                      <td className="text-center px-2 truncate">
                        {event.title}
                      </td>
                      <td className="text-center px-2 truncate">
                          {event.use_yn === 'Y' ? '사용' : '미사용'}
                      </td>
                      <td className="text-center whitespace-nowrap">
                        {event.reg_dt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            <Pagination
              currentPage={pagination.currentPage}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={pagination.handlePageChange}
            />
          </>
        )}
      </div>

      <EventAppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          selectEventAppList();
        }}
        selectedEvent={selectedEventForModal}
      />
    </>
  );
};

export default EventApp;
