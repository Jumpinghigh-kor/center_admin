import React from 'react';

interface OrderDetail {
  mem_id: string;
  mem_name: string;
  mem_birth: string;
  mem_phone: string;
  mem_email_id: string;
  order_app_id: number;
  order_status: string;
  order_quantity: number;
  tracking_number: string;
  order_dt: string;
  order_memo: string;
  order_memo_dt: string;
  memo_check_yn: string;
  memo_del_yn: string;
  payment_status: string;
  payment_method: string;
  payment_amount: number;
  portone_imp_uid: string;
  portone_merchant_uid: string;
  portone_status: string;
  card_name: string;
  reg_dt: string;
  brand_name: string;
  product_name: string;
  price: number;
  original_price: number;
  discount: number;
  give_point: number;
  courier_code: string;
  shipping_address_id: number;
  shipping_address_name: string;
  receiver_name: string;
  receiver_phone: string;
  address: string;
  address_detail: string;
  delivery_request: string;
  zip_code: string;
  option_type: string;
  option_amount: number;
  option_unit: string;
  option_gender: string;
  product_app_id: number;
  delivery_fee: number;
  extra_zip_code: string;
  remote_delivery_fee: number;
  free_shipping_amount: number;
  products?: any[];
  point_use_amount: number;
  point_refund_amount: number;
}

interface OrderPrintModalProps {
  orderDetail: OrderDetail | OrderDetail[] | null;
  isOpen: boolean;
  onClose: () => void;
}

const OrderPrintModal: React.FC<OrderPrintModalProps> = ({ orderDetail, isOpen, onClose }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return `${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)} ${dateString.substring(8, 10)}:${dateString.substring(10, 12)}:${dateString.substring(12, 14)}`;
  };

  const handlePrint = () => {
    window.print();
  };
  
  if (!isOpen || !orderDetail) return null;

  // 주문 배열로 변환 (단일 주문인 경우 배열로 변환)
  const orders = Array.isArray(orderDetail) ? orderDetail : [orderDetail];
  console.log(orders.length, orders.map(o => o.order_dt + o.order_app_id))
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-[800px] max-h-[90vh] overflow-y-auto">
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * {
                visibility: hidden;
              }
              .print-content, .print-content * {
                visibility: visible;
              }
              .print-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
              .no-print {
                display: none !important;
              }
            }
          `
        }} />

        {/* 헤더 */}
        <div className="print-content p-8">
          {orders.map((order, orderIndex) => {
            // 총합 계산
            const totalPrice = (order.products || []).reduce((sum, product) => {
              return sum + (product.order_quantity * product.original_price);
            }, 0);

            return (
              <div key={order.order_app_id} className={orderIndex > 0 ? "mt-20" : ""}>
                {/* 회사 정보 */}
                <div className="text-left mb-8">
                  <h1 className="text-2xl font-bold mb-2">점핑하이 - 점핑코리아</h1>
                </div>

                {/* 주문 정보 */}
                <div className="gap-8">
                  {/* 왼쪽 컬럼 */}
                  <div>
                    {/* 주문 기본 정보 */}
                    <div className="mb-6">
                      <div className="flex items-center justify-start mb-2">
                        <p className='font-bold text-xs'>주문번호</p>
                        <p className='text-xs ml-10'>{order.order_dt}{order.order_app_id}</p>
                      </div>
                      <div className="flex items-center justify-start mb-2">
                        <p className='font-bold text-xs'>주문일자</p>
                        <p className="text-xs ml-10">{formatDate(order.order_dt)}</p>
                      </div>
                      <div className="flex items-center justify-start mb-2">
                        <p className='font-bold text-xs'>결제방법</p>
                        <p className="text-xs ml-10">{order.card_name}</p>
                      </div>
                    </div>

                    <div className='flex justify-between items-center'>
                      {/* 배송 정보 */}
                      <div className="mb-6">
                        <h3 className="font-bold text-xs mb-3">배송정보</h3>
                        <div className="space-y-1">
                          <p className="text-xs">{order.address}{order.address_detail}{order.zip_code ? `(${order.zip_code})` : ''}</p>
                          <p className="text-xs">{order.receiver_phone?.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}</p>
                          <p className="text-xs">{order.receiver_name}</p>
                        </div>
                      </div>

                      {/* 주문자 정보 */}
                      <div className="mb-6">
                        <h3 className="font-bold text-xs mb-3">주문자 정보</h3>
                        <div className="space-y-1">
                          <p className="text-xs">{order.mem_name}</p>
                          <p className="text-xs">{order.mem_email_id}</p>
                          <p className="text-xs">{order.mem_phone?.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}</p>
                        </div>
                      </div>
                    </div>

                    {/* 주문 내역 테이블 */}
                    <div className='flex justify-between items-center'>
                      <div className='w-full' style={{borderTop: '2px solid #000'}}>
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="font-bold text-left text-xs py-2 w-[15%]">주문 내역</th>
                              <th className="font-bold text-right text-xs py-2 w-[15%]">옵션</th>
                              <th className="font-bold text-right text-xs py-2 w-[30%]">주문상태</th>
                              <th className="font-bold text-left text-xs py-2 pl-4 w-[13.3%]">수량</th>
                              <th className="font-bold text-center text-xs py-2 w-[13.3%]">단가</th>
                              <th className="font-bold text-right text-xs py-2 w-[13.3%]">소계</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(order.products || []).map((product) => (
                              <tr className="border-b" key={product.order_app_id}>
                                <td className="py-2 text-xs font-bold text-left w-[15%]">{product.product_name}</td>
                                <td className="py-2 text-xs text-right w-[15%]">{product.option_gender == 'M' ? '남' : product.option_gender == 'W' ? '여' : '공용'} {product.option_unit}({product.option_amount})</td>
                                <td className="py-2 text-xs text-right w-[30%]">
                                  {product.order_status == 'PAYMENT_COMPLETE' ? '배송대기' :
                                                product.order_status == 'HOLD' ? '배송보류' :
                                                product.order_status == 'CANCEL_APPLY' ? '취소신청' :
                                                product.order_status == 'CANCEL_COMPLETE' ? '취소완료' :
                                                product.order_status == 'RETURN_APPLY' ? '반품신청' :
                                                product.order_status == 'RETURN_COMPLETE' ? '반품완료' :
                                                product.order_status == 'EXCHANGE_APPLY' ? '교환신청' :
                                                product.order_status == 'EXCHANGE_COMPLETE' ? '교환완료' :
                                                product.order_status == 'PURCHASE_CONFIRM' ? '구매확정' :
                                                product.order_status == 'SHIPPINGING' ? '배송중' :
                                                product.order_status == 'SHIPPING_COMPLETE' ? '배송완료' : ''}
                                </td>
                                <td className="py-2 pl-8 text-xs text-left w-[13.3%]">{product.order_quantity}</td>
                                <td className="py-2 text-xs text-center w-[13.3%]">{product.original_price.toLocaleString()}원</td>
                                <td className="py-2 text-xs text-right w-[13.3%]">{(product.original_price * product.order_quantity).toLocaleString()}원</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <div className='flex justify-between items-center'>
                        <div className='w-[62%]'></div>
                        <div className="w-[38%]">
                          <div className="flex justify-between border-b border-gray-200">
                            <p className='py-2 text-xs'>합계</p>
                            <p className="py-2 text-right text-xs">{totalPrice.toLocaleString()}원</p>
                          </div>
                          <div className="flex justify-between border-b border-gray-200">
                            <p className='py-2 text-xs'>배송비</p>
                            <p className="py-2 text-right text-xs">{!order.delivery_fee ? '0원' : order?.payment_amount >= order?.free_shipping_amount ? '0원' :  `${order.delivery_fee?.toLocaleString()}원`}</p>
                          </div>
                          {order?.point_use_amount &&
                            <div className="flex justify-between border-b border-gray-200">
                              <p className='py-2 text-xs'>포인트 사용</p>
                              <p className="py-2 text-right text-xs">-{order.point_use_amount?.toLocaleString()}원</p>
                            </div>
                          }
                          {order?.extra_zip_code &&
                            <div className="flex justify-between border-b border-gray-200">
                              <p className='py-2 text-xs'>도서산간 추가 배송비</p>
                              <p className="py-2 text-right text-xs">{order.remote_delivery_fee?.toLocaleString()}원</p>
                            </div>
                          }
                          <div className="flex justify-between">
                            <p className='py-2 text-xs'>회원 할인금액</p>
                            <p className="py-2 text-right text-xs">-{((totalPrice) - (order.payment_amount)).toLocaleString()}원</p>
                          </div>
                          <hr className="border-t-1 border-gray-200" />
                          <div className="flex justify-between font-bold">
                            <p className='py-2 text-xs'>결제금액</p>
                            <p className="py-2 text-right text-xs">{order.payment_amount?.toLocaleString()}원</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='w-full border-b-2 border-black' />

                {/* 하단 회사 정보 */}
                <div className="text-center mt-8">
                  <p className="font-bold text-xs mb-1">점핑하이 - 점핑코리아</p>
                  <p className="text-xs mb-1">서울 강서구 마곡서로 133 (마곡동, 마곡엠밸리7단지) 704동 2층</p>
                  <p className="text-xs">02-1661-0042 / jumpingkor@naver.com</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 하단 버튼 */}
        <div className="no-print p-2 border-t bg-gray-100 flex justify-center items-center">
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="bg-blue-600 text-white text-sm px-5 py-2 rounded hover:bg-blue-700"
            >
              인쇄
            </button>
            <button
              onClick={onClose}
              className="text-gray-700 bg-white text-sm px-5 py-2 rounded hover:bg-gray-400"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPrintModal; 