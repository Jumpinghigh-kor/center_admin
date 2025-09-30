import axios from "axios";
import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useUserStore } from "../store/store";
import dayjs from "dayjs";
import {
  calculatePercentage,
  convertAmount,
  convertDateMonth,
  convertDateYear,
} from "../utils/formatUtils";
import {
  GuidelineType,
  NoticeType,
  Sales,
  Target,
  UpdateLog,
} from "../utils/types";
import CardDetailButton from "../components/CardDetailButton";

const Home: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const [sales, setSales] = useState<Sales[]>([]);
  const [target, setTarget] = useState<Target>({
    target_amount_month: 0,
    target_amount_year: 0,
    target_members: 0,
  });
  const [activeMembers, setActiveMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [updateLogs, setUpdateLogs] = useState<UpdateLog[]>([]);
  const [notices, setNotices] = useState<NoticeType[]>([]);
  const [guidelines, setGuidelines] = useState<GuidelineType[]>([]);
  const [url, setUrl] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.post(
          `${process.env.REACT_APP_API_URL}/video`,
          {
            pl_type: "GUIDE",
          }
        );

        const playlist = res.data.result[0].pl_url;

        setUrl(playlist);
      } catch (e) {
        console.log(e);
      }
    };

    fetchData();
  }, []);

  const MAX_PERCENTAGE = 100;

  const current = dayjs().format("YYYY-MM");

  useEffect(() => {
    const getDatas = async () => {
      try {
        const getCenterResult = await axios.get(
          `${process.env.REACT_APP_API_URL}/center`,
          {
            params: user,
          }
        );
        setTarget(getCenterResult.data.result[0]);

        const fetchSales = await axios.get(
          `${process.env.REACT_APP_API_URL}/sales`,
          {
            params: user,
          }
        );

        setSales(fetchSales.data.result);

        const fetchMembers = await axios.get(
          `${process.env.REACT_APP_API_URL}/center/members`,
          {
            params: user,
          }
        );
        setActiveMembers(fetchMembers.data.result);

        const fetchUpdateLogs = await axios.get(
          `${process.env.REACT_APP_API_URL}/info`
        );
        setUpdateLogs(fetchUpdateLogs.data.updateLog);
        setNotices(fetchUpdateLogs.data.notice);
        setGuidelines(fetchUpdateLogs.data.guideline);

        if (user?.usr_role === "admin") {
          const fetchAllMembers = await axios.post(
            `${process.env.REACT_APP_API_URL}/member/allMemberList`,
            {
              params: {
                user: null,
                center_id: "",
                mem_name: "",
                mem_gender: "",
              },
            }
          );
          setAllMembers(fetchAllMembers.data.result);
        }
      } catch (err) {
        console.log(err);
      }
    };

    getDatas();
  }, [user]);

  return (
    <div className="p-3 sm:p-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <NavLink to={`/sales_month/${current}`}>
          <div className="h-auto p-6 flex flex-col bg-white border max-w-full border-gray-200 rounded-sm shadow hover:bg-gray-100">
            <span className="m-0 font-bold">
              {user?.usr_role === "admin"
                ? `전체 매장 ${convertDateMonth(current)}월 매출`
                : `${convertDateMonth(current)}월 매출`}
            </span>
            <span className="m-0 text-gray-400">
              목표 월 매출 : {convertAmount(target?.target_amount_month)}원
            </span>
            <span className="my-5 font-bold text-3xl">
              {sales[0]?.total_sum_month === null || undefined
                ? 0
                : convertAmount(sales[0]?.total_sum_month)}
              원
            </span>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-green-600 h-2.5 rounded-full"
                style={{
                  width: `${
                    calculatePercentage(
                      sales[0]?.total_sum_month,
                      target?.target_amount_month
                    ) > MAX_PERCENTAGE
                      ? MAX_PERCENTAGE
                      : calculatePercentage(
                          sales[0]?.total_sum_month,
                          target?.target_amount_month
                        )
                  }%`,
                }}
              ></div>
            </div>
            <CardDetailButton />
          </div>
        </NavLink>
        <NavLink to="/sales_year">
          <div className="h-auto p-6 flex flex-col bg-white border max-w-full border-gray-200 rounded-sm shadow hover:bg-gray-100">
            <span className="m-0 font-bold">
              {user?.usr_role === "admin"
                ? `전체 매장 ${convertDateYear(current)}년 연매출`
                : `${convertDateYear(current)}년 연매출`}
            </span>
            <span className="m-0 text-gray-400">
              목표 연 매출 : {convertAmount(target?.target_amount_year)}원
            </span>
            <span className="my-5 font-bold text-3xl">
              {sales[0]?.total_sum_year === null || undefined
                ? 0
                : convertAmount(sales[0]?.total_sum_year)}
              원
            </span>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-green-600 h-2.5 rounded-full"
                style={{
                  width: `${
                    calculatePercentage(
                      sales[0]?.total_sum_year,
                      target?.target_amount_year
                    ) > MAX_PERCENTAGE
                      ? MAX_PERCENTAGE
                      : calculatePercentage(
                          sales[0]?.total_sum_year,
                          target?.target_amount_year
                        )
                  }%`,
                }}
              ></div>
            </div>
            <CardDetailButton />
          </div>
        </NavLink>
        <NavLink to="/members">
          <div className="h-auto p-6 flex flex-col bg-white border max-w-full border-gray-200 rounded-sm shadow hover:bg-gray-100">
            <span className="m-0 font-bold">
              {user?.usr_role === "admin"
                ? "전체 매장 회원권 등록 회원수"
                : "회원권 등록 회원수"}
            </span>
            <span className="m-0 text-gray-400">
              목표 등록인원 수 : {target?.target_members}명
            </span>
            <span className="my-5 font-bold text-3xl">
              {activeMembers?.length}명
            </span>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-green-600 h-2.5 rounded-full"
                style={{
                  width: `${
                    calculatePercentage(
                      activeMembers?.length,
                      target?.target_members
                    ) > MAX_PERCENTAGE
                      ? MAX_PERCENTAGE
                      : calculatePercentage(
                          activeMembers?.length,
                          target?.target_members
                        )
                  }%`,
                }}
              ></div>
            </div>
            <CardDetailButton />
          </div>
        </NavLink>
        <NavLink to="/notice/update">
          <div
            className="h-auto p-6 bg-white border max-w-full border-gray-200 rounded-sm shadow
        hover:bg-gray-100 xl:col-span-2"
          >
            <h4 className="m-0 font-bold mb-2">업데이트</h4>
            <div className="flex flex-col">
              {updateLogs.map((log, index) => (
                <div className="flex" key={log.up_id}>
                  <span className="bg-custom-DFEDE0 text-center text-black text-sm font-medium min-w-28 me-2 px-2.5 py-2 mt-2 rounded">
                    {index === 0 && (
                      <span className="text-white bg-red-500 font-bold me-1 px-0.5 rounded">
                        N
                      </span>
                    )}
                    {log.up_ver}
                  </span>
                  <span className="bg-custom-DFEDE0 text-black w-full text-sm font-medium me-2 px-2.5 py-2 mt-2 rounded">
                    {log.up_desc.length > 55
                      ? `${log.up_desc.slice(0, 55)}...`
                      : log.up_desc}
                  </span>
                </div>
              ))}
            </div>
            <CardDetailButton />
          </div>
        </NavLink>
        <NavLink to="/notice/notice">
          <div className="h-auto p-6 bg-white border max-w-full border-gray-200 rounded-sm shadow hover:bg-gray-100">
            <h4 className="m-0 font-bold mb-2">공지사항</h4>
            <div className="flex flex-col">
              {notices.map((notice) => (
                <span
                  key={notice.no_id}
                  className={`bg-custom-E3F5FF text-black text-sm font-medium me-2 px-2.5 py-2 mt-2 rounded`}
                >
                  {notice.no_desc.length > 75
                    ? `${notice.no_desc.slice(0, 75)}...`
                    : notice.no_desc}
                </span>
              ))}
            </div>
            <CardDetailButton />
          </div>
        </NavLink>
        <NavLink to="/notice/guideline">
          <div className="h-auto p-6 bg-white border max-w-full border-gray-200 rounded-sm shadow hover:bg-gray-100">
            <h4 className="m-0 font-bold mb-2">안내사항</h4>
            <div className="flex flex-col">
              {guidelines.map((guideline) => (
                <span
                  key={guideline.gl_id}
                  className={`bg-custom-FFE6E6 text-black text-sm font-medium me-2 px-2.5 py-2 mt-2 rounded`}
                >
                  {guideline.gl_desc.length > 75
                    ? `${guideline.gl_desc.slice(0, 75)}...`
                    : guideline.gl_desc}
                </span>
              ))}
            </div>
            <CardDetailButton />
          </div>
        </NavLink>
        <NavLink
          target="_blank"
          to={`https://youtu.be/${url}`}
        >
          <div className="h-auto p-6 bg-white border max-w-full flex items-center border-gray-200 rounded-sm shadow hover:bg-gray-100">
            <div className="flex">
              <span className="m-0 font-bold">가이드 영상 보러 가기</span>
              <svg
                className="w-4 h-4 text-gray-800"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 14v4.833A1.166 1.166 0 0 1 16.833 20H5.167A1.167 1.167 0 0 1 4 18.833V7.167A1.166 1.166 0 0 1 5.167 6h4.618m4.447-2H20v5.768m-7.889 2.121 7.778-7.778"
                />
              </svg>
            </div>
            <span className="[&>svg]:h-6 [&>svg]:w-6 ml-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="red"
                viewBox="0 0 576 512"
              >
                <path d="M549.7 124.1c-6.3-23.7-24.8-42.3-48.3-48.6C458.8 64 288 64 288 64S117.2 64 74.6 75.5c-23.5 6.3-42 24.9-48.3 48.6-11.4 42.9-11.4 132.3-11.4 132.3s0 89.4 11.4 132.3c6.3 23.7 24.8 41.5 48.3 47.8C117.2 448 288 448 288 448s170.8 0 213.4-11.5c23.5-6.3 42-24.2 48.3-47.8 11.4-42.9 11.4-132.3 11.4-132.3s0-89.4-11.4-132.3zm-317.5 213.5V175.2l142.7 81.2-142.7 81.2z" />
              </svg>
            </span>
          </div>
        </NavLink>
        {user?.usr_role === "admin" && (
          <NavLink to="/members/allMemberList">
            <div className="h-auto p-6 flex flex-col bg-white border max-w-full border-gray-200 rounded-sm shadow hover:bg-gray-100">
              <span className="m-0 font-bold">전체 매장 회원</span>
              <span className="my-5 font-bold text-3xl">
                {allMembers?.length.toLocaleString()}명
              </span>
              <CardDetailButton />
            </div>
          </NavLink>
        )}
      </div>
    </div>
  );
};

export default Home;
