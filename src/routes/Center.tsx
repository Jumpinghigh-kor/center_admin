import { useEffect, useState } from "react";
import { useUserStore } from "../store/store";
import axios, { AxiosError, AxiosResponse } from "axios";
import { convertAmount } from "../utils/formatUtils";
import { Sales, Target } from "../utils/types";

const Center: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const [target, setTarget] = useState<Target>({
    target_amount_month: 0,
    target_amount_year: 0,
    target_members: 0,
  });
  const [sales, setSales] = useState<Sales[]>([]);
  const [activeMembers, setActiveMembers] = useState([]);

  useEffect(() => {
    const getData = async () => {
      try {
        const fetchTarget = await axios.get(
          `${process.env.REACT_APP_API_URL}/center`,
          {
            params: user,
          }
        );
        setTarget(fetchTarget.data.result[0]);

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
      } catch (e) {
        console.log(e);
      }
    };
    getData();
  }, [user]);

  const editTarget = async () => {
    try {
      await axios.patch(`${process.env.REACT_APP_API_URL}/center`, target);
      alert("수정이 완료되었습니다.");
    } catch (error) {
      const errorResponse = (error as AxiosError).response;
      if (errorResponse) {
        const data = (errorResponse as AxiosResponse).data;
        alert(data);
      }
    }
  };

  return (
    <div className="p-3 sm:p-10">
      <div className="flex flex-col">
        <span className="font-bold text-xl">센터 관리</span>
        <div className="flex flex-col lg:flex-row">
          <table className="shadow-md w-full text-sm text-left rtl:text-right text-gray-500 my-4 bg-white rounded-lg">
            <tbody>
              <tr className="border-b border-gray-200">
                <th className="w-48 text-base text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4 rounded-tl-lg">
                  목표 월매출
                </th>
                <td className="p-2 flex items-center text-black">
                  <input
                    type="text"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg px-2.5 py-1.5 min-w-28 w-full"
                    maxLength={15}
                    onChange={(e) =>
                      setTarget({
                        ...target,
                        target_amount_month: Number(e.target.value),
                      })
                    }
                    value={target?.target_amount_month || ""}
                  />
                  원
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="w-48 text-base text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4">
                  현재 월매출
                </th>
                <td className="px-2 text-black">
                  {convertAmount(sales[0]?.total_sum_month)}원
                </td>
              </tr>
              <tr>
                <th className="w-48 text-base text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4 rounded-bl-lg">
                  남은 월매출
                </th>
                <td className="px-2 text-green-600 font-bold">
                  {target?.target_amount_month - sales[0]?.total_sum_month > 0
                    ? `${convertAmount(
                        target?.target_amount_month - sales[0]?.total_sum_month
                      )}원`
                    : "달성!"}
                </td>
              </tr>
            </tbody>
          </table>
          <table className="shadow-md w-full text-sm text-left rtl:text-right text-gray-500 my-4 lg:m-4 bg-white rounded-lg">
            <tbody>
              <tr className="border-b border-gray-200">
                <th className="w-48 text-base text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4 rounded-tl-lg">
                  목표 연매출
                </th>
                <td className="p-2 flex items-center text-black">
                  <input
                    type="text"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg px-2.5 py-1.5 min-w-28 w-full"
                    maxLength={15}
                    onChange={(e) =>
                      setTarget({
                        ...target,
                        target_amount_year: Number(e.target.value),
                      })
                    }
                    value={target?.target_amount_year || ""}
                  />
                  원
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="w-48 text-base text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4">
                  현재 연매출
                </th>
                <td className="px-2 text-black">
                  {convertAmount(sales[0]?.total_sum_year)}원
                </td>
              </tr>
              <tr>
                <th className="w-48 text-base text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4 rounded-bl-lg">
                  남은 연매출
                </th>
                <td className="px-2 text-green-600 font-bold">
                  {target?.target_amount_year - sales[0]?.total_sum_year > 0
                    ? `${convertAmount(
                        target?.target_amount_year - sales[0]?.total_sum_year
                      )}원`
                    : "달성!"}
                </td>
              </tr>
            </tbody>
          </table>
          <table className="shadow-md w-full text-sm text-left rtl:text-right text-gray-500 my-4 bg-white rounded-lg">
            <tbody>
              <tr className="border-b border-gray-200">
                <th className="w-48 text-base text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4 rounded-tl-lg">
                  목표 등록회원 수
                </th>
                <td className="p-2 flex items-center text-black">
                  <input
                    type="text"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg px-2.5 py-1.5 min-w-28 w-full"
                    maxLength={15}
                    onChange={(e) =>
                      setTarget({
                        ...target,
                        target_members: Number(e.target.value),
                      })
                    }
                    value={target?.target_members || ""}
                  />
                  명
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="w-48 text-base text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4">
                  현재 등록회원 수
                </th>
                <td className="px-2 text-black">{activeMembers?.length}명</td>
              </tr>
              {/* <tr className="border-b border-gray-200"> */}
              <tr>
                <th className="w-48 text-base text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4 rounded-bl-lg">
                  남은 등록회원 수
                </th>
                <td className="px-2 text-green-600 font-bold">
                  {target?.target_members - activeMembers?.length > 0
                    ? `${convertAmount(
                        target?.target_members - activeMembers?.length
                      )}명`
                    : "달성!"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="text-center mt-2">
          <span
            className="mb-5 cursor-pointer inline-flex items-center px-5 py-1 text-sm font-medium text-center text-white bg-green-600 rounded-2xl hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-blue-300"
            onClick={editTarget}
          >
            수정
          </span>
        </div>
      </div>
    </div>
  );
};

export default Center;
