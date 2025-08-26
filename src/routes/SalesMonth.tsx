import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useUserStore } from "../store/store";
import axios from "axios";
import { convertAmount, convertDate } from "../utils/formatUtils";
import DeleteSalesModal from "../components/DeleteSalesModal";

type SalesData = {
  mem_name: string;
  memo_id: number;
  memo_mem_id: number;
  memo_pro_id: number;
  memo_pro_name: string;
  memo_pro_price: number;
  memo_start_date: string;
  memo_end_date: string;
  memo_purchase_date: string;
  pro_id: number;
  pro_name: string;
  pro_months: number;
  pro_price: number;
  pro_class: string;
  pro_status: number;
  center_name: string;
};

const SalesMonth: React.FC = () => {
  const { date } = useParams();
  const [sales, setSales] = useState<SalesData[]>([]);
  const [deleteModalToggle, setDeleteModalToggle] = useState<boolean>(false);
  const [selectedSale, setSelectedSale] = useState<SalesData>();
  const [viewType, setViewType] = useState<string>("전체보기");
  const user = useUserStore((state) => state.user);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 50;
  const totalPage = Math.ceil(sales.length / itemsPerPage);

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/sales/month`,
        {
          params: { user: user, path: date },
        }
      );
      setSales(res.data.result);
    } catch (err) {
      console.log(err);
    }
  }, [user, date]);

  const getReRegister = useCallback(async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/sales/reregister`,
        {
          params: { user: user, path: date },
        }
      );
      return res.data.result;
    } catch (err) {
      console.log(err);
    }
  }, [user, date]);

  useEffect(() => {
    const loadData = async () => {
      await fetchData();
    };

    loadData();
  }, [fetchData]);

  const handleClickNext = () => {
    setCurrentPage((prevPage) =>
      Math.min(prevPage + 1, Math.ceil(sales.length / itemsPerPage))
    );
  };

  const handleClickPrevious = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sales.slice(indexOfFirstItem, indexOfLastItem);

  const showPagination = () => {
    const newArr = [];
    for (let i = 0; i < totalPage; i++) {
      newArr.push(
        <li key={i}>
          <div
            className={
              currentPage === i + 1
                ? "flex items-center cursor-pointer justify-center px-3 h-8 text-blue-600 border border-gray-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700"
                : "flex items-center cursor-pointer justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
            }
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </div>
        </li>
      );
    }
    return newArr;
  };

  return (
    <div className="p-3 sm:p-10">
      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <span className="font-bold text-xl">{date} 매출</span>
          <div className="flex flex-col items-end">
            <select
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2"
              value={viewType}
              onChange={async (e) => {
                setViewType(e.target.value);
                if (e.target.value === "전체보기") {
                  await fetchData();
                } else if (e.target.value === "재등록") {
                  const reRegisterData = await getReRegister();
                  setSales(reRegisterData || []);
                }
              }}
            >
              <option value="전체보기">전체보기</option>
              <option value="재등록">재등록</option>
            </select>
            <div className="h-6 mt-2">
              {viewType === "재등록" && (
                <p className="text-sm text-gray-600">
                  최근 2주 내에 재등록한 회원권 목록입니다.
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg my-4">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500">
            <thead className="text-xs text-white font-bold uppercase bg-custom-C4C4C4">
              <tr>
                <th scope="col" className="px-4 py-3 text-center text-base">
                  날짜
                </th>
                <th scope="col" className="px-4 py-3 text-center text-base">
                  상품
                </th>
                <th scope="col" className="px-4 py-3 text-center text-base">
                  구매자
                </th>
                <th scope="col" className="px-4 py-3 text-center text-base">
                  금액
                </th>
                {
                  //관리자
                  user?.usr_role === "admin" ? (
                    <th className="px-4 py-4 text-center text-base">센터명</th>
                  ) : null
                }
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((sale) => (
                  <tr
                    className={`${
                      selectedSale?.memo_id === sale.memo_id
                        ? `bg-gray-100`
                        : `bg-white`
                    } border-b hover:bg-gray-50`}
                    key={`${sale.memo_id}-${sale.memo_purchase_date}`}
                    onClick={() => setSelectedSale(sale)}
                  >
                    <th
                      scope="row"
                      className="px-6 py-4 text-center text-base font-medium text-gray-900 whitespace-nowrap"
                    >
                      {convertDate(sale.memo_purchase_date)}
                    </th>
                    <td className="px-6 py-4 text-center text-base">
                      {sale.memo_pro_name}
                    </td>
                    <td className="px-6 py-4 text-center text-base">
                      {sale.mem_name}
                    </td>
                    <td className="px-6 py-4 text-center text-base">
                      {convertAmount(sale.memo_pro_price)}
                    </td>
                    {
                      //관리자
                      user?.usr_role === "admin" ? (
                        <td className="px-6 py-4 text-center text-base">
                          {sale.center_name}
                        </td>
                      ) : null
                    }
                  </tr>
                ))
              ) : (
                <tr className="bg-white">
                  <td
                    colSpan={user?.usr_role === "admin" ? 5 : 4}
                    className="px-6 py-4 text-center text-base text-gray-500"
                  >
                    조회 내용이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end">
          {user?.usr_role === "admin" ? (
            "관리자는 매출을 삭제할 수 없습니다."
          ) : (
            <button
              disabled={!selectedSale}
              onClick={() => {
                setDeleteModalToggle(true);
              }}
              className={`${
                !selectedSale
                  ? "bg-gray-400"
                  : "bg-red-600 cursor-pointer hover:bg-red-700"
              } block rounded-2xl px-4 py-1 text-center text-sm text-white font-extrabold shadow-sm hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600`}
            >
              삭제
            </button>
          )}
        </div>

        <nav className="flex items-center flex-column flex-wrap md:flex-row justify-between pt-4">
          <span className="text-sm font-normal text-gray-500 mb-4 md:mb-0 block w-full md:inline md:w-auto"></span>
          <ul className="inline-flex -space-x-px rtl:space-x-reverse text-sm h-8">
            <li>
              <div
                className="flex items-center justify-center cursor-pointer px-3 h-8 ms-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700"
                onClick={handleClickPrevious}
              >
                이전
              </div>
            </li>
            {showPagination()}
            <li>
              <div
                className="flex items-center justify-center cursor-pointer px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700"
                onClick={handleClickNext}
              >
                다음
              </div>
            </li>
          </ul>
        </nav>
      </div>
      {deleteModalToggle ? (
        <DeleteSalesModal
          setDeleteModalToggle={setDeleteModalToggle}
          sale={selectedSale}
          fetchData={fetchData}
          setSelectedSale={setSelectedSale}
        />
      ) : null}
    </div>
  );
};

export default SalesMonth;
