import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../../store/store";
import OrderPrintModal from "../../../components/app/OrderPrintModal";
import MemberOrderAppPopup from "../../../components/app/MemberOrderAppPopup";
import GoodsflowModal from "../../../components/app/GoodsflowModal";
import CustomToastModal from "../../../components/CustomToastModal";

interface OrderDetail {
  mem_id: string;
  mem_name: string;
  mem_birth: string;
  mem_phone: string;
  mem_app_id: string;
  order_app_id: number;
  order_detail_app_id: number;
  order_status: string;
  order_quantity: number;
  order_courier_code: string;
  tracking_number: string;
  goodsflow_id: string;
  purchase_confirm_dt: string;
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
  enter_way: string;
  enter_memo: string;
  option_type: string;
  option_amount: number;
  option_unit: string;
  option_gender: string;
  product_app_id: number;
  delivery_fee: number;
  products: any[];
  extra_zip_code: string;
  remote_delivery_fee: number;
  free_shipping_amount: number;
  point_minus: number;
  order_group: number;
  return_reason_type?: string;
  return_applicator?: string;
  return_quantity: number;
  point_use_amount: number;
  payment_app_id?: number;
  quantity: number;
  return_dt: string;
  refund_amount: number;
  customer_tracking_number: string;
  company_tracking_number: string;
  customer_courier_code: string;
  company_courier_code: string;
  return_goodsflow_id: string;
  delivery_fee_portone_imp_uid: string;
  delivery_fee_portone_merchant_uid: string;
  delivery_fee_payment_app_id: number;
  coupon_discount_amount: number;
  coupon_discount_type: string;
}

interface CommonCode {
  common_code: string;
  group_code: string;
  common_code_name: string;
  common_code_memo: string;
}

const MemberOrderAppDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useUserStore((state) => state.user);
  
  // 화면/계산 공통에 사용하는 헬퍼 함수/상수 정의
  const toStatus = (s: any) => {
    const u = String(s ?? '').trim().toUpperCase();
    if (u === 'EXCHANGE_PAYMENT_COMPLETE') return 'PAYMENT_COMPLETE';
    return u;
  };
  const STATUS_SETS = {
    shippingVisible: new Set(['PAYMENT_COMPLETE', 'SHIPPINGING', 'SHIPPING_COMPLETE', 'PURCHASE_CONFIRM']),
    discountExcluded: new Set(['CANCEL_COMPLETE', 'EXCHANGE_COMPLETE', 'RETURN_COMPLETE'])
  } as const;
  // 상태 코드 → 상태명 변환
  const getOrderStatusName = (status?: string) => {
    const code = String(status || '');
    return orderStatusCodeList.find(c => c.common_code === code)?.common_code_name || '';
  };
  // 상세 데이터에 이미지 필드를 보강하여 반환
  const buildEnhancedOrderDetail = (detail: any) => detail ? {
    ...detail,
    products: detail.products?.map((product: any) => ({
      ...product,
      image: product.image || product.product_image || ''
    }))
  } : detail;
  
  // state로 전달받은 주문 정보가 있으면 사용
  const { id: routeOrderId } = useParams();
  const orderFromState = location.state?.orderDetail;
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(orderFromState || null);
  const [deliveryCompanyList, setDeliveryCompanyList] = useState<CommonCode[]>([]);
  const [orderStatusCodeList, setOrderStatusCodeList] = useState<CommonCode[]>([]);
  const [returnReasonCodeList, setReturnReasonCodeList] = useState<CommonCode[]>([]);
  const [openTrackingDropdownGroup, setOpenTrackingDropdownGroup] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState<'전체' | '배송' | '취소' | '반품교환'>('전체');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isInvoicePopupOpen, setIsInvoicePopupOpen] = useState(false);
  const [openDetailActionsGroup, setOpenDetailActionsGroup] = useState<number | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isGoodsflowModalOpen, setIsGoodsflowModalOpen] = useState(false);
  const [isMergeMode, setIsMergeMode] = useState(false);
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [activeSplitGroup, setActiveSplitGroup] = useState<number | null>(null);
  const [activeMergeGroup, setActiveMergeGroup] = useState<number | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [splitGroups, setSplitGroups] = useState<any[]>([]);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [toastVariant, setToastVariant] = useState<'warning' | 'success'>('success');
  const [toastMessage, setToastMessage] = useState<string>('접수 처리가 완료되었습니다');
  const [invoiceOrderIds, setInvoiceOrderIds] = useState<number[]>([]);
  const [goodsflowOrders, setGoodsflowOrders] = useState<any[]>([]);
  const [splitQtyByDetailId, setSplitQtyByDetailId] = useState<Record<number, number | ''>>({});
  const [exchangeRequestedGroups, setExchangeRequestedGroups] = useState<Set<number>>(new Set());
  const [isExchangePickupConfirmOpen, setIsExchangePickupConfirmOpen] = useState(false);
  const [exchangePickupRefundChoice, setExchangePickupRefundChoice] = useState<'yes' | 'no'>('no');
  const [exchangeTargetDetailIds, setExchangeTargetDetailIds] = useState<number[] | null>(null);

  // 배송중 알림 발송
  const sendShippingNotification = async (memId: string | number, memName: string, productName: string) => {
    try {
      if (!memId || !memName || !productName) return;
      const title = `${memName}님께서 주문하신 ${productName} 상품이 현재 배송중 상태입니다.`;
      const content = '고객님의 소중한 상품을 안전하게 배송 중입니다. 곧 빠르고 안전하게 받아보실 수 있도록 정성을 다하겠습니다.';
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
      console.error('배송중 알림 발송 오류:', err);
    }
  };

  // 배송완료 알림 발송
  const sendShippingCompleteNotification = async (memId: string | number, memName: string, productName: string) => {
    try {
      if (!memId || !memName || !productName) return;
      const title = `${memName}님께서 주문하신 ${productName} 상품이 배송 완료 되었습니다.`;
      const content = '고객님의 소중한 상품이 배송 완료되었습니다. 저희 서비스를 이용해 주셔서 감사드리며, 앞으로도 더 나은 서비스를 위해 노력하겠습니다.';
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
      console.error('배송완료 알림 발송 오류:', err);
    }
  };

  useEffect(() => {
    if (user && user.index) {
      fn_selectCommonCodeList();
    }
  }, [user]);

  // 상세 데이터 조회: selectMemberOrderAppList로 조회하여 그룹 데이터/주소/이미지 병합
  useEffect(() => {
    const fetchDetail = async () => {
      if (!user || !user.index) return;

      try {
        const targetId = orderFromState?.order_app_id || routeOrderId;
        if (!targetId) return;

        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/app/memberOrderApp/selectMemberOrderAppList`,
          {
            center_id: user.index,
            order_status: '',
            searchValue: String(targetId)
          }
        );

        const rows = response.data?.orders || response.data || [];
        if (!Array.isArray(rows) || rows.length === 0) return;

        // target 주문만 필터링 (order_app_id 일치하는 것 우선)
        const filtered = rows.filter((r: any) => String(r.order_app_id) === String(targetId));
        const targetRows = filtered.length > 0 ? filtered : rows;

        // payment_app_id 기준으로 동일 결제 묶음 전체 재조회 (검색 누락 방지)
        const paymentAppId = targetRows[0]?.payment_app_id;
        let groupRows: any[] = targetRows;
        if (paymentAppId) {
          try {
            const groupRes = await axios.post(
              `${process.env.REACT_APP_API_URL}/app/memberOrderApp/selectMemberOrderAppList`,
              { center_id: user.index, payment_app_id: paymentAppId }
            );
            const allGroupRows = groupRes.data?.orders || groupRes.data || [];
            groupRows = Array.isArray(allGroupRows) && allGroupRows.length > 0
              ? allGroupRows
              : rows.filter((r: any) => r.payment_app_id === paymentAppId);
          } catch (e) {
            groupRows = rows.filter((r: any) => r.payment_app_id === paymentAppId);
          }
        }

        let base = groupRows[0];
        let products = groupRows.map((r: any) => ({ ...r }));

        // 파람으로는 이미지 정보만 사용: state에서 넘어온 상품 이미지가 있으면 병합
        try {
          const stateImages = Array.isArray(orderFromState?.products)
            ? orderFromState.products
                .map((p: any) => ({
                  product_app_id: p?.product_app_id,
                  product_detail_app_id: p?.product_detail_app_id,
                  product_image: p?.product_image || p?.image || ''
                }))
            : [];

          if (stateImages.length > 0) {
            const byDetailId = new Map<string, string>();
            const byProductId = new Map<number, string>();
            stateImages.forEach((img: any) => {
              if (img.product_detail_app_id) {
                byDetailId.set(String(img.product_detail_app_id), img.product_image);
              }
              if (img.product_app_id) {
                byProductId.set(Number(img.product_app_id), img.product_image);
              }
            });

            products = products.map((p: any) => {
              const imgByDetail = p?.product_detail_app_id ? byDetailId.get(String(p.product_detail_app_id)) : undefined;
              const imgByProduct = p?.product_app_id ? byProductId.get(Number(p.product_app_id)) : undefined;
              const product_image = imgByDetail || imgByProduct || p?.product_image || '';
              return { ...p, product_image };
            });
          }
        } catch (e) {
          // ignore merge errors; 이미지 병합 실패 시 무시
        }

        // 주소 매핑: order_app_id 기준으로 배송지 정보를 병합
        try {
          const addrRes = await axios.post(
            `${process.env.REACT_APP_API_URL}/app/memberOrderAddress/selectMemberOrderAddress`,
            { center_id: user.index }
          );
          const addrRows = addrRes?.data?.result || [];
          const addrByOrderId = new Map<number, any>();
          (addrRows || []).forEach((row: any) => {
            const oid = Number(row?.order_app_id);
            if (!isNaN(oid) && !addrByOrderId.has(oid)) {
              addrByOrderId.set(oid, row);
            }
          });
          const addressRow = addrByOrderId.get(Number((base as any)?.order_app_id));
          if (addressRow) {
            products = products.map((p: any) => ({
              ...p,
              receiver_name: addressRow.receiver_name,
              receiver_phone: addressRow.receiver_phone,
              address: addressRow.address,
              address_detail: addressRow.address_detail,
              zip_code: addressRow.zip_code,
              enter_way: addressRow.enter_way,
              enter_memo: addressRow.enter_memo,
              delivery_request: addressRow.delivery_request,
              extra_zip_code: addressRow.extra_zip_code,
              delivery_fee_portone_imp_uid: addressRow.delivery_fee_portone_imp_uid,
              delivery_fee_portone_merchant_uid: addressRow.delivery_fee_portone_merchant_uid,
            }));
          }
          // base에도 동일 배송지 반영
          base = {
            ...base,
            receiver_name: addressRow?.receiver_name ?? (base as any)?.receiver_name,
            receiver_phone: addressRow?.receiver_phone ?? (base as any)?.receiver_phone,
            address: addressRow?.address ?? (base as any)?.address,
            address_detail: addressRow?.address_detail ?? (base as any)?.address_detail,
            zip_code: addressRow?.zip_code ?? (base as any)?.zip_code,
            enter_way: addressRow?.enter_way ?? (base as any)?.enter_way,
            enter_memo: addressRow?.enter_memo ?? (base as any)?.enter_memo,
            delivery_request: addressRow?.delivery_request ?? (base as any)?.delivery_request,
            extra_zip_code: addressRow?.extra_zip_code ?? (base as any)?.extra_zip_code,
            delivery_fee_portone_imp_uid: addressRow?.delivery_fee_portone_imp_uid ?? (base as any)?.delivery_fee_portone_imp_uid,
            delivery_fee_portone_merchant_uid: addressRow?.delivery_fee_portone_merchant_uid ?? (base as any)?.delivery_fee_portone_merchant_uid,
          } as any;
        } catch (e) {
          console.error('주소 매핑 오류 (detail):', e);
        }

        const detail: OrderDetail = {
          ...(base as any),
          products
        } as OrderDetail;

        setOrderDetail(detail);
      } catch (err) {
        console.error('주문 상세 조회 오류:', err);
      }
    };

    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, routeOrderId]);
  
  // 외부 클릭 시 드롭다운 닫기 처리
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.tracking-dropdown')) {
        setOpenTrackingDropdownGroup(null);
      }
      if (!target.closest('.detail-actions-dropdown')) {
        setOpenDetailActionsGroup(null);
      }
    };

    if (openTrackingDropdownGroup !== null || openDetailActionsGroup !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openTrackingDropdownGroup, openDetailActionsGroup]);

  // 굿스플로 배송결과 조회 후 송장번호/택배사 동기화 (상세 페이지 진입 시 1회)
  useEffect(() => {
    const syncGoodsflowDeliveries = async () => {
      if (!user?.index || !orderDetail) return;

      const rows: any[] = Array.isArray(orderDetail.products) && orderDetail.products.length > 0
        ? orderDetail.products
        : [orderDetail as any];

      // goodsflow_id 수집 및 중복 제거
      const goodsflowIds: string[] = Array.from(new Set(
        rows
          .map((r: any) => String(r?.goodsflow_id || '').trim())
          .filter((id: string) => id !== '')
      ));
      
      if (goodsflowIds.length === 0) return;
      // 항상 조회하여 동기화 시도 (리스트와 동일 동작)
      try {
        const gfRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/app/goodsflow/shipping/deliveries/${goodsflowIds.join(',')}`,
          { params: { idType: 'serviceId', ts: Date.now() } }
        );
        
        const deliveries = gfRes?.data?.data || [];
        if (!Array.isArray(deliveries) || deliveries.length === 0) return;

        // serviceId -> order_detail_app_id[] 매핑
        const serviceIdToDetailIds = new Map<string, number[]>();
        rows.forEach((r: any) => {
          const sid = String(r?.goodsflow_id || '').trim();
          if (sid !== '' && typeof r?.order_detail_app_id === 'number') {
            if (!serviceIdToDetailIds.has(sid)) serviceIdToDetailIds.set(sid, []);
            serviceIdToDetailIds.get(sid)!.push(r.order_detail_app_id);
          }
        });

        // 현재 상태 맵 (상태 변경 없이 그대로 유지) - detail 기준
        const detailIdToStatus = new Map<number, string>();
        rows.forEach((r: any) => {
          if (typeof r?.order_detail_app_id === 'number' && typeof r?.order_status === 'string') {
            detailIdToStatus.set(r.order_detail_app_id, r.order_status);
          }
        });

        const mapTransporterToCourierCode = (transporter: string): string => {
          if (!transporter) return '';
          const t = String(transporter).toUpperCase();
          if (t === 'KOREX') return 'CJ';
          return t;
        };
        
        const updates: Array<{ orderId: number; invoiceNo: string; courierCode: string }> = [];
        const updateCalls = deliveries
          .filter((d: any) => d?.invoiceNo && d?.id && serviceIdToDetailIds.has(String(d.id)))
          .flatMap((d: any) => {
            const targetDetailIds = serviceIdToDetailIds.get(String(d.id))!;
            const courierCode = mapTransporterToCourierCode(d?.transporter || d?.transporterCode || '');
            targetDetailIds.forEach((did) => {
              updates.push({ orderId: did, invoiceNo: String(d.invoiceNo), courierCode });
            });
            return targetDetailIds.map((detailId) => {
              const currentStatus = detailIdToStatus.get(detailId) || 'PAYMENT_COMPLETE';
              return axios.post(
                `${process.env.REACT_APP_API_URL}/app/memberOrderApp/updateTrackingNumber`,
                {
                  order_detail_app_id: [detailId],
                  tracking_number: d.invoiceNo,
                  order_status: currentStatus,
                  userId: user.index,
                  courier_code: courierCode
                }
              );
            });
          });
          
        if (updateCalls.length > 0) {
          await Promise.allSettled(updateCalls);
          // 로컬 상태 즉시 반영
          setOrderDetail((prev) => {
            if (!prev) return prev;
            const updatedProducts = (prev.products || []).map((p: any) => {
              const u = updates.find((it) => it.orderId === p?.order_detail_app_id);
              if (!u) return p;
              return {
                ...p,
                tracking_number: u.invoiceNo,
                order_courier_code: u.courierCode,
                courier_code: u.courierCode
              };
            });
            return { ...prev, products: updatedProducts } as any;
          });
        }

        // (제거됨) 굿스플로 delivered 기반 자동 배송완료 전환
      } catch (error) {
        console.error('Goodsflow deliveries fetch error (detail):', error);
      }

      // 반품용 굿스플로 조회: return_goodsflow_id로 고객 송장번호 동기화
      try {
        const returnRows: any[] = rows;
        const returnIds: string[] = Array.from(new Set(
          returnRows
            .map((r: any) => String(r?.return_goodsflow_id || '').trim())
            .filter((id: string) => id !== '')
        ));
        if (returnIds.length === 0) return;

        // 이미 고객 송장번호가 모두 있는 경우 스킵
        const hasAllCustomerTracking = returnRows
          .filter((r: any) => String(r?.return_goodsflow_id || '').trim() !== '')
          .every((r: any) => !!r?.customer_tracking_number && String(r.customer_tracking_number).trim() !== '');
        if (hasAllCustomerTracking) return;

        const gfRes2 = await axios.get(
          `${process.env.REACT_APP_API_URL}/app/goodsflow/shipping/deliveries/${returnIds.join(',')}`,
          { params: { idType: 'serviceId', ts: Date.now() } }
        );
        const deliveries2 = gfRes2?.data?.data || [];
        if (!Array.isArray(deliveries2) || deliveries2.length === 0) return;

        // 디버그: 굿스플로(반품/교환) 배송상태 콘솔 출력
        try {
          console.log('[GF_RETURN_DELIVERIES]', (deliveries2 || []).map((d: any) => ({
            id: d?.id,
            status: d?.status || d?.deliveryStatus || d?.state,
            invoiceNo: d?.invoiceNo,
            transporter: d?.transporter || d?.transporterCode
          })));
        } catch (_) {}

        // serviceId -> order_detail_app_id[] 매핑(반품용)
        const sidToDetailIds = new Map<string, number[]>();
        returnRows.forEach((r: any) => {
          const sid = String(r?.return_goodsflow_id || '').trim();
          if (sid !== '' && typeof r?.order_detail_app_id === 'number') {
            if (!sidToDetailIds.has(sid)) sidToDetailIds.set(sid, []);
            sidToDetailIds.get(sid)!.push(r.order_detail_app_id);
          }
        });

        const updateCalls2 = deliveries2
          .filter((d: any) => d?.invoiceNo && d?.id && sidToDetailIds.has(String(d.id)))
          .flatMap((d: any) => {
            const targetDetailIds = sidToDetailIds.get(String(d.id))!;
            return targetDetailIds.map((detailId) => axios.post(
              `${process.env.REACT_APP_API_URL}/app/memberReturnApp/updateReturnCustomerTrackingNumber`,
              {
                order_detail_app_id: [detailId],
                customer_tracking_number: String(d.invoiceNo),
                userId: user.index,
                transporter: String(d.transporter)
              }
            ));
          });

        if (updateCalls2.length > 0) {
          await Promise.allSettled(updateCalls2);
          // 로컬 상태 즉시 반영
          setOrderDetail((prev) => {
            if (!prev) return prev;
            const updatedProducts = (prev.products || []).map((p: any) => {
              const match = deliveries2.find((d: any) => d?.invoiceNo && sidToDetailIds.get(String(d.id || ''))?.includes(p?.order_detail_app_id));
              if (!match) return p;
              return { ...p, customer_tracking_number: String(match.invoiceNo) };
            });
            return { ...prev, products: updatedProducts } as any;
          });
        }
      } catch (error) {
        console.error('Goodsflow return deliveries fetch error (detail):', error);
      }
    };

    syncGoodsflowDeliveries();

    // Delivery Tracker 연동: 운송장(택배사/번호)로 배송상태 조회 후 delivered면 배송완료 처리 (반품/교환 제외)
    const syncDeliveryTracker = async () => {
      try {
        const od = orderDetail;
        if (!od) return;
        const rows: any[] = Array.isArray(od.products) && od.products.length > 0
          ? od.products
          : [od as any];

        // key: companyName|trackingNumber → detailIds
        const pairToDetailIds = new Map<string, number[]>();
        const pairs: Array<{ companyName: string; trackingNumber: string; key: string }> = [];
        rows.forEach((r: any) => {
          const trackingNumber = String(r?.tracking_number || '').trim();
          const companyName = String(r?.order_courier_code || r?.courier_code || '').trim();
          if (trackingNumber && companyName && typeof r?.order_detail_app_id === 'number') {
            const key = `${companyName}|${trackingNumber}`;
            if (!pairToDetailIds.has(key)) {
              pairToDetailIds.set(key, []);
              pairs.push({ companyName, trackingNumber, key });
            }
            pairToDetailIds.get(key)!.push(r.order_detail_app_id);
          }
        });
        if (pairs.length === 0) return;

        // 현재 상태 맵
        const detailIdToStatus = new Map<number, string>();
        rows.forEach((r: any) => {
          if (typeof r?.order_detail_app_id === 'number' && typeof r?.order_status === 'string') {
            detailIdToStatus.set(r.order_detail_app_id, r.order_status);
          }
        });

        // 병렬 조회
        const calls = pairs.map((p) => axios.post(`${process.env.REACT_APP_API_URL}/app/trackingService/trackingService`, {
          companyName: p.companyName,
          trackingNumber: p.trackingNumber
        }));
        const results = await Promise.allSettled(calls);

        const deliveredDetailIds: number[] = [];
        results.forEach((res, idx) => {
          if (res.status !== 'fulfilled') return;
          const body: any = res.value?.data || {};
          const ok = body?.success;
          const statusName = String(body?.data?.status || '').toUpperCase();
          const statusCode = String(body?.data?.statusCode || '').toUpperCase();
          const isDelivered = statusName.includes('DELIVER') || statusCode === 'DELIVERED';
          if (!ok || !isDelivered) return;
          const key = pairs[idx].key;
          const ids = pairToDetailIds.get(key) || [];
          deliveredDetailIds.push(...ids);
        });

        const uniqueDelivered = Array.from(new Set(deliveredDetailIds));
        const shippingCandidates = uniqueDelivered.filter((id) => {
          const cur = String(toStatus(detailIdToStatus.get(id) || '')).toUpperCase();
          if (cur.includes('RETURN') || cur.includes('EXCHANGE')) return false;
          if (cur === 'SHIPPING_COMPLETE' || cur === 'PURCHASE_CONFIRM') return false;
          return true;
        });
        if (shippingCandidates.length > 0) {
          await fn_updateOrderStatusWithParams(shippingCandidates, 'SHIPPING_COMPLETE');
        }
      } catch (e) {
        console.error('Delivery Tracker 연동 오류:', e);
      }
    };

    syncDeliveryTracker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.index, orderDetail?.order_app_id, (orderDetail?.products || []).map((p: any) => String(p?.goodsflow_id || '').trim()).join('|')]);

  // 공통코드 조회: 택배사/주문상태/반품사유 코드 세팅
  const fn_selectCommonCodeList = async () => {
    try {
      const [deliveryRes, statusRes, reasonRes] = await Promise.all([
        axios.post(`${process.env.REACT_APP_API_URL}/app/common/selectCommonCodeList`, { group_code: 'DELIVERY_COMPANY' }),
        axios.post(`${process.env.REACT_APP_API_URL}/app/common/selectCommonCodeList`, { group_code: 'ORDER_STATUS_TYPE' }),
        axios.post(`${process.env.REACT_APP_API_URL}/app/common/selectCommonCodeList`, { group_code: 'RETURN_REASON_TYPE' }),
      ]);
      setDeliveryCompanyList(deliveryRes.data.result || []);
      setOrderStatusCodeList(statusRes.data.result || []);
      setReturnReasonCodeList(reasonRes.data.result || []);
    } catch (err) {
      console.error('공통코드 로딩 오류:', err);
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return `${dateString.substring(0, 4)}년 ${dateString.substring(4, 6)}월 ${dateString.substring(6, 8)}일 오후 ${dateString.substring(8, 10)}:${dateString.substring(10, 12)}`;
  };

  const getDeliveryCompanyName = (code: string) => {
    const company = deliveryCompanyList.find(company => company.common_code === code);
    return company ? company.common_code_name : '';
  };
  
  const getReturnReasonName = (code?: string) => {
    if (!code) return '';
    const item = returnReasonCodeList.find(c => c.common_code === String(code));
    return item ? item.common_code_name : '';
  };

  // 탭별 상품 개수 계산
  const getTabCount = (tab: '전체' | '배송' | '취소' | '반품교환'): number => {
    const list = orderDetail?.products || [];
    if (tab === '전체') return list.length;
    return list.filter((p: any) => mapStatusToTab(p?.order_status) === tab).length;
  };

  // 상태 → 탭 매핑
  const mapStatusToTab = (status: string = ''): '전체' | '배송' | '취소' | '반품교환' | '기타' => {
    const s = String(status).toUpperCase();
    if (s === 'PAYMENT_COMPLETE' || s === 'SHIPPINGING' || s === 'SHIPPING_COMPLETE' || s === 'PURCHASE_CONFIRM') return '배송';
    if (s.includes('CANCEL')) return '취소';
    if (s.includes('RETURN') || s.includes('EXCHANGE')) return '반품교환';
    return '기타';
  };

  // 현재 탭에 표시될 상품 목록 메모이즈
  const visibleProducts = useMemo(() => {
    const list = orderDetail?.products || [];
    if (selectedTab === '전체') return list;
    return list.filter((p: any) => mapStatusToTab(p?.order_status) === selectedTab);
  }, [orderDetail?.products, selectedTab]);

  // 그룹별( order_group ) 묶음 구성: { product, index } 형태로 글로벌 인덱스 유지
  const groupedVisibleProducts = useMemo(() => {
    const groupMap = new Map<number, Array<{ product: any; index: number }>>();
    visibleProducts.forEach((p: any, idx: number) => {
      const groupNo = Number(p?.order_group) || 1;
      if (!groupMap.has(groupNo)) groupMap.set(groupNo, []);
      groupMap.get(groupNo)!.push({ product: p, index: idx });
    });
    return groupMap;
  }, [visibleProducts]);

  // 금액 합계(원가 기준) 메모이즈
  const totalOriginalAmount = useMemo(() => {
    const list = orderDetail?.products;
    if (!list || list.length === 0) {
      return (orderDetail?.original_price || 0) * (orderDetail?.order_quantity || 0);
    }
    return list.reduce((sum: number, p: any) => sum + ((p?.original_price || 0) * (p?.order_quantity || 0)), 0);
  }, [orderDetail]);

  const totalDiscountedAmount = useMemo(() => {
    const list = orderDetail?.products;
    if (!list || list.length === 0) {
      return (orderDetail?.price || 0) * (orderDetail?.order_quantity || 0);
    }
    return list.reduce((sum: number, p: any) => sum + ((p?.price || 0) * (p?.order_quantity || 0)), 0);
  }, [orderDetail]);

  // 결제정보의 "할인": 취소완료/교환완료/반품완료 제외, (원가-판매가)*수량 합
  const discountForActiveStatuses = useMemo(() => {
    const list: any[] = orderDetail?.products || [];
    const filtered = list.filter((p: any) => !STATUS_SETS.discountExcluded.has(toStatus(p?.order_status)));
    const originalTotal = filtered.reduce((sum: number, p: any) => sum + (Number(p?.original_price || 0) * Number(p?.order_quantity || 0)), 0);
    const discountedTotal = filtered.reduce((sum: number, p: any) => sum + (Number(p?.price || 0) * Number(p?.order_quantity || 0)), 0);
    const discount = originalTotal - discountedTotal;
    return discount > 0 ? discount : 0;
  }, [orderDetail?.products]);

  // 굿스플로 모달용 Order 형식으로 변환
  const convertOrderDetailToOrder = (orderDetail: OrderDetail): any => {
    return {
      ...orderDetail,
      add_order_quantity: 0,
      payment_app_id: 0,
      return_type: '',
      return_status: ''
    };
  };

  // 굿스플로 모달 열기
  const handleGoodsflowOpen = () => {
    setIsGoodsflowModalOpen(true);
  };

  // 주문 상태 업데이트: 상세 ID 단위로 변경 및 히스토리 동기화
  const fn_updateOrderStatusWithParams = async (orderDetailAppId: number | number[], orderStatus: string) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/memberOrderApp/updateOrderStatus`,
        {
          order_detail_app_id: orderDetailAppId,
          order_status: orderStatus,
          userId: user?.index
        }
      );

      if (response.data.success) {
        // 주문 정보 업데이트 (그룹/개별 대상 제품 상태 즉시 반영)
        const idsToUpdate: number[] = Array.isArray(orderDetailAppId) ? (orderDetailAppId as number[]) : [orderDetailAppId as number];
        // 반품거절 컨텍스트(RETURN_APPLY → SHIPPING_COMPLETE)에서는 배송완료 알림을 보내지 않음
        const isReturnRejectContext = (() => {
          try {
            const list: any[] = Array.isArray(orderDetail?.products) ? (orderDetail!.products as any[]) : [];
            return String(orderStatus || '').toUpperCase() === 'SHIPPING_COMPLETE' &&
              list.some((p: any) => idsToUpdate.includes(p?.order_detail_app_id) && String(p?.order_status || '').trim().toUpperCase() === 'RETURN_APPLY');
          } catch (_) { return false; }
        })();
        setOrderDetail(prev => {
          if (!prev) return prev;
          const updatedProducts = (prev.products || []).map((p: any) =>
            idsToUpdate.includes(p?.order_detail_app_id)
              ? { ...p, order_status: orderStatus }
              : p
          );
          return {
            ...prev,
            order_status: orderStatus,
            products: updatedProducts
          } as any;
        });
        // history state 동기화
        if (location.state?.orderDetail) {
          const updatedProducts = (location.state.orderDetail.products || []).map((p: any) =>
            (Array.isArray(orderDetailAppId) ? orderDetailAppId.includes(p?.order_detail_app_id) : p?.order_detail_app_id === orderDetailAppId)
              ? { ...p, order_status: orderStatus }
              : p
          );
          navigate(location.pathname, {
            state: {
              ...location.state,
              orderDetail: {
                ...location.state.orderDetail,
                order_status: orderStatus,
                products: updatedProducts
              }
            },
            replace: true
          });
        }
        // 배송완료 알림 발송 (교환 배송완료 포함) - 반품거절 컨텍스트는 제외
        try {
          const upperStatus = String(orderStatus || '').toUpperCase();
          if ((upperStatus === 'SHIPPING_COMPLETE' || upperStatus === 'EXCHANGE_SHIPPING_COMPLETE') && orderDetail && !isReturnRejectContext) {
            const memId = (orderDetail as any)?.mem_id;
            const memName = (orderDetail as any)?.mem_name;
            const list: any[] = Array.isArray(orderDetail?.products) ? (orderDetail!.products as any[]) : [];
            list
              .filter((p: any) => idsToUpdate.includes(p?.order_detail_app_id))
              .forEach((p: any) => {
                sendShippingCompleteNotification(memId, memName, p?.product_name);
              });
          }
        } catch {}
        setIsToastVisible(true);
      }

    } catch (error) {
      console.error("주문 상태 업데이트 오류:", error);
    }
  };

  // 주문 그룹 업데이트: 선택된 상세들을 새 그룹 번호로 이동
  const fn_updateOrderGroup = async (selectedProductIds: number[], newGroupNumber: number) => {
    try {
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/memberOrderApp/updateOrderGroup`,
        {
          order_detail_app_id: selectedProductIds,
          new_group_number: newGroupNumber,
          userId: user?.index
        }
      );

      if (response.data.success) {
        alert("주문 그룹이 성공적으로 나뉘었습니다.");
        // 페이지 새로고침 또는 데이터 재로드
        window.location.reload();
      }
    } catch (error) {
      console.error("주문 그룹 업데이트 오류:", error);
      alert("주문 그룹 업데이트 중 오류가 발생했습니다.");
    }
  };

  // 다음 order_group 번호 계산 (현재 최대 + 1)
  const getNextOrderGroupNumber = (): number => {
    const list: any[] = orderDetail?.products || [];
    if (list.length === 0) return 2;
    const maxGroup = list.reduce((max: number, p: any) => {
      const g = Number(p?.order_group) || 1;
      return g > max ? g : max;
    }, 1);
    return maxGroup + 1;
  };

  // 송장번호 삭제: 굿스플로 취소 포함, 로컬/히스토리 동기화
  const fn_deleteTrackingNumber = async () => {
    try {
      // 그룹 단위 삭제를 위해 invoiceOrderIds 우선 사용, 없으면 전체 products 사용
      const orderAppIds: number[] = (invoiceOrderIds && invoiceOrderIds.length > 0)
        ? Array.from(new Set(invoiceOrderIds))
        : Array.from(new Set((orderDetail?.products || []).map((p: any) => p?.order_detail_app_id).filter((v: any) => v != null)));
      // 굿스플로 취소 API 함께 호출
      const rows: any[] = Array.isArray(orderDetail?.products) && ((orderDetail?.products?.length || 0) > 0)
        ? (orderDetail?.products as any[])
        : (orderDetail ? [orderDetail as any] : []);
      // 1) 교환/반품 수거 취소: return_goodsflow_id 사용
      const returnGoodsflowIdsForCancel: string[] = Array.from(new Set(
        (rows || [])
          .filter((r: any) => orderAppIds.includes(r?.order_detail_app_id))
          .map((r: any) => String(r?.return_goodsflow_id || '').trim())
          .filter((id: any) => id !== '')
      ));
      if (returnGoodsflowIdsForCancel.length > 0) {
        const payload = {
          items: returnGoodsflowIdsForCancel.map((id: string) => ({ id, reasonType: 'OTHER_SERVICE', contents: '교환/반품 송장 삭제' }))
        };
        try {
          await axios.delete(`${process.env.REACT_APP_API_URL}/app/goodsflow/deliveries/cancel`, { data: payload });
        } catch (gfErr) {
          console.error('[GF_CANCEL] deleteTracking (return): error', gfErr);
        }
        try {
          await axios.post(`${process.env.REACT_APP_API_URL}/app/memberReturnApp/updateReturnGoodsflowId`, {
            order_detail_app_id: orderAppIds,
            return_goodsflow_id: null,
            userId: user?.index,
          });
        } catch (e) {
          console.error('return_goodsflow_id 초기화 오류 (delete):', e);
        }
      }
      // 2) 주문(출고) 취소: goodsflow_id 사용
      const goodsflowIdsForCancel: string[] = Array.from(new Set(
        (rows || [])
          .filter((r: any) => orderAppIds.includes(r?.order_detail_app_id))
          .map((r: any) => String(r?.goodsflow_id || '').trim())
          .filter((id: any) => id !== '')
      ));
      
      if (goodsflowIdsForCancel.length > 0) {
        const payload = {
          items: goodsflowIdsForCancel.map((id: string) => ({ id, reasonType: 'OTHER_SERVICE', contents: '고객취소' }))
        };
        
        try {
          const gfCancelRes = await axios.delete(`${process.env.REACT_APP_API_URL}/app/goodsflow/deliveries/cancel`, { data: payload });
          
        } catch (gfErr) {
          console.error('[GF_CANCEL] deleteTracking: error', gfErr);
        }
      }
      // EXCHANGE_PAYMENT_COMPLETE 상태에서는 member_order_app 송장/택배사/굿스플로를 null로 만들지 않도록 서버 호출을 생략
      let response: any = { data: {} };
      const isAnyExchangePayment = (rows || []).some((r: any) => orderAppIds.includes(r?.order_detail_app_id) && String(r?.order_status || '').toUpperCase() === 'EXCHANGE_PAYMENT_COMPLETE');
      if (!isAnyExchangePayment) {
        response = await axios.post(
          `${process.env.REACT_APP_API_URL}/app/memberOrderApp/deleteTrackingNumber`,
          {
            order_detail_app_id: (orderAppIds.length > 0 ? orderAppIds : [orderDetail?.order_detail_app_id]).filter((id) => id != null),
            userId: user?.index
          }
        );
      }
      
      if (!isAnyExchangePayment ? response.data.message : true) {
        // 삭제 후 상태를 배송대기(PAYMENT_COMPLETE)로 되돌리기
        try {
          if ((orderAppIds || []).length > 0) {
            await fn_updateOrderStatusWithParams(orderAppIds, 'PAYMENT_COMPLETE');
          } else if (orderDetail?.order_detail_app_id) {
            await fn_updateOrderStatusWithParams(orderDetail.order_detail_app_id, 'PAYMENT_COMPLETE');
          }
        } catch (_) {}
        // 주문 정보 업데이트: 해당 order_app_id만 비우기
        setOrderDetail(prev => {
          if (!prev) return prev;
          const updatedProducts = (prev.products || []).map((p: any) =>
            orderAppIds.includes(p?.order_detail_app_id)
              ? (String(p?.order_status || '').toUpperCase() === 'EXCHANGE_PAYMENT_COMPLETE'
                  ? { ...p, return_goodsflow_id: '', company_tracking_number: '', company_courier_code: '' }
                  : { ...p, tracking_number: '', order_courier_code: '', courier_code: '', goodsflow_id: '', return_goodsflow_id: '' })
              : p
          );
          return { ...prev, products: updatedProducts } as any;
        });
        // history state 업데이트
        if (location.state?.orderDetail) {
          const updatedProducts = (location.state.orderDetail.products || []).map((p: any) =>
            orderAppIds.includes(p?.order_detail_app_id)
              ? (String(p?.order_status || '').toUpperCase() === 'EXCHANGE_PAYMENT_COMPLETE'
                  ? { ...p, return_goodsflow_id: '', company_tracking_number: '', company_courier_code: '' }
                  : { ...p, tracking_number: '', order_courier_code: '', courier_code: '', goodsflow_id: '', return_goodsflow_id: '' })
              : p
          );
          navigate(location.pathname, {
            state: {
              ...location.state,
              orderDetail: { ...location.state.orderDetail, products: updatedProducts }
            },
            replace: true
          });
        }
        // 사용한 대상 초기화
        setInvoiceOrderIds([]);
      }
    } catch (error) {
      console.error("송장번호 삭제 오류:", error);
      alert("송장번호 삭제 중 오류가 발생했습니다.");
    }
  };
  
  // 취소거절 처리: 승인/취소 플래그 N 처리 후 대상만 배송대기로 되돌리기
  const fn_rejectCancel = async (targetDetailIds?: number[]) => {
    try {
      // detail ID 직접 전달 우선, 없으면 화면의 모든 상세 사용
      const orderDetailAppIds: number[] = Array.from(new Set(
        (targetDetailIds && targetDetailIds.length > 0
          ? targetDetailIds
          : (orderDetail?.products || []).map((p: any) => p?.order_detail_app_id)
        ).filter((v: any) => v != null)
      ));
      
      await axios.post(`${process.env.REACT_APP_API_URL}/app/memberReturnApp/updateMemberReturnAppApproval`, {
        order_detail_app_id: orderDetailAppIds,
        approval_yn: 'N',
        cancel_yn: 'N',
        userId: user?.index,
      });
      // 취소거절 알림 발송
      try {
        const memId = (orderDetail as any)?.mem_id;
        const memName = (orderDetail as any)?.mem_name;
        const list: any[] = Array.isArray(orderDetail?.products) ? (orderDetail!.products as any[]) : [];
        const targets = list.filter((p: any) => orderDetailAppIds.includes(p?.order_detail_app_id));
        const calls = targets.map((p: any) => {
          const title = '취소 접수가 거절되었습니다.';
          const content = `주문하신 ${String(p?.product_name || '')} 상품의 접수 최소가 거절되었습니다. 혹시 문의 사항이 있으시면 고객센터로 연락 부탁드립니다.`;
          return axios.post(`${process.env.REACT_APP_API_URL}/app/postApp/insertPostApp`, {
            post_type: 'SHOPPING',
            title,
            content,
            all_send_yn: 'N',
            push_send_yn: 'Y',
            userId: user?.index,
            mem_id: String(memId),
          }).then((postRes) => {
            const postAppId = postRes.data?.postAppId;
            if (postAppId) {
              return axios.post(`${process.env.REACT_APP_API_URL}/app/postApp/insertMemberPostApp`, {
                post_app_id: postAppId,
                mem_id: memId,
                userId: user?.index,
              });
            }
          });
        });
        await Promise.allSettled(calls);
      } catch {}
    } catch (e) {
      console.error('취소거절 승인 취소 처리 오류:', e);
    }
    const idsToReset: number[] = Array.from(new Set(
      (targetDetailIds && targetDetailIds.length > 0
        ? targetDetailIds
        : (orderDetail?.products || []).map((p: any) => p?.order_detail_app_id)
      ).filter((v: any) => v != null)
    ));
    if (idsToReset.length > 0) {
      await fn_updateOrderStatusWithParams(idsToReset, 'PAYMENT_COMPLETE');
    } else if (orderDetail?.order_detail_app_id) {
      await fn_updateOrderStatusWithParams(orderDetail.order_detail_app_id, 'PAYMENT_COMPLETE');
    }
  };

  // 송장번호 업데이트 성공 콜백: 상태/송장/택배사 로컬 및 히스토리 반영
  const handleInvoiceSuccess = (trackingNumber?: string, courierCode?: string, actionType?: string) => {
    setIsInvoicePopupOpen(false);

    const shouldUpdateStatus = actionType === 'shipping_process';

    // 그룹(여러 order_app_id) 대상으로 수동입력/수정한 경우: 해당 제품들만 즉시 반영
    if (invoiceOrderIds && invoiceOrderIds.length > 0) {
      setOrderDetail(prev => {
        if (!prev) return prev;
        const updatedProducts = (prev.products || []).map((p: any) => {
          if (invoiceOrderIds.includes(p?.order_detail_app_id)) {
            return {
              ...p,
              // EXCHANGE 계열은 회사 송장 정보로 반영
              ...(String(p?.order_status || '').toUpperCase().startsWith('EXCHANGE')
                ? {
                    company_tracking_number: trackingNumber || p.company_tracking_number,
                    company_courier_code: courierCode || p.company_courier_code,
                  }
                : {
                    tracking_number: trackingNumber || p.tracking_number,
                    order_courier_code: courierCode || p.order_courier_code,
                    courier_code: courierCode || p.courier_code,
                  }),
              order_status: shouldUpdateStatus ? 'SHIPPINGING' : p.order_status
            };
          }
          return p;
        });
        return {
          ...prev,
          products: updatedProducts
        } as any;
      });

      // history state 동기화
      if (location.state?.orderDetail) {
        const updatedProducts = (location.state.orderDetail.products || []).map((p: any) => {
          if (invoiceOrderIds.includes(p?.order_detail_app_id)) {
            return {
              ...p,
              ...(String(p?.order_status || '').toUpperCase().startsWith('EXCHANGE')
                ? {
                    company_tracking_number: trackingNumber || p.company_tracking_number,
                    company_courier_code: courierCode || p.company_courier_code,
                  }
                : {
                    tracking_number: trackingNumber || p.tracking_number,
                    order_courier_code: courierCode || p.order_courier_code,
                    courier_code: courierCode || p.courier_code,
                  }),
              order_status: shouldUpdateStatus ? 'SHIPPINGING' : p.order_status
            };
          }
          return p;
        });

        navigate(location.pathname, {
          state: {
            ...location.state,
            orderDetail: {
              ...location.state.orderDetail,
              products: updatedProducts
            }
          },
          replace: true
        });
      }

      // 배송중 알림 발송 (shipping_process 인 경우만)
      try {
        if (shouldUpdateStatus) {
          const memId = (orderDetail as any)?.mem_id;
          const memName = (orderDetail as any)?.mem_name;
          (orderDetail?.products || [])
            .filter((p: any) => invoiceOrderIds.includes(p?.order_detail_app_id))
            .forEach((p: any) => {
              sendShippingNotification(memId, memName, p?.product_name);
            });
        }
      } catch {}

      // 사용한 대상 초기화
      setInvoiceOrderIds([]);
      return;
    }

    // 단일(전체) 대상 처리: 기존 동작 유지
    if (orderDetail) {
      setOrderDetail(prev => prev ? {
        ...prev,
        ...(String(prev?.order_status || '').toUpperCase().startsWith('EXCHANGE')
          ? {
              company_tracking_number: trackingNumber || (prev as any).company_tracking_number,
              company_courier_code: courierCode || (prev as any).company_courier_code,
            }
          : {
              tracking_number: trackingNumber || prev.tracking_number,
              courier_code: courierCode || prev.courier_code,
              order_courier_code: courierCode || prev.order_courier_code,
            }),
        order_status: shouldUpdateStatus ? 'SHIPPINGING' : prev.order_status
      } : null);

      if (location.state?.orderDetail) {
        navigate(location.pathname, {
          state: {
            ...location.state,
            orderDetail: {
              ...location.state.orderDetail,
              ...(String(location.state.orderDetail?.order_status || '').toUpperCase().startsWith('EXCHANGE')
                ? {
                    company_tracking_number: trackingNumber || (location.state.orderDetail as any).company_tracking_number,
                    company_courier_code: courierCode || (location.state.orderDetail as any).company_courier_code,
                  }
                : {
                    tracking_number: trackingNumber || location.state.orderDetail.tracking_number,
                    courier_code: courierCode || location.state.orderDetail.courier_code,
                    order_courier_code: courierCode || location.state.orderDetail.order_courier_code,
                  }),
              order_status: shouldUpdateStatus ? 'SHIPPINGING' : location.state.orderDetail.order_status
            }
          },
          replace: true
        });
      }

      // 배송중 알림 발송 (shipping_process 인 경우만)
      try {
        if (shouldUpdateStatus) {
          const memId = (orderDetail as any)?.mem_id;
          const memName = (orderDetail as any)?.mem_name;
          const list: any[] = Array.isArray(orderDetail?.products) ? (orderDetail!.products as any[]) : [];
          list.forEach((p: any) => {
            sendShippingNotification(memId, memName, p?.product_name);
          });
        }
      } catch {}
    }
  };
  
  if (!orderDetail) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-10">
          <p>주문 정보를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      {/* 상단 헤더 */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-800 mt-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{orderDetail.order_dt}{orderDetail.order_app_id}</p>
                <span className={`px-2 py-1 rounded-full text-sm font-medium 
                  ${orderDetail.order_status == 'PAYMENT_COMPLETE' || orderDetail.order_status == 'SHIPPINGING' ? 'text-orange-500 bg-yellow-100' : 'text-gray-800 bg-gray-50'}`}  >
                  {getOrderStatusName(orderDetail.order_status)}
                  </span>
                <span className="bg-gray-50 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">결제완료</span>
              </div>
              <div className="flex items-center justify-start gap-2 mt-4">
                <p className="text-gray-600 font-bold text-sm">점핑하이 - 점핑코리아</p>
                <p className="text-gray-600 text-sm">{formatDate(orderDetail.order_dt)}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {/* <button 
              className="px-4 py-2 text-gray-700 hover:bg-gray-50"
              onClick={() => setIsPrintModalOpen(true)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
              </svg>
            </button> */}
            <button 
              className="px-4 py-2 bg-gray-200 rounded-md disabled:hover:bg-gray-200 hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                const enhancedOrderDetail = buildEnhancedOrderDetail(orderDetail);
                navigate('/app/memberOrderAppReturn', { 
                  state: { 
                    orderDetail: enhancedOrderDetail,
                    actionType: 'cancel'
                  } 
                });
              }}
              disabled={(() => {
                const list: any[] = Array.isArray(orderDetail?.products) ? orderDetail!.products : [];
                const isCancelable = (status: any) => {
                  const statusCode = String(status ?? '').trim().toUpperCase();
                  if (statusCode === 'CANCEL_APPLY') return false;
                  if (statusCode.includes('RETURN') || statusCode.includes('EXCHANGE')) return false;
                  return !(statusCode === 'SHIPPINGING' || statusCode === 'SHIPPING_COMPLETE' || statusCode === 'PURCHASE_CONFIRM' || statusCode === 'CANCEL_COMPLETE' || statusCode.startsWith('EXCHANGE_'));
                };
                if (list.length > 0) {
                  return !list.some(p => isCancelable(p?.order_status));
                }
                return !isCancelable(orderDetail?.order_status);
              })()}
            >
              취소
            </button>
            <button 
              className="px-4 py-2 bg-gray-200 rounded-md disabled:hover:bg-gray-200 hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                const enhancedOrderDetail = buildEnhancedOrderDetail(orderDetail);
                navigate('/app/memberOrderAppReturn', { 
                  state: { 
                    orderDetail: enhancedOrderDetail,
                    actionType: 'return'
                  } 
                });
              }}
              disabled={(() => {
                const list: any[] = Array.isArray(orderDetail?.products) ? orderDetail!.products : [];
                const isWithinDays = (dt: any, days: number) => {
                  try {
                    const raw = String(dt || '').trim();
                    if (!raw) return false;
                    const digits = raw.replace(/[^0-9]/g, '');
                    if (digits.length < 8) return false;
                    const y = Number(digits.slice(0, 4));
                    const m = Number(digits.slice(4, 6)) - 1;
                    const d = Number(digits.slice(6, 8));
                    const hh = Number(digits.slice(8, 10) || '0');
                    const mm = Number(digits.slice(10, 12) || '0');
                    const ss = Number(digits.slice(12, 14) || '0');
                    const when = new Date(y, m, d, hh, mm, ss);
                    if (Number.isNaN(when.getTime())) return false;
                    const now = new Date();
                    const diff = now.getTime() - when.getTime();
                    return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
                  } catch (_) { return false; }
                };
                const isReturnable = (item: any) => {
                  const statusCode = String(item?.order_status ?? '').trim().toUpperCase();
                  if (statusCode === 'PURCHASE_CONFIRM') {
                    return isWithinDays(item?.purchase_confirm_dt, 3);
                  }
                  return statusCode === 'SHIPPING_COMPLETE' || statusCode === 'EXCHANGE_SHIPPING_COMPLETE';
                };
                if (list.length > 0) {
                  return !list.some(p => isReturnable(p));
                }
                return !isReturnable(orderDetail);
              })()}
            >
              반품
            </button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div>
            <div className="bg-gray-50 rounded-lg shadow-md grid grid-cols-4 gap-4">
              <div 
                className={`flex justify-center items-center p-4 rounded-lg text-center cursor-pointer transition-colors ${
                  selectedTab === '전체' ? 'bg-white shadow-md' : 'bg-gray-50'
                }`}
                onClick={() => setSelectedTab('전체')}
              >
                <p className={`text-sm font-semibold ${selectedTab === '전체' ? '' : 'text-gray-500'}`}>전체</p>
                <p className={`text-sm font-semibold ml-2 ${selectedTab === '전체' ? '' : 'text-gray-500'}`}>{getTabCount('전체')}</p>
              </div>
              <div 
                className={`flex justify-center items-center p-4 rounded-lg text-center cursor-pointer transition-colors ${
                  selectedTab === '배송' ? 'bg-white shadow-md' : 'bg-gray-50'
                }`}
                onClick={() => setSelectedTab('배송')}
              >
                <p className={`text-sm font-semibold ${selectedTab === '배송' ? '' : 'text-gray-500'}`}>배송</p>
                <p className={`text-sm font-semibold ml-2 ${selectedTab === '배송' ? '' : 'text-gray-500'}`}>{getTabCount('배송')}</p>
              </div>
              <div 
                className={`flex justify-center items-center p-4 rounded-lg text-center cursor-pointer transition-colors ${
                  selectedTab === '취소' ? 'bg-white shadow-md' : 'bg-gray-50'
                }`}
                onClick={() => setSelectedTab('취소')}
              >
                <p className={`text-sm font-semibold ${selectedTab === '취소' ? '' : 'text-gray-500'}`}>취소</p>
                <p className={`text-sm font-semibold ml-2 ${selectedTab === '취소' ? '' : 'text-gray-500'}`}>{getTabCount('취소')}</p>
              </div>
              <div 
                className={`flex justify-center items-center p-4 rounded-lg text-center cursor-pointer transition-colors ${
                  selectedTab === '반품교환' ? 'bg-white shadow-md' : 'bg-gray-50'
                }`}
                onClick={() => setSelectedTab('반품교환')}
              >
                <p className={`text-sm font-semibold ${selectedTab === '반품교환' ? '' : 'text-gray-500'}`}>반품/교환</p>
                <p className={`text-sm font-semibold ml-2 ${selectedTab === '반품교환' ? '' : 'text-gray-500'}`}>{getTabCount('반품교환')}</p>
              </div>
            </div>
          </div>

          {/* 왼쪽 영역 - 탭 기반 컨텐츠 */}
          <div className="col-span-2 mt-4">
            {(() => {
              const hasVisible = (orderDetail?.products || []).some((p: any) => {
                const statusCode = String(p?.order_status || '').toUpperCase();
                if (selectedTab === '전체') return true;
                if (statusCode === 'PAYMENT_COMPLETE' || statusCode === 'SHIPPINGING' || statusCode === 'SHIPPING_COMPLETE' || statusCode === 'PURCHASE_CONFIRM') return selectedTab === '배송';
                if (statusCode.includes('CANCEL')) return selectedTab === '취소';
                if (statusCode.includes('RETURN') || statusCode.includes('EXCHANGE')) return selectedTab === '반품교환';
                return false;
              });
              if (!hasVisible) {
                return (
                  <div>
                    <div className="flex justify-center mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mt-36 size-20 text-gray-300">
                        <path d="M8.25 6.75V5.25a2.25 2.25 0 1 1 4.5 0v1.5h3.878a2.25 2.25 0 0 1 2.206 1.74l1.5 6.75a2.25 2.25 0 0 1-2.206 2.76H6.372a2.25 2.25 0 0 1-2.206-2.76l1.5-6.75a2.25 2.25 0 0 1 2.206-1.74H8.25zm1.5 0h4.5V5.25a.75.75 0 1 0-1.5 0v1.5h-1.5v-1.5a.75.75 0 1 0-1.5 0v1.5zM9 18.75a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
                      </svg>
                    </div>
                    <p className="text-center font-bold text-gray-500">{selectedTab} 품목이 없어요.</p>
                  </div>
                );
              }
              return null;
            })()}
            {Array.from(groupedVisibleProducts.entries()).sort((a, b) => a[0] - b[0]).map(([groupNo, items]) => {
              const groupStatus: string = String(items[0]?.product?.order_status || '');
              const groupOrderAppIds: number[] = Array.from(new Set(items.map(i => i.product?.order_app_id).filter((v: any) => v != null)));
              const groupOrderDetailAppIds: number[] = Array.from(new Set(items.map(i => i.product?.order_detail_app_id).filter((v: any) => v != null)));
              const useCustomerTracking = (() => {
                const s = String(groupStatus || '').toUpperCase();
                const isReturnFlow = s === 'RETURN_APPLY' || s === 'RETURN_COMPLETE';
                if (!isReturnFlow) return false;
                const allHaveCustCourier = items.every(i => String(i.product?.customer_courier_code || '').trim() !== '');
                const allHaveCustTracking = items.every(i => String(i.product?.customer_tracking_number || '').trim() !== '');
                return allHaveCustCourier || allHaveCustTracking;
              })();
              const unifiedTrackingNumbers = Array.from(new Set(
                items
                  .map(i => useCustomerTracking ? i.product?.customer_tracking_number : i.product?.tracking_number)
                  .filter((v: any) => !!v)
              ));
              const unifiedCouriers = Array.from(new Set(
                items
                  .map(i => useCustomerTracking ? (i.product?.customer_courier_code || i.product?.order_courier_code || i.product?.courier_code) : (i.product?.order_courier_code || i.product?.courier_code))
                  .filter((v: any) => !!v)
              ));
              const hasUnifiedTracking = unifiedTrackingNumbers.length === 1 && unifiedCouriers.length === 1;
              const unifiedTrackingNumber = hasUnifiedTracking ? unifiedTrackingNumbers[0] : null;
              const displayCourierCode = unifiedCouriers.length >= 1 ? unifiedCouriers[0] : null;
              const groupHasGoodsflowId = items.some(i => String(i.product?.goodsflow_id || '').trim() !== '');
              const groupHasReturnGoodsflowId = items.some(i => String(i.product?.return_goodsflow_id || '').trim() !== '');
              const groupHasAnyTracking = items.some(i => {
                const t = useCustomerTracking ? i.product?.customer_tracking_number : i.product?.tracking_number;
                return String(t || '').trim() !== '';
              });
              const hasExchangeCompanyTracking = (() => {
                const s = String(groupStatus || '').toUpperCase();
                if (s !== 'EXCHANGE_PAYMENT_COMPLETE') return false;
                // 그룹 내 모든 항목에 회사 송장/택배사가 존재해야 배송중 처리 버튼 활성화
                return items.every(i => String(i?.product?.company_tracking_number || '').trim() !== '' && String(i?.product?.company_courier_code || '').trim() !== '');
              })();
              const groupReasonType = (() => {
                const found = items.map(i => i.product?.return_reason_type).find((v: any) => v != null && String(v).trim() !== '');
                return found ?? orderDetail?.return_reason_type;
              })();
              const groupApplicator = (() => {
                const found = items.map(i => i.product?.return_applicator).find((v: any) => v != null && String(v).trim() !== '');
                return found ?? orderDetail?.return_applicator;
              })();
              return (
                <div className="bg-white rounded-lg shadow-md py-8 mb-6" key={`group-${groupNo}`}>
                  <div>
                    <div className="flex justify-between items-center mb-2 px-4">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        {(() => {
                          const code = String(groupStatus || '').trim().toUpperCase();
                          if (code === 'RETURN_APPLY' || code === 'RETURN_GET') return '반품접수';
                          return getOrderStatusName(groupStatus);
                        })()}
                        <span className="text-lg" style={{color: groupStatus === 'CANCEL_APPLY' ? '#FF0000' : '#0090D4'}}>
                          {items.length}
                        </span>
                      </h2>
                      {groupStatus !== 'CANCEL_COMPLETE' && groupStatus !== 'RETURN_COMPLETE' && groupStatus !== 'EXCHANGE_COMPLETE' && groupStatus !== 'EXCHANGE_SHIPPINGING' && groupStatus !== 'EXCHANGE_SHIPPING_COMPLETE' && (
                        <div className="relative detail-actions-dropdown">
                          <button
                            className="text-gray-600"
                            onClick={() => setOpenDetailActionsGroup(openDetailActionsGroup === groupNo ? null : groupNo)}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                            </svg>
                          </button>
                          {openDetailActionsGroup === groupNo && (
                            <div className="py-2 px-4 absolute top-full font-medium text-gray-800 left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[160px]">
                              {String(groupStatus || '').toUpperCase() === 'EXCHANGE_PAYMENT_COMPLETE' ? (
                                <>
                                  <button
                                    className="w-full py-2 text-left text-sm hover:bg-gray-50"
                                    onClick={() => {
                                      setOpenDetailActionsGroup(null);
                                      setInvoiceOrderIds(groupOrderDetailAppIds);
                                      setIsInvoicePopupOpen(true);
                                    }}
                                  >
                                    송장번호 수정
                                  </button>
                                  <button
                                    className="w-full py-2 text-left text-sm hover:bg-gray-50"
                                    onClick={() => {
                                      setOpenDetailActionsGroup(null);
                                      setInvoiceOrderIds(groupOrderDetailAppIds);
                                      setIsDeleteConfirmOpen(true);
                                    }}
                                  >
                                    송장번호 삭제
                                  </button>
                                </>
                              ) : groupStatus === 'RETURN_APPLY' ? (
                                <button
                                  className="w-full py-2 text-left text-sm hover:bg-gray-50"
                                  onClick={async () => {
                                    setOpenDetailActionsGroup(null);
                                    try {
                                      await axios.post(`${process.env.REACT_APP_API_URL}/app/memberReturnApp/updateMemberReturnAppApproval`, {
                                        order_detail_app_id: groupOrderDetailAppIds,
                                        approval_yn: 'N',
                                        cancel_yn: 'Y',
                                        userId: user?.index,
                                      });
                                    } catch (e) {
                                      console.error('반품접수 승인취소 처리 오류:', e);
                                    }
                                    try {
                                      // 취소된 반품 품목에 대해 ORDER 주소를 새로 인서트
                                      const addressInserts = (groupOrderDetailAppIds || []).map((detailId: number) => {
                                        const found = items.find(i => Number(i.product?.order_detail_app_id) === Number(detailId));
                                        const prod: any = found?.product || {};
                                        return axios.post(`${process.env.REACT_APP_API_URL}/app/memberOrderAddress/insertMemberOrderAddress`, {
                                          order_detail_app_id: detailId,
                                          order_address_type: 'ORDER',
                                          mem_id: orderDetail?.mem_id,
                                          receiver_name: prod?.receiver_name || orderDetail?.receiver_name || '',
                                          receiver_phone: prod?.receiver_phone || orderDetail?.receiver_phone || '',
                                          address: prod?.address || orderDetail?.address || '',
                                          address_detail: prod?.address_detail || orderDetail?.address_detail || '',
                                          zip_code: prod?.zip_code || orderDetail?.zip_code || '',
                                          enter_way: prod?.enter_way || orderDetail?.enter_way || null,
                                          enter_memo: prod?.enter_memo || orderDetail?.enter_memo || null,
                                          delivery_request: prod?.delivery_request || orderDetail?.delivery_request || null,
                                          use_yn: 'Y',
                                        });
                                      });
                                      await Promise.all(addressInserts);
                                    } catch (e) {
                                      console.error('반품 취소 후 주소 인서트 오류:', e);
                                    }
                                    await fn_updateOrderStatusWithParams(groupOrderDetailAppIds, 'SHIPPING_COMPLETE');
                                  }}
                                >
                                  배송완료로 되돌리기
                                </button>
                              ) : (
                                <>
                                  {groupStatus !== 'SHIPPINGING' && groupStatus !== 'SHIPPING_COMPLETE' && groupStatus !== 'EXCHANGE_APPLY' && (
                                    <button
                                      className="w-full py-2 text-left text-sm hover:bg-gray-50"
                                      onClick={async () => {
                                        setOpenDetailActionsGroup(null);
                                        await fn_updateOrderStatusWithParams(groupOrderDetailAppIds, 'HOLD');
                                        // 배송보류 설정 시 하단 토스트가 뜨지 않도록 즉시 숨김
                                        setIsToastVisible(false);
                                      }}
                                    >
                                      배송보류 설정
                                    </button>
                                  )}
                                  {hasUnifiedTracking && groupStatus !== 'SHIPPINGING' && (
                                    <button
                                      className="w-full py-2 text-left text-sm hover:bg-gray-50"
                                      onClick={() => {
                                        setOpenDetailActionsGroup(null);
                                        setInvoiceOrderIds(groupOrderDetailAppIds);
                                        setIsInvoicePopupOpen(true);
                                      }}
                                    >
                                      송장번호 수정
                                    </button>
                                  )}
                                  {(hasUnifiedTracking || (groupHasGoodsflowId && !groupHasAnyTracking)) && groupStatus !== 'SHIPPING_COMPLETE' && (
                                    <button
                                      className="w-full py-2 text-left text-sm hover:bg-gray-50"
                                      onClick={() => {
                                        setOpenDetailActionsGroup(null);
                                        setInvoiceOrderIds(groupOrderDetailAppIds);
                                        setIsDeleteConfirmOpen(true);
                                      }}
                                    >
                                      송장번호 삭제
                                    </button>
                                  )}
                                  {groupStatus === 'SHIPPINGING' && (
                                    <button
                                      className="w-full py-2 text-left text-sm hover:bg-gray-50"
                                      onClick={() => {
                                        setOpenDetailActionsGroup(null);
                                        setInvoiceOrderIds(groupOrderDetailAppIds);
                                        setIsInvoicePopupOpen(true);
                                      }}
                                    >
                                      송장번호 수정
                                    </button>
                                  )}
                                  {(groupStatus === 'SHIPPINGING' || groupStatus === 'SHIPPING_COMPLETE') && (
                                    <button
                                      className="w-full py-2 text-left text-sm hover:bg-gray-50"
                                      onClick={async () => {
                                        setOpenDetailActionsGroup(null);
                                        await fn_updateOrderStatusWithParams(groupOrderDetailAppIds, 'PAYMENT_COMPLETE');
                                      }}
                                    >
                                      배송대기로 되돌리기
                                    </button>
                                  )}
                                  {groupStatus !== 'SHIPPING_COMPLETE' && (
                                    <button
                                      className="w-full py-2 text-left text-sm hover:bg-gray-50 rounded-b-lg"
                                      onClick={() => {
                                        setOpenDetailActionsGroup(null);
                                        setIsMergeMode(true);
                                        setIsSplitMode(false);
                                        setActiveMergeGroup(groupNo);
                                        setSelectedProducts([]);
                                      }}
                                    >
                                      주문 상태 합치기
                                    </button>
                                  )}
                                  {groupStatus !== 'SHIPPING_COMPLETE' && (
                                    <button
                                      className="w-full py-2 text-left text-sm hover:bg-gray-50 rounded-b-lg"
                                      onClick={() => {
                                        setOpenDetailActionsGroup(null);
                                        setIsSplitMode(true);
                                        setIsMergeMode(false);
                                        setSelectedProducts([]);
                                        setSplitGroups([]);
                                        setActiveSplitGroup(groupNo);
                                      }}
                                    >
                                      주문 상태 나누기
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mb-2 px-4">
                      <p className="text-sm text-gray-600">{orderDetail?.order_dt}{orderDetail?.order_app_id} · {formatDate(orderDetail?.order_dt || '')}</p>
                    </div>
                    {(groupStatus === 'RETURN_APPLY' || groupStatus === 'RETURN_GET' || groupStatus === 'RETURN_COMPLETE' || groupStatus === 'CANCEL_COMPLETE' || groupStatus === 'EXCHANGE_APPLY' || groupStatus === 'EXCHANGE_GET' || groupStatus === 'EXCHANGE_COMPLETE') && (
                      <div className="px-4 mb-3">
                        <div className="text-sm font-semibold p-3 bg-gray-50 border-l-4 border-gray-300">
                          <p>
                            {getReturnReasonName(String(groupReasonType))}{groupApplicator ? `(${groupApplicator}접수)` : ''}
                          </p>
                        </div>
                      </div>
                    )}

                    {(() => {
                      const codeUpper = String(groupStatus || '').toUpperCase();
                      if (codeUpper === 'EXCHANGE_PAYMENT_COMPLETE' || codeUpper === 'EXCHANGE_SHIPPINGING' || codeUpper === 'EXCHANGE_SHIPPING_COMPLETE') {
                        const hasReturnGfId = (items || []).some(i => String(i?.product?.return_goodsflow_id || '').trim() !== '');
                        const exCompanyCode = (() => {
                          const vals = Array.from(new Set((items || []).map(i => String(i?.product?.company_courier_code || '').trim()).filter(v => v !== '')));
                          return vals[0] || '';
                        })();
                        const exCompanyTracking = (() => {
                          const vals = Array.from(new Set((items || []).map(i => String(i?.product?.company_tracking_number || '').trim()).filter(v => v !== '')));
                          return vals[0] || '';
                        })();
                        if (exCompanyCode && exCompanyTracking) {
                          return (
                            <div className="px-4 mb-4 flex justify-start items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10 text-blue-400">
                                <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h.375a3 3 0 1 1 6 0h3a.75.75 0 0 0 .75-.75V15Z" />
                                <path d="M8.25 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0ZM15.75 6.75a.75.75 0 0 0-.75.75v11.25c0 .087.015.17.042.248a3 3 0 0 1 5.958.464c.853-.175 1.522-.935 1.464-1.883a18.659 18.659 0 0 0-3.732-10.104 1.837 1.837 0 0 0-1.47-.725H15.75Z" />
                                <path d="M19.5 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
                              </svg>
                              <p className="font-bold text-sm text-gray-600 mr-1 ml-1" style={{color: '#0090D4'}}>{getDeliveryCompanyName(String(exCompanyCode))}</p>
                              <p className="font-bold text-sm text-gray-600" style={{color: '#0090D4'}}>{exCompanyTracking}</p>
                            </div>
                          );
                        }
                        if (codeUpper === 'EXCHANGE_PAYMENT_COMPLETE' && hasReturnGfId && exCompanyCode && !exCompanyTracking) {
                          return (
                            <div className="px-4 mb-4">
                              <div className="flex justify-start items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10 text-blue-400">
                                  <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25Z" />
                                  <path d="M8.25 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0ZM15.75 6.75a.75.75 0 0 0-.75.75v11.25c0 .087.015.17.042.248a3 3 0 0 1 5.958.464c.853-.175 1.522-.935 1.464-1.883a18.659 18.659 0 0 0-3.732-10.104 1.837 1.837 0 0 0-1.47-.725H15.75Z" />
                                  <path d="M19.5 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
                                </svg>
                                <p className="font-bold text-sm text-gray-600 mr-1 ml-1" style={{color: '#0090D4'}}>{getDeliveryCompanyName(String(exCompanyCode))}</p>
                              </div>
                              <p className="text-sm font-semibold" style={{color: '#0090D4'}}>
                                굿스플로에서 송장번호를 받아오는 중입니다<br/>
                                (송장 출력을 하지 않았다면 송장삭제를 해주세요)
                              </p>
                            </div>
                          );
                        }
                        if (codeUpper === 'EXCHANGE_PAYMENT_COMPLETE' && hasReturnGfId && !exCompanyCode && !exCompanyTracking) {
                          return (
                            <div className="px-4 mb-4 flex justify-start items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10 text-gray-400">
                                <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h.375a3 3 0 1 1 6 0h3a.75.75 0 0 0 .75-.75V15Z" />
                                <path d="M8.25 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0ZM15.75 6.75a.75.75 0 0 0-.75.75v11.25c0 .087.015.17.042.248a3 3 0 0 1 5.958.464c.853-.175 1.522-.935 1.464-1.883a18.659 18.659 0 0 0-3.732-10.104 1.837 1.837 0 0 0-1.47-.725H15.75Z" />
                                <path d="M19.5 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
                              </svg>
                              <p className="text-sm text-gray-500">({orderDetail?.zip_code || '-'}) {orderDetail?.address || '-'}{orderDetail?.address_detail ? ` ${orderDetail.address_detail}` : ''}</p>
                            </div>
                          );
                        }
                        if (hasReturnGfId) {
                          return (
                            <div className="px-4 mb-4">
                              <p className="text-sm font-semibold" style={{color: '#0090D4'}}>
                                굿스플로에서 송장번호를 받아오는 중입니다<br/>
                                (송장 출력을 하지 않았다면 송장삭제를 해주세요)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }
                      if (codeUpper === 'EXCHANGE_APPLY') {
                        const exCustomerCode = (() => {
                          const vals = Array.from(new Set((items || []).map(i => String(i?.product?.customer_courier_code || '').trim()).filter(v => v !== '')));
                          return vals[0] || '';
                        })();
                        const exCustomerTracking = (() => {
                          const vals = Array.from(new Set((items || []).map(i => String(i?.product?.customer_tracking_number || '').trim()).filter(v => v !== '')));
                          return vals[0] || '';
                        })();
                        if (exCustomerCode && exCustomerTracking) {
                          return (
                            <div className="px-4 mb-4 flex justify-start items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10 text-blue-400">
                                <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h.375a3 3 0 1 1 6 0h3a.75.75 0 0 0 .75-.75V15Z" />
                                <path d="M8.25 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0ZM15.75 6.75a.75.75 0 0 0-.75.75v11.25c0 .087.015.17.042.248a3 3 0 0 1 5.958.464c.853-.175 1.522-.935 1.464-1.883a18.659 18.659 0 0 0-3.732-10.104 1.837 1.837 0 0 0-1.47-.725H15.75Z" />
                                <path d="M19.5 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
                              </svg>
                              <p className="font-bold text-sm text-gray-600 mr-1 ml-1" style={{color: '#0090D4'}}>{getDeliveryCompanyName(String(exCustomerCode))}</p>
                              <p className="font-bold text-sm text-gray-600" style={{color: '#0090D4'}}>{exCustomerTracking}</p>
                            </div>
                          );
                        }
                      }
                      const isReturnOrExchange = codeUpper.includes('RETURN') || codeUpper.includes('EXCHANGE');
                      if (isReturnOrExchange) {
                        const customerTrackingForGroup = (() => {
                          try {
                            const vals = Array.from(new Set((items || []).map(i => String(i?.product?.customer_tracking_number || '').trim()).filter(v => v !== '')));
                            return vals[0] || String(orderDetail?.customer_tracking_number || '').trim();
                          } catch (_) {
                            return String(orderDetail?.customer_tracking_number || '').trim();
                          }
                        })();
                        return (
                          <div className="px-4 mb-4 flex justify-start items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10 text-gray-300">
                              <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h.375a3 3 0 1 1 6 0h3a.75.75 0 0 0 .75-.75V15Z" />
                              <path d="M8.25 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0ZM15.75 6.75a.75.75 0 0 0-.75.75v11.25c0 .087.015.17.042.248a3 3 0 0 1 5.958.464c.853-.175 1.522-.935 1.464-1.883a18.659 18.659 0 0 0-3.732-10.104 1.837 1.837 0 0 0-1.47-.725H15.75Z" />
                              <path d="M19.5 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
                            </svg>
                            <p className="text-sm text-blue-500 font-semibold">{orderDetail?.customer_courier_code || ''}{customerTrackingForGroup ? ` ${customerTrackingForGroup}` : ''}</p>
                            <p className="text-sm text-gray-500">({orderDetail?.zip_code || '-'}) {orderDetail?.address || '-'}{orderDetail?.address_detail ? ` ${orderDetail.address_detail}` : ''}</p>
                          </div>
                        );
                      }
                      if ((useCustomerTracking && (displayCourierCode || unifiedTrackingNumber)) || (!useCustomerTracking && unifiedTrackingNumber && displayCourierCode)) {
                        return (
                          <div className="px-4 mb-4 flex justify-start items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10 text-blue-400">
                              <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h.375a3 3 0 1 1 6 0h3a.75.75 0 0 0 .75-.75V15Z" />
                              <path d="M8.25 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0ZM15.75 6.75a.75.75 0 0 0-.75.75v11.25c0 .087.015.17.042.248a3 3 0 0 1 5.958.464c.853-.175 1.522-.935 1.464-1.883a18.659 18.659 0 0 0-3.732-10.104 1.837 1.837 0 0 0-1.47-.725H15.75Z" />
                              <path d="M19.5 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
                            </svg>
                            {displayCourierCode && (
                              <p className="font-bold text-sm text-gray-600 mr-1 ml-1" style={{color: '#0090D4'}}>{getDeliveryCompanyName(String(displayCourierCode))}</p>
                            )}
                            {unifiedTrackingNumber && (
                              <p className="font-bold text-sm text-gray-600" style={{color: '#0090D4'}}>{unifiedTrackingNumber}</p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {!hasUnifiedTracking && groupHasGoodsflowId && !groupHasAnyTracking && (
                      <div className="px-4 mb-4">
                        <p className="text-sm font-semibold" style={{color: '#0090D4'}}>굿스플로에서 송장번호를 받아오는 중입니다<br/>
                        (송장 출력을 하지 않았다면 송장삭제를 해주세요)</p>
                      </div>
                    )}

                    {groupStatus === 'CANCEL_APPLY' && (
                      <div className="text-sm font-semibold m-4 p-4 bg-gray-50 mb-6 border-l-4 border-gray-300">
                        <p>{getReturnReasonName(String(groupReasonType))}({groupApplicator}접수)</p>
                      </div>
                    )}

                    <div className="">
                      {items.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">조회내용이 없습니다.</div>
                      ) : (
                        items.map(({ product, index }, productIndex: number) => (
                          <div className={`flex items-center gap-4 px-6 py-3 ${productIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`} key={`${groupNo}-${productIndex}-${product?.order_app_id}-${product?.product_detail_app_id ?? 'no-detail'}`}>
                            <div className="flex items-center gap-4 relative">
                              {((isMergeMode && activeMergeGroup !== null && groupNo !== activeMergeGroup) || (isSplitMode && activeSplitGroup === groupNo)) && (
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                  checked={selectedProducts.includes(index)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedProducts([...selectedProducts, index]);
                                    } else {
                                      setSelectedProducts(selectedProducts.filter(i => i !== index));
                                    }
                                  }}
                                />
                              )}
                              <img src={product.product_image} alt="상품이미지" className="w-16 h-16 rounded-lg" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-xs text-gray-600">{product?.order_dt}{product?.order_app_id}</p>
                                  <p className="font-medium mb-2 text-sm">{product?.product_name}</p>
                                  <p className="text-gray-700 mt-1 bg-gray-300 px-2 py-1 rounded-full text-xs inline-block">
                                    {product?.option_gender === 'W' ? '여성' : product?.option_gender === 'M' ? '남성' : '공용'}{product?.option_unit !== 'NONE_UNIT' ? product?.option_unit : ''} {product?.option_amount ? (product?.option_amount) : ''}
                                  </p>
                                </div>
                                <div className="flex justify-between items-start">
                                  {isSplitMode && activeSplitGroup === groupNo && (
                                    <div className="mt-2 flex items-center gap-2 mr-10">
                                      <input
                                        type="number"
                                        min={1}
                                        max={Number(product?.order_quantity || 0) - 1}
                                        className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                                        value={splitQtyByDetailId[product?.order_detail_app_id] ?? ''}
                                        onChange={(e) => {
                                          const v = e.target.value === '' ? '' : Number(e.target.value);
                                          setSplitQtyByDetailId((prev) => ({ ...prev, [product?.order_detail_app_id]: (v as any) }));
                                        }}
                                        placeholder="0"
                                      />
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm">{product?.price?.toLocaleString()}원 x {product?.order_quantity}</p>
                                    <p className="text-gray-500 text-sm">{(product?.original_price)?.toLocaleString()}원</p>
                                  </div>
                                  <p className="text-sm ml-10">{(product?.price * product?.order_quantity)?.toLocaleString()}원</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {(groupStatus !== 'SHIPPING_COMPLETE' && groupStatus !== 'PURCHASE_CONFIRM' && groupStatus !== 'CANCEL_COMPLETE' && groupStatus !== 'RETURN_COMPLETE' && groupStatus !== 'EXCHANGE_COMPLETE') && (
                      <div className="mt-8">
                        <div className="flex items-center justify-end">
                          <div className="relative tracking-dropdown mb-6 mr-6">
                            {groupStatus === 'CANCEL_APPLY' ? (
                              <div className="flex items-center gap-2">
                                <button
                                  className="px-4 py-2 text-gray-700 hover:border-black text-sm rounded-lg border border-gray-300"
                                  onClick={() => fn_rejectCancel(groupOrderDetailAppIds)}
                                >
                                  취소거절
                                </button>
                                <button
                                  className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold"
                                  onClick={() => {
                                    const enhancedOrderDetail = orderDetail ? {
                                      ...orderDetail,
                                      products: orderDetail.products?.map((product: any) => ({
                                        ...product,
                                        image: product.image || product.product_image || ''
                                      }))
                                    } : orderDetail;
                                    navigate('/app/memberOrderAppReturn', {
                                      state: {
                                        orderDetail: enhancedOrderDetail,
                                        actionType: 'cancel',
                                        startStep: 3,
                                        selectedOrderAppIds: groupOrderDetailAppIds
                                      }
                                    });
                                  }}
                                >
                                  취소승인
                                </button>
                              </div>
                            ) : groupStatus === 'EXCHANGE_APPLY' ? (
                              <div>
                                <div className="flex items-center gap-2">
                                  <button
                                    className="px-4 py-2 text-gray-700 hover:border-black text-sm rounded-lg border border-gray-300"
                                    onClick={async () => {
                                      // 반품 거절과 동일: 굿스플로 취소, return_goodsflow_id/customer_tracking_number 초기화, 상태 배송완료
                                      try {
                                        // 굿스플로 취소 (serviceId: return_goodsflow_id 우선)
                                        try {
                                          const returnGoodsflowIds: string[] = Array.from(new Set(
                                            (items || [])
                                              .map(i => String((i?.product?.return_goodsflow_id)).trim())
                                              .filter(id => id !== '')
                                          ));
                                          
                                          if (returnGoodsflowIds.length > 0) {
                                            await axios.delete(`${process.env.REACT_APP_API_URL}/app/goodsflow/deliveries/cancel`, {
                                              data: {
                                                items: returnGoodsflowIds.map((id: string) => ({ id, reasonType: 'OTHER_SERVICE', contents: '교환 취소' }))
                                              }
                                            });
                                          }
                                        } catch (gfErr) {
                                          console.error('굿스플로 교환취소 호출 오류:', gfErr);
                                        }
                                        try {
                                          await axios.post(`${process.env.REACT_APP_API_URL}/app/memberReturnApp/updateReturnGoodsflowId`, {
                                            order_detail_app_id: groupOrderDetailAppIds,
                                            return_goodsflow_id: null,
                                            userId: user?.index,
                                          });
                                        } catch (e) {
                                          console.error('return_goodsflow_id 초기화 오류:', e);
                                        }
                                        try {
                                          await axios.post(`${process.env.REACT_APP_API_URL}/app/memberReturnApp/updateReturnCustomerTrackingNumber`, {
                                            order_detail_app_id: groupOrderDetailAppIds,
                                            customer_tracking_number: null,
                                            userId: user?.index,
                                          });
                                        } catch (e) {
                                          console.error('customer_tracking_number 초기화 오류:', e);
                                        }
                                        try {
                                          await axios.post(`${process.env.REACT_APP_API_URL}/app/memberReturnApp/updateMemberReturnAppApproval`, {
                                            order_detail_app_id: groupOrderDetailAppIds,
                                            approval_yn: 'N',
                                            cancel_yn: 'N',
                                            userId: user?.index,
                                          });
                                        } catch (e) {
                                          console.error('교환거절 승인 취소 처리 오류:', e);
                                        }
                                        await fn_updateOrderStatusWithParams(groupOrderDetailAppIds, 'SHIPPING_COMPLETE');
                                      } catch (e) {
                                        console.error('교환거절 처리 오류:', e);
                                      }
                                    }}
                                  >
                                    교환거절
                                  </button>
                                  <button
                                    className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold"
                                    onClick={async () => {
                                      // 수거완료 버튼 클릭 시 확인 팝업 표시 (동작 변경 없음)
                                      if (groupHasReturnGoodsflowId) {
                                        setIsExchangePickupConfirmOpen(true);
                                        setExchangePickupRefundChoice('no');
                                        try {
                                          const ids: number[] = Array.from(new Set((items || []).map(i => i?.product?.order_detail_app_id).filter((v: any) => v != null)));
                                          setExchangeTargetDetailIds(ids);
                                        } catch (_) {
                                          setExchangeTargetDetailIds(null);
                                        }
                                        return;
                                      }
                                      try {
                                        // 교환 수거신청: 반품과 동일한 굿스플로 수거 API 호출 후 EXCHANGE_GET 처리
                                        try {
                                          const nowId = `${Date.now()}`;
                                          const pickupDateStr = (() => {
                                            const d = new Date();
                                            d.setDate(d.getDate() + 1);
                                            return d.toISOString().slice(0,10);
                                          })();
                                          // 그룹의 첫 상품을 기준으로 기본 정보 구성
                                          const first = (items && items[0] && items[0].product) ? items[0].product : {} as any;
                                          const orderDateStr = (() => {
                                            const s = String(first?.order_dt || orderDetail?.order_dt || '');
                                            if (s && s.length >= 12) {
                                              return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)} ${s.slice(8,10)}:${s.slice(10,12)}`;
                                            }
                                            return new Date().toISOString().slice(0,16).replace('T',' ');
                                          })();
                                          const body: any = {
                                            requestId: `EXC-${orderDetail?.order_app_id}-${nowId}`,
                                            contractType: 'USER',
                                            items: [
                                              {
                                                centerCode: '1000011886',
                                                uniqueId: `EXC-${orderDetail?.order_app_id}-${nowId}`,
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
                                                deliveryMessage: orderDetail?.delivery_request || '',
                                                consumerName: orderDetail?.receiver_name,
                                                consumerPhoneNo: orderDetail?.receiver_phone,
                                                deliveryPaymentMethod: 'RECEIVER_PAY',
                                                originalInvoiceNo: String(first?.tracking_number || ''),
                                                originalTransporterCode: orderDetail?.order_courier_code == 'CJ' ? 'KOREX' : orderDetail?.order_courier_code,
                                                deliveryItems: (items || []).map(({ product }: any) => ({
                                                  orderNo: String(product?.order_app_id || orderDetail?.order_app_id || ''),
                                                  orderDate: orderDateStr,
                                                  name: String(product?.product_name || ''),
                                                  quantity: Number(product?.order_quantity || 1),
                                                  price: Number(product?.price || 0),
                                                  code: String(product?.product_detail_app_id || ''),
                                                  option: String(product?.option_unit || ''),
                                                })),
                                              }
                                            ]
                                          };
                                          
                                          const gfRes = await axios.post(`${process.env.REACT_APP_API_URL}/app/goodsflow/deliveries/shipping/return/deliveryItems`, body);

                                        try {
                                            const serviceId =
                                              gfRes?.data?.data?.items?.[0]?.data?.serviceId ||
                                              gfRes?.data?.data?.serviceId ||
                                              gfRes?.data?.serviceId || '';
                                            if (serviceId) {
                                              await axios.post(`${process.env.REACT_APP_API_URL}/app/memberReturnApp/updateReturnGoodsflowId`, {
                                                order_detail_app_id: groupOrderDetailAppIds,
                                                return_goodsflow_id: serviceId,
                                                userId: user?.index,
                                              });
                                            // 수거신청 시 승인 플래그 처리
                                            try {
                                              await axios.post(`${process.env.REACT_APP_API_URL}/app/memberReturnApp/updateMemberReturnAppApproval`, {
                                                order_detail_app_id: groupOrderDetailAppIds,
                                                approval_yn: 'Y',
                                                cancel_yn: 'N',
                                                userId: user?.index,
                                              });
                                            } catch (apprErr) {
                                              console.error('수거신청 승인 플래그 업데이트 오류:', apprErr);
                                            }
                                            // 교환 접수 완료 우편 발송
                                            try {
                                              const memId = (orderDetail as any)?.mem_id;
                                              const memName = (orderDetail as any)?.mem_name;
                                              const sendCalls = (items || []).map(async ({ product }: any) => {
                                                const productName = String(product?.product_name || '').trim();
                                                if (!memId || !memName || !productName) return;
                                                const title = `${memName}님의 ${productName} 상품 교환 접수가 완료되었습니다.`;
                                                const content = `현재 ${memName}님의 교환 접수가 확인되었습니다. 주문하신 ${productName} 상품의 회수 및 재발송 절차가 신속하게 진행할 예정입니다.`;
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
                                              });
                                              await Promise.allSettled(sendCalls);
                                            } catch (notifErr) {
                                              console.error('교환 접수 완료 우편 발송 오류:', notifErr);
                                            }
                                              window.location.reload();
                                            } else {
                                              console.log('gfRes::', gfRes?.data?.data);
                                            }
                                          } catch (saveErr) {
                                            console.error('[EXCHANGE_FLOW] save return_goodsflow_id error', saveErr);
                                          }
                                        } catch (gfErr) {
                                          console.error('교환 수거신청 굿스플로 호출 오류:', gfErr);
                                        }
                                        setExchangeRequestedGroups(prev => new Set([...Array.from(prev), groupNo]));
                                      } catch (e) {
                                        console.error('교환 수거신청 처리 오류:', e);
                                      }
                                    }}
                                  >
                                    {groupHasReturnGoodsflowId ? '수거완료' : '수거신청'}
                                  </button>
                                </div>
                                {groupHasReturnGoodsflowId && (
                                  <p className="text-xs mt-2">수거가 완료되면 위의 버튼을 눌러주세요.</p>
                                )}
                              </div>
                            ) : groupStatus === 'RETURN_APPLY' ? (
                              <div>
                                <div className="flex items-center gap-2">
                                  <button
                                    className="px-4 py-2 text-gray-700 hover:border-black text-sm rounded-lg border border-gray-300"
                                    onClick={async () => {
                                      try {
                                        // 굿스플로 반품 취소 (서비스ID 기반)
                                        try {
                                          const returnGoodsflowIds: string[] = Array.from(new Set(
                                            (items || [])
                                              .map(i => String((i?.product?.return_goodsflow_id)).trim())
                                              .filter(id => id !== '')
                                          ));
                                          
                                          if (returnGoodsflowIds.length > 0) {
                                            const payload = {
                                              items: returnGoodsflowIds.map((id: string) => ({ id, reasonType: 'OTHER_SERVICE', contents: '반품 취소' }))
                                            };
                                            
                                            const res = await axios.delete(`${process.env.REACT_APP_API_URL}/app/goodsflow/deliveries/cancel`, { data: payload });
                                            console.log('res::', res);
                                          }
                                        } catch (gfErr) {
                                          console.error('굿스플로 반품취소 호출 오류:', gfErr);
                                        }
                                        // 반품 거부 시 return_goodsflow_id, customer_tracking_number 초기화
                                        try {
                                          await axios.post(`${process.env.REACT_APP_API_URL}/app/memberReturnApp/updateReturnGoodsflowId`, {
                                            order_detail_app_id: groupOrderDetailAppIds,
                                            goodsflow_id: null,
                                            userId: user?.index,
                                          });
                                        } catch (e) {
                                          console.error('return_goodsflow_id 초기화 오류:', e);
                                        }
                                        try {
                                          await axios.post(`${process.env.REACT_APP_API_URL}/app/memberReturnApp/updateReturnCustomerTrackingNumber`, {
                                            order_detail_app_id: groupOrderDetailAppIds,
                                            customer_tracking_number: null,
                                            userId: user?.index,
                                          });
                                        } catch (e) {
                                          console.error('customer_tracking_number 초기화 오류:', e);
                                        }
                                        await axios.post(`${process.env.REACT_APP_API_URL}/app/memberReturnApp/updateMemberReturnAppApproval`, {
                                          order_detail_app_id: groupOrderDetailAppIds,
                                          approval_yn: 'N',
                                          cancel_yn: 'Y',
                                          userId: user?.index,
                                        });
                                        // 반품 거절 시 반품 배송비 환불(포트원)
                                        try {
                                          const feeAmount = Number((orderDetail as any)?.delivery_fee_payment_amount || 0);
                                          const alreadyRefunded = String((orderDetail as any)?.delivery_fee_payment_status || '') === 'PAYMENT_REFUND';
                                          if (feeAmount > 0 && !alreadyRefunded) {
                                            await axios.post(`${process.env.REACT_APP_API_URL}/app/portone/requestPortOneRefund`, {
                                              imp_uid: (orderDetail as any)?.delivery_fee_portone_imp_uid || null,
                                              merchant_uid: (orderDetail as any)?.delivery_fee_portone_merchant_uid || null,
                                              refundAmount: feeAmount,
                                              reason: '반품 거절: 배송비 환불',
                                            });
                                            if ((orderDetail as any)?.delivery_fee_payment_app_id) {
                                              await axios.post(`${process.env.REACT_APP_API_URL}/app/memberPaymentApp/updateMemberPaymentApp`, {
                                                payment_app_id: (orderDetail as any)?.delivery_fee_payment_app_id,
                                                payment_status: 'PAYMENT_REFUND',
                                                refund_amount: feeAmount,
                                                userId: user?.index,
                                              });
                                            }
                                          }
                                        } catch (refundErr) {
                                          console.error('반품 배송비 환불 처리 오류:', refundErr);
                                        }
                                      } catch (e) {
                                        console.error('반품접수 승인취소 처리 오류:', e);
                                      }
                                      try {
                                        const addressInserts = (groupOrderDetailAppIds || []).map((detailId: number) => {
                                          const found = items.find(i => Number(i.product?.order_detail_app_id) === Number(detailId));
                                          const prod: any = found?.product || {};
                                          return axios.post(`${process.env.REACT_APP_API_URL}/app/memberOrderAddress/insertMemberOrderAddress`, {
                                            order_detail_app_id: detailId,
                                            order_address_type: 'ORDER',
                                            mem_id: orderDetail?.mem_id,
                                            receiver_name: prod?.receiver_name || orderDetail?.receiver_name || '',
                                            receiver_phone: prod?.receiver_phone || orderDetail?.receiver_phone || '',
                                            address: prod?.address || orderDetail?.address || '',
                                            address_detail: prod?.address_detail || orderDetail?.address_detail || '',
                                            zip_code: prod?.zip_code || orderDetail?.zip_code || '',
                                            enter_way: prod?.enter_way || orderDetail?.enter_way || null,
                                            enter_memo: prod?.enter_memo || orderDetail?.enter_memo || null,
                                            delivery_request: prod?.delivery_request || orderDetail?.delivery_request || null,
                                            use_yn: 'Y',
                                          });
                                        });
                                        await Promise.all(addressInserts);
                                      } catch (e) {
                                        console.error('반품 거절 후 주소 인서트 오류:', e);
                                      }
                                      const hasPurchaseConfirm = (items || []).some(({ product }: any) => {
                                        const v = String(product?.purchase_confirm_dt || '').trim();
                                        return v !== '' && v !== 'null' && v !== 'undefined';
                                      });
                                      await fn_updateOrderStatusWithParams(groupOrderDetailAppIds, hasPurchaseConfirm ? 'PURCHASE_CONFIRM' : 'SHIPPING_COMPLETE');
                                      // 반품거절 안내 메시지 발송
                                      try {
                                        const memId = (orderDetail as any)?.mem_id;
                                        const memName = (orderDetail as any)?.mem_name;
                                        const calls = items.map(({ product }: any) => {
                                          const title = `${memName}님께서 주문하신 ${String(product?.product_name || '')} 상품의 반품 접수가 취소 되었습니다.`;
                                          const content = '반품 접수가 취소되었습니다. 혹시 문의 사항이 있으시면 고객센터로 연락 부탁드립니다.';
                                          return axios.post(`${process.env.REACT_APP_API_URL}/app/postApp/insertPostApp`, {
                                            post_type: 'SHOPPING',
                                            title,
                                            content,
                                            all_send_yn: 'N',
                                            push_send_yn: 'Y',
                                            userId: user?.index,
                                            mem_id: String(memId),
                                          }).then((postRes) => {
                                            const postAppId = postRes.data?.postAppId;
                                            if (postAppId) {
                                              return axios.post(`${process.env.REACT_APP_API_URL}/app/postApp/insertMemberPostApp`, {
                                                post_app_id: postAppId,
                                                mem_id: memId,
                                                userId: user?.index,
                                              });
                                            }
                                          });
                                        });
                                        await Promise.allSettled(calls);
                                      } catch (notifErr) {}
                                    }}
                                  >
                                    반품거절
                                  </button>
                                  {(() => {
                                    const hasCustomerPair = (items || []).some(i => {
                                      const t = String(i?.product?.customer_tracking_number || '').trim();
                                      const c = String(i?.product?.customer_courier_code || '').trim();
                                      return t !== '' && c !== '';
                                    });
                                    return (groupHasReturnGoodsflowId || hasCustomerPair);
                                  })() ? (
                                    <button
                                      className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold"
                                      onClick={async () => {
                                        try {
                                          await fn_updateOrderStatusWithParams(groupOrderDetailAppIds, 'RETURN_GET');
                                        } catch (e) {
                                          console.error('수거완료 처리 오류:', e);
                                        }
                                      }}
                                    >
                                      수거완료
                                    </button>
                                  ) : (
                                    <>
                                      {groupApplicator === '구매자' && !groupHasReturnGoodsflowId && (
                                        <button
                                          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold mr-2"
                                          onClick={async () => {
                                            try {
                                              // 굿스플로 반품신청 API 호출
                                              const nowId = `${Date.now()}`;
                                              const pickupDateStr = (() => {
                                                const d = new Date();
                                                d.setDate(d.getDate() + 1);
                                                return d.toISOString().slice(0,10);
                                              })();
                                              
                                              // 그룹의 첫 상품을 기준으로 기본 정보 구성
                                              const first = (items && items[0] && items[0].product) ? items[0].product : {} as any;
                                              const orderDateStr = (() => {
                                                const s = String(first?.order_dt || orderDetail?.order_dt || '');
                                                if (s && s.length >= 12) {
                                                  return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)} ${s.slice(8,10)}:${s.slice(10,12)}`;
                                                }
                                                return new Date().toISOString().slice(0,16).replace('T',' ');
                                              })();
                                              
                                              const body: any = {
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
                                                    deliveryMessage: orderDetail?.delivery_request || '',
                                                    consumerName: orderDetail?.receiver_name,
                                                    consumerPhoneNo: orderDetail?.receiver_phone,
                                                    deliveryPaymentMethod: 'RECEIVER_PAY',
                                                    originalInvoiceNo: String(first?.tracking_number || ''),
                                                    originalTransporterCode: orderDetail?.order_courier_code == 'CJ' ? 'KOREX' : orderDetail?.order_courier_code,
                                                    deliveryItems: (items || []).map(({ product }: any) => ({
                                                      orderNo: String(product?.order_app_id || orderDetail?.order_app_id || ''),
                                                      orderDate: orderDateStr,
                                                      name: String(product?.product_name || ''),
                                                      quantity: Number(product?.order_quantity || 1),
                                                      price: Number(product?.price || 0),
                                                      code: String(product?.product_detail_app_id || ''),
                                                      option: String(product?.option_unit || ''),
                                                    })),
                                                  }
                                                ]
                                              };
                                              
                                              const gfRes = await axios.post(`${process.env.REACT_APP_API_URL}/app/goodsflow/deliveries/shipping/return/deliveryItems`, body);

                                              try {
                                                const serviceId =
                                                  gfRes?.data?.data?.items?.[0]?.data?.serviceId ||
                                                  gfRes?.data?.data?.serviceId ||
                                                  gfRes?.data?.serviceId || '';
                                                if (serviceId) {
                                                  await axios.post(`${process.env.REACT_APP_API_URL}/app/memberReturnApp/updateReturnGoodsflowId`, {
                                                    order_detail_app_id: groupOrderDetailAppIds,
                                                    return_goodsflow_id: serviceId,
                                                    userId: user?.index,
                                                  });
                                                  // 로컬 상태 즉시 반영: return_goodsflow_id 업데이트하여 버튼이 '수거완료'로 바뀌도록 처리
                                                  try {
                                                    setOrderDetail((prev) => {
                                                      if (!prev) return prev;
                                                      const updatedProducts = (prev.products || []).map((p: any) =>
                                                        groupOrderDetailAppIds.includes(p?.order_detail_app_id)
                                                          ? { ...p, return_goodsflow_id: serviceId }
                                                          : p
                                                      );
                                                      return { ...prev, products: updatedProducts } as any;
                                                    });
                                                  } catch {}
                                                }
                                              } catch (saveErr) {
                                                console.error('[RETURN_FLOW] save return_goodsflow_id error', saveErr);
                                              }
                                            } catch (gfErr) {
                                              console.error('반품 수거신청 굿스플로 호출 오류:', gfErr);
                                            }
                                            setExchangeRequestedGroups(prev => new Set([...Array.from(prev), groupNo]));
                                          }}
                                        >
                                          수거 접수
                                        </button>
                                      )}
                                      {!(groupApplicator === '구매자' && !groupHasReturnGoodsflowId) && (
                                        <button
                                          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold"
                                          onClick={() => {
                                            const enhancedOrderDetail = buildEnhancedOrderDetail(orderDetail);
                                            navigate('/app/memberOrderAppReturn', {
                                              state: {
                                                orderDetail: enhancedOrderDetail,
                                                actionType: 'return',
                                              }
                                            });
                                          }}
                                        >
                                          수거 정보 등록
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                                {(() => {
                                  const hasCustomerPair = (items || []).some(i => {
                                    const t = String(i?.product?.customer_tracking_number || '').trim();
                                    const c = String(i?.product?.customer_courier_code || '').trim();
                                    return t !== '' && c !== '';
                                  });
                                  return !(groupApplicator === '구매자' && !groupHasReturnGoodsflowId && !hasCustomerPair);
                                })() && (
                                  <p className="text-xs mt-2">수거가 완료되면 위의 버튼을 눌러주세요.</p>
                                )}
                              </div>
                            ) : groupStatus === 'RETURN_GET' ? (
                              <div className="flex items-center gap-2">
                                <button
                                  className="px-4 py-2 text-gray-700 hover:border-black text-sm rounded-lg border border-gray-300"
                                  onClick={async () => {
                                    // 반품취소 → 배송완료로 되돌리기와 동일 처리 + ORDER 주소 신규 인서트
                                    try {
                                      // 굿스플로 반품 취소 (서비스ID 기반)
                                      try {
                                        const returnGoodsflowIds: string[] = Array.from(new Set(
                                          (items || [])
                                            .map(i => String((i?.product?.return_goodsflow_id)).trim())
                                            .filter(id => id !== '')
                                        ));

                                        if (returnGoodsflowIds.length > 0) {
                                          const payload = {
                                            items: returnGoodsflowIds.map((id: string) => ({ id, reasonType: 'OTHER_SERVICE', contents: '반품 취소' }))
                                          };
                                          
                                          const res = await axios.delete(`${process.env.REACT_APP_API_URL}/app/goodsflow/deliveries/cancel`, { data: payload });
                                        }

                                      } catch (gfErr) {
                                        console.error('굿스플로 반품취소 호출 오류:', gfErr);
                                      }
                                      // 반품 취소 시 return_goodsflow_id, customer_tracking_number 초기화
                                      try {
                                        await axios.post(`${process.env.REACT_APP_API_URL}/app/memberReturnApp/updateReturnGoodsflowId`, {
                                          order_detail_app_id: groupOrderDetailAppIds,
                                          goodsflow_id: null,
                                          userId: user?.index,
                                        });
                                      } catch (e) {
                                        console.error('return_goodsflow_id 초기화 오류:', e);
                                      }
                                      try {
                                        await axios.post(`${process.env.REACT_APP_API_URL}/app/memberReturnApp/updateReturnCustomerTrackingNumber`, {
                                          order_detail_app_id: groupOrderDetailAppIds,
                                          customer_tracking_number: null,
                                          userId: user?.index,
                                        });
                                      } catch (e) {
                                        console.error('customer_tracking_number 초기화 오류:', e);
                                      }
                                      await axios.post(`${process.env.REACT_APP_API_URL}/app/memberReturnApp/updateMemberReturnAppApproval`, {
                                        order_detail_app_id: groupOrderDetailAppIds,
                                        approval_yn: 'N',
                                        cancel_yn: 'Y',
                                        userId: user?.index,
                                      });
                                    } catch (e) {
                                      console.error('반품취소 승인취소 처리 오류:', e);
                                    }
                                    try {
                                      const addressInserts = (groupOrderDetailAppIds || []).map((detailId: number) => {
                                        const found = items.find(i => Number(i.product?.order_detail_app_id) === Number(detailId));
                                        const prod: any = found?.product || {};
                                        return axios.post(`${process.env.REACT_APP_API_URL}/app/memberOrderAddress/insertMemberOrderAddress`, {
                                          order_detail_app_id: detailId,
                                          order_address_type: 'ORDER',
                                          mem_id: orderDetail?.mem_id,
                                          receiver_name: prod?.receiver_name || orderDetail?.receiver_name || '',
                                          receiver_phone: prod?.receiver_phone || orderDetail?.receiver_phone || '',
                                          address: prod?.address || orderDetail?.address || '',
                                          address_detail: prod?.address_detail || orderDetail?.address_detail || '',
                                          zip_code: prod?.zip_code || orderDetail?.zip_code || '',
                                          enter_way: prod?.enter_way || orderDetail?.enter_way || null,
                                          enter_memo: prod?.enter_memo || orderDetail?.enter_memo || null,
                                          delivery_request: prod?.delivery_request || orderDetail?.delivery_request || null,
                                          use_yn: 'Y',
                                        });
                                      });
                                      await Promise.all(addressInserts);
                                    } catch (e) {
                                      console.error('반품취소 후 주소 인서트 오류:', e);
                                    }
                                    try {
                                      await axios.post(`${process.env.REACT_APP_API_URL}/app/memberOrderApp/updateOrderStatus`, {
                                        order_detail_app_id: groupOrderDetailAppIds,
                                        order_status: 'SHIPPING_COMPLETE',
                                        userId: user?.index
                                      });
                                      // 로컬 상태 즉시 반영 (알림 전송 없음)
                                      setOrderDetail(prev => {
                                        if (!prev) return prev;
                                        const updatedProducts = (prev.products || []).map((p: any) =>
                                          groupOrderDetailAppIds.includes(p?.order_detail_app_id)
                                            ? { ...p, order_status: 'SHIPPING_COMPLETE' }
                                            : p
                                        );
                                        return { ...prev, order_status: 'SHIPPING_COMPLETE', products: updatedProducts } as any;
                                      });
                                      if (location.state?.orderDetail) {
                                        const updatedProducts = (location.state.orderDetail.products || []).map((p: any) =>
                                          groupOrderDetailAppIds.includes(p?.order_detail_app_id)
                                            ? { ...p, order_status: 'SHIPPING_COMPLETE' }
                                            : p
                                        );
                                        navigate(location.pathname, {
                                          state: {
                                            ...location.state,
                                            orderDetail: {
                                              ...location.state.orderDetail,
                                              order_status: 'SHIPPING_COMPLETE',
                                              products: updatedProducts
                                            }
                                          },
                                          replace: true
                                        });
                                      }
                                    } catch (stateErr) {}
                                      try {
                                        const memId = (orderDetail as any)?.mem_id;
                                        const memName = (orderDetail as any)?.mem_name;
                                        const calls = items.map(({ product }: any) => {
                                          const title = `${memName}님께서 주문하신 ${String(product?.product_name || '')} 상품의 반품이 취소 되었습니다.`;
                                          const content = '반품이 취소되었습니다. 혹시 문의 사항이 있으시면 고객센터로 연락 부탁드립니다.';
                                          return axios.post(`${process.env.REACT_APP_API_URL}/app/postApp/insertPostApp`, {
                                            post_type: 'SHOPPING',
                                            title,
                                            content,
                                            all_send_yn: 'N',
                                            push_send_yn: 'Y',
                                            userId: user?.index,
                                            mem_id: String(memId),
                                          }).then((postRes) => {
                                            const postAppId = postRes.data?.postAppId;
                                            if (postAppId) {
                                              return axios.post(`${process.env.REACT_APP_API_URL}/app/postApp/insertMemberPostApp`, {
                                                post_app_id: postAppId,
                                                mem_id: memId,
                                                userId: user?.index,
                                              });
                                            }
                                          });
                                        });
                                        await Promise.allSettled(calls);
                                      } catch (notifErr) {}
                                  }}
                                >
                                  반품취소
                                </button>
                                <button
                                  className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold"
                                  onClick={() => {
                                    const enhancedOrderDetail = orderDetail ? {
                                      ...orderDetail,
                                      products: orderDetail.products?.map((product: any) => ({
                                        ...product,
                                        image: product.image || product.product_image || ''
                                      }))
                                    } : orderDetail;
                                    navigate('/app/memberOrderAppReturn', {
                                      state: {
                                        orderDetail: enhancedOrderDetail,
                                        actionType: 'return',
                                        startStep: 3,
                                        selectedOrderAppIds: groupOrderDetailAppIds
                                      }
                                    });
                                      // 승인 시에는 메시지 발송 없음 (환불 완료 단계에서 발송)
                                  }}
                                >
                                  반품승인
                                </button>
                              </div>
                            ) : (
                              <>
                                {isMergeMode && activeMergeGroup === groupNo ? (
                                  <div className="flex gap-2">
                                    <button
                                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                                      onClick={() => {
                                        setIsMergeMode(false);
                                        setSelectedProducts([]);
                                        setActiveMergeGroup(null);
                                      }}
                                    >
                                      취소
                                    </button>
                                    <button
                                      className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                                      onClick={async () => {
                                        if (selectedProducts.length === 0) {
                                          setToastMessage('상품을 먼저 체크해주세요');
                                          setToastVariant('warning');
                                          setIsToastVisible(true);
                                          return;
                                        }
                                        // 기준 그룹(items)의 상태/택배사/송장/굿스플로 값이 모두 동일한지 확인
                                        const baseProducts: any[] = items.map(i => i.product);
                                        const firstStatus = String(baseProducts[0]?.order_status || '');
                                        const firstCourier = String(baseProducts[0]?.order_courier_code || baseProducts[0]?.courier_code || '');
                                        const firstTracking = String(baseProducts[0]?.tracking_number || '');
                                        const firstGf = String(baseProducts[0]?.goodsflow_id || '');
                                        const uniformBase = baseProducts.every(p =>
                                          String(p?.order_status || '') === firstStatus &&
                                          String(p?.order_courier_code || p?.courier_code || '') === firstCourier &&
                                          String(p?.tracking_number || '') === firstTracking &&
                                          String(p?.goodsflow_id || '') === firstGf
                                        );

                                        // 선택 대상이 기준값과 모두 동일한지 확인 (기준 그룹 제외)
                                        const selectedObjects = selectedProducts
                                          .map(index => visibleProducts[index])
                                          .filter(p => p && Number(p?.order_group || 0) !== Number(activeMergeGroup));
                                        const allMatchBase = selectedObjects.every(p =>
                                          String(p?.order_status || '') === firstStatus &&
                                          String(p?.order_courier_code || p?.courier_code || '') === firstCourier &&
                                          String(p?.tracking_number || '') === firstTracking &&
                                          String(p?.goodsflow_id || '') === firstGf
                                        );

                                        if (!uniformBase || !allMatchBase) {
                                          setToastMessage('합칠 수 있는 섹션이 없어요');
                                          setToastVariant('warning');
                                          setIsToastVisible(true);
                                          return;
                                        }

                                        const selectedOrderDetailAppIds = Array.from(new Set(
                                          selectedObjects
                                            .map(p => p!.order_detail_app_id)
                                            .filter((id: any) => id != null)
                                        ));
                                        if (selectedOrderDetailAppIds.length === 0 || activeMergeGroup === null) {
                                          setToastMessage('상품을 먼저 체크해주세요');
                                          setToastVariant('warning');
                                          setIsToastVisible(true);
                                          return;
                                        }
                                        await fn_updateOrderGroup(selectedOrderDetailAppIds as number[], Number(activeMergeGroup));
                                      }}
                                    >
                                      선택 항목 합치기
                                    </button>
                                  </div>
                                ) : isSplitMode && activeSplitGroup === groupNo ? (
                                  <div className="flex gap-2">
                                    <button
                                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                                      onClick={() => {
                                        setIsSplitMode(false);
                                        setIsMergeMode(false);
                                        setSelectedProducts([]);
                                        setSplitGroups([]);
                                        setActiveSplitGroup(null);
                                      }}
                                    >
                                      취소
                                    </button>
                                    <button
                                      className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                                      onClick={async () => {
                                        // 아무것도 선택 안 된 경우 경고 토스트 표시 후 중단
                                        if (selectedProducts.length === 0) {
                                          setToastMessage('상품을 먼저 체크해주세요');
                                          setToastVariant('warning');
                                          setIsToastVisible(true);
                                          return;
                                        }
                                        // 현재 그룹의 전체 품목을 모두 선택한 경우 분할 불가
                                        const groupIndexes = items.map(i => i.index);
                                        const selectedInGroup = selectedProducts.filter(i => groupIndexes.includes(i)).length;
                                        const hasValidQtyInput = (() => {
                                          // 선택된 항목들 중 입력 수량이 1 이상, 최대-1 이하인 케이스가 하나라도 있으면 true
                                          for (const idx of selectedProducts) {
                                            if (!groupIndexes.includes(idx)) continue;
                                            const p = visibleProducts[idx];
                                            const maxQty = Number(p?.order_quantity || 0);
                                            const q = Number((splitQtyByDetailId as any)[p?.order_detail_app_id] || 0);
                                            if (maxQty > 1 && q > 0 && q < maxQty) return true;
                                          }
                                          return false;
                                        })();
                                        if (selectedInGroup === items.length && !hasValidQtyInput) {
                                          setToastMessage('전체 품목을 이동시키는 것은 불가능합니다');
                                          setToastVariant('warning');
                                          setIsToastVisible(true);
                                          return;
                                        }
                                        if (selectedProducts.length > 0) {
                                          // 수량 분할 먼저: 유효 수량 입력된 선택 항목들만 분할 API 호출
                                          const qtySplitTargets = selectedProducts
                                            .filter(index => groupIndexes.includes(index))
                                            .map(index => visibleProducts[index])
                                            .filter(p => {
                                              const maxQty = Number(p?.order_quantity || 0);
                                              const q = Number((splitQtyByDetailId as any)[p?.order_detail_app_id] || 0);
                                              return maxQty > 1 && q > 0 && q < maxQty;
                                            });
                                          if (qtySplitTargets.length > 0) {
                                            try {
                                              await Promise.all(qtySplitTargets.map((p: any) => axios.post(`${process.env.REACT_APP_API_URL}/app/memberOrderApp/updateNewMemberOrderApp`, {
                                                order_detail_app_id: p?.order_detail_app_id,
                                                order_quantity: Number((splitQtyByDetailId as any)[p?.order_detail_app_id]),
                                                userId: user?.index,
                                                receiver_name: p?.receiver_name || orderDetail?.receiver_name || '',
                                                receiver_phone: p?.receiver_phone || orderDetail?.receiver_phone || '',
                                                address: p?.address || orderDetail?.address || '',
                                                address_detail: p?.address_detail || orderDetail?.address_detail || '',
                                                zip_code: p?.zip_code || orderDetail?.zip_code || '',
                                                enter_way: (orderDetail as any)?.enter_way || null,
                                                enter_memo: (orderDetail as any)?.enter_memo || null,
                                                delivery_request: p?.delivery_request || orderDetail?.delivery_request || null,
                                              })));
                                            } catch (e) {
                                              console.error('수량 분할 처리 오류 (bulk):', e);
                                            }
                                          }

                                          // 남은 선택 항목들에 대해 그룹 이동 처리
                                          const selectedOrderDetailAppIds = Array.from(new Set(
                                            selectedProducts
                                              .map(index => visibleProducts[index]?.order_detail_app_id)
                                              .filter(id => id !== undefined)
                                          ));
                                          const nextGroupNumber = getNextOrderGroupNumber();
                                          await fn_updateOrderGroup(selectedOrderDetailAppIds as number[], nextGroupNumber);
                                        }
                                      }}
                                    >
                                      새 주문 상태로 나누기
                                    </button>
                                  </div>
                                ) : (
                                  (() => { const s = String(groupStatus || '').toUpperCase(); const isExchangePayment = (s === 'EXCHANGE_PAYMENT_COMPLETE'); const isExchangeShipping = (s === 'EXCHANGE_SHIPPINGING'); const paymentLike = (s === 'PAYMENT_COMPLETE' || s === 'EXCHANGE_SHIPPING_COMPLETE'); if (s === 'EXCHANGE_SHIPPING_COMPLETE') { return null; } return (
                                  <button
                                    className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                                  onClick={() => {
                                    if (s == 'HOLD') {
                                      fn_updateOrderStatusWithParams(groupOrderDetailAppIds, 'PAYMENT_COMPLETE');
                                    } else if (paymentLike && hasUnifiedTracking) {
                                      fn_updateOrderStatusWithParams(groupOrderDetailAppIds, 'SHIPPINGING');
                                      try {
                                        items.forEach(({ product }) => {
                                          sendShippingNotification((orderDetail as any)?.mem_id, (orderDetail as any)?.mem_name, product?.product_name);
                                        });
                                      } catch {}
                                    } else if (s == 'SHIPPINGING') {
                                      fn_updateOrderStatusWithParams(groupOrderDetailAppIds, 'SHIPPING_COMPLETE');
                                    } else if (isExchangeShipping) {
                                      fn_updateOrderStatusWithParams(groupOrderDetailAppIds, 'EXCHANGE_SHIPPING_COMPLETE');
                                    } else if (isExchangePayment && hasExchangeCompanyTracking) {
                                      fn_updateOrderStatusWithParams(groupOrderDetailAppIds, 'EXCHANGE_SHIPPINGING');
                                    } else {
                                      // EXCHANGE_PAYMENT_COMPLETE 포함: 송장 입력 드롭다운 오픈
                                      setOpenTrackingDropdownGroup(openTrackingDropdownGroup === groupNo ? null : groupNo);
                                    }
                                  }}
                                  >
                                    {(((isExchangePayment && !hasExchangeCompanyTracking)) || (s === 'PAYMENT_COMPLETE' && !hasUnifiedTracking)) && (
                                      <>
                                        <span className="text-sm">송장추가</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                      </>
                                    )}
                                    {s == 'SHIPPINGING' && <span className="text-sm">배송완료 처리</span>}
                                    {isExchangeShipping && <span className="text-sm">배송완료 처리</span>}
                                    {s == 'HOLD' && <span className="text-sm">배송보류 해제</span>}
                                    {paymentLike && hasUnifiedTracking && <span className="text-sm">배송중 처리</span>}
                                    {isExchangePayment && hasExchangeCompanyTracking && <span className="text-sm">배송중 처리</span>}
                                  </button>
                                  ); })()
                                )}
                                {openTrackingDropdownGroup === groupNo && (
                                  <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                                    <button
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-t-lg"
                                  onClick={() => {
                                    setOpenTrackingDropdownGroup(null);
                                    // 현재 그룹의 주문들을 한 건으로 묶어서 굿스플로에 전달 (deliveryItems로 처리)
                                    const mergedOrder = convertOrderDetailToOrder(items[0].product);
                                    (mergedOrder as any).products = items.map(i => i.product);
                                    setGoodsflowOrders([mergedOrder as any]);
                                    handleGoodsflowOpen();
                                  }}
                                    >
                                      굿스플로
                                    </button>
                                    <button
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-b-lg"
                                      onClick={() => {
                                        setOpenTrackingDropdownGroup(null);
                                        setInvoiceOrderIds(groupOrderDetailAppIds);
                                        setIsInvoicePopupOpen(true);
                                      }}
                                    >
                                      수동입력
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* 오른쪽 - 결제정보 */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold mb-4">결제정보</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">결제수단</span>
                <span className="font-medium">{orderDetail?.card_name ? orderDetail?.card_name : '어플 포인트'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">상품 금액</span>
                <span>{totalOriginalAmount.toLocaleString()} 원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">할인</span>
                <span>-{(totalOriginalAmount - totalDiscountedAmount).toLocaleString()} 원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">배송비</span>
                <span>{(orderDetail?.free_shipping_amount > Number(orderDetail?.payment_amount)) ? orderDetail?.delivery_fee.toLocaleString() + ' 원' : '무료배송'}</span>
              </div>
              {orderDetail?.extra_zip_code &&
                <div className="flex justify-between">
                  <span className="text-gray-600">도서 산간 배송비</span>
                  <span>{orderDetail?.remote_delivery_fee.toLocaleString()} 원</span>
                </div>
              }
              {Number(orderDetail?.point_use_amount) !== 0 &&
                <div className="flex justify-between">
                  <span className="text-gray-600">적립금</span>
                  <span>{(Number(orderDetail?.point_use_amount) ? -orderDetail?.point_use_amount : 0)?.toLocaleString()} 원</span>
                </div>
              }
              {Number(orderDetail?.coupon_discount_amount) !== 0 &&
                <div className="flex justify-between">
                  <span className="text-gray-600">쿠폰</span>
                  <span>{orderDetail?.coupon_discount_type === 'PERCENT' ? '-' + Number((Number(orderDetail?.coupon_discount_amount) * 1/100) * ( (totalOriginalAmount - totalDiscountedAmount))).toLocaleString() : '-' + Number(orderDetail?.coupon_discount_amount).toLocaleString()} 원</span>
                </div>
              }
              {/* {Number(orderDetail?.refund_amount) !== 0 &&
                <div className="flex justify-between">
                  <span className="text-gray-600">쿠폰+적립금</span>
                  <span>{(totalOriginalAmount - totalDiscountedAmount - orderDetail?.refund_amount - Number(orderDetail?.point_use_amount || 0) - orderDetail?.payment_amount).toLocaleString()} 원</span>    
                </div>
              } */}
              <div className="flex justify-between">
                <span className="text-gray-600">환불</span>
                <span>{Number(Number(orderDetail?.refund_amount) ? -orderDetail?.refund_amount : 0).toLocaleString()} 원</span>
              </div>
              <hr />
              <div className="flex justify-between font-semibold text-lg">
                <span>결제 금액</span>
                {/* <span>{(() => {
                  const couponDeduction = (() => {
                    const amt = Number(orderDetail?.coupon_discount_amount || 0);
                    if (!amt) return 0;
                    return orderDetail?.coupon_discount_type === 'PERCENT'
                      ? Number((amt * 1/100) * ( (totalOriginalAmount - totalDiscountedAmount)))
                      : amt;
                  })();
                  const base = Math.max(0, (totalDiscountedAmount - Number(orderDetail?.point_use_amount || 0) - Number(orderDetail?.refund_amount || 0) - couponDeduction));
                  const canShowShipping = toStatus(orderDetail?.order_status) === 'CANCEL_COMPLETE';
                  const addShipping = canShowShipping && ((Number(orderDetail?.payment_amount) || 0) < Number(orderDetail?.free_shipping_amount || 0))
                    ? Number(orderDetail?.delivery_fee || 0)
                    : 0;
                  return (base + addShipping).toLocaleString();
                })()} 원</span> */}
                <span>{Number(orderDetail?.payment_amount).toLocaleString()} 원</span>
              </div>
            </div>
          </div>

          {/* 구매자 정보 */}
          <div className="space-y-6 mt-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold mb-4">구매자 정보</h3>
              <div className="space-y-2">
                <p className="text-sm font-semibold" style={{color: '#0090D4'}}>{orderDetail?.mem_app_id}</p>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{orderDetail?.mem_name}</span>
                </div>
                <p className="text-sm font-semibold" style={{color: '#0090D4'}}>{orderDetail?.mem_phone?.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}</p>
              </div>
            </div>

            {/* 배송지 정보 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold mb-4">배송지 정보</h3>
              <div className="space-y-2">
                <div className="flex">
                  <p className="text-sm">{orderDetail?.receiver_name || '수령자 없음'}</p>
                </div>
                <div className="flex">
                  <p className="text-sm">{orderDetail?.receiver_phone || '수령자 전화번호 없음'}</p>
                </div>
                <div className="flex">
                  <div>
                    <p className="text-sm">({orderDetail?.zip_code || '우편번호 없음'}) {orderDetail?.address || '주소 없음'}</p>
                    <p className="text-gray-600 text-xs mt-1">{orderDetail?.delivery_request ? orderDetail?.delivery_request : '배송메모 없음'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 출력 모달 */}
      <OrderPrintModal
        orderDetail={orderDetail}
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />

      {/* 송장입력 팝업 */}
      <MemberOrderAppPopup
        isOpen={isInvoicePopupOpen}
        onClose={() => setIsInvoicePopupOpen(false)}
        onCancel={() => setIsInvoicePopupOpen(false)}
        orderDetailAppId={invoiceOrderIds.length > 0 ? invoiceOrderIds : (orderDetail?.products ? orderDetail.products.map(product => product.order_detail_app_id) : [])}
        userId={user?.index}
        onSuccess={(trackingNumber, courierCode, actionType) => handleInvoiceSuccess(trackingNumber, courierCode, actionType)}
        mode="input"
        existingTrackingNumber={(() => {
          try {
            const ids = (invoiceOrderIds && invoiceOrderIds.length > 0)
              ? invoiceOrderIds
              : (orderDetail?.products ? orderDetail.products.map((p: any) => p?.order_detail_app_id) : []);
            const targets = (orderDetail?.products || []).filter((p: any) => ids.includes(p?.order_detail_app_id));
            for (const p of targets) {
              const statusUpper = String(p?.order_status || '').toUpperCase();
              if (statusUpper.startsWith('EXCHANGE')) {
                const t = String(p?.company_tracking_number || '').trim();
                if (t) return t;
              } else {
                const t = String(p?.tracking_number || '').trim();
                if (t) return t;
              }
            }
            return '';
          } catch { return ''; }
        })()}
        existingCourierCode={(() => {
          try {
            const ids = (invoiceOrderIds && invoiceOrderIds.length > 0)
              ? invoiceOrderIds
              : (orderDetail?.products ? orderDetail.products.map((p: any) => p?.order_detail_app_id) : []);
            const targets = (orderDetail?.products || []).filter((p: any) => ids.includes(p?.order_detail_app_id));
            for (const p of targets) {
              const statusUpper = String(p?.order_status || '').toUpperCase();
              if (statusUpper.startsWith('EXCHANGE')) {
                const c = String(p?.company_courier_code || '').trim();
                if (c) return c;
              } else {
                const c = String(p?.order_courier_code || p?.courier_code || '').trim();
                if (c) return c;
              }
            }
            return '';
          } catch { return ''; }
        })()}
        isShippingMode={orderDetail?.order_status === 'SHIPPINGING'}
      />

       {/* 굿스플로 연동 모달 */}
       <GoodsflowModal
         selectedOrders={goodsflowOrders.length > 0 ? goodsflowOrders : (orderDetail ? [convertOrderDetailToOrder(orderDetail)] : [])}
         isOpen={isGoodsflowModalOpen}
         onClose={() => {
           setIsGoodsflowModalOpen(false);
           setGoodsflowOrders([]);
         }}
         onSuccess={async () => {
           try {
             // 굿스플로 송장 등록 성공 시 해당 상세들을 배송중으로 전환
             const detailIds: number[] = (() => {
               if (goodsflowOrders && goodsflowOrders.length > 0) {
                 const first = goodsflowOrders[0] as any;
                 const list = Array.isArray(first?.products) ? first.products : [];
                 return Array.from(new Set(list.map((p: any) => p?.order_detail_app_id).filter((v: any) => v != null)));
               }
               const list = Array.isArray(orderDetail?.products) ? (orderDetail!.products as any[]) : [];
               return Array.from(new Set(list.map((p: any) => p?.order_detail_app_id).filter((v: any) => v != null)));
             })();
             if (detailIds.length > 0) {
               const isAnyExchangePaymentComplete = (() => {
                 try {
                   const products: any[] = Array.isArray(orderDetail?.products) ? (orderDetail!.products as any[]) : [];
                   return detailIds.some((id: number) => String(products.find((p: any) => p?.order_detail_app_id === id)?.order_status || '').toUpperCase() === 'EXCHANGE_PAYMENT_COMPLETE');
                 } catch (_) {
                   return false;
                 }
               })();
               const nextStatus = isAnyExchangePaymentComplete ? 'EXCHANGE_SHIPPINGING' : 'SHIPPINGING';
               await fn_updateOrderStatusWithParams(detailIds, nextStatus);

               // 배송중 알림 발송
               try {
                 const memId = (orderDetail as any)?.mem_id;
                 const memName = (orderDetail as any)?.mem_name;
                 const products: any[] = Array.isArray(orderDetail?.products) ? (orderDetail!.products as any[]) : [];
                 products
                   .filter((p: any) => detailIds.includes(p?.order_detail_app_id))
                   .forEach((p: any) => {
                     sendShippingNotification(memId, memName, p?.product_name);
                   });
               } catch {}
             }

             // 굿스플로 아이디(goodsflow_id) 즉시 반영하여 파란 트럭/안내문구가 새로고침 없이 보이도록 동기화
             try {
               const targetId = orderFromState?.order_app_id || routeOrderId || orderDetail?.order_app_id;
               if (user?.index && targetId) {
                 const res = await axios.post(
                   `${process.env.REACT_APP_API_URL}/app/memberOrderApp/selectMemberOrderAppList`,
                   {
                     center_id: user.index,
                     order_status: '',
                     searchValue: String(targetId)
                   }
                 );
                 const rows = res.data?.orders || res.data || [];
                 if (Array.isArray(rows) && rows.length > 0) {
                   const byDetailId = new Map<number, any>();
                   rows.forEach((r: any) => {
                     const did = Number(r?.order_detail_app_id);
                     if (!isNaN(did)) byDetailId.set(did, r);
                   });
                   setOrderDetail((prev) => {
                     if (!prev) return prev;
                     const updatedProducts = (prev.products || []).map((p: any) => {
                       const m = byDetailId.get(Number(p?.order_detail_app_id));
                       if (!m) return p;
                       return {
                         ...p,
                         goodsflow_id: m?.goodsflow_id || p.goodsflow_id,
                       };
                     });
                     return { ...prev, products: updatedProducts } as any;
                   });

                  // 교환 배송대기(EXCHANGE_PAYMENT_COMPLETE)의 굿스플로 송장 등록 시: return_goodsflow_id 저장 → 굿스플로에서 송장/택배사 조회 → 회사 송장/택배사 업데이트
                  try {
                    if (detailIds && detailIds.length > 0 && (() => {
                      try {
                        const products: any[] = Array.isArray(orderDetail?.products) ? (orderDetail!.products as any[]) : [];
                        return detailIds.some((id: number) => String(products.find((p: any) => p?.order_detail_app_id === id)?.order_status || '').toUpperCase() === 'EXCHANGE_PAYMENT_COMPLETE');
                      } catch (_) { return false; }
                    })()) {
                      // 대상 상세ID들에 대해 동일 굿스플로 serviceId(goodsflow_id)를 취득
                      const serviceIds = Array.from(new Set(
                        detailIds
                          .map((id: number) => String(byDetailId.get(id)?.goodsflow_id || '').trim())
                          .filter((v: string) => v !== '')
                      ));
                      if (serviceIds.length === 1) {
                        const serviceId = serviceIds[0];
                        // 1) return_goodsflow_id 저장
                        await axios.post(`${process.env.REACT_APP_API_URL}/app/memberReturnApp/updateReturnGoodsflowId`, {
                          order_detail_app_id: detailIds,
                          return_goodsflow_id: serviceId,
                          userId: user?.index,
                        });
                        // 2) 굿스플로에서 송장/택배사 조회
                        const gfRes3 = await axios.get(
                          `${process.env.REACT_APP_API_URL}/app/goodsflow/shipping/deliveries/${encodeURIComponent(serviceId)}`,
                          { params: { idType: 'serviceId' } }
                        );
                        const deliveries3: any[] = gfRes3?.data?.data || [];
                        const first = Array.isArray(deliveries3) && deliveries3.length > 0 ? deliveries3[0] : null;
                        const invoiceNo = first && first.invoiceNo ? String(first.invoiceNo).trim() : '';
                        const transporter = first && (first.transporter || first.transporterCode) ? String(first.transporter || first.transporterCode).trim() : '';
                        const companyCode = (String(transporter).toUpperCase() === 'KOREX') ? 'CJ' : transporter;
                        if (invoiceNo && companyCode) {
                          // 3) 회사 송장/택배사 업데이트
                          await axios.post(`${process.env.REACT_APP_API_URL}/app/memberReturnApp/updateExchangeCompanyTrackingInfo`, {
                            order_detail_app_id: detailIds,
                            company_tracking_number: invoiceNo,
                            company_courier_code: companyCode,
                            userId: user?.index,
                          });
                          // 로컬 상태 반영
                          setOrderDetail((prev) => {
                            if (!prev) return prev;
                            const updated = (prev.products || []).map((p: any) =>
                              detailIds.includes(p?.order_detail_app_id)
                                ? { ...p, company_tracking_number: invoiceNo, company_courier_code: companyCode }
                                : p
                            );
                            return { ...prev, products: updated } as any;
                          });
                        }
                      }
                    }
                  } catch (exSyncErr) {
                    console.error('[EXCHANGE_FLOW] company tracking sync error:', exSyncErr);
                  }
                 }
               }
             } catch (gfSyncErr) {
               console.error('굿스플로 아이디 동기화 오류:', gfSyncErr);
             }
           } catch (e) {
             console.error('굿스플로 송장 등록 후 배송중 전환 오류:', e);
           } finally {
             setIsGoodsflowModalOpen(false);
             setGoodsflowOrders([]);
           }
         }}
       />

      <CustomToastModal
        message={toastMessage}
        isVisible={isToastVisible}
        onClose={() => setIsToastVisible(false)}
        variant={toastVariant}
      />

      {/* 교환 수거완료 확인 팝업 */}
      {isExchangePickupConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div>
              <h3 className="text-base font-medium mb-3">
                현재 귀책을 떠나 고객님이 교환 배송비를 선결제 하였습니다.<br />교환 배송비를 환불하시겠습니까?
              </h3>
              <div className="space-y-2 mb-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="exchangePickupRefund"
                    value="yes"
                    checked={exchangePickupRefundChoice === 'yes'}
                    onChange={() => setExchangePickupRefundChoice('yes')}
                  />
                  예
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="exchangePickupRefund"
                    value="no"
                    checked={exchangePickupRefundChoice === 'no'}
                    onChange={() => setExchangePickupRefundChoice('no')}
                  />
                  아니오
                </label>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setIsExchangePickupConfirmOpen(false)}
                >
                  닫기
                </button>
                <button
                  className="px-4 py-2 bg-black text-white font-semibold rounded-lg hover:bg-gray-900"
                  onClick={async () => {
                    try {
                      if (exchangePickupRefundChoice === 'yes') {
                        const paymentAppId = (orderDetail as any)?.delivery_fee_payment_app_id;
                        
                        if (paymentAppId) {
                          try {
                            await axios.post(`${process.env.REACT_APP_API_URL}/app/portone/requestPortOneRefund`, {
                              payment_app_id: paymentAppId,
                              userId: user?.index,
                              order_app_id: (orderDetail as any)?.order_app_id,
                              reason: '교환 배송비 환불',
                            });
                          } catch (e) {
                            console.error('[PortOne] 배송비 환불 요청 오류:', e);
                          }
                        }
                      }
                      const ids = (exchangeTargetDetailIds && exchangeTargetDetailIds.length > 0)
                        ? exchangeTargetDetailIds
                        : Array.from(new Set(((orderDetail?.products || []) as any[])
                            .map((p: any) => p?.order_detail_app_id)
                            .filter((v: any) => v != null)));
                      if (ids && ids.length > 0) {
                        await fn_updateOrderStatusWithParams(ids, 'EXCHANGE_PAYMENT_COMPLETE');
                      }
                    } catch (e) {
                      console.error('교환 배송비 환불 처리 오류:', e);
                    } finally {
                      setIsExchangePickupConfirmOpen(false);
                    }
                  }}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* 송장번호 삭제 확인 팝업 */}
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  송장을 삭제할까요?
                </h3>
                <p className="text-sm font-medium text-gray-400 mb-6">
                  한 번 삭제하면 되돌릴 수 없어요.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setIsDeleteConfirmOpen(false)}
                  >
                    취소
                  </button>
                  <button
                    className="px-4 py-2 bg-red-600 font-semibold text-white rounded-lg hover:bg-red-700"
                    onClick={async () => {
                      setIsDeleteConfirmOpen(false);
                      await fn_deleteTrackingNumber();
                    }}
                  >
                    송장번호 삭제
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default MemberOrderAppDetail; 