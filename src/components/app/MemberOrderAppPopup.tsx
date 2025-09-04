import React, { useState, useEffect, useLayoutEffect } from 'react';
import axios from 'axios';
import CustomToastModal from '../CustomToastModal';

interface MemberOrderAppPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  orderDetailAppId: number[] | null;
  userId: number | null;
  onSuccess: (trackingNumber?: string, courierCode?: string, orderStatus?: string) => void;
  mode?: 'input' | 'delete'; // 추가: 입력 모드 또는 삭제 모드
  existingTrackingNumber?: string; // 기존 송장번호
  existingCourierCode?: string; // 기존 택배사 코드
  isShippingMode?: boolean; // 배송중 상태에서 수정 모드
}

interface CommonCode {
  common_code: string;
  group_code: string;
  common_code_name: string;
  common_code_memo: string;
}

const MemberOrderAppPopup: React.FC<MemberOrderAppPopupProps> = ({
  isOpen,
  onClose,
  onCancel,
  orderDetailAppId,
  userId,
  onSuccess,
  mode = 'input',
  existingTrackingNumber,
  existingCourierCode,
  isShippingMode = false
}) => {
  const [deliveryCompany, setDeliveryCompany] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [deliveryCompanyList, setDeliveryCompanyList] = useState<CommonCode[]>([]);
  const [isDeliveryDropdownOpen, setIsDeliveryDropdownOpen] = useState(false);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    const fetchDeliveryCompanies = async () => {
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/app/common/selectCommonCodeList`,
          {
            group_code: "DELIVERY_COMPANY"
          }
        );
        setDeliveryCompanyList(response.data.result || []);
      } catch (err) {
        console.error("택배사 목록 로딩 오류:", err);
      }
    };

    if (isOpen) {
      fetchDeliveryCompanies();
      // 팝업 열릴 때 값들 초기화
      setDeliveryCompany('');
      setInvoiceNumber('');
      setIsDeliveryDropdownOpen(false);
      // 이전 팝업 상태로 인해 토스트가 미리 뜨는 현상 방지
      setIsToastVisible(false);
      setMessage('');
    }
  }, [isOpen]);

  // 팝업 렌더 직전에 토스트 상태 초기화하여 플리커/선표시 방지
  useLayoutEffect(() => {
    if (isOpen) {
      setIsToastVisible(false);
      setMessage('');
    }
  }, [isOpen]);

  // 택배사 목록이 로드된 후 기존 값 설정
  useEffect(() => {
    if (!isOpen || deliveryCompanyList.length === 0) return;
    if (existingTrackingNumber && existingCourierCode) {
      setInvoiceNumber(existingTrackingNumber);
      const courierName = deliveryCompanyList.find(company => company.common_code === existingCourierCode)?.common_code_name || '';
      setDeliveryCompany(courierName);
    }
  }, [deliveryCompanyList, isOpen, existingTrackingNumber, existingCourierCode]);

  // 송장번호 업데이트 함수
  const updateTrackingNumber = async (trackingNumber: string, orderStatus: string, actionType: 'input_only' | 'shipping_process') => {
    try {
      // EXCHANGE_PAYMENT_COMPLETE(교환 배송비 결제완료) 상태에서는 회사 송장/택배사 정보를 교환 테이블에 저장
      const courier_code = deliveryCompanyList.find(company => company.common_code_name === deliveryCompany)?.common_code || '';
      let response;
      const isExchange = String(orderStatus || '').toUpperCase().startsWith('EXCHANGE');
      if (isExchange) {
        response = await axios.post(
          `${process.env.REACT_APP_API_URL}/app/memberReturnApp/updateExchangeCompanyTrackingInfo`,
          {
            order_detail_app_id: orderDetailAppId,
            company_tracking_number: trackingNumber,
            company_courier_code: courier_code,
            userId: userId,
          }
        );
      } else {
        response = await axios.post(
          `${process.env.REACT_APP_API_URL}/app/memberOrderApp/updateTrackingNumber`,
          {
            order_detail_app_id: orderDetailAppId,
            tracking_number: trackingNumber,
            order_status: orderStatus,
            userId: userId,
            courier_code,
          }
        );
      }

      // API 응답이 성공이면 처리
      if (response.data.success || response.status === 200) {
        try {
          if (actionType === 'shipping_process') {
            const nextStatus = isExchange ? 'EXCHANGE_SHIPPINGING' : 'SHIPPINGING';
            await axios.post(
              `${process.env.REACT_APP_API_URL}/app/memberOrderApp/updateOrderStatus`,
              {
                order_detail_app_id: orderDetailAppId,
                order_status: nextStatus,
                userId: userId,
              }
            );
          }
        } catch (e) {
          console.error('상태 변경 오류:', e);
        }
        setMessage("송장번호가 성공적으로 등록되었습니다.");
        const courierCode = courier_code;
        onSuccess(trackingNumber, courierCode, actionType);
        onClose();
        setIsToastVisible(true);
      }
    } catch (error) {
      console.error("송장번호 업데이트 오류:", error);
    }
  };

  // 송장번호 삭제 함수
  const deleteTrackingNumber = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/memberOrderApp/deleteTrackingNumber`,
        {
          order_detail_app_id: orderDetailAppId,
          userId: userId,
        }
      );
      
      if (response.data.success || response.status === 200) {
        setMessage("송장번호가 성공적으로 삭제되었습니다.");
        onSuccess('', '');
        onClose();
        setIsToastVisible(true);
      }
    } catch (error) {
      console.error("송장번호 삭제 오류:", error);
    }
  };

  if (!isOpen && !isToastVisible) return null;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-96 max-w-md mx-4">
          {mode === 'delete' ? (
            <>
              <h2 className="text-xl font-bold text-black mb-2">
                1건의 송장번호를 삭제할까요?
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                선택한 주문의 송장번호를 한번에 삭제할 수 있어요.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={deleteTrackingNumber}
                  className="px-4 py-2 text-white bg-gray-800 rounded-lg hover:bg-gray-700"
                >
                  송장번호 삭제
                </button>
              </div>
            </>
          ) : (
            // 입력 모드 UI
            <>
              <h2 className="text-xl font-bold text-black mb-6">
                송장번호를 입력해주세요
              </h2>

              <div className="space-y-4 mb-6">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="택배사"
                    value={deliveryCompany}
                    onChange={(e) => setDeliveryCompany(e.target.value)}
                    onClick={() => setIsDeliveryDropdownOpen(!isDeliveryDropdownOpen)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                    readOnly
                  />
                  {/* 택배사 드롭다운 */}
                  {isDeliveryDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                      {deliveryCompanyList.map((company) => (
                        <div
                          key={company.common_code}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setDeliveryCompany(company.common_code_name);
                            setIsDeliveryDropdownOpen(false);
                          }}
                        >
                          {company.common_code_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="송장번호를 입력해주세요"
                    value={invoiceNumber}
                    onChange={(e) => {
                      const value = e.target.value;
                      // 숫자만 허용
                      if (/^\d*$/.test(value)) {
                        setInvoiceNumber(value);
                      }
                    }}
                    onKeyPress={(e) => {
                      // 숫자가 아닌 키는 입력 방지
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center px-2">
                <button
                  onClick={onCancel}
                  className="font-medium text-sm"
                >
                  취소
                </button>
                <div>
                  {isShippingMode ? (
                    <button
                      onClick={() => updateTrackingNumber(invoiceNumber, 'SHIPPINGING', 'input_only')}
                      disabled={!invoiceNumber.trim()}
                      className={`py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
                        invoiceNumber.trim() 
                          ? 'bg-gray-800 text-white hover:bg-gray-700' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      송장번호 수정
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => updateTrackingNumber(invoiceNumber, 'PAYMENT_COMPLETE', 'input_only')}
                        disabled={!invoiceNumber.trim()}
                        className={`py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
                          invoiceNumber.trim() 
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        송장번호만 입력
                      </button>
                      <button
                        onClick={() => updateTrackingNumber(invoiceNumber, 'SHIPPINGING', 'shipping_process')}
                        disabled={!invoiceNumber.trim()}
                        className={`py-3 px-4 rounded-lg font-medium text-sm ml-2 transition-colors ${
                          invoiceNumber.trim() 
                            ? 'bg-gray-800 text-white hover:bg-gray-700' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        배송중 처리
                      </button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
          </div>
        </div>
      )}

      <CustomToastModal
        message={message}
        isVisible={isToastVisible}
        onClose={() => setIsToastVisible(false)}
      />  
    </>
  );
};

export default MemberOrderAppPopup; 