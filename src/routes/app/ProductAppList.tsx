import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../store/store";
import { useCheckbox } from "../../hooks/useCheckbox";

interface ProductApp {
  product_app_id: number;
  big_category: string;
  small_category: string;
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

  // 공통코드 목록 불러오기
  useEffect(() => {
    fetchCommonCodes();
  }, []);

  // 배너 목록 불러오기
  useEffect(() => {
    fetchProducts();
  }, []);

  // 공통코드 목록 가져오기
  const fetchCommonCodes = async () => {
    try {
      // 먼저 상품 목록을 가져와서 사용되는 big_category들을 확인
      const productsResponse = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/productApp/selectProductAppList`
      );
      
      const products = productsResponse.data.result;
      
      // 사용되는 big_category들에서 고유값 추출
      const uniqueBigCategories = [...new Set(products.map((product: ProductApp) => product.big_category))];
      
      // 필요한 그룹코드들 생성 (대분류 + 각 소분류)
      const groupCodes = [
        "PRODUCT_CATEGORY", // 대분류용
        ...uniqueBigCategories.map(category => `${category}_CATEGORY`) // 소분류용
      ];
      
      // 각 그룹코드별로 공통코드 가져오기
      const commonCodePromises = groupCodes.map(groupCode =>
        axios.post(
          `${process.env.REACT_APP_API_URL}/app/common/selectCommonCodeList`,
          { group_code: groupCode }
        )
      );
      
      const commonCodeResponses = await Promise.all(commonCodePromises);
      
      // 모든 결과 합치기
      const allCommonCodes = commonCodeResponses.flatMap(response => response.data.result);
      
      setCommonCodes(allCommonCodes);
    } catch (err) {
      console.error("공통코드 로딩 오류:", err);
    }
  };

  // 카테고리 코드로 카테고리명 찾기
  const getCategoryName = (categoryCode: string) => {
    const category = commonCodes.find(code => code.common_code === categoryCode);
    return category ? category.common_code_name : categoryCode;
  };

  // 소분류 카테고리명 찾기
  const getSmallCategoryName = (bigCategory: string, smallCategoryCode: string) => {
    const groupCode = `${bigCategory}_CATEGORY`;
    const smallCategory = commonCodes.find(code => 
      code.common_code === smallCategoryCode && 
      code.group_code === groupCode
    );
    return smallCategory ? smallCategory.common_code_name : smallCategoryCode;
  };

  // 상품 등록 페이지로 이동
  const handleRegisterClick = () => {
    navigate("/app/productApp/detail");
  };

  // 상품 수정 페이지로 이동
  const handleEditClick = (product: ProductApp) => {
    navigate(`/app/productApp/detail?product_app_id=${product.product_app_id}`, {
      state: { productData: product }
    });
  };

  // 배너 목록 새로고침
  const fetchProducts = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/productApp/selectProductAppList`
      );

      setProductsList(response.data.result);
      // 체크박스 선택 초기화
      resetCheckedItems();
    } catch (err) {
      console.error("상품 목록 로딩 오류:", err);
    }
  };

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
        // 선택된 각 상품 ID에 대해 deleteProductApp API 호출
        for (const productId of selectedProductIds) {
          await axios.post(
            `${process.env.REACT_APP_API_URL}/app/productApp/deleteProductApp`,
            {
              productAppId: productId,
              modId: user.index,
            }
          );
        }

        // 목록 새로고침
        fetchProducts();
        alert("선택한 상품들이 삭제되었습니다.");
      } catch (err) {
        console.error("상품 일괄 삭제 오류:", err);
        alert("상품 일괄 삭제 중 오류가 발생했습니다.");
      }
    }
  };

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
              일괄 삭제
            </button>
            <button
              onClick={handleRegisterClick}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              상품 등록
            </button>
          </div>
        </div>

        {productsList.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>등록된 상품이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="w-full h-16 border-b border-gray-200">
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
                  <th className="text-center whitespace-nowrap">제목</th>
                  <th className="text-center whitespace-nowrap hidden md:table-cell">
                    가격
                  </th>
                  <th className="text-center whitespace-nowrap hidden md:table-cell">
                    할인율
                  </th>
                  <th className="text-center whitespace-nowrap hidden md:table-cell">
                    포인트
                  </th>
                  <th className="text-center whitespace-nowrap">전시여부</th>
                  <th className="text-center whitespace-nowrap">등록일</th>
                </tr>
              </thead>
              <tbody>
                {productsList.map((product, idx) => (
                  <tr
                    key={product.product_app_id}
                    className="h-16 border-b border-gray-200 hover:bg-gray-50"
                    onClick={() => handleEditClick(product)}
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
                      {getCategoryName(product.big_category)}
                    </td>
                    <td className="text-center whitespace-nowrap">
                      {getSmallCategoryName(product.big_category, product.small_category)}
                    </td>
                    <td className="text-center px-2 max-w-[100px] md:max-w-[100px] truncate">
                      {product.title}
                    </td>
                    <td className="text-center px-2 md:table-cell">
                      {product.original_price.toLocaleString()}
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
                    <td className="text-center whitespace-nowrap">
                      {product.reg_dt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductAppList;
