import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CustomToastModal from "../../../components/CustomToastModal";
import axios from "axios";
import { useUserStore } from "../../../store/store";
import { formatAmPmDate } from "../../../utils/formatUtils";


const MemberOrderAppReturn: React.FC = () => {

  const navigate = useNavigate();
  const location = useLocation();
  const { orderDetail, actionType, startStep, selectedOrderAppIds } = (location.state || {}) as any;
  const user = useUserStore((state) => state.user);
  const [quantityByIndex, setQuantityByIndex] = useState<Record<number, number>>({});
  const hasAnyQuantity = Object.values(quantityByIndex).some((v) => (v ?? 0) > 0);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [toastVariant, setToastVariant] = useState<'warning' | 'success'>('success');
  const [toastMessage, setToastMessage] = useState<string>("");
  const [returnReasonList, setReturnReasonList] = useState<any[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [orderStatusCodeList, setOrderStatusCodeList] = useState<any[]>([]);
  const [selectedReturnReasonType, setSelectedReturnReasonType] = useState<string>("");
  const [detailReason, setDetailReason] = useState<string>("");
  const [isAutoPickup, setIsAutoPickup] = useState<boolean>(true);
  const [pickupReceiverName, setPickupReceiverName] = useState<string>('');
  const [pickupReceiverPhone, setPickupReceiverPhone] = useState<string>('');
  const [pickupZipCode, setPickupZipCode] = useState<string>('');
  const [pickupRoadAddress, setPickupRoadAddress] = useState<string>('');
  const [pickupJibunAddress, setPickupJibunAddress] = useState<string>('');
  const [pickupDetailAddress, setPickupDetailAddress] = useState<string>('');
  const [isPickupDefaultAddress, setIsPickupDefaultAddress] = useState<boolean>(true);
  const [pickupEnterWay, setPickupEnterWay] = useState<string>('');
  const [pickupEnterMemo, setPickupEnterMemo] = useState<string>('');
  const [pickupDeliveryRequest, setPickupDeliveryRequest] = useState<string>('');

  const [isManualFinalRefundAmount, setIsManualFinalRefundAmount] = useState<boolean>(false);
  const [manualFinalRefundAmount, setManualFinalRefundAmount] = useState<number>(0);
  const [refundDeductionAmount, setRefundDeductionAmount] = useState<number>(0);
  const [pointDeductionAmount, setPointDeductionAmount] = useState<number>(0);
  const [refundDeliveryFee, setRefundDeliveryFee] = useState<number>(0);
  const isRefundCalcMode = startStep === 3 && step === 3;
  const [latestPointAmount, setLatestPointAmount] = useState<number | null>(null);
  const hasReturnApplySelected = useMemo(() => {
    try {
      return (orderDetail.products || []).some((item: any, idx: number) => {
        const qty = quantityByIndex[idx] ?? 0;
        if (qty <= 0) return false;
        const s = String(item?.order_status || '').trim().toUpperCase();
        return s === 'RETURN_APPLY';
      });
    } catch (_) {
      return false;
    }
  }, [orderDetail?.products, quantityByIndex]);
  // 취소완료 알림 발송
  const sendCancelCompleteNotification = async (memId: string | number, memName: string, productName: string) => {
    try {
      if (!memId || !memName || !productName) return;
      const title = `${memName}고객님께서 주문하신 ${productName} 상품이 취소 완료되었습니다.`;
      const content = '고객님의 주문이 취소 처리되었습니다. 환불 및 상세 정보는 취소•반품•교환 내역에서 확인하실 수 있습니다.';
      const postRes = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/postApp/insertPostApp`,
        {
          post_type: 'SHOPPING',
          title,
          content,
          all_send_yn: 'N',
          push_send_yn: 'Y',
          userId: user?.index,
          mem_id: String(memId),
        }
      );
      const postAppId = postRes.data?.postAppId;
      if (postAppId) {
        await axios.post(`${process.env.REACT_APP_API_URL}/app/postApp/insertMemberPostApp`, {
          post_app_id: postAppId,
          mem_id: memId,
          userId: user?.index,
        });
      }
    } catch (err) {
      console.error('취소완료 알림 발송 오류:', err);
    }
  };

  // 반품완료 알림 발송
  const sendReturnCompleteNotification = async (memId: string | number, memName: string, productName: string) => {
    try {
      if (!memId || !memName || !productName) return;
      const title = `${memName}고객님께서 주문하신 ${productName}상품이 반품 완료되었습니다.`;
      const content = '고객님의 반품이 처리되었습니다. 환불 및 상세 정보는 취소•반품•교환 내역에서 확인하실 수 있습니다.';
      const postRes = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/postApp/insertPostApp`,
        {
          post_type: 'SHOPPING',
          title,
          content,
          all_send_yn: 'N',
          push_send_yn: 'Y',
          userId: user?.index,
          mem_id: String(memId),
        }
      );
      const postAppId = postRes.data?.postAppId;
      if (postAppId) {
        await axios.post(`${process.env.REACT_APP_API_URL}/app/postApp/insertMemberPostApp`, {
          post_app_id: postAppId,
          mem_id: memId,
          userId: user?.index,
        });
      }
    } catch (err) {
      console.error('반품완료 알림 발송 오류:', err);
    }
  };


  useEffect(() => {
    const scriptId = 'daum-postcode-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      document.body.appendChild(script);
    }
  }, []);

  // 수거정보 초기 매핑: 주문 상세의 배송지 정보를 기본값으로 세팅
  useEffect(() => {
    if (actionType !== 'return' || !orderDetail) return;
    try {
      if (isPickupDefaultAddress) {
        setPickupReceiverName(orderDetail?.receiver_name || '');
        setPickupReceiverPhone(orderDetail?.receiver_phone || '');
        setPickupZipCode(orderDetail?.zip_code || '');
        setPickupRoadAddress(orderDetail?.address || '');
        setPickupJibunAddress('');
        setPickupDetailAddress(orderDetail?.address_detail || '');
        setPickupEnterWay(orderDetail?.enter_way || '');
        setPickupEnterMemo(orderDetail?.enter_memo || '');
        setPickupDeliveryRequest(orderDetail?.delivery_request || '');
      } else {
        setPickupReceiverName('');
        setPickupReceiverPhone('');
        setPickupZipCode('');
        setPickupRoadAddress('');
        setPickupJibunAddress('');
        setPickupDetailAddress('');
        setPickupEnterWay('');
        setPickupEnterMemo('');
        setPickupDeliveryRequest('');
      }
    } catch (e) {
      // ignore mapping errors
    }
  }, [actionType, orderDetail, isPickupDefaultAddress]);

  // Initialize step 3 flow when navigated from 취소승인
  useEffect(() => {
    if (startStep === 3) {
      setStep(3);
      if (orderDetail && Array.isArray(orderDetail.products) && Array.isArray(selectedOrderAppIds) && selectedOrderAppIds.length > 0) {
        const idList = selectedOrderAppIds.map((v: any) => Number(v)).filter((v: any) => !isNaN(v));
        const next: Record<number, number> = {};
        orderDetail.products.forEach((p: any, idx: number) => {
          const detailId = Number(p?.order_detail_app_id);
          const orderId = Number(p?.order_app_id);
          if ((!!detailId && idList.includes(detailId)) || (!!orderId && idList.includes(orderId))) {
            next[idx] = Number(p?.order_quantity) || 0;
          }
        });
        setQuantityByIndex(next);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startStep]);

  const handleSearchAddress = () => {
    const w: any = window as any;
    if (w.daum && w.daum.Postcode) {
      new w.daum.Postcode({
        oncomplete: (data: any) => {
          setPickupZipCode(data.zonecode || '');
          setPickupRoadAddress(data.roadAddress || '');
          setPickupJibunAddress(data.jibunAddress || '');
        },
      }).open();
    } else {
      alert('주소 검색 스크립트를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
    }
  };

  useEffect(() => {
    const fetchReturnReasons = async () => {
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/app/common/selectCommonCodeList`,
          { group_code: "RETURN_REASON_TYPE" }
        );
        setReturnReasonList(response.data.result || []);
      } catch (error) {
        console.error('반품 사유 코드 로딩 오류:', error);
      }
    };
    fetchReturnReasons();
  }, []);

  // 포인트 최신값 조회: 새로고침/재진입 시에도 서버 값 반영
  useEffect(() => {
    const fetchLatestPoint = async () => {
      try {
        if (!user?.index || !orderDetail?.order_app_id) return;
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/app/memberOrderApp/selectMemberOrderAppList`, {
          center_id: user.index,
          searchValue: String(orderDetail.order_app_id),
        });
        const rows = res.data?.orders || res.data || [];
        const target = Array.isArray(rows)
          ? rows.find((r: any) => String(r.order_app_id) === String(orderDetail.order_app_id)) || rows[0]
          : null;
        if (target && target.point_amount != null) {
          setLatestPointAmount(Number(target.point_amount));
        }
      } catch (e) {
        // ignore
      }
    };
    fetchLatestPoint();
  }, [user?.index, orderDetail?.order_app_id]);

  // 취소/반품 접수 처리 함수 (HTML에서 API 호출 제거)
  const fn_handleConfirm = async () => {
    try {
      if (actionType === 'cancel') {
        const orderAppIds: number[] = Array.from(new Set(
          (orderDetail?.products || [])
            .map((p: any, idx: number) => ({ p, idx }))
            .filter(({ p, idx }: { p: any; idx: number }) => (quantityByIndex[idx] ?? 0) > 0)
            .filter(({ p }: { p: any }) => !['SHIPPINGING', 'SHIPPING_COMPLETE', 'PURCHASE_CONFIRM'].includes(String(p?.order_status || '').trim().toUpperCase()))
            .map(({ p }: { p: any }) => p?.order_app_id)
            .filter((v: any) => v != null)
        ));
        const selectedItems = (orderDetail?.products || [])
          .map((item: any, idx: number) => ({ item, idx }))
          .filter(({ item, idx }: { item: any; idx: number }) => (quantityByIndex[idx] ?? 0) > 0)
          .filter(({ item }: { item: any }) => !['SHIPPINGING', 'SHIPPING_COMPLETE', 'PURCHASE_CONFIRM'].includes(String(item?.order_status || '').trim().toUpperCase()));

        // 선택된 항목을 기준으로, 기존 접수 존재/미존재를 나눠 각각 업데이트 또는 인서트 처리
        const itemsWithReturn = selectedItems.filter(({ item }: { item: any }) => !!item.return_app_id);
        const itemsWithoutReturn = selectedItems.filter(({ item }: { item: any }) => !item.return_app_id);

        // 기존 접수 존재: 개별 업데이트 (수량 반영)
        if (itemsWithReturn.length > 0) {
          await Promise.all(
            itemsWithReturn.map(({ item, idx }: { item: any; idx: number }) =>
              axios.post(`${process.env.REACT_APP_API_URL}/app/memberReturnApp/updateMemberReturnApp`, {
                order_detail_app_id: [item.order_detail_app_id],
                return_reason_type: selectedReturnReasonType || null,
                reason: detailReason || null,
                quantity: quantityByIndex[idx] ?? 0,
                userId: user?.index,
              })
            )
          );
        }

        // 기존 접수 미존재: 개별 인서트 (수량 반영)
        if (itemsWithoutReturn.length > 0) {
          const insertPayloads = itemsWithoutReturn.map(({ item, idx }: { item: any; idx: number }) => ({
            order_detail_app_id: item.order_detail_app_id,
            order_address_id: orderDetail?.shipping_address_id,
            mem_id: orderDetail?.mem_id,
            return_reason_type: selectedReturnReasonType || null,
            reason: detailReason || null,
            quantity: quantityByIndex[idx] ?? 0,
          }));
          await Promise.all(
            insertPayloads.map((payload: any) =>
              axios.post(`${process.env.REACT_APP_API_URL}/app/memberReturnApp/insertMemberReturnApp`, payload)
            )
          );
        }

        // 수량 반영: 각 품목별로 취소 수량만큼 원 주문 분할 처리 (상세 기준)
        if (selectedItems.length > 0) {
          await Promise.all(
            selectedItems.map(({ item, idx }: { item: any; idx: number }) =>
              axios.post(`${process.env.REACT_APP_API_URL}/app/memberOrderApp/updateNewMemberOrderApp`, {
                order_detail_app_id: item.order_detail_app_id,
                order_quantity: quantityByIndex[idx] ?? 0,
                userId: user?.index,
              })
            )
          );
        }

        const orderDetailAppIds = Array.from(new Set(
          selectedItems
            .map(({ item }: { item: any }) => item?.order_detail_app_id)
            .filter((v: any) => v != null)
        ));
        await axios.post(`${process.env.REACT_APP_API_URL}/app/memberOrderApp/updateOrderStatus`, {
          order_detail_app_id: orderDetailAppIds,
          order_status: 'CANCEL_APPLY',
          userId: user?.index,
        });
      } else {
        // 반품 접수: RETURN_APPLY는 굿스플로 서비스ID만 업데이트 처리
        try {
          const selectedReturnApplyItems = (orderDetail?.products || [])
            .map((item: any, idx: number) => ({ item, idx }))
            .filter(({ idx }: { idx: number }) => (quantityByIndex[idx] ?? 0) > 0)
            .filter(({ item }: { item: any }) => String(item?.order_status || '').trim().toUpperCase() === 'RETURN_APPLY');
          if (selectedReturnApplyItems.length > 0 && isAutoPickup) {
            const orderDateStr = (() => {
              const s = String(orderDetail?.order_dt || '');
              if (s && s.length >= 12) {
                return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)} ${s.slice(8,10)}:${s.slice(10,12)}`;
              }
              return new Date().toISOString().slice(0,16).replace('T',' ');
            })();
            const nowId = `${Date.now()}`;
            const pickupDateStr = (() => {
              const d = new Date();
              d.setDate(d.getDate() + 1);
              return d.toISOString().slice(0,10);
            })();
            const firstItem = selectedReturnApplyItems[0]?.item || {};
            const body = {
              requestId: `RET-${orderDetail?.order_app_id}-${nowId}`,
              contractType: 'USER',
              items: [
                {
                  centerCode: '1000011886',
                  uniqueId: `RET-${orderDetail?.order_app_id}-${nowId}`,
                  boxSize: 'B10',
                  transporter: 'KOREX',
                  fromName: orderDetail?.receiver_name,
                  fromPhoneNo: orderDetail?.receiver_phone,
                  fromAddress1: orderDetail?.address,
                  fromAddress2: orderDetail?.address_detail,
                  fromZipcode: orderDetail?.zip_code,
                  toName: '점핑하이',
                  toPhoneNo: '07050554754',
                  toAddress1: '서울 강서구 마곡서로 133',
                  toAddress2: '704동 2층',
                  toZipcode: '07798',
                  pickupRequestDate: pickupDateStr,
                  deliveryMessage: pickupDeliveryRequest || '',
                  consumerName: orderDetail?.receiver_name,
                  consumerPhoneNo: orderDetail?.receiver_phone,
                  deliveryPaymentMethod: 'RECEIVER_PAY',
                  originalInvoiceNo: String(firstItem?.tracking_number || ''),
                  originalTransporterCode: firstItem?.order_courier_code == 'CJ' ? 'KOREX' : firstItem?.order_courier_code || '',
                  deliveryItems: selectedReturnApplyItems.map(({ item, idx }: { item: any; idx: number }) => ({
                    orderNo: String(orderDetail?.order_app_id || ''),
                    orderDate: orderDateStr,
                    name: String(item?.product_name || ''),
                    quantity: Number(quantityByIndex[idx] ?? 0) || 1,
                    price: Number(item?.price || 0),
                    code: String(item?.product_detail_app_id || ''),
                    option: String(item?.option_unit || ''),
                  })),
                }
              ]
            } as any;
            const gfRes = await axios.post(`${process.env.REACT_APP_API_URL}/app/goodsflow/deliveries/shipping/return/deliveryItems`, body);
            console.log('gfRes', gfRes);
            try {
              const serviceId =
                gfRes?.data?.data?.items?.[0]?.data?.serviceId ||
                gfRes?.data?.data?.serviceId ||
                gfRes?.data?.serviceId || '';
              const detailIdsForUpdate: number[] = Array.from(new Set(
                selectedReturnApplyItems.map(({ item }: any) => item?.order_detail_app_id).filter((v: any) => v != null)
              ));
              if (serviceId && detailIdsForUpdate.length > 0) {
                await axios.post(`${process.env.REACT_APP_API_URL}/app/memberReturnApp/updateReturnGoodsflowId`, {
                  order_detail_app_id: detailIdsForUpdate,
                  return_goodsflow_id: serviceId,
                  userId: user?.index,
                });
                try {
                  const memId = (orderDetail as any)?.mem_id;
                  const memName = (orderDetail as any)?.mem_name;
                  for (const { item } of selectedReturnApplyItems) {
                    const title = '반품 신청이 접수되었습니다.';
                    const content = `주문하신 ${String(item?.product_name || '')} 상품의 반품 신청이 정상적으로 접수되었습니다. 곧 기사님이 방문하여 상품을 수거할 예정입니다.`;
                    const postRes = await axios.post(
                      `${process.env.REACT_APP_API_URL}/app/postApp/insertPostApp`,
                      {
                        post_type: 'SHOPPING',
                        title,
                        content,
                        all_send_yn: 'N',
                        push_send_yn: 'Y',
                        userId: user?.index,
                        mem_id: String(memId),
                      }
                    );
                    const postAppId = postRes.data?.postAppId;
                    if (postAppId) {
                      await axios.post(`${process.env.REACT_APP_API_URL}/app/postApp/insertMemberPostApp`, {
                        post_app_id: postAppId,
                        mem_id: memId,
                        userId: user?.index,
                      });
                    }
                  }
                } catch (_) {}
              }
            } catch (_) {}
          }
        } catch (e) {
          console.error('[RETURN_APPLY_ONLY] goodsflow/updateReturnGoodsflowId error', e);
        }

        // 반품 접수: 선택 품목 인서트 후 상태 RETURN_APPLY로 변경
        const selectedItems = (orderDetail?.products || [])
          .map((item: any, idx: number) => ({ item, idx }))
          .filter(({ item, idx }: { item: any; idx: number }) => (quantityByIndex[idx] ?? 0) > 0)
          .filter(({ item }: { item: any }) => {
            const statusCode = String(item?.order_status || '').trim().toUpperCase();
            return statusCode === 'SHIPPING_COMPLETE' || statusCode === 'PURCHASE_CONFIRM' || statusCode === 'EXCHANGE_SHIPPING_COMPLETE';
          });

        if (selectedItems.length > 0) {
          // 1) 수량 기준 분할: 선택 수량만큼 대상 상세를 새 그룹으로 이동(주문 분리)
          await Promise.all(
            selectedItems.map(({ item, idx }: { item: any; idx: number }) =>
              axios.post(`${process.env.REACT_APP_API_URL}/app/memberOrderApp/updateNewMemberOrderApp`, {
                order_detail_app_id: item.order_detail_app_id,
                order_quantity: quantityByIndex[idx] ?? 0,
                userId: user?.index,
              })
            )
          );

          // 2) RETURN 주소 생성 + 반품 인서트/업데이트
          const upsertCalls = await Promise.all(
            selectedItems.map(async ({ item, idx }: { item: any; idx: number }) => {
              const receiver_name = isPickupDefaultAddress ? (orderDetail?.receiver_name || '') : (pickupReceiverName || '');
              const receiver_phone = isPickupDefaultAddress ? (orderDetail?.receiver_phone || '') : (pickupReceiverPhone || '');
              const address = isPickupDefaultAddress ? (orderDetail?.address || '') : (pickupRoadAddress || '');
              const address_detail = isPickupDefaultAddress ? (orderDetail?.address_detail || '') : (pickupDetailAddress || '');
              const zip_code = isPickupDefaultAddress ? (orderDetail?.zip_code || '') : (pickupZipCode || '');
              const enter_way = isPickupDefaultAddress ? (orderDetail?.enter_way || null) : (pickupEnterWay || null);
              const enter_memo = isPickupDefaultAddress ? (orderDetail?.enter_memo || null) : (pickupEnterMemo || null);
              const delivery_request = isPickupDefaultAddress ? (orderDetail?.delivery_request || null) : (pickupDeliveryRequest || null);
              const statusCode = String(item?.order_status || '').trim().toUpperCase();

              // EXCHANGE_SHIPPING_COMPLETE: 기존 반품 레코드 삭제 후 신규 인서트
              if (statusCode === 'EXCHANGE_SHIPPING_COMPLETE') {
                if (orderDetail?.shipping_address_id) {
                  try {
                    await axios.post(`${process.env.REACT_APP_API_URL}/app/memberOrderAddress/deleteMemberOrderAddress`, {
                      order_address_id: orderDetail?.shipping_address_id,
                      userId: user?.index,
                    });
                  } catch (e) {
                    // proceed even if delete fails
                  }
                }
                const addressRes = await axios.post(`${process.env.REACT_APP_API_URL}/app/memberOrderAddress/insertMemberOrderAddress`, {
                  order_detail_app_id: item.order_detail_app_id,
                  order_address_type: 'RETURN',
                  mem_id: orderDetail?.mem_id,
                  receiver_name,
                  receiver_phone,
                  address,
                  address_detail,
                  zip_code,
                  enter_way,
                  enter_memo,
                  delivery_request,
                  use_yn: 'Y',
                });
                const newOrderAddressId = addressRes?.data?.order_address_id;

                try {
                  await axios.post(`${process.env.REACT_APP_API_URL}/app/memberReturnApp/deleteMemberReturnApp`, {
                    order_detail_app_id: [item.order_detail_app_id],
                    userId: user?.index,
                  });
                } catch (_) {}

                return axios.post(`${process.env.REACT_APP_API_URL}/app/memberReturnApp/insertMemberReturnApp`, {
                  order_detail_app_id: item.order_detail_app_id,
                  order_address_id: newOrderAddressId,
                  mem_id: orderDetail?.mem_id,
                  return_reason_type: selectedReturnReasonType || null,
                  reason: detailReason || null,
                  quantity: quantityByIndex[idx] ?? 0,
                });
              }

              // 기존 접수 존재 시: 반환 정보만 업데이트 (주소는 변경하지 않음)
              if (item?.return_app_id) {
                // 주소 이력 생성: 기존 RETURN 주소 비활성화 후 신규 RETURN 주소 인서트
                if (orderDetail?.shipping_address_id) {
                  try {
                    await axios.post(`${process.env.REACT_APP_API_URL}/app/memberOrderAddress/deleteMemberOrderAddress`, {
                      order_address_id: orderDetail?.shipping_address_id,
                      userId: user?.index,
                    });
                  } catch (e) {
                    // proceed even if delete fails
                  }
                }
                const newAddrRes = await axios.post(`${process.env.REACT_APP_API_URL}/app/memberOrderAddress/insertMemberOrderAddress`, {
                  order_detail_app_id: item.order_detail_app_id,
                  order_address_type: 'RETURN',
                  mem_id: orderDetail?.mem_id,
                  receiver_name,
                  receiver_phone,
                  address,
                  address_detail,
                  zip_code,
                  enter_way,
                  enter_memo,
                  delivery_request,
                  use_yn: 'Y',
                });
                const newOrderAddressIdForUpdate = newAddrRes?.data?.order_address_id;

                return axios.post(`${process.env.REACT_APP_API_URL}/app/memberReturnApp/updateMemberReturnApp`, {
                  order_detail_app_id: [item.order_detail_app_id],
                  return_reason_type: selectedReturnReasonType || null,
                  reason: detailReason || null,
                  quantity: quantityByIndex[idx] ?? 0,
                  order_address_id: newOrderAddressIdForUpdate,
                  approval_yn: null,
                  cancel_yn: 'N',
                  userId: user?.index,
                });
              }

              // 신규 접수: 기존 주소 비활성화 후, RETURN 주소 생성 → 반품 접수 인서트
              if (orderDetail?.shipping_address_id) {
                try {
                  await axios.post(`${process.env.REACT_APP_API_URL}/app/memberOrderAddress/deleteMemberOrderAddress`, {
                    order_address_id: orderDetail?.shipping_address_id,
                    userId: user?.index,
                  });
                } catch (e) {
                  // proceed even if delete fails
                }
              }
              const addressRes = await axios.post(`${process.env.REACT_APP_API_URL}/app/memberOrderAddress/insertMemberOrderAddress`, {
                order_detail_app_id: item.order_detail_app_id,
                order_address_type: 'RETURN',
                mem_id: orderDetail?.mem_id,
                receiver_name,
                receiver_phone,
                address,
                address_detail,
                zip_code,
                enter_way,
                enter_memo,
                delivery_request,
                use_yn: 'Y',
              });
              const newOrderAddressId = addressRes?.data?.order_address_id;

              return axios.post(`${process.env.REACT_APP_API_URL}/app/memberReturnApp/insertMemberReturnApp`, {
                order_detail_app_id: item.order_detail_app_id,
                order_address_id: newOrderAddressId,
                mem_id: orderDetail?.mem_id,
                return_reason_type: selectedReturnReasonType || null,
                reason: detailReason || null,
                quantity: quantityByIndex[idx] ?? 0,
              });
            })
          );

          // 3) 굿스플로 반품 접수(API) 호출: 자동 수거 신청 시
          try {
            if (isAutoPickup) {
              const selectedItem = selectedItems[0]?.item || {};
              const orderDateStr = (() => {
                const s = String(orderDetail?.order_dt || '');
                if (s && s.length >= 12) {
                  return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)} ${s.slice(8,10)}:${s.slice(10,12)}`;
                }
                return new Date().toISOString().slice(0,16).replace('T',' ');
              })();
              const nowId = `${Date.now()}`;
              const pickupDateStr = (() => {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                return d.toISOString().slice(0,10);
              })();
              const body = {
                requestId: `RET-${orderDetail?.order_app_id}-${nowId}`,
                contractType: 'USER',
                items: [
                  {
                    centerCode: "1000011886",
                    uniqueId: `RET-${orderDetail?.order_app_id}-${nowId}`,
                    boxSize: "B10",
                    transporter: 'KOREX',
                    fromName: orderDetail?.receiver_name,
                    fromPhoneNo: orderDetail?.receiver_phone,
                    fromAddress1: orderDetail?.address,
                    fromAddress2: orderDetail?.address_detail,
                    fromZipcode: orderDetail?.zip_code,
                    toName: '점핑하이',
                    toPhoneNo: '07050554754',
                    toAddress1: '서울 강서구 마곡서로 133',
                    toAddress2: '704동 2층',
                    toZipcode: '07798',
                    pickupRequestDate: pickupDateStr,
                    deliveryMessage: pickupDeliveryRequest || '',
                    consumerName: orderDetail?.receiver_name,
                    consumerPhoneNo: orderDetail?.receiver_phone,
                    deliveryPaymentMethod: 'RECEIVER_PAY',
                    originalInvoiceNo: String(selectedItem?.tracking_number || ''),
                    originalTransporterCode: selectedItem?.order_courier_code == 'CJ' ? 'KOREX' : selectedItem?.order_courier_code || '',
                    deliveryItems: selectedItems.map(({ item, idx }: { item: any; idx: number }) => ({
                      orderNo: String(orderDetail?.order_app_id || ''),
                      orderDate: orderDateStr,
                      name: String(item?.product_name || ''),
                      quantity: Number(quantityByIndex[idx] ?? 0) || 1,
                      price: Number(item?.price || 0),
                      code: String(item?.product_detail_app_id || ''),
                      option: String(item?.option_unit || ''),
                    })),
                  }
                ]
              } as any;
              const gfRes = await axios.post(`${process.env.REACT_APP_API_URL}/app/goodsflow/deliveries/shipping/return/deliveryItems`, body);
              // 굿스플로 서비스ID 저장: 반품 전용 컬럼(return_goodsflow_id)에 보관
              try {
                const serviceId =
                  gfRes?.data?.data?.items?.[0]?.data?.serviceId ||
                  gfRes?.data?.data?.serviceId ||
                  gfRes?.data?.serviceId || '';
                const detailIdsForUpdate: number[] = Array.from(new Set(
                  selectedItems.map(({ item }: any) => item?.order_detail_app_id).filter((v: any) => v != null)
                ));
                if (serviceId && detailIdsForUpdate.length > 0) {
                  await axios.post(`${process.env.REACT_APP_API_URL}/app/memberReturnApp/updateReturnGoodsflowId`, {
                    order_detail_app_id: detailIdsForUpdate,
                    return_goodsflow_id: serviceId,
                    userId: user?.index,
                  });
                    
                } else {
                  console.warn('[RETURN_FLOW] no serviceId to save');
                }
              } catch (saveErr) {
                console.error('[RETURN_FLOW] save return_goodsflow_id error', saveErr);
              }
            }
          } catch (e) {
            console.error('굿스플로 반품접수 호출 오류:', e);
          }

          const orderDetailAppIds = Array.from(new Set(
            selectedItems
              .map(({ item }: { item: any }) => item?.order_detail_app_id)
              .filter((v: any) => v != null)
          ));
          
          await axios.post(`${process.env.REACT_APP_API_URL}/app/memberOrderApp/updateOrderStatus`, {
            order_detail_app_id: orderDetailAppIds,
            order_status: 'RETURN_APPLY',
            userId: user?.index,
          });
          try {
            const memId = (orderDetail as any)?.mem_id;
            const memName = (orderDetail as any)?.mem_name;
            for (const si of selectedItems) {
              const title = '반품 신청이 접수되었습니다.';
              const content = `주문하신 ${String(si.item?.product_name || '')} 상품의 반품 신청이 정상적으로 접수되었습니다. 곧 기사님이 방문하여 상품을 수거할 예정입니다.`;
              const postRes = await axios.post(
                `${process.env.REACT_APP_API_URL}/app/postApp/insertPostApp`,
                {
                  post_type: 'SHOPPING',
                  title,
                  content,
                  all_send_yn: 'N',
                  push_send_yn: 'Y',
                  userId: user?.index,
                  mem_id: String(memId),
                }
              );
              const postAppId = postRes.data?.postAppId;
              if (postAppId) {
                await axios.post(`${process.env.REACT_APP_API_URL}/app/postApp/insertMemberPostApp`, {
                  post_app_id: postAppId,
                  mem_id: memId,
                  userId: user?.index,
                });
              }
            }
          } catch (_) {}
          
        }
      }
      setIsConfirmOpen(false);
      setToastVariant('success');
      setToastMessage('취소접수 되었습니다');
      setIsToastVisible(true);
      navigate(-1);
    } catch (err) {
      console.error('취소/반품 접수 처리 오류:', err);
      setIsConfirmOpen(false);
    }
  };
  
  useEffect(() => {
    const fetchOrderStatusCodes = async () => {
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/app/common/selectCommonCodeList`,
          { group_code: 'ORDER_STATUS_TYPE' }
        );
        setOrderStatusCodeList(response.data.result || []);
      } catch (error) {
        console.error('주문 상태 코드 로딩 오류:', error);
      }
    };
    fetchOrderStatusCodes();
  }, []);
  
  // 취소승인 처리 함수: 포트원 환불 → 승인(Y) → 상태 CANCEL_COMPLETE → 적립금 삭제
  const fn_approveCancel = async (_targetDetailIds?: number[]) => {
    try {
      const usedPointForRefund = Math.max(0, Number(orderDetail?.point_use_amount || 0));
      const orderDetailAppIds: number[] = Array.from(new Set(
        (_targetDetailIds && _targetDetailIds.length > 0
          ? _targetDetailIds
          : (Array.isArray(selectedOrderAppIds) && selectedOrderAppIds.length > 0
              ? selectedOrderAppIds
              : (orderDetail?.products || []).map((p: any) => p?.order_detail_app_id))
        ).filter((v: any) => v != null)
      ));

      const expectedBase = (orderDetail.products || []).reduce((sum: number, item: any, idx: number) => {
        const paymentAmount = Number(item?.payment_amount || 0);
        return sum + (paymentAmount);
      }, 0);
      const amountToSave = Math.max(expectedBase - Number(refundDeductionAmount || 0), 0);
      const refundAmountToSave = (() => {
        // if (actionType === 'cancel') {
          const baseAmountProrated = (orderDetail.products || []).reduce((sum: number, item: any, idx: number) => {
            const status = String(item?.order_status || '').trim().toUpperCase();
            if (["SHIPPINGING", "SHIPPING_COMPLETE", "PURCHASE_CONFIRM"].includes(status)) return sum;
            const totalQty = Number(item?.total_order_quantity ?? item?.order_quantity ?? 0);
            if (!totalQty) return sum;
            const canceledQty = Number((quantityByIndex[idx] ?? item?.return_quantity ?? 0) || 0);
            if (canceledQty <= 0) return sum;
            const paymentAmount = Number(item?.payment_amount || 0);
            const perUnit = paymentAmount / totalQty;
            return sum + (perUnit * canceledQty);
          }, 0);
          const safeDeduction = Math.min(Number(refundDeductionAmount || 0), baseAmountProrated);
          return Math.max(baseAmountProrated - safeDeduction, 0);
        // }
        return amountToSave;
      })();

      // 1) 결제 환불(결제 금액이 있을 때만)
      const paymentBalance = Number(orderDetail?.payment_amount || 0);
      if (paymentBalance > 0) {
        const reasonName = (() => {
          const code = String(orderDetail?.return_reason_type || selectedReturnReasonType || '');
          const found = (returnReasonList || []).find((r: any) => String(r?.common_code) === code);
          return found?.common_code_name || '취소승인';
        })();
        let refundAmountForPayment = Math.max(0, Number(amountToSave || 0));
        // if (actionType === 'cancel') {
          const baseAmountProrated = (orderDetail.products || []).reduce((sum: number, item: any, idx: number) => {
            const status = String(item?.order_status || '').trim().toUpperCase();
            if (["SHIPPINGING", "SHIPPING_COMPLETE", "PURCHASE_CONFIRM"].includes(status)) return sum;
            const totalQty = Number(item?.total_order_quantity ?? item?.order_quantity ?? 0);
            if (!totalQty) return sum;
            const canceledQty = Number((quantityByIndex[idx] ?? item?.return_quantity ?? 0) || 0);
            if (canceledQty <= 0) return sum;
            const paymentAmount = Number(item?.payment_amount || 0);
            const perUnit = paymentAmount / totalQty;
            return sum + (perUnit * canceledQty);
          }, 0);
          const safeDeduction = Math.min(Number(refundDeductionAmount || 0), baseAmountProrated);
          const expectedAmount = Math.max(baseAmountProrated - safeDeduction, 0);
          refundAmountForPayment = expectedAmount;
        // }
        await axios.post(`${process.env.REACT_APP_API_URL}/app/portone/requestPortOneRefund`, {
          imp_uid: orderDetail?.portone_imp_uid || null,
          merchant_uid: orderDetail?.portone_merchant_uid || null,
          refundAmount: refundAmountForPayment,
          reason: reasonName,
        });
      }

      // 1-1) 결제 정보 수정
      await axios.post(`${process.env.REACT_APP_API_URL}/app/memberPaymentApp/updateMemberPaymentApp`, {
        order_app_id: orderDetail?.order_app_id,
        payment_status: 'PAYMENT_REFUND',
        refund_amount: refundAmountToSave,
        userId: user?.index,
      });

      // 2) 취소/반품 승인 플래그 업데이트 (상세 기준)
      await axios.post(`${process.env.REACT_APP_API_URL}/app/memberReturnApp/updateMemberReturnAppApproval`, {
        order_detail_app_id: orderDetailAppIds,
        approval_yn: 'Y',
        cancel_yn: 'N',
        userId: user?.index,
      });

      // 3) 주문상태 변경 (상세 기준): 취소는 CANCEL_COMPLETE, 반품은 RETURN_COMPLETE
      await axios.post(`${process.env.REACT_APP_API_URL}/app/memberOrderApp/updateOrderStatus`, {
        order_detail_app_id: orderDetailAppIds,
        order_status: actionType === 'return' ? 'RETURN_COMPLETE' : 'CANCEL_COMPLETE',
        userId: user?.index,
      });

      // 취소완료/반품승인 알림 발송
      try {
        if (actionType !== 'return') {
          const memId = (orderDetail as any)?.mem_id;
          const memName = (orderDetail as any)?.mem_name;
          (orderDetail?.products || [])
            .filter((p: any) => orderDetailAppIds.includes(p?.order_detail_app_id))
            .forEach((p: any) => {
              sendCancelCompleteNotification(memId, memName, p?.product_name);
            });
        } else {
          // 반품승인 알림 발송 (반품 플로우)
          const memId = (orderDetail as any)?.mem_id;
          const memName = (orderDetail as any)?.mem_name;
          for (const p of (orderDetail?.products || []).filter((pp: any) => orderDetailAppIds.includes(pp?.order_detail_app_id))) {
            try {
              const title = `${memName} 님꼐서 주문하신 ${String(p?.product_name || '')} 상품의 반품이 승인 되었습니다.`;
              const content = '반품 신청이 승인되었습니다. 항상 저희 서비스를 이용해 주셔서 감사드리며, 앞으로도 더 나은 서비스를 제공할 수 있도록 최선을 다하겠습니다.';
              const postRes = await axios.post(
                `${process.env.REACT_APP_API_URL}/app/postApp/insertPostApp`,
                {
                  post_type: 'SHOPPING',
                  title,
                  content,
                  all_send_yn: 'N',
                  push_send_yn: 'Y',
                  userId: user?.index,
                  mem_id: String(memId),
                }
              );
              const postAppId = postRes.data?.postAppId;
              if (postAppId) {
                await axios.post(`${process.env.REACT_APP_API_URL}/app/postApp/insertMemberPostApp`, {
                  post_app_id: postAppId,
                  mem_id: memId,
                  userId: user?.index,
                });
              }
            } catch (_) {}
          }
        }
      } catch {}

      // 4) 쿠폰 사용 복구: 주문에 쿠폰이 적용되어 있으면 쿠폰 사용여부를 N으로 되돌림
      try {
        const memberCouponAppId = (orderDetail as any)?.member_coupon_app_id;
        const hasCouponApplied = Number((orderDetail as any)?.coupon_discount_amount || 0) > 0 || !!memberCouponAppId;
        if (memberCouponAppId && hasCouponApplied) {
          await axios.post(`${process.env.REACT_APP_API_URL}/app/couponApp/updateCouponAppUseYn`, {
            member_coupon_app_id: memberCouponAppId,
            user_id: user?.index,
            use_yn: 'N',
          });
        }
      } catch (e) {
        // no-op: 쿠폰 복구 실패는 프로세스를 막지 않음
      }

      setIsToastVisible(true);
    } catch (e) {
      console.error('취소 승인 처리 오류:', e);
    }
  };

  // 최종 환불 금액(단일 소스): 선택 합계(판매가×수량) 기준으로 차감 반영, 직접입력 우선
  const finalRefundAmountNumber = useMemo(() => {
    const selectedTotal = (orderDetail.products || []).reduce((sum: number, item: any, idx: number) => {
      const status = String(item?.order_status || '').trim().toUpperCase();
      const qty = quantityByIndex[idx] ?? 0;
      const price = Number(item?.price || 0);
      if (
        actionType === 'return' &&
        !(status === 'SHIPPINGING' || status === 'SHIPPING_COMPLETE' || status === 'EXCHANGE_SHIPPING_COMPLETE' || status === 'RETURN_APPLY')
      ) return sum;
      return sum + (price * qty);
    }, 0);
    // 쿠폰 차감액 (주문 전체 기준)
    const productTotalAll = (orderDetail.products || []).reduce((sum: number, it: any) => sum + ((it?.original_price || 0) * (it?.order_quantity || 0)), 0);
    const productDiscountedAll = (orderDetail.products || []).reduce((sum: number, it: any) => sum + ((it?.price || 0) * (it?.order_quantity || 0)), 0);
    const couponAmt = Number(orderDetail?.coupon_discount_amount || 0);
    const couponType = String(orderDetail?.coupon_discount_type || '').toUpperCase();
    const couponDeduction = couponAmt
      ? (couponType === 'PERCENT'
          ? Number((couponAmt * 1/100) * (productTotalAll - productDiscountedAll))
          : couponAmt)
      : 0;
    const refundAmount = Math.max(selectedTotal - couponDeduction, 0);
    const safeDeduction = Math.min(Number(refundDeductionAmount || 0), refundAmount);
    const autoFinal = Math.max(refundAmount - safeDeduction, 0);
    return isManualFinalRefundAmount ? Number(manualFinalRefundAmount || 0) : autoFinal;
  }, [orderDetail?.products, quantityByIndex, actionType, refundDeductionAmount, isManualFinalRefundAmount, manualFinalRefundAmount]);

  const formatNumber = (n: number) => (Number(n || 0)).toLocaleString();

  return (
    <div className="w-full h-full">
      <style>{`
        input.no-spin[type=number]::-webkit-outer-spin-button,
        input.no-spin[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input.no-spin[type=number] { -moz-appearance: textfield; }
      `}</style>
      <div className="bg-white p-10" >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
              navigate(-1);
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <p className="text-sm text-gray-500 font-semibold">주문상세</p>
            </div>
            <h1 className="text-3xl font-bold mt-4 mb-4">{isRefundCalcMode ? '환불금액계산' : (actionType === 'cancel' ? '취소' : '반품')}</h1>
          </div>
          {(
            <div>
              <button
                className={`${step === 1 ? 'bg-gray-200 text-gray-500' : 'bg-white text-black border border-gray-300'} px-4 py-2 rounded-md mr-2`}
                onClick={() => {
                  if (step === 2) setStep(1);
                  else if (step === 3) setStep(2);
                  else navigate(-1);
                }}
              >
                이전
              </button>
              {step === 1 && (
                <button
                  className={`${step === 1 ? 'bg-black text-white' : 'bg-white text-black text-gray-400'} px-4 py-2 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed`}
                  onClick={() => {
                    if (!hasAnyQuantity) {
                      setToastVariant('warning');
                      setToastMessage('반품할 상품을 선택해주세요');
                      setIsToastVisible(true);
                      return;
                    }
                    setStep(2);
                  }}
                >
                  다음
                </button>
              )}
            </div>
          )}
        </div>
        {isRefundCalcMode && (
          <div className="flex items-center gap-2">
            <p className="text-gray-500 font-semibold text-xs">주문 취소 상품에 대한 환불 금액을 계산해 주세요</p>
          </div>
        )}
        {!isRefundCalcMode && (
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 ${step === 1 ? 'text-black' : 'text-gray-500'}`}>
              <span className={`w-5 h-5 rounded-full border ${step === 1 ? 'bg-black text-white' : 'bg-gray-200'} flex items-center justify-center text-xs font-bold`}>1</span>
              <span className="text-xs font-semibold">품목 선택</span>
            </div>
            <span className="text-gray-500 text-xs">&gt;</span>
            <div className={`flex items-center gap-2 ${step === 2 ? 'text-black' : 'text-gray-500'}`}>
              <span className={`w-5 h-5 rounded-full border ${step === 2 ? 'bg-black text-white' : 'bg-gray-200'} flex items-center justify-center text-xs font-bold`}>2</span>
              <span className="text-xs font-semibold">{actionType === 'cancel' ? '취소' : '반품'} 정보 입력</span>
            </div>
          </div>
        )}
      </div>

      {step === 1 && (
        <div className="flex items-start justify-between mt-10">
          <div className="w-2/3">
            {(() => {
              const filtered = (orderDetail.products || [])
                .map((item: any, idx: number) => ({ item, idx }))
                .filter(({ item }: { item: any }) => {
                  const s = String(item?.order_status || '').trim().toUpperCase();
                  if (actionType === 'return') {
                    return s === 'SHIPPINGING' || s === 'SHIPPING_COMPLETE' || s === 'EXCHANGE_SHIPPING_COMPLETE';
                  }
                  if (s.indexOf('CANCEL') >= 0) return false;
                  return s === 'PAYMENT_COMPLETE' || s === 'HOLD';
                });
              const grouped = filtered.reduce((acc: Record<string, Array<{ item: any; idx: number }>>, cur: { item: any; idx: number }) => {
                const key = String(cur.item?.order_group ?? `group-${cur.idx}`);
                if (!acc[key]) acc[key] = [];
                acc[key].push(cur);
                return acc;
              }, {} as Record<string, Array<{ item: any; idx: number }>>);
              const entries = (Object.entries(grouped) as Array<[string, Array<{ item: any; idx: number }>]>)
              return entries.map(([groupKey, list], groupIndex) => (
                <div key={groupKey} className="bg-white p-10 rounded-lg shadow-md mb-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-medium">
                        {(() => {
                          const codes = list.map(({ item }: { item: any }) => String(item?.order_status || '').trim().toUpperCase());
                          let code = '';
                          if (actionType === 'cancel') {
                            code = codes.includes('HOLD') ? 'HOLD' : 'PAYMENT_COMPLETE';
                          } else {
                            if (codes.includes('EXCHANGE_SHIPPING_COMPLETE')) {
                              code = 'EXCHANGE_SHIPPING_COMPLETE';
                            } else if (codes.includes('SHIPPING_COMPLETE')) {
                              code = 'SHIPPING_COMPLETE';
                            } else {
                              code = 'SHIPPINGING';
                            }
                          }
                          return (
                            orderStatusCodeList.find((c: any) => c.common_code === code)?.common_code_name || ''
                          );
                        })()}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            className="flex items-center gap-1 text-sm font-semibold text-gray-700"
                            onClick={() => {
                              const updates: Record<number, number> = {};
                              list.forEach(({ item, idx }: { item: any; idx: number }) => {
                                const status = String(item?.order_status || '').trim().toUpperCase();
                                if (actionType === 'return') {
                                  if (status === 'SHIPPINGING' || status === 'SHIPPING_COMPLETE' || status === 'EXCHANGE_SHIPPING_COMPLETE' || status === 'RETURN_APPLY') {
                                    updates[idx] = Number(item.order_quantity) || 0;
                                  }
                                } else {
                                  if (status === 'PAYMENT_COMPLETE' || status === 'HOLD') {
                                    updates[idx] = Number(item.order_quantity) || 0;
                                  }
                                }
                              });
                              setQuantityByIndex((prev) => ({ ...prev, ...updates }));
                            }}
                          >
                            전체취소
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">#{orderDetail.order_dt}{orderDetail.order_app_id}{entries.length > 1 ? `-${String(groupIndex + 1).padStart(2, '0')}` : ''}</p>
                  </div>
                  <div className="mt-10">
                    {list.map(({ item, idx }: { item: any; idx: number }) => (
                      <div key={idx} className="flex items-center justify-between mt-4">
                        <div className="flex items-start gap-2">
                          <img src={item.image} className="w-16 h-16 rounded-lg" alt="상품 이미지" />
                          <div className="ml-2">
                            <p className="text-sm font-medium">{item.product_name}</p>
                            <p className="text-xs font-semibold mt-1 bg-gray-100 px-2 py-1 rounded-full w-fit">{item.option_gender == 'M' ? '남자' : item.option_gender == 'W' ? '여자' : '공용'} {item.option_amount}{item.option_unit}</p>
                            <p className="text-xs text-gray-500 mt-2">{item.price?.toLocaleString()} X {item.order_quantity}</p>
                            <p className="text-sm font-medium mt-1">총 {(item.price * item.order_quantity)?.toLocaleString()}원</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <input 
                            className="border border-gray-300 rounded px-2 py-1 w-20 text-right"
                            type="number" 
                            min="0"
                            max={item.order_quantity}
                            value={quantityByIndex[idx] ?? 0}
                            onChange={(e) => {
                              const value = Math.max(0, Math.min(Number(item.order_quantity) || 0, Number(e.target.value) || 0));
                              setQuantityByIndex((prev) => ({ ...prev, [idx]: value }));
                            }}
                          />
                          <div className="flex flex-col items-end gap-2">
                            <p
                              className={`text-sm font-semibold ml-10 ${(((quantityByIndex[idx] ?? 0) * (item.price ?? 0)) ? 'text-red-500' : '')}`}
                            >
                              {((-(quantityByIndex[idx] ?? 0) * (item.price ?? 0)) || 0)?.toLocaleString()}원
                            </p>
                            {((quantityByIndex[idx] ?? 0) === (Number(item.order_quantity) || 0)) && (
                              <div className="bg-red-100 rounded-full px-2 py-1 flex items-center justify-center">
                                <p className="font-semibold text-xs text-red-600">전체</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
          
          <div className="w-1/3 ml-10 bg-white p-10 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-m font-medium">예상 환불 금액</p>
            </div>
            <div className="mt-10">
              {orderDetail.delivery_fee && (orderDetail?.payment_amount <= orderDetail?.free_shipping_amount) &&
                (orderDetail.products || []).some((item: any, idx: number) => {
                  const status = String(item?.order_status || '').trim().toUpperCase();
                  const qty = quantityByIndex[idx] ?? 0;
                  return (actionType !== 'return' || status === 'SHIPPINGING' || status === 'SHIPPING_COMPLETE' || status === 'EXCHANGE_SHIPPING_COMPLETE' || status === 'RETURN_APPLY') && qty > 0;
                }) &&
                (
                  orderDetail.free_shipping_amount >= (orderDetail.products || []).reduce((sum: number, item: any, idx: number) => {
                    const status = String(item?.order_status || '').trim().toUpperCase();
                    const qty = quantityByIndex[idx] ?? 0;
                    const price = item.price ?? 0;
                    if (actionType === 'return' && !(status === 'SHIPPINGING' || status === 'SHIPPING_COMPLETE' || status === 'EXCHANGE_SHIPPING_COMPLETE' || status === 'RETURN_APPLY')) return sum;
                    return sum + qty * price;
                  }, 0)
                ) && (
                <div className="flex items-center justify-between">
                  <p className="text-m font-medium">배송비</p>
                  <p className="text-m font-medium"><span className="text-xl font-bold">{orderDetail.delivery_fee?.toLocaleString()}</span>원</p>
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <p className="text-m font-medium">금액</p>
                <p className="text-m font-medium">
                  <span className="text-xl font-bold">
                    {(() => {
                      const selectedTotal = (orderDetail.products || []).reduce((sum: number, item: any, idx: number) => {
                        const status = String(item?.order_status || '').trim().toUpperCase();
                        const qty = quantityByIndex[idx] ?? 0;
                        const price = item.price ?? 0;
                        if (actionType === 'return' && !(status === 'SHIPPINGING' || status === 'SHIPPING_COMPLETE' || status === 'EXCHANGE_SHIPPING_COMPLETE' || status === 'RETURN_APPLY')) return sum;
                        return sum + qty * price;
                      }, 0);
                      return selectedTotal?.toLocaleString();
                    })()}
                  </span>
                  원
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex items-start justify-between mt-10">
          <div className="w-2/3 bg-white p-10 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold">{actionType === 'return' ? '반품 상품' : '취소 상품'}</p>
              <p className="text-xs font-semibold text-gray-500">주문 {formatAmPmDate(orderDetail?.order_dt)} &nbsp;|&nbsp; 취소 {formatAmPmDate(orderDetail?.return_dt)}</p>
            </div>
            <div className="mt-6 space-y-8">
              <div className="flex items-start">
                <p className="w-1/3 text-m font-semibold">사유</p>
                <div className="w-2/3">
                  <p className="text-sm font-medium">
                    {(() => {
                      const code = selectedReturnReasonType || orderDetail?.return_reason_type || '';
                      const found = (returnReasonList || []).find((r: any) => String(r?.common_code) === String(code));
                      return found?.common_code_name || '-';
                    })()}
                  </p>
                  {detailReason && (
                    <p className="text-xs text-gray-500 mt-1">{detailReason}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start">
                <p className="w-1/3 text-m font-semibold">품목</p>
                <div className="w-2/3">
                  {(orderDetail.products || [])
                    .map((item: any, idx: number) => ({ item, idx }))
                    .filter(({ idx }: { idx: number }) => (quantityByIndex[idx] ?? 0) > 0)
                    .map(({ item, idx }: { item: any; idx: number }, listIdx: number) => {
                      const selectedQty = quantityByIndex[idx] ?? 0;
                      return (
                        <div className={`flex items-center justify-between ${listIdx !== 0 ? 'mt-6' : ''}`} key={idx}>
                          <div className="flex items-center gap-2">
                            <img src={item.image} className="w-16 h-16 rounded-lg" alt="상품 이미지" />
                            <div className="flex flex-col">
                              <p className="text-sm font-semibold">{item.product_name}</p>
                              <p className="bg-gray-300 px-2 py-1 rounded-full w-fit text-xs font-semibold mt-1">{item.option_gender == 'M' ? '남자' : item.option_gender == 'W' ? '여자' : '공용'} {item.option_amount}{item.option_unit}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <p className="text-sm font-semibold">{(item.price * selectedQty)?.toLocaleString()} 원</p>
                            <p className="text-xs text-gray-500 mt-1">{item.price?.toLocaleString()} X {selectedQty}</p>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
              <div className="flex items-start">
                <p className="w-1/3 text-m font-semibold">금액 설정</p>
                <div className="w-2/3">
                  <p className="text-sm font-medium">환불 금액 차감</p>
                  <div className="mt-2 relative w-1/2">
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded px-3 py-2 pr-8 text-sm text-right"
                      value={refundDeductionAmount ? refundDeductionAmount.toLocaleString() : ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        const next = Number(raw || 0);
                        try {

                        } catch (_) {}
                        // 제한 기준: 화면의 예상 환불 금액 계산과 동일한 기준(baseAmount)
                        const baseAmountForLimit = (orderDetail.products || []).reduce((sum: number, item: any, idx: number) => {
                          const qty = quantityByIndex[idx] ?? 0;
                          const price = Number(item?.price || 0);
                          return sum + (price * qty);
                        }, 0);
                        try { console.log('[REFUND_DEBUG] baseAmountForLimit:', baseAmountForLimit); } catch (_) {}
                        if (next > baseAmountForLimit) {
                          setToastVariant('warning');
                          setToastMessage('입력할 수 없습니다');
                          try { console.log('[REFUND_DEBUG] block: next > baseAmountForLimit'); } catch (_) {}
                          setIsToastVisible(true);
                          return;
                        }
                        setRefundDeductionAmount(next);
                      }}
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">원</span>
                  </div>
                  {!orderDetail?.point_use_amount ? null : (
                    <>
                      <p className="text-sm font-medium mt-4">적립금 차감</p>
                      <div className="mt-2 flex items-center gap-2 w-1/2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded px-3 py-2 pr-8 text-sm text-right"
                            value={pointDeductionAmount ? pointDeductionAmount.toLocaleString() : ''}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/[^0-9]/g, '');
                              const next = Number(raw || 0);
                              const usedPointNow = Number((latestPointAmount ?? orderDetail?.point_use_amount) || 0);
                              if (next > usedPointNow) {
                                setToastVariant('warning');
                                setToastMessage('입력할 수 없습니다');
                                setIsToastVisible(true);
                                return;
                              }
                              setPointDeductionAmount(next);
                            }}
                            placeholder="0"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">원</span>
                        </div>
                        <button
                          className="bg-black text-white px-3 py-2 rounded-md text-sm whitespace-nowrap"
                          onClick={async () => {
                            if (!window.confirm('포인트를 차감하시겠습니까?')) return;
                            try {
                              const usedPoint = Number((latestPointAmount ?? orderDetail?.point_use_amount) || 0);
                              const deductedPoint = Math.min(Number(pointDeductionAmount || 0), usedPoint);
                              const finalRefundPoint = Math.max(usedPoint - deductedPoint, 0);
                              await axios.post(`${process.env.REACT_APP_API_URL}/app/memberPointApp/updatePointAmount`, {
                                order_app_id: orderDetail?.order_app_id,
                                userId: user?.index,
                                point_amount: finalRefundPoint,
                              });
                              setLatestPointAmount(finalRefundPoint);
                              setPointDeductionAmount(0);
                              setToastVariant('success');
                              setToastMessage('포인트 차감이 완료되었습니다');
                              setIsToastVisible(true);
                            } catch (err) {
                              setToastVariant('warning');
                              setToastMessage('포인트 차감 중 오류가 발생했습니다');
                              setIsToastVisible(true);
                            }
                          }}
                        >
                          차감하기
                        </button>
                      </div>
                    </>
                  )}
                  {orderDetail?.delivery_fee_payment_amount && orderDetail.delivery_fee_payment_amount > 0 && (
                    <>
                      <p className="text-sm font-medium mt-4">반품 배송비</p>
                      <div className="mt-2">
                        <button
                          className={`px-3 py-2 rounded-md text-sm ${
                            orderDetail?.delivery_fee_payment_status === 'PAYMENT_REFUND' 
                              ? 'bg-gray-400 text-white cursor-not-allowed' 
                              : 'bg-black text-white'
                          }`}
                          disabled={orderDetail?.delivery_fee_payment_status === 'PAYMENT_REFUND'}
                          onClick={async () => {
                            if (!window.confirm('반품 배송비를 환불하시겠습니까?')) return;
                            try {
                              // 포트원 환불 API 호출
                              await axios.post(`${process.env.REACT_APP_API_URL}/app/portone/requestPortOneRefund`, {
                                imp_uid: orderDetail?.delivery_fee_portone_imp_uid || null,
                                merchant_uid: orderDetail?.delivery_fee_portone_merchant_uid || null,
                                refundAmount: orderDetail?.delivery_fee_payment_amount,
                                reason: '반품 배송비 환불',
                              });
                              
                              // 결제 정보 업데이트
                              await axios.post(`${process.env.REACT_APP_API_URL}/app/memberPaymentApp/updateMemberPaymentApp`, {
                                payment_app_id: orderDetail?.delivery_fee_payment_app_id,
                                payment_status: 'PAYMENT_REFUND',
                                refund_amount: orderDetail?.delivery_fee_payment_amount,
                                userId: user?.index,
                              });
                              
                              setToastVariant('success');
                              setToastMessage('반품 배송비 환불이 완료되었습니다');
                              setIsToastVisible(true);
                            } catch (err) {
                              setToastVariant('warning');
                              setToastMessage('반품 배송비 환불 중 오류가 발생했습니다');
                              setIsToastVisible(true);
                            }
                          }}
                        >
                          {orderDetail?.delivery_fee_payment_status === 'PAYMENT_REFUND' 
                            ? '환불완료' 
                            : `${Number(orderDetail.delivery_fee_payment_amount).toLocaleString()}원 환불하기`
                          }
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="w-1/3 ml-10">
            {isRefundCalcMode && (
              <div className="bg-white p-10 rounded-lg shadow-md mb-4">
                {(() => {
                  const baseAmount = (orderDetail.products || []).reduce((sum: number, item: any, idx: number) => {
                    // if (actionType === 'cancel') {
                      const status = String(item?.order_status || '').trim().toUpperCase();
                      if (["SHIPPINGING", "SHIPPING_COMPLETE", "PURCHASE_CONFIRM"].includes(status)) return sum;
                      const totalQty = Number(item?.total_order_quantity ?? item?.order_quantity ?? 0);
                      if (!totalQty) return sum;
                      const canceledQty = Number((quantityByIndex[idx] ?? item?.return_quantity ?? 0) || 0);
                      if (canceledQty <= 0) return sum;
                      const paymentAmount = Number(item?.payment_amount || 0);
                      const perUnit = paymentAmount / totalQty;
                      return sum + (perUnit * canceledQty);
                    // }
                    return sum;
                  }, 0);
                  const safeDeduction = Math.min(Number(refundDeductionAmount || 0), baseAmount);

                  const expectedAmount = Math.max(baseAmount - safeDeduction, 0);

                  return (
                    <div className="flex items-center justify-between">
                      <p className="text-m font-medium">예상 환불 금액</p>
                      <p className="text-m font-medium"><span className="text-xl font-bold">{expectedAmount.toLocaleString()}</span>원</p>
                    </div>
                  );
                })()}
              </div>
            )}
            <div className="bg-white p-10 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-m font-medium">결제정보</p>
              </div>
              <div className="mt-10 space-y-3">
                {(() => {
                  const productTotalAll = (orderDetail.products || []).reduce((sum: number, item: any) => sum + ((item?.original_price || 0) * (item?.order_quantity || 0)), 0);
                  const productDiscountedAll = (orderDetail.products || []).reduce((sum: number, item: any) => sum + ((item?.price || 0) * (item?.order_quantity || 0)), 0);
                  const orderAmount = Number(orderDetail?.payment_amount || 0);
                  const usedPoint = Number((latestPointAmount ?? orderDetail?.point_use_amount) || 0);
                  const paymentBalance = Number(orderDetail?.payment_amount || 0);
                  const couponAmt = Number(orderDetail?.coupon_discount_amount || 0);
                  const couponType = String(orderDetail?.coupon_discount_type || '').toUpperCase();
                  const couponDeduction = couponAmt
                    ? (couponType === 'PERCENT'
                        ? Number((couponAmt * 1/100) * (productTotalAll - productDiscountedAll))
                        : couponAmt)
                    : 0;
                  const saleDiscount = Math.max(productTotalAll - productDiscountedAll, 0);
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-m font-medium">주문 금액</p>
                        <p className="text-m font-medium"><span className="text-xl font-bold">{productTotalAll.toLocaleString()}</span>원</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-m font-medium">상품 금액</p>
                        <p className="text-m font-medium"><span className="text-xl font-bold">{productTotalAll.toLocaleString()}</span>원</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-m font-medium">할인</p>
                        <p className="text-m font-medium">-<span className="text-xl font-bold">{saleDiscount.toLocaleString()}</span>원</p>
                      </div>
                      {!!couponAmt && (
                        <div className="flex items-center justify-between">
                          <p className="text-m font-medium">쿠폰</p>
                          <p className="text-m font-medium">-<span className="text-xl font-bold">{couponDeduction.toLocaleString()}</span>원</p>
                        </div>
                      )}
                      {/* <div className="flex items-center justify-between">
                        <p className="text-m font-medium">기본 배송비</p>
                        <p className="text-m font-medium"><span className="text-xl font-bold">{baseDeliveryFee.toLocaleString()}</span>원</p>
                      </div> */}
                      <div className="flex items-center justify-between">
                        <p className="text-m font-medium">적립금 사용</p>
                        <p className="text-m font-medium"><span className="text-xl font-bold">{usedPoint ? '-' + (usedPoint).toLocaleString() : 0}</span>원</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-m font-medium">결제 잔액</p>
                        <p className="text-m font-medium"><span className="text-xl font-bold">{paymentBalance.toLocaleString()}</span>원</p>
                      </div>
                      {orderDetail?.refund_amount && (
                        <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                          <p className="text-m font-medium">부분 취소</p>
                          <p className="text-m font-medium"><span className="text-xl font-bold">{Number(orderDetail?.refund_amount).toLocaleString()}</span>원</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="bg-white p-10 rounded-lg shadow-md mt-4">
              <div className="flex items-center justify-between">
                <p className="text-m font-medium">환불 정보</p>
              </div>
              {(() => {
                const baseAmount = (orderDetail.products || []).reduce((sum: number, item: any, idx: number) => {
                  // if (actionType !== 'cancel') return sum;
                  const status = String(item?.order_status || '').trim().toUpperCase();
                  if (["SHIPPINGING", "SHIPPING_COMPLETE", "PURCHASE_CONFIRM"].includes(status)) return sum;
                  const totalQty = Number(item?.total_order_quantity ?? item?.order_quantity ?? 0);
                  if (!totalQty) return sum;
                  const canceledQty = Number((quantityByIndex[idx] ?? item?.return_quantity ?? 0) || 0);
                  if (canceledQty <= 0) return sum;
                  const paymentAmount = Number(item?.payment_amount || 0);
                  const perUnit = paymentAmount / totalQty;
                  return sum + (perUnit * canceledQty);
                }, 0);
                const safeDeduction = Math.min(Number(refundDeductionAmount || 0), baseAmount);

                const expectedAmount = Math.max(baseAmount - safeDeduction, 0);
                
                return (
                  <div className="mt-6 space-y-4">
                    <div>
                      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                        <p className="text-sm text-gray-500 font-medium">환불 금액</p>
                        <p className="mt-2 text-gray-500 text-sm font-bold">{formatNumber(expectedAmount)} 원</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">최종 환불 금액</p>
                        <label className="text-xs flex items-center gap-2">
                          <input type="checkbox" checked={isManualFinalRefundAmount} onChange={(e) => setIsManualFinalRefundAmount(e.target.checked)} />
                          직접입력
                        </label>
                      </div>
                      <div className="mt-2 relative">
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded px-3 py-2 pr-8 text-sm text-right"
                          value={isManualFinalRefundAmount ? formatNumber(manualFinalRefundAmount) : formatNumber(expectedAmount)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9]/g, '');
                            const next = Number(raw || 0);
                            const limit = expectedAmount;
                            if (next > limit) {
                              setToastVariant('warning');
                              setToastMessage('입력할 수 없습니다');
                              setIsToastVisible(true);
                              return;
                            }
                            setManualFinalRefundAmount(next);
                          }}
                          placeholder={`${formatNumber(expectedAmount)} 원`}
                          disabled={!isManualFinalRefundAmount}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">원</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {!(Number((latestPointAmount ?? orderDetail?.point_use_amount) || 0) > 0) ? null : (
              <div className="bg-white p-10 rounded-lg shadow-md mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-m font-medium">적립금 정보</p>
                </div>
                {(() => {
                  const usedPoint = Number((latestPointAmount ?? orderDetail?.point_use_amount) || 0);
                  const deductedPoint = Math.min(Number(pointDeductionAmount || 0), usedPoint);
                  const finalRefundPoint = Math.max(usedPoint - deductedPoint, 0);
                  return (
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">사용 적립금</p>
                        <p className="text-sm font-medium">{usedPoint.toLocaleString()} 원</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">차감 적립금</p>
                        <p className="text-sm font-medium">{deductedPoint.toLocaleString()} 원</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">최종 환불 적립금</p>
                        <p className="text-sm font-medium">{finalRefundPoint.toLocaleString()} 원</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
              <button
              className="w-full bg-black text-white px-4 py-3 rounded-md mt-5"
              onClick={async () => {
                if (!window.confirm('반품 배송비, 적립금 차감 등 모든 처리가 완료되었습니까?\n정말로 환불 처리를 진행하시겠습니까?')) return;
                await fn_approveCancel();
                setToastVariant('success');
                setToastMessage(`${formatNumber(finalRefundAmountNumber)}원 환불 처리되었습니다`);
                setIsToastVisible(true);
                navigate(-1);
              }}
            >
              {(() => {
                // if (actionType === 'cancel') {
                  const baseAmount = (orderDetail.products || []).reduce((sum: number, item: any, idx: number) => {
                    const status = String(item?.order_status || '').trim().toUpperCase();
                    if (["SHIPPINGING", "SHIPPING_COMPLETE", "PURCHASE_CONFIRM"].includes(status)) return sum;
                    const totalQty = Number(item?.total_order_quantity ?? item?.order_quantity ?? 0);
                    if (!totalQty) return sum;
                    const canceledQty = Number((quantityByIndex[idx] ?? item?.return_quantity ?? 0) || 0);
                    if (canceledQty <= 0) return sum;
                    const paymentAmount = Number(item?.payment_amount || 0);
                    const perUnit = paymentAmount / totalQty;
                    return sum + (perUnit * canceledQty);
                  }, 0);
                  const safeDeduction = Math.min(Number(refundDeductionAmount || 0), baseAmount);
                  const expectedAmount = Math.max(baseAmount - safeDeduction, 0);
                  return `${formatNumber(expectedAmount)}원 환불 처리`;
                // }

                // const base = (orderDetail.products || []).reduce((sum: number, item: any, idx: number) => {
                //   const price = Number(item?.payment_amount || 0);
                //   return sum + (price);
                // }, 0);
                // const expectedAmountForDisplay = Math.max(base, 0);
                // const autoFinalForInput = Math.max(expectedAmountForDisplay - Math.min(Number(refundDeductionAmount || 0), expectedAmountForDisplay), 0);
                // return `${formatNumber(autoFinalForInput)}원 환불 처리`;
              })()}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex items-start justify-between mt-10">
          <div className="w-2/3 bg-white p-10 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-m">{actionType === 'cancel' ? '취소 정보' : '반품 정보'}</p>
            </div>
            <div className="mt-6">
              <div className="flex items-start">
                <p className="w-1/3 text-m font-semibold">품목</p>
                <div className="w-2/3">
                {(orderDetail.products || [])
                  .map((item: any, idx: number) => ({ item, idx }))
                  .filter(({ idx }: { idx: number }) => (quantityByIndex[idx] ?? 0) > 0)
                  .filter(({ item }: { item: any }) => actionType !== 'cancel' || !['SHIPPINGING', 'SHIPPING_COMPLETE', 'PURCHASE_CONFIRM'].includes(String(item?.order_status || '').trim().toUpperCase()))
                  .map(({ item, idx }: { item: any; idx: number }, listIdx: number) => {
                    const selectedQty = quantityByIndex[idx] ?? 0;
                    return (
                      <div className={`flex items-center justify-between ${listIdx !== 0 ? 'mt-10' : ''}`} key={idx}>
                        <div className="flex items-center gap-2">
                          <img src={item.image} className="w-16 h-16 rounded-lg" alt="상품 이미지" />
                          <div className="flex flex-col">
                            <p className="text-sm font-semibold">{item.product_name}</p>
                            <p className="bg-gray-300 px-2 py-1 rounded-full w-fit text-xs font-semibold mt-1">{item.option_gender == 'M' ? '남자' : item.option_gender == 'W' ? '여자' : '공용'} {item.option_amount}{item.option_unit}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-sm font-semibold">{(item.price * selectedQty)?.toLocaleString()} 원</p>
                          <p className="text-xs text-gray-500 mt-1">{item.price?.toLocaleString()} X {selectedQty}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              {actionType === 'return' && !hasReturnApplySelected && (
                <div className="mt-10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-m font-semibold">수거정보</p>
                    <div className="flex items-center gap-4 text-sm">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="autoPickup"
                          checked={isAutoPickup}
                          onChange={() => setIsAutoPickup(true)}
                          className="form-radio"
                        />
                        자동수거 신청
                      </label>
                    </div>
                  </div>
                  <div className="mt-8 text-right">
                    <p className="text-sm font-semibold mb-2">수거 주소</p>
                    <div className="flex items-center gap-4 text-sm justify-end">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="pickupMode"
                          checked={isPickupDefaultAddress}
                          onChange={() => setIsPickupDefaultAddress(true)}
                          className="form-radio"
                        />
                        기본 주문 주소
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="pickupMode"
                          checked={!isPickupDefaultAddress}
                          onChange={() => setIsPickupDefaultAddress(false)}
                          className="form-radio"
                        />
                        직접입력
                      </label>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-right mt-4">
                      <p className="text-sm font-semibold mb-4">받는분</p>
                      <input
                        type="text"
                        className="w-1/2 border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder="받는분"
                        value={pickupReceiverName}
                        onChange={(e) => setPickupReceiverName(e.target.value)}
                        disabled={isPickupDefaultAddress}
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold mb-4">연락처</p>
                      <input
                        type="text"
                        className="w-1/2 border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder="연락처"
                        value={pickupReceiverPhone}
                        onChange={(e) => setPickupReceiverPhone(e.target.value)}
                        disabled={isPickupDefaultAddress}
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">주소정보</p>
                      <div className="flex items-center justify-end gap-2 mt-4">
                        <input
                          type="text"
                          className=" border border-gray-300 rounded px-3 py-2 text-sm"
                          placeholder="우편번호"
                          value={pickupZipCode}
                          disabled
                          onChange={(e) => setPickupZipCode(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={handleSearchAddress}
                          className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                          disabled={isPickupDefaultAddress}
                        >
                          검색
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <input
                        type="text"
                        className="w-1/2 border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder="도로명 혹은 지번주소"
                        value={pickupRoadAddress || pickupJibunAddress}
                        disabled
                        onChange={(e) => setPickupRoadAddress(e.target.value)}
                      />
                    </div>
                    <div className="text-right">
                      <input
                        type="text"
                        className="w-1/2 border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder="상세주소"
                        value={pickupDetailAddress}
                        onChange={(e) => setPickupDetailAddress(e.target.value)}
                        disabled={isPickupDefaultAddress}
                      />
                    </div>
                    <div className="text-right">
                      <input
                        type="text"
                        className="w-1/2 border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder={isPickupDefaultAddress ? '출입방법' : '출입방법(선택사항)'}
                        value={pickupEnterWay}
                        onChange={(e) => setPickupEnterWay(e.target.value)}
                        disabled={isPickupDefaultAddress}
                      />
                    </div>
                    <div className="text-right">
                      <input
                        type="text"
                        className="w-1/2 border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder={isPickupDefaultAddress ? '출입메모' : '출입메모(선택사항)'}
                        value={pickupEnterMemo}
                        onChange={(e) => setPickupEnterMemo(e.target.value)}
                        disabled={isPickupDefaultAddress}
                      />
                    </div>
                    <div className="text-right">
                      <input
                        type="text"
                        className="w-1/2 border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder={isPickupDefaultAddress ? '배송 요구사항' : '배송요구사항(선택사항)'}
                        value={pickupDeliveryRequest}
                        onChange={(e) => setPickupDeliveryRequest(e.target.value)}
                        disabled={isPickupDefaultAddress}
                      />
                    </div>
                  </div>
                </div>
              )}
              {!hasReturnApplySelected && (
              <div className="mt-10 flex items-center w-full">
                <p className="text-m font-semibold w-1/3">사유</p>
                <select className="w-2/3 border border-gray-300 rounded px-3 py-2" value={selectedReturnReasonType} onChange={(e) => setSelectedReturnReasonType(e.target.value)}>
                  <option value="">선택하세요</option>
                  {returnReasonList.map((reason: any) => (
                    <option key={reason.common_code} value={reason.common_code}>
                      {reason.common_code_name}
                    </option>
                  ))}
                </select>
              </div>
              )}
              {!hasReturnApplySelected && (
              <div className="mt-10 flex items-center w-full">
                <p className="text-m font-semibold w-1/3"></p>
                <textarea
                  className="w-2/3 border border-gray-300 rounded px-3 py-2 h-32"
                  placeholder={("" + (() => {
                    const selectedReason = (returnReasonList || []).find((r: any) => String(r?.common_code) === String(selectedReturnReasonType));
                    const reasonName = String(selectedReason?.common_code_name || '');
                    const reasonCodeUpper = String(selectedReturnReasonType || '').trim().toUpperCase();
                    const isOtherReason = reasonName.includes('기타') || reasonCodeUpper === 'OTHER' || reasonCodeUpper === 'ETC';
                    return isOtherReason
                      ? '상세 사유를 정확하게 입력해주세요 (필수 사항)'
                      : '상세 사유를 입력해주세요 (선택 사항)';
                  })())}
                  value={detailReason}
                  onChange={(e) => setDetailReason(e.target.value)}
                />
              </div>
              )}
            </div>
          </div>
          <div className="w-1/3 ml-10 bg-white p-10 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-m font-medium">예상 환불 금액</p>
            </div>
            <div className="mt-10">
              {!orderDetail?.payment_amount && (
                <div className="flex items-center justify-between">
                  <p className="text-m font-medium">포인트</p>
                  <p className="text-m font-medium">
                    <span className="text-xl font-bold">{(() => {
                      if (actionType === 'return') {
                        const selectedTotal = (orderDetail.products || []).reduce((sum: number, item: any, idx: number) => {
                          const point_use_amount = item.point_use_amount ?? 0;
                          return Number(point_use_amount).toLocaleString();
                        }, 0);
                        return selectedTotal?.toLocaleString();
                      } else if (actionType === 'cancel') {
                        const cancelSelectedTotal = (orderDetail.products || []).reduce((sum: number, item: any, idx: number) => {
                          const status = String(item?.order_status || '').trim().toUpperCase();
                          if (['SHIPPINGING', 'SHIPPING_COMPLETE', 'PURCHASE_CONFIRM'].includes(status)) return sum;
                          const point_use_amount = item.point_use_amount ?? 0;
                          return Number(point_use_amount).toLocaleString();
                        }, 0);
                        return cancelSelectedTotal?.toLocaleString();
                      }
                      return orderDetail?.point_amount?.toLocaleString();
                    })()}</span>원
                  </p>
                </div>
              )}
              
              {/* {orderDetail.delivery_fee && (orderDetail?.payment_amount <= orderDetail?.free_shipping_amount) &&
                orderDetail.products.some((_: any, idx: number) => (quantityByIndex[idx] ?? 0) > 0) &&
                (
                  orderDetail.free_shipping_amount >= orderDetail.products.reduce((sum: number, item: any, idx: number) => {
                    const qty = quantityByIndex[idx] ?? 0;
                    const price = item.price ?? 0;
                    return sum + qty * price;
                  }, 0)
                ) && (
                <div className="flex items-center justify-between">
                  <p className="text-m font-medium">배송비</p>
                  <p className="text-m font-medium"><span className="text-xl font-bold">{orderDetail?.delivery_fee?.toLocaleString()}</span>원</p>
                </div>
              )} */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-m font-medium">금액</p>
                <p className="text-m font-medium">
                  <span className="text-xl font-bold">{(() => {
                    if (actionType === 'return') {
                      const selectedTotal = (orderDetail.products || []).reduce((sum: number, item: any, idx: number) => {
                        const qty = quantityByIndex[idx] ?? 0;
                        const price = item.price ?? 0;
                        return sum + qty * price;
                      }, 0);
                      return selectedTotal?.toLocaleString();
                    } else if (actionType === 'cancel') {
                      const cancelSelectedTotal = (orderDetail.products || []).reduce((sum: number, item: any, idx: number) => {
                        const status = String(item?.order_status || '').trim().toUpperCase();
                        if (["SHIPPINGING", "SHIPPING_COMPLETE", "PURCHASE_CONFIRM"].includes(status)) return sum;
                        const totalQty = Number(item?.total_order_quantity ?? item?.order_quantity ?? 0);
                        if (!totalQty) return sum;
                        const canceledQty = Number((quantityByIndex[idx] ?? item?.return_quantity ?? 0) || 0);
                        if (canceledQty <= 0) return sum;
                        const paymentAmount = Number(item?.payment_amount || 0);
                        const perUnit = paymentAmount / totalQty;
                        return sum + (perUnit * canceledQty);
                      }, 0);
                      return cancelSelectedTotal?.toLocaleString();
                    }
                    return orderDetail?.payment_amount ? orderDetail?.payment_amount?.toLocaleString() : 0;
                  })()} </span>원
                </p>
              </div>
              <div className="mt-6">
                <button
                  className="w-full bg-black text-white px-4 py-3 rounded-md"
                  onClick={() => {
                    if (!hasReturnApplySelected) {
                      if (!selectedReturnReasonType) {
                        setToastVariant('warning');
                        setToastMessage('사유를 골라주세요');
                        setIsToastVisible(true);
                        return;
                      }
                    }
                    if (actionType === 'return' && !isPickupDefaultAddress) {
                      const hasReceiver = String(pickupReceiverName || '').trim().length > 0;
                      const hasPhone = String(pickupReceiverPhone || '').trim().length > 0;
                      const hasZip = String(pickupZipCode || '').trim().length > 0;
                      const hasBaseAddr = String(pickupRoadAddress || pickupJibunAddress || '').trim().length > 0;
                      const hasDetail = String(pickupDetailAddress || '').trim().length > 0;
                      if (!(hasReceiver && hasPhone && hasZip && hasBaseAddr && hasDetail)) {
                        setToastVariant('warning');
                        setToastMessage('주소를 입력해 주세요');
                        setIsToastVisible(true);
                        return;
                      }
                    }
                    if (!hasReturnApplySelected) {
                      const selectedReason = (returnReasonList || []).find((r: any) => String(r?.common_code) === String(selectedReturnReasonType));
                      const reasonName = String(selectedReason?.common_code_name || '');
                      const reasonCodeUpper = String(selectedReturnReasonType || '').trim().toUpperCase();
                      const isOtherReason = reasonName.includes('기타') || reasonCodeUpper === 'OTHER' || reasonCodeUpper === 'ETC';
                      if (isOtherReason && String(detailReason || '').trim().length === 0) {
                        setToastVariant('warning');
                        setToastMessage('상세 사유를 입력해주세요');
                        setIsToastVisible(true);
                        return;
                      }
                    }
                    // 자동수거 선택 시 굿스플로 출고 이력이 없는(수동 등록) 상품은 자동수거 불가
                    if (actionType === 'return' && isAutoPickup) {
                      const selectedForAutoPickup = (orderDetail.products || [])
                        .map((item: any, idx: number) => ({ item, idx }))
                        .filter(({ idx }: { idx: number }) => (quantityByIndex[idx] ?? 0) > 0)
                        .filter(({ item }: { item: any }) => {
                          const statusCode = String(item?.order_status || '').trim().toUpperCase();
                          return statusCode === 'SHIPPINGING' || statusCode === 'SHIPPING_COMPLETE' || statusCode === 'EXCHANGE_SHIPPING_COMPLETE';
                        });
                      const hasManualRegistered = selectedForAutoPickup.some(({ item }: { item: any }) => !item?.goodsflow_id);
                      if (hasManualRegistered) {
                        alert('수동 입력으로 등록된 상품은 자동수거가 불가능 합니다');
                        return;
                      }
                    }
                    setIsConfirmOpen(true);
                  }}
                >
                  {actionType === 'cancel' ? '취소 접수' : '반품 접수'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={toastVariant === 'warning' ? 'toast-warning' : ''}>
        <CustomToastModal
          message={toastMessage}
          isVisible={isToastVisible}
          variant={toastVariant}
          onClose={() => setIsToastVisible(false)}
        />
      </div>

      {isConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-96 max-w-md mx-4">
            <h2 className="text-xl font-bold text-black mb-2">
              {actionType === 'cancel' ? '취소접수 처리 할까요?' : '반품접수 처리 할까요?'}
            </h2>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                닫기
              </button>
              <button
                onClick={fn_handleConfirm}
                className="px-4 py-2 text-white bg-black rounded-lg hover:opacity-90"
              >
                {actionType === 'cancel' ? '취소접수 처리' : '반품접수 처리'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberOrderAppReturn;
