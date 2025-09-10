import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../../store/store";
import Pagination from "../../../components/Pagination";
import { usePagination } from "../../../hooks/usePagination";
import SettlementAppModal from "../../../components/app/SettlementAppModal";
import { openInputDatePicker } from "../../../utils/commonUtils";

interface CenterOrderApp {
  order_app_id: number;
  order_detail_app_id: number;
  mem_name: string;
  mem_phone: string;
  mem_app_status: string;
  formatted_order_dt: string;
  order_dt: string;
  order_status: string;
  order_quantity: number;
  product_name: string;
  original_price: number;
  discount: number;
  price: number;
  give_point: number;
  option_type: string;
  option_unit: string;
  option_gender: string;
  option_amount: number;
  point_amount: number;
  payment_amount: number;
  center_payback: number;
  order_group: string;
  formatted_purchase_confirm_dt: string;
  purchase_confirm_dt: string;
}

interface CommonCodeItem {
  common_code: string;
  common_code_name: string;
}

const CenterOrderAppList: React.FC = () => {
  const navigate = useNavigate();
  const [orderList, setOrderList] = useState<CenterOrderApp[]>([]);
  const user = useUserStore((state) => state.user);
  const [orderStatusCodeList, setOrderStatusCodeList] = useState<CommonCodeItem[]>([]);
  const [isSettlementOpen, setIsSettlementOpen] = useState<boolean>(false);
  const [paybackError, setPaybackError] = useState<string>("");
  const modalOrders = React.useMemo(() => {
    return (orderList || []).map((o: any) => ({
      order_dt: typeof o.order_dt === 'string' ? o.order_dt : '',
      purchase_confirm_dt: typeof o.purchase_confirm_dt === 'string' ? o.purchase_confirm_dt : '',
      order_status: o.order_status,
      center_payback: typeof o.center_payback === 'number' ? o.center_payback : (typeof o.center_payback === 'string' ? o.center_payback.replace(/,/g, '') : 0),
    }));
  }, [orderList]);

  

  // 검색 데이터 상태
  const [searchData, setSearchData] = useState({
    mem_name: "",
    order_status: "",
    mem_app_status: "",
    start_order_dt: "",
    end_order_dt: "",
    start_purchase_confirm_dt: "",
    end_purchase_confirm_dt: "",
    min_center_payback: "",
    max_center_payback: ""
  });

  // 페이지네이션 훅 사용
  const pagination = usePagination({
    totalItems: orderList.length,
    itemsPerPage: 10,
  });

  // 현재 페이지에 표시할 데이터
  const currentInquiries = pagination.getCurrentPageData(orderList);

  // 검색 조건 변경 핸들러
  const handleSearchChange = (field: string, value: string) => {
    setSearchData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 검색 처리
  const handleSearch = async () => {
    if (paybackError) return;
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/memberOrderApp/selectCenterMemberOrderAppList`,
        {
          center_id: user.center_id,
          ...searchData
        }
      );
      
      setOrderList(response.data);
      pagination.resetPage();
    } catch (err) {
      console.error("주문 목록 검색 오류:", err);
    }
  };

  const formatNumberWithCommas = (value: string) => {
    const digitsOnly = value.replace(/[^0-9]/g, "");
    if (!digitsOnly) return "";
    return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const getNumericValue = (value: string) => {
    if (!value) return NaN;
    const num = Number(value.replace(/,/g, ""));
    return Number.isFinite(num) ? num : NaN;
  };

  const handlePaybackChange = (field: "min_center_payback" | "max_center_payback", value: string) => {
    const formatted = formatNumberWithCommas(value);
    setSearchData(prev => {
      const next = { ...prev, [field]: formatted };
      const minVal = getNumericValue(next.min_center_payback);
      const maxVal = getNumericValue(next.max_center_payback);
      if (!Number.isNaN(minVal) && !Number.isNaN(maxVal) && minVal > maxVal) {
        setPaybackError("최소금액이 최대금액보다 클 수 없습니다.");
      } else {
        setPaybackError("");
      }
      return next;
    });
  };

  // 검색 초기화
  const handleReset = () => {
    setSearchData({
      mem_name: "",
      order_status: "",
      mem_app_status: "",
      start_order_dt: "",
      end_order_dt: "",
      start_purchase_confirm_dt: "",
      end_purchase_confirm_dt: "",
      min_center_payback: "",
      max_center_payback: ""
    });
    selectCenterMemberOrderAppList();
  };

  // 리뷰 목록 불러오기
  const selectCenterMemberOrderAppList = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/memberOrderApp/selectCenterMemberOrderAppList`,
        {
          center_id: user.center_id
        }
      );
      
      setOrderList(response.data);
      pagination.resetPage();
    } catch (err) {
      console.error("주문 목록 로딩 오류:", err);
    } finally {
    }
  };

  // 주문 상태 코드 목록 불러오기
  const selectOrderStatusCodeList = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/common/selectCommonCodeList`,
        {
          group_code: "ORDER_STATUS_TYPE",
        }
      );

      setOrderStatusCodeList(response.data.result || []);
    } catch (err) {
      console.error("주문 상태 코드 로딩 오류:", err);
    }
  };

  useEffect(() => {
    if (user && user.index) {
      selectCenterMemberOrderAppList();
    }
  }, [user]);

  useEffect(() => {
    selectOrderStatusCodeList();
  }, []);

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">주문 관리</h2>
          <div>
            <button onClick={() => setIsSettlementOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700">정산금 전체보기</button>
          </div>
        </div>

        {/* 검색 필터 테이블 */}
        <div className="mb-6">
          <table className="w-full border border-gray-300">
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium">이름</td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="text"
                    value={searchData.mem_name}
                    onChange={(e) => handleSearchChange('mem_name', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                    placeholder="이름을 입력하세요"
                  />
                </td>
                <td className="border p-2 text-center bg-gray-200 font-medium">주문일시</td>
                <td className="border p-2 flex items-center justify-between" onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target && target.tagName.toLowerCase() === 'input') return;
                  const firstInput = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement | null;
                  if (firstInput) openInputDatePicker(firstInput);
                }}>
                  <input
                    type="date"
                    value={searchData.start_order_dt}
                    onChange={(e) => handleSearchChange('start_order_dt', e.target.value)}
                    onClick={(e) => openInputDatePicker(e.currentTarget)}
                    onFocus={(e) => openInputDatePicker(e.currentTarget)}
                    className="w-1/2 px-2 py-1 border cursor-pointer border-gray-300 rounded"
                  />
                  ~
                  <input
                    type="date"
                    value={searchData.end_order_dt}
                    onChange={(e) => handleSearchChange('end_order_dt', e.target.value)}
                    onClick={(e) => openInputDatePicker(e.currentTarget)}
                    onFocus={(e) => openInputDatePicker(e.currentTarget)}
                    className="w-1/2 px-2 py-1 border cursor-pointer border-gray-300 rounded"
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium">주문상태</td>
                <td className="border border-gray-300 p-2">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="order_status"
                        value=""
                        checked={searchData.order_status === ''}
                        onChange={(e) => handleSearchChange('order_status', e.target.value)}
                        className="mr-1"
                      />
                      <span className="text-sm">전체</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="order_status"
                        value="PURCHASE_CONFIRM"
                        checked={searchData.order_status === 'PURCHASE_CONFIRM'}
                        onChange={(e) => handleSearchChange('order_status', e.target.value)}
                        className="mr-1"
                      />
                      <span className="text-sm">구매 확정</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="order_status"
                        value="NOT_PURCHASE_CONFIRM"
                        checked={searchData.order_status !== '' && searchData.order_status !== 'PURCHASE_CONFIRM'}
                        onChange={(e) => handleSearchChange('order_status', e.target.value)}
                        className="mr-1"
                      />
                      <span className="text-sm">구매 미확정</span>
                    </label>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium">정산금</td>
                <td className="border border-gray-300 p-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={searchData.min_center_payback}
                      onChange={(e) => handlePaybackChange('min_center_payback', e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      placeholder="최소"
                    />
                    <span className="text-sm text-gray-500">~</span>
                    <input
                      type="text"
                      value={searchData.max_center_payback}
                      onChange={(e) => handlePaybackChange('max_center_payback', e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      placeholder="최대"
                    />
                    <span className="text-sm text-gray-500">원</span>
                  </div>
                  {paybackError && (
                    <div className="text-red-500 text-xs mt-1">{paybackError}</div>
                  )}
                </td>
              </tr>
              <tr>
                <td className="border p-2 text-center bg-gray-200 font-medium">구매확정일시</td>
                <td className="border p-2 flex items-center justify-between" onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target && target.tagName.toLowerCase() === 'input') return;
                  const firstInput = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement | null;
                  if (firstInput) openInputDatePicker(firstInput);
                }}>
                  <input
                    type="date"
                    value={searchData.start_purchase_confirm_dt}
                    onChange={(e) => handleSearchChange('start_purchase_confirm_dt', e.target.value)}
                    onClick={(e) => openInputDatePicker(e.currentTarget)}
                    onFocus={(e) => openInputDatePicker(e.currentTarget)}
                    className="w-1/2 px-2 py-1 border cursor-pointer border-gray-300 rounded"
                  />
                  ~
                  <input
                    type="date"
                    value={searchData.end_purchase_confirm_dt}
                    onChange={(e) => handleSearchChange('end_purchase_confirm_dt', e.target.value)}
                    onClick={(e) => openInputDatePicker(e.currentTarget)}
                    onFocus={(e) => openInputDatePicker(e.currentTarget)}
                    className="w-1/2 px-2 py-1 border cursor-pointer border-gray-300 rounded"
                  />
                </td>
              </tr>
            </tbody>
          </table>

          {/* 검색 버튼 */}
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              초기화
            </button>
            <button
              onClick={handleSearch}
              disabled={!!paybackError}
              className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded ${paybackError ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              검색
            </button>
          </div>
        </div>

        {orderList.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>등록된 주문이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-start items-center mb-2">
              <p className="text-sm font-semibold">총 {orderList.length}건</p>
              <div className="ml-4">
                <p className="text-red-500">
                  <span className="font-bold">*</span>
                  정산은 매월 <span className="font-bold">구매확정일시</span>를 기준으로 계산하며, 익월 10일에 정산금을 지급합니다.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="w-full h-16 border-b border-gray-200 bg-gray-200">
                    <th className="text-center pl-4 whitespace-nowrap">번호</th>
                    <th className="text-center whitespace-nowrap">이름</th>
                    <th className="text-center whitespace-nowrap">주문상태</th>
                    <th className="text-center whitespace-nowrap">상품이름</th>
                    <th className="text-center whitespace-nowrap">원가</th>
                    <th className="text-center whitespace-nowrap">할인율</th>
                    <th className="text-center whitespace-nowrap">할인가</th>
                    <th className="text-center whitespace-nowrap">주문수량</th>
                    <th className="text-center whitespace-nowrap">결제금액</th>
                    <th className="text-center whitespace-nowrap">주문일시</th>
                    <th className="text-center whitespace-nowrap">구매확정일시</th>
                    <th className="text-center whitespace-nowrap">정산금</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInquiries?.map((ele, index) => {
                    return (
                      <tr
                        key={index}
                        className="h-16 border-b border-gray-200 hover:bg-gray-50"
                        onClick={() => {}}
                      >
                        <td className="pl-4 text-center">
                          {orderList.length - (pagination.startIndex + index)}
                        </td>
                        <td className="text-center px-2 truncate">
                          {ele.mem_name}
                        </td>
                        <td className="text-center px-2 truncate">
                          {ele.order_status == 'PURCHASE_CONFIRM' ? '구매 확정'
                          : `구매 미확정(${orderStatusCodeList.find((c) => c.common_code === ele.order_status)?.common_code_name || ''})`}
                        </td>
                        <td className="text-center px-2">
                          <p>{ele.product_name}</p>
                          <p>{ele.option_amount + ele.option_unit + ' ' + (ele.option_gender == 'W' ? '여성' : ele.option_gender == 'M' ? '남성' : ele.option_gender == 'A' ? '공용' : '')}</p>
                        </td>
                        <td className="text-center px-2 truncate">
                          {ele.original_price}원
                        </td>
                        <td className="text-center px-2 truncate">
                          {ele.discount}%
                        </td>
                        <td className="text-center px-2 truncate">
                          {ele.price.toLocaleString()}원
                        </td>
                        <td className="text-center px-2">
                          {ele.order_quantity}
                        </td>
                        <td className="text-center whitespace-nowrap">
                          {((ele.price * ele.order_quantity - ele.point_amount)).toLocaleString()}원
                        </td>
                        <td className="text-center whitespace-nowrap">
                          {ele.formatted_order_dt}
                        </td>
                        <td className="text-center whitespace-nowrap">
                          {ele.formatted_purchase_confirm_dt ? ele.formatted_purchase_confirm_dt : '-'}
                        </td>
                        <td className="text-center whitespace-nowrap">
                          {ele.order_status == 'PURCHASE_CONFIRM' ? Number(ele.center_payback)?.toLocaleString() : 0}원
                        </td>
                      </tr>
                    )
                  })}
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
      <SettlementAppModal open={isSettlementOpen} onClose={() => setIsSettlementOpen(false)} orders={modalOrders as any} />
    </>
  );
};

export default CenterOrderAppList;
