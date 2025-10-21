import React, { useCallback, useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSidebarStore, useUserStore } from "../store/store";
import axios from "axios";
import "./../styles/Navbar.css";
import { convertDateWithoutYear } from "../utils/formatUtils";
import { Notification } from "../utils/types";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useUserStore((state) => state.user);
  const [sidebar, setSideBar] = useSidebarStore((state) => [
    state.sidebar,
    state.setSidebar,
  ]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotification, setShowNotification] = useState<Boolean>();
  const target = location.pathname.startsWith("/app") ? "/" : "/app";

  const UNREAD_NOTIFICATION_COUNT = notifications.filter(
    (not) => not.not_is_read === 0
  ).length;

  const readNotification = useCallback(
    async (not_id: number, not_type: string) => {
      try {
        await axios.patch(
          `${process.env.REACT_APP_API_URL}/notification/${not_id}`
        );
        setShowNotification(false);
        if (not_type === "만료 알림") {
          if (location.pathname === "/members") {
            return window.location.reload();
          }
          navigate("/members");
        } else if (not_type === "답변 알림") {
          navigate("/inquiry");
        } else if (not_type && not_type.includes("예약")) {
          if (location.pathname.startsWith("/app")) {
            navigate("/app/reservation");
          } else {
            navigate("/members/reservation");
          }
        }
      } catch (e) {
        console.log(e);
      }
    },
    [navigate, location]
  );

  useEffect(() => {
    const getNotifications = async () => {
      try {
        const result = await axios.get(
          `${process.env.REACT_APP_API_URL}/notification/${user?.center_id}`
        );
        setNotifications(result.data.result);
      } catch (e) {
        console.log(e);
      }
    };
    getNotifications();
  }, [user?.center_id, readNotification]);

  const isAppSection = location.pathname.startsWith("/app");
  return (
    <nav className="bg-transparent">
      <div className={`${isAppSection ? 'ml-16 md:ml-64' : ''} bg-custom-393939`}>
        <div className="mx-auto px-3 sm:px-10">
          <div className="relative flex h-16 items-center">
            <div className="flex flex-1 items-center sm:justify-start">
              <div className="flex items-center pr-2 sm:pr-0">
                <button
                  type="button"
                  className="items-center justify-center w-10 h-10 text-sm rounded-lg text-gray-100 focus:outline-none"
                  aria-controls="navbar-hamburger"
                  aria-expanded="false"
                  onClick={() => setSideBar(!sidebar)}
                >
                  <svg
                    className="w-6 h-6"
                    aria-hidden="true"
                    fill="none"
                    viewBox="0 0 17 14"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M1 1h15M1 7h15M1 13h15"
                    />
                  </svg>
                </button>
                <span className="flex">
                  <button
                    onClick={() => setShowNotification(!showNotification)}
                    className="flex"
                  >
                    <svg
                      className="items-center justify-center w-8 h-8 rounded-lg text-gray-100 focus:outline-none"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 5.365V3m0 2.365a5.338 5.338 0 0 1 5.133 5.368v1.8c0 2.386 1.867 2.982 1.867 4.175 0 .593 0 1.292-.538 1.292H5.538C5 18 5 17.301 5 16.708c0-1.193 1.867-1.789 1.867-4.175v-1.8A5.338 5.338 0 0 1 12 5.365ZM8.733 18c.094.852.306 1.54.944 2.112a3.48 3.48 0 0 0 4.646 0c.638-.572 1.236-1.26 1.33-2.112h-6.92Z"
                      />
                    </svg>
                    {UNREAD_NOTIFICATION_COUNT === 0 ? null : (
                      <span className="bg-green-600 text-white text-xs py-0.5 px-1.5 rounded-full absolute ml-4 -mt-0.5">
                        {UNREAD_NOTIFICATION_COUNT}
                      </span>
                    )}
                  </button>
                  {showNotification ? (
                    <div className="notify-modal bg-custom-E8E8E8 absolute p-3 mt-10 w-80 h-96 z-30 rounded-xl border-custom-727272 shadow-lg overflow-scroll">
                      <span className="font-bold flex py-2">알림</span>
                      {notifications.length === 0 ? (
                        <span className="text-gray-500 flex justify-center h-80 items-center">
                          알림이 없습니다.
                        </span>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            className={`${
                              notification.not_is_read === 0
                                ? "bg-white hover:bg-gray-100"
                                : "bg-white text-gray-500"
                            } w-full p-4 my-2 flex rounded-xl cursor-pointer`}
                            key={notification.not_id}
                            onClick={() =>
                              readNotification(
                                notification.not_id,
                                notification.not_type
                              )
                            }
                          >
                            <div className="flex flex-col">
                              <div className="flex justify-between">
                                <span
                                  className={`${
                                    notification.not_is_read === 0
                                      ? "text-green-600"
                                      : "text-gray-500"
                                  } font-bold`}
                                >
                                  {notification.not_title}
                                </span>
                                <span className="text-sm">
                                  {convertDateWithoutYear(
                                    notification.not_created_at
                                  )}
                                </span>
                              </div>
                              <span className="text-sm">
                                {notification.not_message}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : null}
                </span>
              </div>
            </div>

            {/* <NavLink to={target}> */}
            <NavLink to="/">
              <div className="flex items-center justify-center">
                {/* <p className="text-white mr-4">[ {location.pathname.startsWith("/app") ? "점핑하이 관리로 이동" : "회원 어플 관리로 이동"}]</p> */}
                <span className="text-white font-bold">JUMPING-HIGH</span>
              </div>
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
