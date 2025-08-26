import React, { useState } from "react";
import axios from "axios";
import { convertAmount, removeNonNumeric } from "../utils/formatUtils";
import { useUserStore } from "../store/store";
import { Product } from "../utils/types";

interface ModalProps {
  setModalToggle: React.Dispatch<React.SetStateAction<boolean>>;
  selectedProduct: Product;
  mode: String;
  fetchData: () => Promise<void>;
}

const AddProductModal: React.FC<ModalProps> = ({
  setModalToggle,
  selectedProduct,
  mode,
  fetchData,
}) => {
  const user = useUserStore((state) => state.user);
  const [product, setProduct] = useState<Product>({
    pro_name: mode === "add" ? "" : selectedProduct?.pro_name,
    pro_months: mode === "add" ? 0 : selectedProduct?.pro_months,
    pro_week: mode === "add" ? 0 : selectedProduct?.pro_week,
    pro_remaining_counts:
      mode === "add" ? 0 : selectedProduct?.pro_remaining_counts,
    pro_price: mode === "add" ? 0 : selectedProduct?.pro_price,
    pro_type: mode === "add" ? "" : selectedProduct?.pro_type,
    pro_class: mode === "add" ? "" : selectedProduct?.pro_class,
  });
  const [confirm, setConfirm] = useState<Boolean>(false);

  const isProductValid = (): boolean => {
    if (product.pro_type === "개월권") {
      return (
        product.pro_name !== "" &&
        product.pro_months !== 0 &&
        product.pro_class !== ""
      );
    }

    if (product.pro_type === "주간권") {
      return (
        product.pro_name !== "" &&
        product.pro_week !== 0 &&
        product.pro_class !== ""
      );
    }

    if (product.pro_type === "회차권") {
      // 주간권에서만 입력하는 필드 목록 (예: "week_start", "week_end")
      const excludeFields = ["pro_week", "pro_price"];

      return Object.entries(product).every(([key, value]) => {
        // 제외할 필드는 건너뛴다.
        if (excludeFields.includes(key)) return true;

        // 나머지 필드는 기존 유효성 검사 적용
        return value !== 0 && value !== "";
      });
    }

    return false; // 기본적으로 유효하지 않음
  };

  const addProduct = async () => {
    if (!isProductValid()) {
      setConfirm(false);
      return alert("판매가를 제외한 입력칸을 다 채워주세요.");
    }

    try {
      if (mode === "add") {
        await axios.post(`${process.env.REACT_APP_API_URL}/product`, [
          product,
          user.center_id,
        ]);
      } else if (mode === "edit") {
        await axios.patch(
          `${process.env.REACT_APP_API_URL}/product/${selectedProduct?.pro_id}`,
          product
        );
      } else {
        return alert("다시 시도하시기 바랍니다.");
      }
      setModalToggle(false);
      fetchData();
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div
      id="add-product-modal"
      className="overflow-y-auto
      overflow-x-hidden
      fixed top-0 right-0 left-0 z-50 justify-center items-center w-full inset-0 max-h-full"
    >
      <div className="fixed top-0 right-0 left-0 w-full max-h-full min-h-screen md:inset-0 bg-black opacity-50"></div>
      <div className="absolute bottom-0 bg-white animate-openModalMobile sm:animate-openModalPC w-full sm:w-auto lg:w-full lg:max-w-screen-sm sm:h-full sm:min-h-screen sm:top-0 right-0 z-80">
        {/* Modal content */}
        <div className="relative">
          {/* Modal header */}
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
            <h3 className="text-xl font-semibold text-gray-900">
              회원권 {mode === "add" ? "등록" : "수정"}
            </h3>
            <button
              type="button"
              className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
              data-modal-hide="authentication-modal"
              onClick={() => setModalToggle(false)}
            >
              <svg
                className="w-3 h-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                />
              </svg>
              <span className="sr-only">Close modal</span>
            </button>
          </div>
          {/* Modal body  */}
          <div className="p-4 md:p-5 flex flex-col items-center">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500">
              <tbody>
                <tr className="border-b border-gray-200 h-12">
                  <th
                    scope="row"
                    className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                  >
                    상품명
                  </th>
                  <td className="px-6 py-2 bg-white text-black max-w-52">
                    <input
                      type="text"
                      id="product"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-1.5"
                      placeholder="상품명 입력"
                      required
                      value={product.pro_name}
                      onChange={(e) =>
                        setProduct({ ...product, pro_name: e.target.value })
                      }
                    />
                  </td>
                </tr>

                <tr className="border-b border-gray-200 h-12">
                  <th
                    scope="row"
                    className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                  >
                    회원권형태
                  </th>
                  <td className="px-6 py-2 text-black">
                    <div className="flex">
                      <div className="flex items-center mr-6">
                        <input
                          id="product-times"
                          type="radio"
                          value="회차권"
                          name="product-type"
                          defaultChecked={product.pro_type === "회차권"}
                          disabled={mode === "edit"}
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                          onClick={(e: React.MouseEvent<HTMLElement>) =>
                            setProduct({
                              ...product,
                              pro_type: (e.target as HTMLButtonElement).value,
                            })
                          }
                        />
                        <label
                          htmlFor="product-times"
                          className="ms-1 text-sm font-medium text-gray-900"
                        >
                          회차권
                        </label>
                      </div>
                      <div className="flex items-center mr-6">
                        <input
                          id="product-month"
                          type="radio"
                          value="개월권"
                          name="product-type"
                          defaultChecked={product.pro_type === "개월권"}
                          disabled={mode === "edit"}
                          onClick={(e: React.MouseEvent<HTMLElement>) =>
                            setProduct({
                              ...product,
                              pro_type: (e.target as HTMLButtonElement).value,
                            })
                          }
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                        />
                        <label
                          htmlFor="product-month"
                          className="ms-1 text-sm font-medium text-gray-900"
                        >
                          개월권
                        </label>
                      </div>
                      <div className="flex items-center mr-6">
                        <input
                          id="product-week"
                          type="radio"
                          value="주간권"
                          name="product-type"
                          defaultChecked={product.pro_type === "주간권"}
                          disabled={mode === "edit"}
                          onClick={(e: React.MouseEvent<HTMLElement>) =>
                            setProduct({
                              ...product,
                              pro_type: (e.target as HTMLButtonElement).value,
                            })
                          }
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                        />
                        <label
                          htmlFor="product-week"
                          className="ms-1 text-sm font-medium text-gray-900"
                        >
                          주간권
                        </label>
                      </div>
                    </div>
                  </td>
                </tr>

                <tr className="border-b border-gray-200 h-12">
                  <th
                    scope="row"
                    className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                  >
                    판매가
                  </th>
                  <td className="px-6 py-2 bg-white text-black flex items-center">
                    <input
                      type="text"
                      id="price"
                      className="bg-gray-50 border border-gray-300 max-w-52 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-1.5"
                      placeholder="숫자만 입력하세요"
                      value={product.pro_price}
                      maxLength={10}
                      onChange={(e) =>
                        setProduct({
                          ...product,
                          pro_price: Number(removeNonNumeric(e.target.value)),
                        })
                      }
                    />
                    원
                  </td>
                </tr>
                <tr className="border-b border-gray-200 h-12">
                  <th
                    scope="row"
                    className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                  >
                    기간
                  </th>
                  <td className="px-6 py-2 bg-white text-black flex items-center">
                    <input
                      type="text"
                      id="months"
                      className="bg-gray-50 border border-gray-300 max-w-52 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-1.5"
                      maxLength={3}
                      value={
                        product.pro_type === "주간권"
                          ? product.pro_week
                          : product.pro_months
                      }
                      onChange={(e) =>
                        setProduct({
                          ...product,
                          [product.pro_type === "주간권"
                            ? "pro_week"
                            : "pro_months"]: Number(
                            removeNonNumeric(e.target.value)
                          ),
                        })
                      }
                    />
                    {product?.pro_type === "주간권" ? "주" : "개월"}
                  </td>
                </tr>
                {product.pro_type === "회차권" ? (
                  <tr className="border-b border-gray-200 h-12">
                    <th
                      scope="row"
                      className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                    >
                      횟수
                    </th>
                    <td className="px-6 py-2 bg-white text-black flex items-center">
                      <input
                        type="text"
                        id="counts"
                        className="bg-gray-50 border border-gray-300 max-w-52 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-1.5"
                        maxLength={3}
                        value={product.pro_remaining_counts}
                        onChange={(e) =>
                          setProduct({
                            ...product,
                            pro_remaining_counts: Number(
                              removeNonNumeric(e.target.value)
                            ),
                          })
                        }
                      />
                      회
                    </td>
                  </tr>
                ) : null}
                <tr className="h-12">
                  <th
                    scope="row"
                    className="text-center p-2 font-medium text-white whitespace-nowrap bg-custom-C4C4C4"
                  >
                    수업형태
                  </th>
                  <td className="px-6 py-2 text-black">
                    <div className="flex">
                      <div className="flex items-center mr-6">
                        <input
                          id="instructor"
                          type="radio"
                          value="강사"
                          name="class"
                          defaultChecked={product.pro_class === "강사"}
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                          onClick={(e: React.MouseEvent<HTMLElement>) =>
                            setProduct({
                              ...product,
                              pro_class: (e.target as HTMLButtonElement).value,
                            })
                          }
                        />
                        <label
                          htmlFor="instructor"
                          className="ms-1 text-sm font-medium text-gray-900"
                        >
                          강사
                        </label>
                      </div>
                      <div className="flex items-center mr-6">
                        <input
                          id="video"
                          type="radio"
                          value="영상"
                          name="class"
                          defaultChecked={product.pro_class === "영상"}
                          onClick={(e: React.MouseEvent<HTMLElement>) =>
                            setProduct({
                              ...product,
                              pro_class: (e.target as HTMLButtonElement).value,
                            })
                          }
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                        />
                        <label
                          htmlFor="video"
                          className="ms-1 text-sm font-medium text-gray-900"
                        >
                          영상
                        </label>
                      </div>
                      <div className="flex items-center mr-6">
                        <input
                          id="instructorAndVideo"
                          type="radio"
                          value="강사+영상"
                          name="class"
                          defaultChecked={product.pro_class === "강사+영상"}
                          onClick={(e: React.MouseEvent<HTMLElement>) =>
                            setProduct({
                              ...product,
                              pro_class: (e.target as HTMLButtonElement).value,
                            })
                          }
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                        />
                        <label
                          htmlFor="instructorAndVideo"
                          className="ms-1 text-sm font-medium text-gray-900"
                        >
                          강사 + 영상
                        </label>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="p-5">
              <button
                type="button"
                className="block rounded-full bg-green-600 px-10 py-3 text-center text-sm text-white font-extrabold shadow-sm hover:text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                onClick={() => setConfirm(true)}
              >
                {mode === "add" ? "등록" : "수정"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* 확인 모달 */}
      <div
        tabIndex={-1}
        className={`${
          confirm ? "block" : "hidden"
        } overflow-y-auto overflow-x-hidden flex justify-center z-50 w-full md:inset-0 h-modal md:h-full`}
      >
        <div className="relative p-4 w-full max-w-md h-full md:h-auto">
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
              className="w-11 h-11 mb-3.5 mx-auto text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 18"
            >
              <path d="M18 0H6a2 2 0 0 0-2 2h14v12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Z" />
              <path d="M14 4H2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2ZM2 16v-6h12v6H2Z" />
            </svg>
            <p className="mb-4 text-gray-500">회원권 정보가 일치합니까?</p>
            <p className="mb-1 text-gray-500">상품명 : {product.pro_name}</p>
            <p className="mb-1 text-gray-500">
              판매가 : {convertAmount(Number(product.pro_price))}원
            </p>
            <p className="mb-1 text-gray-500">
              기간 :{" "}
              {product.pro_type === "주간권"
                ? `${product.pro_week}주`
                : `${product.pro_months}개월`}
            </p>
            {product.pro_type === "회차권" ? (
              <p className="mb-1 text-gray-500">
                기간 : {product.pro_remaining_counts}회
              </p>
            ) : null}
            <p className="mb-4 text-gray-500">
              회원권 형태 : {product.pro_type}
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
                onClick={addProduct}
              >
                {mode === "add" ? "네. 등록할게요" : "네. 수정할게요"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;
