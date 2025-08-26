import React, { useCallback, useEffect, useState } from "react";
import AddProductModal from "../components/AddProductModal";
import axios from "axios";
import { useUserStore } from "../store/store";
import DeleteProductModal from "../components/DeleteProductModal";
import { convertAmount } from "../utils/formatUtils";
import { Product } from "../utils/types";

const initialProduct: Product = {
  pro_id: 0,
  pro_name: "",
  pro_type: "",
  pro_months: 0,
  pro_week: 0,
  pro_remaining_counts: 0,
  pro_price: 0,
  pro_class: "",
};

const Products: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const [deleteModalToggle, setDeleteModalToggle] = useState<boolean>(false);
  const [modalToggle, setModalToggle] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] =
    useState<Product>(initialProduct);
  const [mode, setMode] = useState<String>("");

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/product`, {
        params: user,
      });
      setSelectedProduct(initialProduct);
      setProducts(res.data.result);
    } catch (e) {
      console.log(e);
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      await fetchData();
    };

    loadData();
  }, [fetchData]);

  if (modalToggle || deleteModalToggle) {
    //모달 오픈시 스크롤 방지
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }

  return (
    <div className="p-3 sm:p-10">
      <div className="flex justify-between">
        <span className="font-bold text-xl">회원권 관리</span>
        <div className="flex row-auto">
          <button
            disabled={selectedProduct.pro_id === 0}
            className={`${
              selectedProduct.pro_id === 0
                ? "bg-gray-400"
                : "bg-blue-600 cursor-pointer hover:bg-blue-700"
            } block rounded-2xl mr-3 px-4 py-1 text-center text-sm text-white font-extrabold shadow-sm hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600`}
            onClick={() => {
              setMode("edit");
              setModalToggle(true);
            }}
          >
            수정
          </button>
          <button
            disabled={selectedProduct.pro_id === 0}
            onClick={() => {
              setDeleteModalToggle(true);
            }}
            className={`${
              selectedProduct.pro_id === 0
                ? "bg-gray-400"
                : "bg-red-600 cursor-pointer hover:bg-red-700"
            } block mr-3 rounded-2xl px-4 py-1 text-center text-sm text-white font-extrabold shadow-sm hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600`}
          >
            삭제
          </button>
          <button
            type="submit"
            className="block rounded-2xl bg-green-600 px-4 py-1 text-center text-sm  text-white font-extrabold shadow-sm hover:text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
            onClick={() => {
              setMode("add");
              setModalToggle(true);
            }}
          >
            등록
          </button>
        </div>
      </div>
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg my-4">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500">
          <thead className="text-xs text-white font-bold uppercase bg-custom-C4C4C4">
            <tr>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                상품명
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                회원권형태
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                수업형태
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                이용기간
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                횟수
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                금액
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr
                className={`${
                  selectedProduct?.pro_id === product.pro_id
                    ? `bg-gray-100`
                    : `bg-white`
                } border-b hover:bg-gray-50`}
                key={product.pro_id}
                onClick={() => setSelectedProduct(product)}
                onDoubleClick={() => {
                  setMode("edit");
                  setModalToggle(true);
                }}
              >
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {product.pro_name}
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {product.pro_type}
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {product.pro_class}
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {product.pro_type === "주간권"
                    ? `${product.pro_week}주`
                    : `${product.pro_months}개월`}
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {product.pro_type === "회차권"
                    ? `${product.pro_remaining_counts}회`
                    : null}
                </td>
                <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                  {convertAmount(product.pro_price)}원
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalToggle ? (
        <AddProductModal
          setModalToggle={setModalToggle}
          selectedProduct={selectedProduct}
          mode={mode}
          fetchData={fetchData}
        />
      ) : null}
      {deleteModalToggle ? (
        <DeleteProductModal
          setDeleteModalToggle={setDeleteModalToggle}
          product={selectedProduct}
          fetchData={fetchData}
        />
      ) : null}
    </div>
  );
};

export default Products;
