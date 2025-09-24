import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../../store/store";
import { usePagination } from "../../../hooks/usePagination";
import { useSearch } from "../../../hooks/useSearch";
import Pagination from "../../../components/Pagination";
import { useCheckbox } from "../../../hooks/useCheckbox";

interface ProductApp {
  product_app_id: number;
  brand_name: string;
  big_category: string;
  small_category: string;
  product_name: string;
  title: string;
  price: number;
  original_price: number;
  discount: number;
  give_point: number;
  sell_start_dt: string;
  sell_end_dt: string;
  courier_code: string;
  delivery_fee: number;
  remote_delivery_fee: number;
  free_shipping_amount: number;
  inquiry_phone_number: string;
  today_send_yn: "Y" | "N";
  today_send_time: string;
  not_today_send_day: string;
  consignment_yn: "Y" | "N";
  view_yn: "Y" | "N";
  del_yn: "Y" | "N";
  reg_dt: string;
  reg_id: number;
  mod_dt: string;
  mod_id: number;
}

interface CommonCode {
  common_code: string;
  common_code_name: string;
  group_code: string;
}

const ProductAppList: React.FC = () => {
  const navigate = useNavigate();
  const [productsList, setProductsList] = useState<ProductApp[]>([]);
  const [commonCodes, setCommonCodes] = useState<CommonCode[]>([]);
  const user = useUserStore((state) => state.user);
  const { checkedItems, allChecked, handleAllCheck, handleIndividualCheck, resetCheckedItems } = useCheckbox(productsList.length);

  const pagination = usePagination({ totalItems: productsList.length, itemsPerPage: 10 });
  const currentProductsList = pagination.getCurrentPageData(productsList);

  // 상품 목록 조회 (검색 파라미터 반영)
  const getProductAppList = async (searchParams?: any) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/productApp/selectProductAppList`,
        { ...searchParams }
      );
      const list: ProductApp[] = response.data.result || response.data || [];
      setProductsList(list);
      resetCheckedItems();
      pagination.resetPage();
      // 상품 목록 기반으로 공통코드 로딩
      await getCommonCodeListByProducts(list);
    } catch (err) {
      console.error("상품 목록 로딩 오류:", err);
    }
  };

  // 공통코드 목록 가져오기 (이미 가져온 상품 목록을 활용)
  const getCommonCodeListByProducts = async (products: ProductApp[]) => {
    try {
      const uniqueBigCategories = [
        ...new Set(products.map((product: ProductApp) => product.big_category)),
      ];
      const groupCodes = [
        "PRODUCT_CATEGORY",
        ...uniqueBigCategories.map((category) => `${category}_CATEGORY`),
      ];
      const commonCodePromises = groupCodes.map((groupCode) =>
        axios.post(
          `${process.env.REACT_APP_API_URL}/app/common/selectCommonCodeList`,
          { group_code: groupCode }
        )
      );
      const commonCodeResponses = await Promise.all(commonCodePromises);
      const allCommonCodes = commonCodeResponses.flatMap(
        (response) => response.data.result
      );
      setCommonCodes(allCommonCodes);
    } catch (err) {
      console.error("공통코드 로딩 오류:", err);
    }
  };

  // 검색 공통 훅 사용
  const { searchData, setSearchData, handleSearch, handleReset } = useSearch({
    onSearch: getProductAppList,
    initialSearchData: {
      product_name: "",
      brand_name: "",
      big_category: "",
      small_category: "",
      consignment_yn: "",
      view_yn: "",
      min_price: "",
      max_price: "",
      min_discount: "",
      max_discount: "",
      min_point: "",
      max_point: "",
    },
  });

  // 일괄 삭제 처리
  const handleBatchDelete = async () => {
    const selectedProductIds = productsList
      .filter((_, index) => checkedItems[index])
      .map(product => product.product_app_id);

    if (selectedProductIds.length === 0) {
      alert("삭제할 상품을 선택해주세요.");
      return;
    }

    if (window.confirm("선택한 상품들을 삭제하시겠습니까?")) {
      try {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/app/productApp/deleteProductApp`,
          {
            product_app_id: selectedProductIds,
            user_id: user.index,
          }
        );
        
        // 목록 새로고침
        getProductAppList();
      } catch (err) {
        console.error("상품 삭제 오류:", err);
        alert("상품 일괄 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  useEffect(() => {
    getProductAppList();
  }, []);


  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">상품 관리</h2>
          <div className="flex gap-2">
            <button
              onClick={handleBatchDelete}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              삭제
            </button>
            <button
              onClick={() => navigate("/app/productApp/productAppRegister")}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              등록
            </button>
          </div>
        </div>

        {/* 검색 필터 테이블 */}
        <div className="mb-6">
          <table className="w-full border border-gray-300">
            <tbody>
              <tr>
                <td className="border border-gray-300 text-center bg-gray-200 font-medium w-1/6">상품명</td>
                <td className="border border-gray-300 p-3 w-2/6">
                  <input
                    type="text"
                    name="product_name"
                    value={searchData.product_name}
                    onChange={(e) => setSearchData({ ...searchData, product_name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                    placeholder="상품명을 입력하세요"
                  />
                </td>
                <td className="border border-gray-300 text-center bg-gray-200 font-medium w-1/6">브랜드명</td>
                <td className="border border-gray-300 p-3 w-2/6">
                  <input
                    type="text"
                    name="brand_name"
                    value={searchData.brand_name}
                    onChange={(e) => setSearchData({ ...searchData, brand_name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                    placeholder="브랜드명을 입력하세요"
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-3 text-center bg-gray-200 font-medium w-1/6">카테고리</td>
                <td className="border border-gray-300 p-3">
                  <div className="flex items-center  space-x-8">
                    <div className="flex items-center space-x-2">
                      <p>대분류 : </p>
                      <select
                        name="big_category"
                        value={searchData.big_category}
                        onChange={(e) => setSearchData({ ...searchData, big_category: e.target.value, small_category: "" })}
                        className="px-2 py-1 border border-gray-300 rounded bg-white"
                      >
                        <option value="">전체</option>
                        {commonCodes
                          .filter(code => code.group_code === 'PRODUCT_CATEGORY')
                          .map((code) => (
                            <option key={code.common_code} value={code.common_code}>
                              {code.common_code_name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <p>소분류 : </p>
                      <select
                        name="small_category"
                        value={searchData.small_category}
                        onChange={(e) => setSearchData({ ...searchData, small_category: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded bg-white"
                      >
                        <option value="">전체</option>
                        {commonCodes.filter(code => code.group_code === `${searchData.big_category}_CATEGORY`).map((code) => (
                          <option key={code.common_code} value={code.common_code}>
                            {code.common_code_name}
                          </option>
                        ))}
                        </select>
                    </div>
                  </div>
                </td>
                <td className="border border-gray-300 p-3 text-center bg-gray-200 font-medium">전시 여부</td>
                <td className="border border-gray-300 p-3">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="view_yn"
                        value=""
                        checked={searchData.view_yn === ''}
                        onChange={(e) => setSearchData({ ...searchData, view_yn: e.target.value })}
                        className="mr-1 cursor-pointer"
                      />
                      <span className="text-sm">전체</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="view_yn"
                        value="Y"
                        checked={searchData.view_yn === 'Y'}
                        onChange={(e) => setSearchData({ ...searchData, view_yn: e.target.value })}
                        className="mr-1 cursor-pointer"
                      />
                      <span className="text-sm">전시</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="view_yn"
                        value="N"
                        checked={searchData.view_yn === 'N'}
                        onChange={(e) => setSearchData({ ...searchData, view_yn: e.target.value })}
                        className="mr-1 cursor-pointer"
                      />
                      <span className="text-sm">미전시</span>
                    </label>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium w-1/6">가격</td>
                <td className="border border-gray-300 p-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={searchData.min_price}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, "");
                        setSearchData({ ...searchData, min_price: v });
                      }}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      placeholder="최소"
                      inputMode="numeric"
                    />
                    <span className="text-sm text-gray-500">~</span>
                    <input
                      type="text"
                      value={searchData.max_price}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, "");
                        setSearchData({ ...searchData, max_price: v });
                      }}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      placeholder="최대"
                      inputMode="numeric"
                    />
                    <span className="text-sm text-gray-500">원</span>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium w-1/6">할인율</td>
                <td className="border border-gray-300 p-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={searchData.min_discount}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        if (raw === "") {
                          setSearchData({ ...searchData, min_discount: "" });
                        } else {
                          const n = Math.max(0, Math.min(100, parseInt(raw, 10)));
                          setSearchData({ ...searchData, min_discount: String(n) });
                        }
                      }}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      placeholder="최소"
                      inputMode="numeric"
                    />
                    <span className="text-sm text-gray-500">~</span>
                    <input
                      type="text"
                      value={searchData.max_discount}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        if (raw === "") {
                          setSearchData({ ...searchData, max_discount: "" });
                        } else {
                          const n = Math.max(0, Math.min(100, parseInt(raw, 10)));
                          setSearchData({ ...searchData, max_discount: String(n) });
                        }
                      }}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      placeholder="최대"
                      inputMode="numeric"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 text-center bg-gray-200 font-medium w-1/6">포인트</td>
                <td className="border border-gray-300 p-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={searchData.min_point}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, "");
                        setSearchData({ ...searchData, min_point: v });
                      }}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      placeholder="최소"
                      inputMode="numeric"
                    />
                    <span className="text-sm text-gray-500">~</span>
                    <input
                      type="text"
                      value={searchData.max_point}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, "");
                        setSearchData({ ...searchData, max_point: v });
                      }}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      placeholder="최대"
                      inputMode="numeric"
                    />
                    <span className="text-sm text-gray-500">포인트</span>
                  </div>
                </td>
                <td className="border border-gray-300 p-3 text-center bg-gray-200 font-medium">위탁상품 여부</td>
                <td className="border border-gray-300 p-3">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="consignment_yn"
                        value=""
                        checked={searchData.consignment_yn === ''}
                        onChange={(e) => setSearchData({ ...searchData, consignment_yn: e.target.value })}
                        className="mr-1 cursor-pointer"
                      />
                      <span className="text-sm">전체</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="consignment_yn"
                        value="Y"
                        checked={searchData.consignment_yn === 'Y'}
                        onChange={(e) => setSearchData({ ...searchData, consignment_yn: e.target.value })}
                        className="mr-1 cursor-pointer"
                      />
                      <span className="text-sm">위탁 상품</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="consignment_yn"
                        value="N"
                        checked={searchData.consignment_yn === 'N'}
                        onChange={(e) => setSearchData({ ...searchData, consignment_yn: e.target.value })}
                        className="mr-1 cursor-pointer"
                      />
                      <span className="text-sm">자사 상품</span>
                    </label>
                  </div>
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded hover:bg-blue-700"
            >
              검색
            </button>
          </div>
        </div>

        {productsList.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>등록된 상품이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-semibold">총 {productsList.length}건</p>
              <p>아래 목록 클릭 시 상세 페이지로 이동합니다.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="w-full h-16 border-b border-gray-200 bg-gray-200">
                    <th className="text-center px-4 w-12">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5"
                        onChange={(e) => handleAllCheck(e.target.checked)}
                        checked={allChecked}
                      />
                    </th>
                    <th className="text-center pl-4 whitespace-nowrap">번호</th>
                    <th className="text-center whitespace-nowrap">대분류</th>
                    <th className="text-center whitespace-nowrap">소분류</th>
                    <th className="text-center whitespace-nowrap">브랜드명</th>
                    <th className="text-center whitespace-nowrap">상품명</th>
                    <th className="text-center whitespace-nowrap">가격</th>
                    <th className="text-center whitespace-nowrap">할인율</th>
                    <th className="text-center whitespace-nowrap">포인트</th>
                    <th className="text-center whitespace-nowrap">전시여부</th>
                    <th className="text-center whitespace-nowrap">위탁상품 여부</th>
                    <th className="text-center whitespace-nowrap">등록일</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProductsList.map((product, idx) => (
                    <tr
                      key={product.product_app_id}
                      className="h-16 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/app/productApp/productAppDetail?product_app_id=${product.product_app_id}`)}
                    >
                      <td
                        className="px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="form-checkbox h-5 w-5"
                          checked={checkedItems[idx] || false}
                          onChange={(e) => handleIndividualCheck(idx, e.target.checked)}
                        />
                      </td>
                      <td className="pl-4 text-center">{productsList?.length - idx}</td>
                      <td className="text-center whitespace-nowrap">
                        {commonCodes.find(c => c.group_code === 'PRODUCT_CATEGORY' && c.common_code === product.big_category)?.common_code_name ?? product.big_category}
                      </td>
                      <td className="text-center whitespace-nowrap">
                        {commonCodes.find(c => c.group_code === `${product.big_category}_CATEGORY` && c.common_code === product.small_category)?.common_code_name ?? product.small_category}
                      </td>
                      <td className="text-center px-2 md:table-cell">
                        {product.brand_name}
                      </td>
                      <td className="text-center px-2 max-w-[100px] md:max-w-[100px] truncate">
                        {product.product_name}
                      </td>
                      <td className="text-center px-2 md:table-cell">
                        {product.price.toLocaleString()}
                      </td>
                      <td className="text-center hidden md:table-cell">
                        {product.discount.toLocaleString()}
                      </td>
                      <td className="text-center hidden md:table-cell">
                        {product.give_point ? product.give_point : 0}
                      </td>
                      <td className="text-center hidden md:table-cell">
                        {product.view_yn === "Y" ? "전시" : "미전시"}
                      </td>
                      <td className="text-center hidden md:table-cell">
                        {product.consignment_yn === "Y" ? "위탁 상품" : "자사 상품"}
                      </td>
                      <td className="text-center whitespace-nowrap">
                        {product.reg_dt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {/* 페이지네이션 */}
        {productsList.length > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={pagination.handlePageChange}
          />
        )}
      </div>
    </>
  );
};

export default ProductAppList;
