import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useUserStore } from "../store/store";
import axios from "axios";
import { convertAmount, convertDateMonth } from "../utils/formatUtils";

type YearlySales = {
  sales_date: string;
  totalSales: number;
  sales_year: number;
};

const groupByYear = (data: YearlySales[]) => {
  return data.reduce((acc, curr) => {
    if (!acc[curr.sales_year]) {
      acc[curr.sales_year] = [];
    }
    acc[curr.sales_year].push(curr);
    return acc;
  }, {} as Record<number, YearlySales[]>);
};

const SalesYear: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const [sales, setSales] = useState<YearlySales[]>([]);

  useEffect(() => {
    const getSales = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/sales/year`,
          {
            params: user,
          }
        );
        setSales(res.data.result);
      } catch (err) {
        console.log(err);
      }
    };
    getSales();
  }, [user]);

  const groupedSales = groupByYear(sales);

  const groups = Object.keys(groupedSales).map((key: string) => {
    return { sales_year: key, monthData: groupedSales[Number(key)] };
  });

  return (
    <div className="p-3 sm:p-10">
      {groups.reverse().map((group) => (
        <div className="flex flex-col mb-20" key={group.sales_year}>
          <span className="font-bold text-xl">{group.sales_year}년 매출</span>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 mt-3 gap-4">
            {group.monthData?.map((data) => (
              <div
                className="max-w-sm bg-white border border-gray-200 rounded-xl shadow"
                key={data.sales_date}
              >
                <div className="bg-custom-C4C4C4 text-center py-2 rounded-t-xl">
                  <h5 className="text-2xl font-bold tracking-tight text-white">
                    {convertDateMonth(data.sales_date)}월
                  </h5>
                </div>
                <p className="text-2xl py-6 font-bold text-black text-center">
                  {convertAmount(data.totalSales)}원
                </p>
                <div className="text-center">
                  <NavLink to={`/sales_month/${data.sales_date}`} state={data}>
                    <span className="mb-5 inline-flex items-center px-5 py-1 text-sm font-medium text-center text-white bg-green-600 rounded-2xl hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-blue-300">
                      자세히
                    </span>
                  </NavLink>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SalesYear;
