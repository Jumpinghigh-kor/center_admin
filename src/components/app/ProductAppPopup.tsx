import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSearch } from "../../hooks/useSearch";
import { usePagination } from "../../hooks/usePagination";
import Pagination from "../Pagination";

interface ProductApp {
  product_app_id: number;
  brand_name: string;
  title: string;
  price: number;
  original_price: number;
}

interface ProductAppPopupProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProductId: number;
  onChangeSelected: (productId: number) => void;
  onConfirm: (payload: { product_app_id: number; title: string; brand_name: string }) => void;
}

const ProductAppPopup: React.FC<ProductAppPopupProps> = ({
  isOpen,
  onClose,
  selectedProductId,
  onChangeSelected,
  onConfirm,
}) => {
  const [productList, setProductList] = useState<ProductApp[]>([]);
  const [localSelectedId, setLocalSelectedId] = useState<number>(selectedProductId ?? -1);
  const [searchResetKey, setSearchResetKey] = useState<number>(0);

  // 페이지네이션
  const pagination = usePagination({ totalItems: productList.length, itemsPerPage: 10, initialPage: 1 });
  const currentProducts = useMemo(
    () => pagination.getCurrentPageData(productList),
    [productList, pagination.getCurrentPageData, pagination.startIndex, pagination.endIndex]
  );

  // 상품 목록 조회
  const selectProductAppList = async (params?: any) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/productApp/selectProductAppList`,
        {
          ...(params || {})
        }
      );
      
      setProductList(response.data.result);
    } catch (error) {
      console.error("상품 목록 조회 오류:", error);
      alert("상품 목록을 불러오는 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    selectProductAppList();
  }, []);

  useEffect(() => {
    setLocalSelectedId(selectedProductId ?? -1);
  }, [selectedProductId]);

  // 팝업이 열릴 때 초기화 처리
  useEffect(() => {
    if (isOpen) {
      setLocalSelectedId(selectedProductId ?? 0);
      setSearchResetKey((k) => k + 1); // 검색 컴포넌트 리셋 (remount)
      selectProductAppList({});
    }
  }, [isOpen, selectedProductId]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg p-8 max-w-5xl w-[90vw] h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">상품 선택</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 검색 영역 */}
        <ProductSearch key={searchResetKey} onSearch={selectProductAppList} />

        <div className="mt-10 mb-2 flex justify-between items-center">
          <p className="text-sm font-semibold">총 {productList.length}건</p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                if (localSelectedId === -1) {
                  alert("상품을 선택해주세요.");
                  return;
                }
                if (localSelectedId === 0) {
                  onConfirm({ product_app_id: 0, title: "", brand_name: "" });
                } else {
                  const sel = productList.find(p => p.product_app_id === localSelectedId);
                  if (sel) onConfirm({ product_app_id: sel.product_app_id, title: sel.title, brand_name: sel.brand_name });
                  else onConfirm({ product_app_id: 0, title: "", brand_name: "" });
                }
              }}
              className="px-4 py-2 text-white bg-green-700 rounded hover:bg-green-800 transition-colors cursor-pointer"
            >
              선택
            </button>
          </div>
        </div>
      
        {productList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">등록된 상품이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="w-full h-16 border-b border-gray-200 bg-gray-200">
                  <th className="text-center pl-4 whitespace-nowrap">번호</th>
                  <th className="text-center whitespace-nowrap">브랜드명</th>
                  <th className="text-center whitespace-nowrap">상품명</th>
                  <th className="text-center whitespace-nowrap">할인가</th>
                  <th className="text-center whitespace-nowrap">원가</th>
                  <th className="text-center whitespace-nowrap">선택</th>
                </tr>
              </thead>
              <tbody>
                <tr className="h-16 border-b border-gray-200 hover:bg-gray-50 cursor-pointer" onClick={() => { setLocalSelectedId(0); }}>
                  <td colSpan={5} className="text-center px-2">전체 상품</td>
                  <td className="text-center px-2">
                    <input
                      type="radio"
                      name="productSelect"
                      className="form-radio h-5 w-5"
                      checked={localSelectedId === 0}
                      onChange={() => { setLocalSelectedId(0); }}
                    />
                  </td>
                </tr>
                {currentProducts.map((product, index) => {
                  const globalIndex = pagination.startIndex + index;
                  return (
                  <tr key={product.product_app_id} className="h-16 border-b border-gray-200 hover:bg-gray-50 cursor-pointer" onClick={() => { setLocalSelectedId(product.product_app_id); }}>
                    <td className="pl-4 text-center">{productList.length - globalIndex}</td>
                    <td className="text-center px-2">{product.brand_name}</td>
                    <td className="text-center px-2">{product.title}</td>
                    <td className="text-center px-2">{product.price?.toLocaleString()}원</td>
                    <td className="text-center px-2">{product.original_price?.toLocaleString()}원</td>
                    <td className="text-center px-2">
                      <input
                        type="radio"
                        name="productSelect"
                        className="form-radio h-5 w-5"
                        checked={localSelectedId === product.product_app_id}
                        onChange={() => { setLocalSelectedId(product.product_app_id); }}
                      />
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
            <Pagination
              currentPage={pagination.currentPage}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={pagination.handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductAppPopup;



// 내부용 검색 컴포넌트 (공통 useSearch 사용)
const ProductSearch: React.FC<{ onSearch: (params?: any) => void }> = ({ onSearch }) => {
  const { searchData, setSearchData, handleSearch, handleReset } = useSearch({
    onSearch,
    initialSearchData: {
      brand_name: "",
      title: "",
    },
  });

  return (
    <div className="mb-4">
      <table className="w-full border border-gray-200">
        <tbody>
          <tr>
            <td className="bg-gray-100 px-3 py-2 text-center font-medium w-1/6">브랜드명</td>
            <td className="px-3 py-2 w-2/6">
              <input
                type="text"
                value={(searchData as any).brand_name}
                onChange={(e) => setSearchData({ ...(searchData as any), brand_name: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
                className="w-full px-2 py-1 border border-gray-300 rounded"
                placeholder="브랜드명"
              />
            </td>
            <td className="bg-gray-100 px-3 py-2 text-center font-medium w-1/6">상품명</td>
            <td className="px-3 py-2 w-2/6">
              <input
                type="text"
                value={(searchData as any).title}
                onChange={(e) => setSearchData({ ...(searchData as any), title: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
                className="w-full px-2 py-1 border border-gray-300 rounded"
                placeholder="상품명"
              />
            </td>
          </tr>
        </tbody>
      </table>
      <div className="flex justify-end gap-2 mt-3">
        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
        >
          초기화
        </button>
        <button
          type="button"
          onClick={handleSearch}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded hover:bg-blue-700"
        >
          검색
        </button>
      </div>
    </div>
  );
};

