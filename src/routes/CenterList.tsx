import axios from "axios";
import React, { useEffect, useState } from "react";
import { useUserStore } from "../store/store";
import {
  convertAmount,
  convertDateMonth,
  convertDateYear,
} from "../utils/formatUtils";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { Center } from "../utils/types";

const CenterList: React.FC = () => {
  const current = dayjs().format("YYYY-MM");
  const [centers, setCenters] = useState<Center[]>([]);
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.usr_role !== "admin") {
      return navigate("/");
    }

    const getData = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/center/list`,
          {
            params: user,
          }
        );
        setCenters(res.data.result);
      } catch (e) {
        console.log(e);
      }
    };
    getData();
  }, [user, navigate]);

  return (
    <div className="p-3 sm:p-10">
      <div className="flex flex-col">
        <span className="font-bold text-xl">전체 센터 리스트</span>
      </div>
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg my-4">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500">
          <thead className="text-xs text-white font-bold uppercase bg-custom-C4C4C4">
            <tr>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                ID
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                센터명
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                {`${convertDateMonth(current)}월 매출`}
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                {`${convertDateYear(current)}년 매출`}
              </th>
            </tr>
          </thead>
          <tbody>
            {centers?.map((center, index) => (
              <tr
                key={center.center_id}
                className={`bg-white border-b hover:bg-gray-100`}
              >
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {centers.length - index}
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {center.center_name}
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {convertAmount(center?.monthly_sales ?? 0)}원
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {convertAmount(center?.annual_sales ?? 0)}원
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CenterList;
