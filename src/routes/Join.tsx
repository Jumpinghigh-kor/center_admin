import axios from "axios";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ko } from "date-fns/locale"; //한국어 설정
import { useUserStore } from "../store/store";
import { convertAmount, convertDate, convertPhone } from "../utils/formatUtils";
import { Product } from "../utils/types";
import { getMonth, getYear } from "date-fns";

interface Member {
  mem_id: number;
  mem_name: string;
  mem_phone: string;
  mem_manager: string;
  sch_time: string;
  mem_sch_id: number;
}

const Join: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as Member;
  const user = useUserStore((state) => state.user);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product>();
  const [currentTime, setCurrentTime] = useState<Date | null>();
  const [startDate, setStartDate] = useState<String>("");
  const [endDate, setEndDate] = useState<String | any>("");
  const [confirm, setConfirm] = useState<Boolean>(false);

  useEffect(() => {
    const getProducts = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/product`,
          {
            params: user,
          }
        );
        setProducts(res.data.result);
      } catch (err) {
        console.log(err);
      }
    };
    getProducts();
  }, [user]);

  useEffect(() => {
    const getTime = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/time`);
        setCurrentTime(res.data.result);
        setStartDate(res.data.result);
      } catch {}
    };
    getTime();
  }, []);

  const joinMembership = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/schedule/date/${state.mem_sch_id}`,
        { params: { user: user, startDate: startDate } }
      );

      const data = res.data.result;

      if (data.length > 0 && data[0].sch_max_cap <= data.length) {
        const userConfirmed = window.confirm(
          `현재 최대 회원 수(${data[0].sch_max_cap})를 초과할 수 있습니다. 그래도 등록하시겠습니까?`
        );

        if (!userConfirmed) return;
      }

      await axios.post(`${process.env.REACT_APP_API_URL}/member/order`, [
        state,
        selectedProduct,
        startDate,
        user,
      ]);
      navigate("/members");
    } catch (e) {
      console.log(e);
    } finally {
    }
  };

  if (confirm) {
    //모달 오픈시 스크롤 방지
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }

  return (
    <div className="p-3 sm:p-10">
      <div className="flex flex-col">
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500">
            <thead className="text-xs text-white font-bold uppercase bg-custom-C4C4C4">
              <tr>
                <th
                  scope="col"
                  className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
                >
                  이름
                </th>
                <th
                  scope="col"
                  className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
                >
                  수업시간
                </th>
                <th
                  scope="col"
                  className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
                >
                  담당자
                </th>
                <th
                  scope="col"
                  className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
                >
                  전화번호
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white border-b hover:bg-gray-50">
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {state.mem_name}
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {state.sch_time}
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {state.mem_manager}
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {convertPhone(state.mem_phone)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-10">
          {products.length === 0 ? (
            <NavLink to="/products">
              <span className="bg-pink-500 text-white p-2">
                <b>회원권 관리</b>에서 회원권을 먼저 등록해주세요.
              </span>
            </NavLink>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 mt-3 gap-4">
              {products.map((product) => (
                <div
                  className={`max-w-sm bg-white border-2 ${
                    product.pro_id === selectedProduct?.pro_id
                      ? "border-green-600"
                      : "border-gray-200"
                  } rounded-xl shadow
                hover:bg-gray-100
                `}
                  key={product.pro_id}
                  onClick={() => {
                    setSelectedProduct(product);

                    const durationType = product?.pro_week ? "week" : "month";
                    const durationValue =
                      product?.pro_week || product?.pro_months;

                    setEndDate(
                      dayjs(convertDate(startDate))
                        .add(Number(durationValue), durationType)
                        .subtract(1, "day")
                        .format("YYYY-MM-DD")
                    );
                  }}
                >
                  <div className="bg-custom-C4C4C4 text-center py-2 rounded-t-xl">
                    <h5 className="text-xl font-bold tracking-tight text-black">
                      {product.pro_name}
                    </h5>
                  </div>
                  <p className="text-2xl pt-6 font-bold text-black text-center">
                    {product.pro_type === "회차권"
                      ? `${product.pro_remaining_counts}회`
                      : product.pro_type === "개월권"
                      ? `${product.pro_months}개월`
                      : `${product.pro_week}주`}
                  </p>
                  <p className="text-2xl py-6 font-bold text-green-600 text-center">
                    {convertAmount(product.pro_price)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-10 flex justify-between flex-col lg:flex-row">
          <div className="text-xl">
            <>
              <span className="font-bold mr-3 flex items-center">
                시작일자 :&nbsp;
                <div className="relative max-w-sm">
                  <div className="absolute z-30 inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
                    </svg>
                  </div>
                </div>
                <DatePicker
                  selected={currentTime}
                  locale={ko}
                  onChange={(date: any) => {
                    setCurrentTime(date);
                    setStartDate(convertDate(date));

                    const durationType = selectedProduct?.pro_week
                      ? "week"
                      : "month";
                    const durationValue =
                      selectedProduct?.pro_week || selectedProduct?.pro_months;

                    setEndDate(
                      dayjs(date)
                        .add(Number(durationValue), durationType)
                        .subtract(1, "day")
                        .format("YYYY-MM-DD")
                    );
                  }}
                  dateFormat="yyyy-MM-dd"
                  className="bg-gray-50 border cursor-pointer border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5"
                  renderCustomHeader={({
                    date,
                    decreaseMonth,
                    increaseMonth,
                    prevMonthButtonDisabled,
                    nextMonthButtonDisabled,
                  }) => (
                    <div>
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={decreaseMonth}
                          disabled={prevMonthButtonDisabled}
                        >
                          <svg
                            className="w-4 h-4 text-gray-800"
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke="currentColor"
                              strokeWidth={2}
                              d="m15 19-7-7 7-7"
                            />
                          </svg>
                        </button>
                        <span>
                          {getYear(date)}년 {getMonth(date) + 1}월
                        </span>
                        <button
                          type="button"
                          onClick={increaseMonth}
                          disabled={nextMonthButtonDisabled}
                        >
                          <svg
                            className="w-4 h-4 text-gray-800"
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke="currentColor"
                              strokeWidth={2}
                              d="m9 5 7 7-7 7"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                />
              </span>

              <span className="font-bold mt-2 flex items-center">
                만기일자 :{" "}
                {endDate === "Invalid Date" || !endDate ? (
                  <span className="text-red-800">회원권을 선택해주세요.</span>
                ) : (
                  <span className="font-bold ml-1 mr-3 flex items-center">
                    <div className="relative max-w-sm">
                      <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-gray-500"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
                        </svg>
                      </div>
                    </div>
                    <DatePicker
                      selected={new Date(dayjs(endDate).format("YYYY-MM-DD"))}
                      locale={ko}
                      disabled
                      dateFormat="yyyy-MM-dd"
                      className="bg-gray-200 border border-gray-300 text-gray-500 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5"
                    />
                  </span>
                )}
              </span>
            </>
          </div>
          <div className="font-bold text-2xl">
            선택 상품&nbsp;
            <span className="text-green-600">
              {!!selectedProduct
                ? convertAmount(Number(selectedProduct?.pro_price))
                : "0"}
            </span>
            &nbsp;원
          </div>
        </div>
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            className="block rounded-full bg-green-600 px-10 py-3 text-center text-sm text-white font-extrabold shadow-sm hover:text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
            onClick={() => {
              if (selectedProduct === undefined) {
                return alert("회원권을 선택해주세요.");
              }
              setConfirm(true);
            }}
          >
            등록
          </button>
        </div>
      </div>
      {/* 확인 모달 */}
      {confirm ? (
        <div className="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full h-screen md:inset-0 h-modal md:h-full">
          <div className="fixed top-0 right-0 left-0 w-full max-h-full min-h-screen md:inset-0 bg-black opacity-50"></div>
          <div
            tabIndex={-1}
            className="overflow-y-auto overflow-x-hidden absolute z-50 w-full md:inset-0 h-modal md:h-full"
          >
            <div className="flex justify-center p-4 h-full md:h-auto">
              <div className="relative p-4 text-center bg-white rounded-lg shadow sm:p-5">
                <button
                  type="button"
                  className="text-gray-400 absolute top-2.5 right-2.5 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                  onClick={() => setConfirm(false)}
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"></path>
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
                <svg
                  className="text-gray-400 w-11 h-11 mb-3.5 mx-auto"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M14 2a3.963 3.963 0 0 0-1.4.267 6.439 6.439 0 0 1-1.331 6.638A4 4 0 1 0 14 2Zm1 9h-1.264A6.957 6.957 0 0 1 15 15v2a2.97 2.97 0 0 1-.184 1H19a1 1 0 0 0 1-1v-1a5.006 5.006 0 0 0-5-5ZM6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Z" />
                </svg>
                <p className="mb-4 text-gray-500">등록 정보가 일치합니까?</p>
                <p className="mb-1 text-gray-500">이름 : {state.mem_name}</p>
                <p className="mb-1 text-gray-500">
                  회원권 : {selectedProduct?.pro_name}
                </p>
                <p className="mb-4 text-gray-500">
                  상품금액 : {convertAmount(Number(selectedProduct?.pro_price))}
                  원
                </p>
                <div className="flex justify-center items-center space-x-4">
                  <button
                    data-modal-toggle="deleteModal"
                    type="button"
                    className="py-2 px-3 text-sm font-medium text-gray-500 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-primary-300 hover:text-gray-900 focus:z-10"
                    onClick={() => setConfirm(false)}
                  >
                    아니요. 취소할래요
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-3 text-sm font-medium text-center text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-red-300"
                    onClick={joinMembership}
                  >
                    네. 등록할게요
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Join;
