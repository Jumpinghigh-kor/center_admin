import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useUserStore } from "../../../store/store";
import { useSearch } from "../../../hooks/useSearch";
import { usePagination } from "../../../hooks/usePagination";
import Pagination from "../../../components/Pagination";
import { useCheckbox } from "../../../hooks/useCheckbox";
import { openInputDatePicker } from "../../../utils/commonUtils";
import { useNavigate } from "react-router-dom";

interface CouponApp {
  coupon_app_id: number;
  product_app_id: number;
  discount_type: string;
  discount_amount: number;
  min_order_amount: number;
  description: string;
  badge_text: string;
  start_dt: string | number;
  end_dt: string | number;
  coupon_notice: string;
  del_yn: "Y" | "N";
  reg_date: string;
  reg_time: string;
  mod_dt: string;
  reg_id: string;
  mod_id: string;
  title: string;
  brand_name: string;
  product_del_yn: string;
  have_cnt: number;
}

const MembercouponApp: React.FC = () => {
  const [couponList, setcouponList] = useState<CouponApp[]>([]);
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();

  const { searchData, setSearchData, handleSearch, handleReset} = useSearch({
    onSearch: (params) => selectCouponAppList(params),
    initialSearchData: {
      brand_name: "",
      product_name: "",
      discount_type: "",
      min_discount_amount: "",
      max_discount_amount: "",
      min_order_amount: "",
      max_order_amount: "",
      start_dt: "",
      end_dt: "",
    },
  });

  // 페이징 및 체크박스 공통 훅
  const filteredList = useMemo(() => {
    return couponList;
  }, [couponList]);

  const pagination = usePagination({ totalItems: filteredList.length, itemsPerPage: 10, initialPage: 1 });
  const currentCouponList = useMemo(() => pagination.getCurrentPageData(filteredList), [filteredList, pagination.getCurrentPageData, pagination.startIndex, pagination.endIndex]);
  const { checkedItems, allChecked, handleAllCheck, handleIndividualCheck, resetCheckedItems } = useCheckbox(filteredList.length);

  // 쿠폰 목록 조회
  const selectCouponAppList = async (searchParams?: any) => {    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/couponApp/selectCouponAppList`,
        {
          ...(searchParams ?? searchData)
        }
      );

      setcouponList(response.data.result);
      resetCheckedItems();
      pagination.resetPage();
    } catch (err) {
      alert("쿠폰 목록을 불러오는 도중 오류가 발생했습니다.");
    } finally {
    }
  };

  // 금액/주문금액 범위 입력 공통 처리 및 유효성 검사
  const handleAmountRangeChange = (
    field: 'min_discount_amount' | 'max_discount_amount' | 'min_order_amount' | 'max_order_amount',
    value: string
  ) => {
    const sanitized = value.replace(/[^0-9]/g, '');
    const isDiscount = field.indexOf('discount') !== -1;
    if (isDiscount) {
      const type = (searchData as any).discount_type;
      if (!type) {
        alert('할인 금액 단위를 먼저 선택해주세요. (% 또는 원)');
        return;
      }
      if (type === 'PERCENT' && sanitized !== '') {
        let n = Number(sanitized);
        if (isNaN(n)) n = 0;
        if (n < 0 || n > 100) {
          alert('퍼센트는 0 이상 100 이하만 입력 가능합니다.');
        }
        if (n < 0) n = 0;
        if (n > 100) n = 100;
        setSearchData({ ...searchData, [field]: String(n) });
        return;
      }
    }
    setSearchData({ ...searchData, [field]: sanitized });
    const minKey = (isDiscount ? 'min_discount_amount' : 'min_order_amount') as
      | 'min_discount_amount'
      | 'min_order_amount';
    const maxKey = (isDiscount ? 'max_discount_amount' : 'max_order_amount') as
      | 'max_discount_amount'
      | 'max_order_amount';
    const minVal = Number(((field === minKey ? sanitized : (searchData as any)[minKey]) || ''));
    const maxVal = Number(((field === maxKey ? sanitized : (searchData as any)[maxKey]) || ''));
  };

  // 쿠폰 삭제
  const deleteMembercouponApp = async () => {
    const selectedIds = checkedItems
      .map((checked, index) => (checked ? filteredList[index]?.coupon_app_id : null))
      .filter((v): v is number => typeof v === 'number');

    if (selectedIds.length === 0) {
       alert("삭제할 쿠폰을 선택해주세요.");
       return;
     }

    const confirm = window.confirm("정말 삭제하시겠습니까?");
    if (!confirm) {
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/couponApp/deleteCouponApp`,
        {
          coupon_app_id: selectedIds,
          user_id: user?.index
        }
      );

      selectCouponAppList();
    } catch (err) {
      alert("쿠폰 목록을 불러오는 도중 오류가 발생했습니다.");
    } finally {
    }
  };

  // 검색 클릭 시 날짜 유효성 검사
  const handleSearchClick = () => {
    const { start_dt, end_dt } = searchData as any;
    if (start_dt && end_dt && end_dt < start_dt) {
      alert('적용 기간 종료일이 시작일보다 작을 수 없습니다.');
      return;
    }
    handleSearch();
  };

  // 쿠폰 목록 불러오기
  useEffect(() => {
    if (user && user.index) {
      selectCouponAppList(searchData);
    }
  }, [user]);

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">쿠폰 관리</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                navigate(`/app/couponApp/couponAppRegister`);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              등록
            </button>
            <button
              onClick={() => {
                deleteMembercouponApp();
              }}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              삭제
            </button>
          </div>
        </div>

        {/* 검색 필터 테이블 */}
        <div className="mb-6">
          <table className="w-full border border-gray-300">
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium w-1/6">브랜드 이름</td>
                <td className="border border-gray-300 p-2 w-2/6">
                  <input
                    type="text"
                    value={searchData.brand_name}
                    onChange={(e) => setSearchData({ ...searchData, brand_name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                    placeholder="이름을 입력하세요"
                  />
                </td>
                <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium w-1/6">상품 이름</td>
                <td className="border border-gray-300 p-2 w-2/6">
                  <input
                    type="text"
                    value={searchData.product_name}
                    onChange={(e) => setSearchData({ ...searchData, product_name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                    placeholder="이름을 입력하세요"
                  />
                </td>
              </tr>
              <tr>
              <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium">할인 금액</td>
                <td className="border border-gray-300 p-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={searchData.min_discount_amount}
                      onChange={(e) => handleAmountRangeChange('min_discount_amount', e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      placeholder="최소"
                    />
                    <span className="text-sm text-gray-500">~</span>
                    <input
                      type="text"
                      value={searchData.max_discount_amount}
                      onChange={(e) => handleAmountRangeChange('max_discount_amount', e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      placeholder="최대"
                    />
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="discount_type"
                        value="PERCENT"
                        onChange={(e) => setSearchData({ ...searchData, discount_type: e.target.value })}
                        className="mr-1"
                        placeholder="%"
                      />
                      <span className="text-sm">%</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="discount_type"
                        value="FIXED"
                        onChange={(e) => setSearchData({ ...searchData, discount_type: e.target.value })}
                        className="mr-1"
                        placeholder="원"
                      />
                      <span className="text-sm">원</span>
                    </label>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium w-1/6">최소 주문 금액</td>
                <td className="border border-gray-300 p-2">
                <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={searchData.min_order_amount}
                      onChange={(e) => handleAmountRangeChange('min_order_amount', e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      placeholder="최소"
                    />
                    <span className="text-sm text-gray-500">~</span>
                    <input
                      type="text"
                      value={searchData.max_order_amount}
                      onChange={(e) => handleAmountRangeChange('max_order_amount', e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      placeholder="최대"
                    />
                    <span className="text-sm text-gray-500">원</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border p-2 text-center bg-gray-200 font-medium">적용 기간</td>
                <td className="border p-2 flex items-center justify-between" onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target && target.tagName.toLowerCase() === 'input') return;
                  const firstInput = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement | null;
                  if (firstInput) openInputDatePicker(firstInput);
                }}>
                  <input
                    type="date"
                    value={searchData.start_dt}
                    onChange={(e) => setSearchData({ ...searchData, start_dt: e.target.value })}
                    onClick={(e) => openInputDatePicker(e.currentTarget)}
                    onFocus={(e) => openInputDatePicker(e.currentTarget)}
                    className="w-1/2 px-2 py-1 border cursor-pointer border-gray-300 rounded"
                  />
                  ~
                  <input
                    type="date"
                    value={searchData.end_dt}
                    onChange={(e) => setSearchData({ ...searchData, end_dt: e.target.value })}
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
              onClick={handleSearchClick}
              className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded bg-blue-600 hover:bg-blue-700`}
            >
              검색
            </button>
          </div>
        </div>

        {couponList.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>등록된 쿠폰 내역이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-start items-center mb-2">
              <p className="text-sm font-semibold">총 {filteredList.length}건</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="w-full h-16 border-b border-gray-200 bg-gray-200">
                    <th className="text-center px-4 w-12">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 cursor-pointer"
                        onChange={(e) => handleAllCheck(e.target.checked)}
                        checked={allChecked}
                      />
                    </th>
                    <th className="text-center pl-4 whitespace-nowrap">번호</th>
                    <th className="text-center whitespace-nowrap">브랜드 이름</th>
                    <th className="text-center whitespace-nowrap">상품 이름</th>
                    <th className="text-center whitespace-nowrap">할인 금액</th>
                    <th className="text-center whitespace-nowrap">할인 단위</th>
                    <th className="text-center whitespace-nowrap hidden md:table-cell">내용</th>
                    <th className="text-center whitespace-nowrap">상품 삭제 여부</th>
                    <th className="text-center whitespace-nowrap">최소 주문 금액</th>
                    <th className="text-center whitespace-nowrap">적용 기간</th>
                    <th className="text-center whitespace-nowrap">등록일</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCouponList.map((coupon, index) => {
                    const globalIndex = pagination.startIndex + index;
                    const checked = !!checkedItems[globalIndex];
                    return (
                    <tr
                      key={coupon.coupon_app_id}
                      className="h-16 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        navigate(`/app/couponApp/couponAppDetail?couponAppId=${coupon.coupon_app_id}`);
                      }}
                    >
                      <td
                        className="px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="form-checkbox h-5 w-5 cursor-pointer"
                          checked={checked}
                          onChange={(e) => handleIndividualCheck(globalIndex, e.target.checked)}
                        />
                      </td>
                      <td className="pl-4 text-center">{filteredList.length - globalIndex}</td>
                      <td className="text-center px-2 max-w-[100px] md:max-w-[200px]">
                        {coupon.product_app_id === 0 ? '전체 상품' : coupon.brand_name}
                      </td>
                      <td className="text-center px-2 max-w-[100px] md:max-w-[200px]">
                        {coupon.product_app_id === 0 ? '전체 상품' : coupon.title}
                      </td>
                      <td className="text-center px-2 max-w-[100px] md:max-w-[200px]">
                        {coupon.discount_amount.toLocaleString()}
                      </td>
                      <td className="text-center px-2 max-w-[150px] md:max-w-[200px]">
                        {coupon.discount_type === 'PERCENT' ? '%' : '원'}
                      </td>
                      <td className="text-center px-2 max-w-[200px] hidden md:table-cell">
                        <div style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {coupon.description}
                        </div>
                      </td>
                      <td className="text-center px-2">
                        {coupon.product_del_yn === 'Y' ? '삭제' : '미삭제'}
                      </td>
                      <td className="text-center px-2">
                        {coupon.min_order_amount.toLocaleString()}원
                      </td>
                      <td className="text-center hidden md:table-cell">
                        {coupon.start_dt} ~ <br /> {coupon.end_dt}
                      </td>
                      <td className="text-center hidden md:table-cell">
                        {coupon.reg_date} <br /> {coupon.reg_time}
                      </td>
                    </tr>
                  );})}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={pagination.currentPage}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={pagination.handlePageChange}
            />
          </>
        )}
      </div>
    </>
  );
};

export default MembercouponApp;
