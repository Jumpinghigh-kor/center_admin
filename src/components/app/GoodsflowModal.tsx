import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUserStore } from '../../store/store';

interface Order {
  mem_id: string;
  mem_name: string;
  mem_birth: string;
  mem_phone: string;
  mem_app_id: string;
  order_app_id: number;
  order_detail_app_id: number;
  order_status: string;
  order_quantity: number;
  add_order_quantity: number;
  tracking_number: string;
  order_dt: string;
  order_memo: string;
  order_memo_dt: string;
  memo_check_yn: string;
  memo_del_yn: string;
  payment_app_id: number;
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
  return_type: string;
  return_status: string;
  delivery_fee: number;
  products?: Order[];
  free_shipping_amount: number;
  order_courier_code: string;
  extra_zip_code: string;
  remote_delivery_fee: number;
  point_minus: number;
}

// 굿스플로 API 응답 인터페이스
interface GoodsflowResponse {
  transactionId: string;
  success: boolean;
  data: {
    totalCnt: number;
    successCnt: number;
    failCnt: number;
    items: Array<{
      idx: number;
      success: boolean;
      data?: {
        uniqueId: string;
        serviceId: string;
      };
      error?: {
        message: string;
        detail: any;
      };
    }>;
  };
  error?: {
    message: string;
    detail: any;
  };
  responseDateTime: string;
}

interface GoodsflowModalProps {
  selectedOrders: Order[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const GoodsflowModal: React.FC<GoodsflowModalProps> = ({ 
  selectedOrders, 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(true);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const user = useUserStore((state) => state.user);
   
  useEffect(() => {
    if (isOpen) {
      setShowConfirmation(true);
      setIsLoading(false);
      setErrorMessage('');
    }
  }, [isOpen]);

  const handleGoodsflowIntegration = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      // 현재 시간을 기반으로 requestId 생성
      const now = new Date();
      const requestId = `REQ-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      
      const orderAppIdByItemIndex: number[] = [];
      const itemsList = selectedOrders.flatMap((order, orderIndex) => {
        const year = order.order_dt.substring(0, 4);
        const month = order.order_dt.substring(4, 6);
        const day = order.order_dt.substring(6, 8);
        const hour = order.order_dt.substring(8, 10);
        const minute = order.order_dt.substring(10, 12);
        const millisecond = now.getMilliseconds().toString().padStart(3, '0');
        const uniqueId = `webhook-${order.order_dt}${millisecond}${order.order_app_id}`;

        // 주문에 여러 상품이 있는 경우 처리
        const products = order.products && order.products.length > 0 ? order.products : [order];
        
                 // 상품별로 다른 부분만 반복
         const deliveryItems = products.map((product, productIndex) => {
           // 상품 옵션 정보 생성
           const itemGender = product.option_gender === 'W' ? '여성' : product.option_gender === 'M' ? '남성' : product.option_gender === 'A' ? '공용' : '';
           const optionText = `${product.option_amount ? product.option_amount : ''} ${product.option_unit !== 'NONE_UNIT' ? product.option_unit : ''} ${itemGender ? itemGender : ''}`;

           return {
             orderNo: `${order.order_dt}${order.order_app_id}`,
             orderDate: `${year}-${month}-${day} ${hour}:${minute}`,
             name: product.product_name,
             quantity: product.order_quantity,
             price: product.price,
             code: `${product.product_app_id}`,
             option: optionText
           };
         });

         const item = {
           centerCode: "1000011886",
           uniqueId: uniqueId,
           boxSize: "B10",
           transporter: "KOREX",
           fromName: "점핑하이",
           fromPhoneNo: "07050554754",
           fromAddress1: "서울 강서구 마곡서로 133",
           fromAddress2: "704동 202호, 203호, 204호",
           fromZipcode: "07798",
           toName: order.receiver_name,
           toPhoneNo: order.receiver_phone,
           toAddress1: order.address,
           toAddress2: order.address_detail,
           toZipcode: order.zip_code,
           deliveryMessage: order.delivery_request,
           consumerName: order.mem_name,
           consumerPhoneNo: order.mem_phone,
           deliveryPaymentMethod: "SENDER_PAY",
           deliveryItems: deliveryItems
         };
         
         return item;
      });

      const items = itemsList.flat();

      // 요청 순서와 상세 주문 ID 매핑 저장
      items.forEach((_item, idx) => {
        const correspondingOrder = selectedOrders[idx];
        if (correspondingOrder) {
          const products = correspondingOrder.products && correspondingOrder.products.length > 0
            ? correspondingOrder.products
            : [correspondingOrder as any];
          const detailIds = products
            .map((p: any) => p?.order_detail_app_id)
            .filter((id: any) => typeof id === 'number');
          // @ts-ignore keep legacy var name but store array
          orderAppIdByItemIndex.push(detailIds as number[]);
        }
      });
      
      const requestData = {
        requestId: requestId,
        contractType: "USER",
        items: items
      };

      // 굿스플로 API 호출 (백엔드 프록시를 통해) - 물품정보분리 API
      const response = await axios.post<GoodsflowResponse>(
        `${process.env.REACT_APP_API_URL}/app/goodsflow/shipping/print/deliveryItems`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // 디버그: 응답 전체 로깅
      console.log('[GF] response.success:', response.data?.success);
      console.log('[GF] response.data:', response.data?.data);
      console.log('[GF] response.error:', response.data?.error);
      if (response?.data?.data?.items) {
        response.data.data.items.forEach((it) => {
          if (!it.success) {
            console.warn('[GF] item error:', {
              idx: it.idx,
              message: it.error?.message,
              detail: it.error?.detail
            });
          }
        });
      }

      if (response.data.success) {
        const { totalCnt, successCnt, failCnt } = response.data.data;
        
        if (failCnt > 0) {
          // 일부 실패한 경우
          const failedItems = response.data.data.items.filter(item => !item.success);
          const errorDetails = failedItems.map(item => {
            const detailText = typeof item.error?.detail === 'string'
              ? item.error?.detail
              : JSON.stringify(item.error?.detail || {});
            return `주문 ${item.idx + 1}: ${item.error?.message || '알 수 없는 오류'} (${detailText})`;
          }).join(', ');
          
            setErrorMessage(`일부 주문 처리에 실패했습니다. (성공: ${successCnt}, 실패: ${failCnt}) ${errorDetails}`);
          } else {
           // 모든 주문이 성공한 경우
           
           // 성공한 주문들의 serviceId 추출 및 DB 반영
           const successfulItems = response.data.data.items.filter(item => item.success && item.data?.serviceId);
           const serviceIds = successfulItems.map(item => item.data!.serviceId);

           try {
             if (successfulItems.length > 0 && user?.index) {
               await Promise.all(successfulItems.map(async (item) => {
                 const mappedOrderAppId = orderAppIdByItemIndex[item.idx];
                 if (mappedOrderAppId && item.data?.serviceId) {
                   // EXCHANGE 계열은 반품과 동일하게 return_goodsflow_id에 저장
                   const isExchange = String((selectedOrders[0]?.order_status || '')).toUpperCase().startsWith('EXCHANGE');
                   if (isExchange) {
                     await axios.post(
                       `${process.env.REACT_APP_API_URL}/app/memberReturnApp/updateReturnGoodsflowId`,
                       {
                         order_detail_app_id: Array.isArray(mappedOrderAppId) ? mappedOrderAppId : [mappedOrderAppId],
                         return_goodsflow_id: item.data.serviceId,
                         userId: user.index
                       }
                     );
                   } else {
                     await axios.post(
                       `${process.env.REACT_APP_API_URL}/app/memberOrderApp/updateGoodsflowId`,
                       {
                         order_detail_app_id: Array.isArray(mappedOrderAppId) ? mappedOrderAppId : [mappedOrderAppId],
                         goodsflow_id: item.data.serviceId,
                         userId: user.index
                       }
                     );
                   }
                 }
               }));
             }
           } catch (error) {
             console.error('굿스플로 ID 저장 오류:', error);
           }
           
           if (serviceIds.length > 0) {
             // 송장출력 URI 생성 API 호출
             try {
               const printUriResponse = await axios.put(
                 `${process.env.REACT_APP_API_URL}/app/goodsflow/shipping/print-uri`,
                 serviceIds,
                 {
                   headers: {
                     'Content-Type': 'application/json'
                   }
                 }
               );
               
               if (printUriResponse.data.success && printUriResponse.data.data?.uri) {
                 // 생성된 URI로 송장출력 페이지 열기
                 window.open(printUriResponse.data.data.uri, '_blank', 'width=1300,height=770');
               }
             } catch (error) {
               console.error('송장출력 URI 생성 오류:', error);
             }
           }

           // DB 반영이 완료된 후에 목록 새로고침 및 모달 닫기 호출
           try {
             onSuccess();
           } finally {
             onClose();
           }
         }
      } else {
        // API 응답 자체가 실패한 경우
        setErrorMessage(response.data.error?.message || '굿스플로 연동 중 오류가 발생했습니다.');
      }

    } catch (error) {
      console.error('굿스플로 연동 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4 shadow-2xl">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-4">
            {showConfirmation ? `${selectedOrders.length}건을 송장등록 처리할까요?` : "송장등록 - 굿스플로"}
          </h3>
          
          {isLoading ? (
            <div className="py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">굿스플로와 연동 중입니다...</p>
            </div>
          ) : errorMessage ? (
            <div className="py-4">
              <div className="bg-red-50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-sm font-medium text-red-800">{errorMessage}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                닫기
              </button>
            </div>
          ) : showConfirmation ? (
            <div className="py-2">
              <p className="text-sm text-left text-gray-600 mb-4">
                선택한 주문의 상태를 한번에 변경할 수 있어요.
              </p>
              
              {/* 굿스플로 계정 정보 */}
              <div>
                <div className="text-left">
                  <label className="block text-sm font-medium mb-2">굿스플로 계정</label>
                  <div 
                    className="flex justify-between items-center w-full border border-gray-300 rounded-lg p-2 text-sm cursor-pointer"
                    onClick={() => setShowAccountDetails(!showAccountDetails)}
                  >
                    <p className="truncate">(07798) 서울 강서구 마곡서로 133 (마곡동, 마곡엠 밸리7단지), 704동 202호, 203호, 204호</p>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 transition-transform duration-200 ${showAccountDetails ? 'rotate-180' : ''}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                  {showAccountDetails && (
                    <div className="cursor-pointer absolute mt-2 bg-white rounded-lg p-2 text-sm z-10 border border-gray-300 shadow-lg" onClick={() => setShowAccountDetails(false)}>
                      <div className='bg-gray-100 p-2 rounded-lg'>
                        <p className="font-medium">CJ대한통운</p>
                        <p>(07798) 서울 강서구 마곡서로 133 (마곡동, 마곡엠 밸리7단지), 704동 202호, 203호, 204호</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-7">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    handleGoodsflowIntegration();
                  }}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg"
                >
                  송장등록 처리
                </button>
              </div>
            </div>
          ) : (
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-4">
                선택된 {selectedOrders.length}개의 주문을 굿스플로와 연동합니다.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 rounded hover:bg-gray-300 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoodsflowModal; 