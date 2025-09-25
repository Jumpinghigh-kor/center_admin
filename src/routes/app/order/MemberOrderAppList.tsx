import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../../store/store";
import { useCheckbox } from "../../../hooks/useCheckbox";
import { usePagination } from "../../../hooks/usePagination";
import Pagination from "../../../components/Pagination";
import MemberOrderAppPopup from "../../../components/app/MemberOrderAppPopup";
import OrderPrintModal from "../../../components/app/OrderPrintModal";
import GoodsflowModal from "../../../components/app/GoodsflowModal";
import CustomToastModal from "../../../components/CustomToastModal";
import blueI from "../../../images/blue_i.png";
import grayI from "../../../images/gray_i.png";
import editGray from "../../../images/edit_gray.png";
import penGray from "../../../images/pen_gray.png";
import trashGray from "../../../images/trash_gray.png";
import checkGray from "../../../images/check_gray.png";

interface Order {
  mem_id: string;
  mem_name: string;
  mem_birth: string;
  mem_phone: string;
  mem_email_id: string;
  order_app_id: number;
  order_detail_app_id: number;
  order_status: string;
  order_quantity: number;
  add_order_quantity: number; // 전체 상품 수량 합계
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
  enter_way: string;
  enter_memo: string;
  zip_code: string;
  option_type: string;
  option_amount: number;
  option_unit: string;
  option_gender: string;
  product_app_id: number;
  return_type: string;
  return_status: string;
  delivery_fee: number;
  products?: Order[]; // 합쳐진 주문의 개별 상품들
  free_shipping_amount: number;
  order_courier_code: string;
  extra_zip_code: string;
  remote_delivery_fee: number;
  point_minus: number;
  order_group: number;
  goodsflow_id: string;
  point_use_amount: number;
  quantity: number;
  return_dt: string;
  refund_amount: number;
  jumping_free_shipping_amount: number;
  customer_tracking_number: string;
  company_tracking_number: string;
  customer_courier_code: string;
  company_courier_code: string;
  return_quantity: number;
  return_goodsflow_id: string;
  delivery_fee_portone_imp_uid: string;
  delivery_fee_portone_merchant_uid: string;
  coupon_discount_amount: number;
  coupon_discount_type: string;
}

interface CommonCode {
  common_code: string;
  group_code: string;
  common_code_name: string;
  common_code_memo: string;
}

interface ProductImage {
  fileName: string;
  imgForm: string;
  orderSeq: number;
  imageUrl: string;
  productAppId: number;
}

const MemberOrderAppList: React.FC = () => {
  const navigate = useNavigate();
  const [orderList, setOrderList] = useState<Order[]>([]);
  const [deliveryCompanyList, setDeliveryCompanyList] = useState<CommonCode[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isEditMemoOpen, setIsEditMemoOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [memoText, setMemoText] = useState("");
  const [isDeleteMemoOpen, setIsDeleteMemoOpen] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [isOrderProcessOpen, setIsOrderProcessOpen] = useState(false);
  const [isOrderPrintOpen, setIsOrderPrintOpen] = useState(false);
  const [isInvoicePopupOpen, setIsInvoicePopupOpen] = useState(false);
  const [selectedOrderDetailAppId, setSelectedOrderDetailAppId] = useState<number[] | null>(null);
  const [popupMode, setPopupMode] = useState<'input' | 'delete'>('input');
  const [isErrorPopupOpen, setIsErrorPopupOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState({ title: '', content: '' });
  const [isOrderPrintModalOpen, setIsOrderPrintModalOpen] = useState(false);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | Order[] | null>(null);
  const [isGoodsflowModalOpen, setIsGoodsflowModalOpen] = useState(false);
  const [selectedOrdersForGoodsflow, setSelectedOrdersForGoodsflow] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('TOTAL_COUNT');
  const [activeTabCount, setActiveTabCount] = useState(0);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('복사가 완료되었습니다');
  const [searchValue, setSearchValue] = useState('');
  const [orderCountList, setOrderCountList] = useState([]);
  const [orderStatusCodeList, setOrderStatusCodeList] = useState<CommonCode[]>([]);
  const [returnReasonCodeList, setReturnReasonCodeList] = useState<CommonCode[]>([]);
  const [goodsflowInitiatedOrderIds, setGoodsflowInitiatedOrderIds] = useState<number[]>([]);
  const [isExchangePaymentCompleteForPopup, setIsExchangePaymentCompleteForPopup] = useState(false);
  const user = useUserStore((state) => state.user);
  const { currentPage, totalPages, itemsPerPage, handlePageChange, getCurrentPageData, resetPage } = usePagination({
    totalItems: totalCount,
    itemsPerPage: 10
  });
  const { checkedItems, allChecked, handleAllCheck, handleIndividualCheck, resetCheckedItems } = useCheckbox(orderList.length);

  // Helpers: 체크 항목으로 선택된 주문/아이디 계산 (중복 제거)
  const getSelectedOrdersFromChecks = () =>
    checkedItems
      .map((checked, index) => (checked ? orderList[index] : null))
      .filter((order): order is Order => order !== null);

  const getSelectedOrderIdsFromChecks = () =>
    checkedItems
      .map((checked, index) => (checked ? orderList[index] : null))
      .filter((order) => order !== null)
      .flatMap((order: any) => (order?.products ? order.products.map((product: any) => product.order_detail_app_id) : [order?.order_detail_app_id]))
      .filter((id) => id !== undefined) as number[];

  // 주문 목록 불러오기
  useEffect(() => {
    if (!user || !user.index) return;
    fn_memberOrderAppListInternal(false);
    fn_deliveryCompanyList();
    fn_memberOrderAppCount();
    fn_orderStatusTypeList();
    fn_returnReasonTypeList();
  }, [user]);

  // 페이지 변경 시 주문 목록 다시 불러오기
  useEffect(() => {
    if (!user || !user.index) return;
    fn_memberOrderAppListInternal(false);
  }, [currentPage]);

  // activeTab 변경 시 주문 목록 다시 불러오기
  useEffect(() => {
    if (!user || !user.index) return;
    fn_memberOrderAppListInternal(false);
  }, [activeTab]);

  // orderList가 로드된 후 상품 이미지 가져오기
  useEffect(() => {
    if (orderList.length > 0) {
      fn_productAppImg();
    }
  }, [orderList]);

  // 체크박스 선택 상태 변경 시 드롭다운 메뉴 초기화
  useEffect(() => {
    if (checkedItems.some(checked => checked)) {
      setIsOrderProcessOpen(false);
      setIsOrderPrintOpen(false);
    }
  }, [checkedItems]);

  // 택배사 목록 불러오기
  const fn_deliveryCompanyList = async () => {
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

  // 주문 상태 코드 목록 불러오기
  const fn_orderStatusTypeList = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/common/selectCommonCodeList`,
        {
          group_code: "ORDER_STATUS_TYPE",
        }
      );

      setOrderStatusCodeList(response.data.result || []);
    } catch (err) {
      console.error("주문 상태 코드 로딩 오류:", err);
    }
  };

  // 취소 사유 코드 목록 불러오기
  const fn_returnReasonTypeList = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/common/selectCommonCodeList`,
        { group_code: 'RETURN_REASON_TYPE' }
      );
      setReturnReasonCodeList(response.data.result || []);
    } catch (err) {
      console.error('취소 사유 코드 로딩 오류:', err);
    }
  };

  const getReturnReasonName = (code?: string) => {
    if (!code) return '';
    const item = returnReasonCodeList.find(c => c.common_code === String(code));
    return item ? item.common_code_name : '';
  };

  // 주문 주소 조회 함수는 제거 (fn_memberOrderAppListInternal 내부에서 함께 호출)

  // 주문 목록 갯수 조회
  const fn_memberOrderAppCount = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/memberOrderApp/selectMemberOrderAppCount`,
        {
          center_id: user.index
        }
      );

      setOrderCountList(response.data || []);
      setActiveTabCount(response.data[0][activeTab]);
    } catch (err) {
      console.error("주문 목록 갯수 조회 오류:", err);
    }
  };

  // 상품 이미지 불러오기
  const fn_productAppImg = async () => { 
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/memberOrderApp/selectProductAppImg`,
      );
      
      const representImgs: ProductImage[] = response.data
        .reduce((acc: any[], img: any) => {
          if (!acc.find(item => item.product_app_id === img.product_app_id)) {
            acc.push(img);
          }
          return acc;
        }, [])
        .map((img: any) => ({
          productAppId: img.product_app_id,
          imageUrl: `https://rkpeiqnrtbpwuaxymwkr.supabase.co/storage/v1/object/public/product/product/${img.file_name}`,
        }));
      
      setProductImages(representImgs);
    } catch (err) {
      console.error("상품 이미지 로딩 오류:", err);
    }
  };
  
  // 실제 로딩 함수
  const fn_memberOrderAppListInternal = async (skipGoodsflowSync?: boolean) => {
    if (!user || !user.index) {
      return;
    }
    
    try {
          const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/app/memberOrderApp/selectMemberOrderAppList`,
         {
           center_id: user.index,
           order_status: activeTab === 'ALL' ? '' : activeTab,
           searchValue: searchValue,
         }
       );
      
      const rawOrders = response.data.orders || response.data || [];

      const groupedOrders = rawOrders.reduce((acc: any[], order: any) => {
        const key = order?.order_app_id;
        if (key == null) {
          const { products: _omitP, ...productOnly } = order || {};
          order.products = [productOnly];
          order.add_order_quantity = order.order_quantity;
          acc.push(order);
          return acc;
        }

        const existingOrder = acc.find(item => item.order_app_id === key);

        if (existingOrder) {
          existingOrder.give_point = (existingOrder.give_point || 0) + (order.give_point || 0);
          existingOrder.add_order_quantity = (existingOrder.add_order_quantity || 0) + (order.order_quantity || 0);

          if (!existingOrder.products) {
            existingOrder.products = [];
          }
          const { products: _omit2, ...cleanRow } = order || {};
          existingOrder.products.push(cleanRow);
        } else {
          const { products: _omit1, ...productOnly } = order || {};
          order.products = [productOnly];
          order.add_order_quantity = order.order_quantity;
          acc.push(order);
        }

        return acc;
      }, []);

      // 주소 매핑: order_detail_app_id 기준 매칭 (각 상품에 주입, 헤더는 첫 상품으로 보강)
      try {
        const addrRes = await axios.post(
          `${process.env.REACT_APP_API_URL}/app/memberOrderAddress/selectMemberOrderAddress`,
          { center_id: user.index }
        );
        const addrRows = addrRes?.data?.result || [];
        const addrByDetailId = new Map<number, any>();
        (addrRows || []).forEach((row: any) => {
          const did = Number(row?.order_detail_app_id);
          if (!isNaN(did) && !addrByDetailId.has(did)) {
            addrByDetailId.set(did, row);
          }
        });
        groupedOrders.forEach((g: any) => {
          if (Array.isArray(g.products) && g.products.length > 0) {
            g.products = g.products.map((p: any) => {
              const a = addrByDetailId.get(Number(p?.order_detail_app_id));
              if (!a) return p;
              return {
                ...p,
                receiver_name: a.receiver_name,
                receiver_phone: a.receiver_phone,
                address: a.address,
                address_detail: a.address_detail,
                zip_code: a.zip_code,
                delivery_request: a.delivery_request,
                extra_zip_code: a.extra_zip_code,
                enter_way: a.enter_way,
                enter_memo: a.enter_memo,
                delivery_fee_portone_imp_uid: a.delivery_fee_portone_imp_uid,
                delivery_fee_portone_merchant_uid: a.delivery_fee_portone_merchant_uid,
              };
            });
            
            const h = g.products[0] || {};
            g.receiver_name = h.receiver_name ?? g.receiver_name;
            g.receiver_phone = h.receiver_phone ?? g.receiver_phone;
            g.address = h.address ?? g.address;
            g.address_detail = h.address_detail ?? g.address_detail;
            g.zip_code = h.zip_code ?? g.zip_code;
            g.delivery_request = h.delivery_request ?? g.delivery_request;
            g.extra_zip_code = h.extra_zip_code ?? g.extra_zip_code;
            g.enter_way = h.enter_way ?? g.enter_way;
            g.enter_memo = h.enter_memo ?? g.enter_memo;
            g.delivery_fee_portone_imp_uid = h.delivery_fee_portone_imp_uid ?? g.delivery_fee_portone_imp_uid;
            g.delivery_fee_portone_merchant_uid = h.delivery_fee_portone_merchant_uid ?? g.delivery_fee_portone_merchant_uid;
          }
        });
      } catch (e) {
        console.error('주소 매핑 오류:', e);
      }

      setOrderList(groupedOrders);
      setTotalCount(response.data.total || response.data.length || 0);
      resetCheckedItems();

      // 굿스플로 배송(결과)조회 - 새로고침마다 호출 및 즉시 매핑 반영
      if (!skipGoodsflowSync) {
        try {
          const goodsflowIds: string[] = Array.from(
            new Set(
              (rawOrders || [])
                .map((o: any) => o?.goodsflow_id)
                .filter((id: any) => typeof id === 'string' && id.trim() !== '')
            )
          );

          if (goodsflowIds.length > 0) {
            const gfRes = await axios.get(
              `${process.env.REACT_APP_API_URL}/app/goodsflow/shipping/deliveries/${goodsflowIds.join(',')}`,
              { params: { idType: 'serviceId' } }
            );
            
            // serviceId -> order_detail_app_id 매핑 생성 (상세 기준으로 송장 업데이트)
            const serviceIdToDetailIds = new Map<string, number[]>();
            (rawOrders || []).forEach((o: any) => {
              const sid = o?.goodsflow_id;
              if (typeof sid === 'string' && sid.trim() !== '' && typeof o?.order_detail_app_id === 'number') {
                if (!serviceIdToDetailIds.has(sid)) serviceIdToDetailIds.set(sid, []);
                serviceIdToDetailIds.get(sid)!.push(o.order_detail_app_id);
              }
            });

            const deliveries = gfRes?.data?.data || [];
            // 각 상세의 현재 상태 맵 구성 (상태 변경 방지 위해 기존 상태 그대로 사용)
            const detailIdToStatus = new Map<number, string>();
            (rawOrders || []).forEach((o: any) => {
              if (typeof o?.order_detail_app_id === 'number' && typeof o?.order_status === 'string') {
                detailIdToStatus.set(o.order_detail_app_id, o.order_status);
              }
            });

            const updateCalls = deliveries
              .filter((d: any) => d?.invoiceNo && serviceIdToDetailIds.has(d?.id))
              .flatMap((d: any) => {
                const targetDetailIds = serviceIdToDetailIds.get(d.id)!;
                const courierCode = d?.transporter === 'KOREX' ? 'CJ' : d?.transporter || '';
                return targetDetailIds.map((detailId) => {
                  const currentStatus = detailIdToStatus.get(detailId) || '';
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
              // DB 반영 직후 즉시 화면 데이터 재로딩(두 번째 호출에서는 동기화 스킵)
              await fn_memberOrderAppListInternal(true);
              return;
            }
          }
        } catch (error) {
          console.error('Goodsflow deliveries fetch error:', error);
        }
      }

      // Delivery Tracker 연동: tracking_number가 있고 상태가 PAYMENT_COMPLETE인 경우 at_pickup이면 SHIPPINGING으로 변경
      try {
        // 택배사 코드 → Delivery Tracker carrierId 매핑
        const mapCourierToCarrierId = (code: string): string => {
          if (!code) return '';
          const upper = code.toUpperCase();
          if (upper === 'CJ') return 'kr.cjlogistics';
          return '';
        };

        // 조회 대상(중복 제거: carrierId+trackingNumber)
        const toCheckMap = new Map<string, { carrierId: string; trackingNumber: string }>();
        (rawOrders || [])
          .filter((o: any) => o?.tracking_number && o?.order_status === 'PAYMENT_COMPLETE')
          .forEach((o: any) => {
            const carrierId = mapCourierToCarrierId(o?.order_courier_code || '');
            if (!carrierId) return;
            const trackingNumber = String(o.tracking_number);
            const key = `${carrierId}::${trackingNumber}`;
            if (!toCheckMap.has(key)) {
              toCheckMap.set(key, { carrierId, trackingNumber });
            }
          });
        const query = `
          query Track($carrierId: ID!, $trackingNumber: String!) {
            track(carrierId: $carrierId, trackingNumber: $trackingNumber) {
              progresses { time status { id text } }
            }
          }
        `;

        // 병렬 조회
        const checks = Array.from(toCheckMap.values()).map(({ carrierId, trackingNumber }) =>
          axios.post(
            `${process.env.REACT_APP_API_URL}/app/delivery-tracker/graphql`,
            { query, variables: { carrierId, trackingNumber } }
          ).then(res => ({ carrierId, trackingNumber, data: res.data }))
           .catch(err => ({ carrierId, trackingNumber, error: err }))
        );

        const results = await Promise.all(checks);

        // at_pickup 상태인 트래킹들에 대해 해당 주문들을 SHIPPINGING으로 변경
        for (const r of results) {
          if ((r as any).error) continue;
          const progresses = (r as any).data?.data?.track?.progresses || [];
          const hasAtPickup = Array.isArray(progresses) && progresses.some((p: any) => p?.status?.id === 'at_pickup');
          if (!hasAtPickup) continue;

          // 동일 운송장/택배사의 주문 중 현재 PAYMENT_COMPLETE 인 건만 상태 변경
          const targetOrders = (rawOrders || []).filter((o: any) => {
            const carrierId = mapCourierToCarrierId(o?.order_courier_code || '');
            return (
              o?.tracking_number && String(o.tracking_number) === (r as any).trackingNumber &&
              carrierId === (r as any).carrierId &&
              o?.order_status === 'PAYMENT_COMPLETE'
            );
          });

          for (const o of targetOrders) {
            await fn_updateOrderStatus(o.order_app_id, 'SHIPPINGING');
            try { await sendShippingNotification(o.mem_id, o.mem_name, o.product_name); } catch {}
          }
        }
      } catch (error) {
        console.error('Delivery Tracker fetch error:', error);
      }

      // Delivery Tracker 연동: delivered면 배송완료로 전환 (반품/교환 제외)
      try {
        const toCheckMap = new Map<string, { companyName: string; trackingNumber: string }>();
        (rawOrders || [])
          .filter((o: any) => {
            const s = String(o?.order_status || '').toUpperCase();
            if (s.includes('RETURN') || s.includes('EXCHANGE')) return false;
            if (s === 'SHIPPING_COMPLETE' || s === 'PURCHASE_CONFIRM') return false;
            return !!(String(o?.tracking_number || '').trim() && String(o?.order_courier_code || o?.courier_code || '').trim());
          })
          .forEach((o: any) => {
            const companyName = String(o?.order_courier_code || o?.courier_code || '').trim();
            const trackingNumber = String(o?.tracking_number).trim();
            const key = `${companyName}::${trackingNumber}`;
            if (!toCheckMap.has(key)) {
              toCheckMap.set(key, { companyName, trackingNumber });
            }
          });

        if (toCheckMap.size > 0) {
          const calls = Array.from(toCheckMap.values()).map(({ companyName, trackingNumber }) =>
            axios
              .post(`${process.env.REACT_APP_API_URL}/app/trackingService/trackingService`, { companyName, trackingNumber })
              .then((res) => ({ companyName, trackingNumber, data: res.data }))
              .catch((err) => ({ companyName, trackingNumber, error: err }))
          );

          const results = await Promise.all(calls);

          const deliveredPairs = results.filter((r: any) => {
            if ((r as any).error) return false;
            const ok = (r as any).data?.success;
            const statusName = String((r as any).data?.data?.status || '').toUpperCase();
            const statusCode = String((r as any).data?.data?.statusCode || '').toUpperCase();
            const delivered = statusName.includes('DELIVER') || statusCode === 'DELIVERED';
            return ok && delivered;
          });

          for (const p of deliveredPairs) {
            const companyName = (p as any).companyName;
            const trackingNumber = (p as any).trackingNumber;
            const targets = (rawOrders || []).filter((o: any) => {
              const s = String(o?.order_status || '').toUpperCase();
              if (s.includes('RETURN') || s.includes('EXCHANGE')) return false;
              if (s === 'SHIPPING_COMPLETE' || s === 'PURCHASE_CONFIRM') return false;
              const cc = String(o?.order_courier_code || o?.courier_code || '').trim();
              const tn = String(o?.tracking_number || '').trim();
              return cc === companyName && tn === trackingNumber;
            });
            for (const o of targets) {
              await fn_updateOrderStatus(o.order_detail_app_id, 'SHIPPING_COMPLETE');
              try { await sendShippingCompleteNotification(o.mem_id, o.mem_name, o.product_name); } catch {}
            }
          }
        }
      } catch (error) {
        console.error('Delivery Tracker delivered sync error:', error);
      }

      // Delivery Tracker 연동(반품): 고객 반품 운송장이 있고 상태가 RETURN_APPLY인 경우 delivered면 RETURN_GET으로 변경
      try {
        const mapCourierToCarrierId = (code: string): string => {
          if (!code) return '';
          const upper = code.toUpperCase();
          if (upper === 'CJ') return 'kr.cjlogistics';
          if (upper === 'HANJIN') return 'kr.hanjin';
          if (upper === 'LOTTE') return 'kr.lotte';
          if (upper === 'EPOST') return 'kr.epost';
          if (upper === 'ROZEN' || upper === 'LOGEN') return 'kr.logen';
          return '';
        };

        // 조회 대상: RETURN_APPLY + 고객 운송장 존재
        const toCheckMap = new Map<string, { carrierId: string; trackingNumber: string }>();
        (rawOrders || [])
          .filter((o: any) => o?.order_status === 'RETURN_APPLY' && o?.customer_tracking_number)
          .forEach((o: any) => {
            const carrierId = mapCourierToCarrierId(o?.customer_courier_code || '');
            if (!carrierId) return;
            const trackingNumber = String(o.customer_tracking_number);
            const key = `${carrierId}::${trackingNumber}`;
            if (!toCheckMap.has(key)) {
              toCheckMap.set(key, { carrierId, trackingNumber });
            }
          });

        if (toCheckMap.size > 0) {
          const query = `
            query Track($carrierId: ID!, $trackingNumber: String!) {
              track(carrierId: $carrierId, trackingNumber: $trackingNumber) {
                state { id text }
                progresses { status { id text } }
              }
            }
          `;

          const checks = Array.from(toCheckMap.values()).map(({ carrierId, trackingNumber }) =>
            axios
              .post(`${process.env.REACT_APP_API_URL}/app/delivery-tracker/graphql`, { query, variables: { carrierId, trackingNumber } })
              .then((res) => ({ carrierId, trackingNumber, data: res.data }))
              .catch((err) => ({ carrierId, trackingNumber, error: err }))
          );

        const results = await Promise.all(checks);

        for (const r of results) {
          if ((r as any).error) continue;
          const stateId = (r as any).data?.data?.track?.state?.id || '';
          const progresses = (r as any).data?.data?.track?.progresses || [];
          const delivered = stateId === 'delivered' || (Array.isArray(progresses) && progresses.some((p: any) => p?.status?.id === 'delivered'));
          if (!delivered) continue;

          // 동일 운송장/택배사의 반품 접수 주문을 RETURN_GET으로 변경
          const target = (rawOrders || []).filter((o: any) => {
            const carrierId = mapCourierToCarrierId(o?.customer_courier_code || '');
            return (
              o?.order_status === 'RETURN_APPLY' &&
              o?.customer_tracking_number && String(o.customer_tracking_number) === (r as any).trackingNumber &&
              carrierId === (r as any).carrierId
            );
          });
          for (const o of target) {
            await fn_updateOrderStatus(o.order_detail_app_id, 'RETURN_GET');
          }
        }
        }
      } catch (error) {
        console.error('Delivery Tracker return sync error:', error);
      }
    } catch (err) {
      console.error("주문 목록 로딩 오류:", err);
    } finally {
    }
  };

  // 굿스플로 반품/교환(수거) 조회: return_goodsflow_id → 고객 송장/택배사 동기화 (렌더링 후 별도 수행)
  const syncReturnExchangeFromGoodsflow = async () => {
    try {
      if (!user || !user.index) return;
      const rows: any[] = (orderList || []).flatMap((o: any) => Array.isArray(o?.products) && o.products.length > 0 ? o.products : [o]);
      const candidates = rows.filter((r: any) => {
        const s = String(r?.order_status || '').toUpperCase();
        const hasReturnGfId = String(r?.return_goodsflow_id || '').trim() !== '';
        const needCustomerTracking = !String(r?.customer_tracking_number || '').trim() || !String(r?.customer_courier_code || '').trim();
        const isReturn = s.startsWith('RETURN_');
        const isExchangeApply = s === 'EXCHANGE_APPLY';
        return hasReturnGfId && needCustomerTracking && (isReturn || isExchangeApply);
      });
      
      const serviceIds: string[] = Array.from(new Set(candidates.map((r: any) => String(r?.return_goodsflow_id || '').trim()).filter((v: string) => v !== '')));
      if (serviceIds.length === 0) return;
      const gfRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/app/goodsflow/shipping/deliveries/${serviceIds.join(',')}`,
        { params: { idType: 'serviceId' } }
      );
      const deliveries = gfRes?.data?.data || [];
      const sidToDetailIds = new Map<string, number[]>();
      (candidates || []).forEach((r: any) => {
        const sid = String(r?.return_goodsflow_id || '').trim();
        const did = Number(r?.order_detail_app_id);
        if (sid && !isNaN(did)) {
          if (!sidToDetailIds.has(sid)) sidToDetailIds.set(sid, []);
          sidToDetailIds.get(sid)!.push(did);
        }
      });
      const mapTransporterToCourier = (t: string): string => {
        const u = String(t || '').toUpperCase();
        if (u === 'KOREX') return 'CJ';
        return u;
      };
      const updates: Array<{ detailId: number; invoiceNo: string; courier: string }> = [];
      const updateCalls = (deliveries || [])
        .filter((d: any) => d?.invoiceNo && d?.id && sidToDetailIds.has(d.id))
        .flatMap((d: any) => {
          const targetIds = sidToDetailIds.get(d.id)!;
          const invoiceNo = String(d.invoiceNo);
          const courier = mapTransporterToCourier(d?.transporter || d?.transporterCode || '');
          targetIds.forEach((id) => updates.push({ detailId: id, invoiceNo, courier }));
          return targetIds.map((detailId) => axios.post(
            `${process.env.REACT_APP_API_URL}/app/memberReturnApp/updateReturnCustomerTrackingNumber`,
            {
              order_detail_app_id: [detailId],
              customer_tracking_number: invoiceNo,
              userId: user.index,
            }
          ));
        });
      if (updateCalls.length === 0) return;
      await Promise.allSettled(updateCalls);
      const byDetailId = new Map<number, { invoiceNo: string; courier: string }>();
      updates.forEach(u => byDetailId.set(u.detailId, { invoiceNo: u.invoiceNo, courier: u.courier }));
      setOrderList((prev) => {
        const apply = (row: any): any => {
          const did = Number(row?.order_detail_app_id);
          if (!isNaN(did) && byDetailId.has(did)) {
            const u = byDetailId.get(did)!;
            return {
              ...row,
              customer_tracking_number: u.invoiceNo,
              customer_courier_code: u.courier || row.customer_courier_code,
            };
          }
          return row;
        };
        return (prev || []).map((o: any) => Array.isArray(o?.products) && o.products.length > 0 ? { ...o, products: o.products.map(apply) } : apply(o));
      });
    } catch (err) {
      console.error('syncReturnExchangeFromGoodsflow error:', err);
    }
  };

  // 렌더링 후(데이터 로드 후) 별도 동기화 수행
  useEffect(() => {
    if (!user || !user.index) return;
    syncReturnExchangeFromGoodsflow();
  }, [user?.index, orderList]);
  
  // 메모 편집 팝업 열기
  const handleEditMemo = (orderId: number, currentMemo: string) => {
    setEditingOrderId(orderId);
    const targetOrder = orderList.find(order => order.order_app_id === orderId);
    const memoText = (targetOrder?.memo_del_yn === 'Y') ? "" : (currentMemo || "");
    setMemoText(memoText);
    setIsEditMemoOpen(true);
  };

  // 메모 삭제 확인 팝업 열기
  const handleDeleteMemo = (orderId: number) => {
    setDeletingOrderId(orderId);
    setIsDeleteMemoOpen(true);
  };
  
  // 메모 수정
  const fn_modifyMemo = async (orderId: number, memoCheckYn: string | undefined, memoDelYn: string | undefined) => {
    try {
      const requestData: any = {
        order_app_id: orderId,
        userId: user.index,
      };

      if (memoCheckYn !== undefined) {
        requestData.memo_check_yn = memoCheckYn;
      } else  {
         requestData.order_memo = memoText;
       }

      if (memoDelYn !== undefined) {
        requestData.memo_del_yn = memoDelYn;
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/memberOrderApp/updateMemberOrderAppMemo`,
        requestData
      );

      if (memoCheckYn === undefined && memoDelYn === undefined) {
        await fn_memberOrderAppListInternal(false);
      } else {
        setOrderList(prev => prev.map(order => {
          if (order.order_app_id === orderId) {
            if (memoCheckYn !== undefined) {
              return { ...order, memo_check_yn: memoCheckYn };
            } else if (memoDelYn !== undefined) {
              return { ...order, memo_del_yn: 'Y' };
            }
          }
          return order;
        }));
      }

      if (memoCheckYn === undefined && memoDelYn === undefined) {
        setIsEditMemoOpen(false);
        setEditingOrderId(null);
        setMemoText("");
      } else if (memoDelYn !== undefined) {
        setIsDeleteMemoOpen(false);
        setDeletingOrderId(null);
      }
    } catch (error) {
      console.error("메모 저장 오류:", error);
    }
  };
  
  // 주문상태 변경
  const fn_updateOrderStatus = async (orderDetailAppId: number, orderStatus: string) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/memberOrderApp/updateOrderStatus`,
        {
          order_detail_app_id: orderDetailAppId,
          order_status: orderStatus,
          userId: user.index,
        }
      );
    }
    catch (error) {
      console.error("주문상태 변경 오류:", error);
    }
  };
  
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
  
  return (
    <>
      <div className="flex justify-between items-center mt-4 mb-6">
        <h2 className="text-xl font-semibold">주문 관리</h2>
      </div>

      {/* 주문 상태 탭 */}
      <div className="mb-4 bg-white rounded-lg shadow-sm p-2">
        <div>
          {orderCountList.map((count: any, idx: any) => (
            <div key={idx} className="flex items-center space-x-2 overflow-x-auto whitespace-nowrap">
              {/* 전체 */}
              <div
                className="flex items-center gap-1 px-3 py-1 text-gray-700 text-sm cursor-pointer group"
                onClick={() => {
                  setActiveTab('TOTAL_COUNT');
                  setActiveTabCount(count.TOTAL_COUNT);
                }}
              >
                <p className={`group-hover:font-bold ${activeTab === 'TOTAL_COUNT' ? 'font-bold' : ''}`}>전체</p>
                <p
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${activeTab === 'TOTAL_COUNT' ? 'text-white' : 'text-gray-600'}`}
                  style={{ backgroundColor: activeTab === 'TOTAL_COUNT' ? '#15181E' : '#E5E7EB' }}
                >
                  {count.TOTAL_COUNT || 0}
                </p>
              </div>

              {/* 공통코드 기반 상태 탭 */}
              {orderStatusCodeList
                .filter((code) => ['PAYMENT_COMPLETE', 'SHIPPINGING', 'SHIPPING_COMPLETE', 'CANCEL_APPLY', 'RETURN_APPLY', 'PURCHASE_CONFIRM'].includes(code.common_code))
                .map((code) => (
                <div
                  key={code.common_code}
                  className="flex items-center gap-1 px-3 py-1 text-gray-700 text-sm cursor-pointer group"
                  onClick={() => {
                    setActiveTab(code.common_code);
                    setActiveTabCount((count as any)[code.common_code] || 0);
                  }}
                >
                  <p className={`group-hover:font-bold ${activeTab === code.common_code ? 'font-bold' : ''}`}>{code.common_code_name}</p>
                  <p
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${activeTab === code.common_code ? 'text-white' : 'text-gray-600'}`}
                    style={{ backgroundColor: activeTab === code.common_code ? '#15181E' : '#E5E7EB' }}
                  >
                    {(count as any)[code.common_code] || 0}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div className="flex justify-start items-center mb-6">
            <h3 className="text-lg font-semibold">
              {activeTab === 'TOTAL_COUNT'
                ? '전체'
                : (orderStatusCodeList.find((c) => c.common_code === activeTab)?.common_code_name || '')}
            </h3>
            <p className="text-sm font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-xl ml-2">{activeTabCount}</p>
          </div>

          <div className="relative">
            <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2 w-80">
              <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="이름, 연락처, 주문번호, 송장번호" 
                className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-500 focus:outline-none"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    fn_memberOrderAppListInternal(false);
                  }
                }}
              />
            </div>
          </div>
        </div>

        {orderList.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>등록된 주문 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="w-full border-b border-gray-200">
                  <th className="text-left flex items-center gap-2 py-4 w-1/5">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4"
                      onChange={(e) => handleAllCheck(e.target.checked)}
                      checked={allChecked}
                    />
                    <p className="text-sm" style={{color: "#717680"}}>주문</p>
                  </th>
                  <th className="text-left w-2/5 text-sm" style={{color: "#717680"}}>품목·배송지</th>
                  <th className="text-left w-1/5 text-sm" style={{color: "#717680"}}><p className="pl-4">결제 정보</p></th>
                  <th className="text-left w-1/5 text-sm" style={{color: "#717680"}}>메모</th>
                </tr>
              </thead>
              <tbody>
                {orderList.map((order, index) => {
                  return (
                    <tr
                      key={order.order_detail_app_id}
                      className="border-b border-gray-200 h-full"
                      style={{ height: 'auto' }}
                    > 
                      {/* 주문 정보 */}
                      <td className="w-1/5 h-full align-top py-4" onClick={(e) => e.stopPropagation()}>
                        <div>
                          <div className="font-medium text-blue-600 cursor-pointer hover:underline flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="form-checkbox h-4 w-4"
                              checked={checkedItems[index] || false}
                              onChange={(e) =>
                                handleIndividualCheck(index, e.target.checked)
                              }
                            />
                            <div 
                              className="flex items-center gap-2 cursor-pointer group"
                              onClick={() => {
                                const enhancedOrder = {
                                  ...order,
                                  products: order.products
                                    ? order.products.map((product: any) => ({
                                        ...product,
                                        product_image:
                                          productImages.find(
                                            (img) => img.productAppId === product.product_app_id
                                          )?.imageUrl || product.product_image || ''
                                      }))
                                    : order.products
                                };
                                navigate(`/app/memberOrderApp/detail/${order.order_app_id}`, {
                                  state: { orderDetail: enhancedOrder }
                                });
                              }}
                            >
                              <svg className="w-4 h-4 text-gray-400 group-hover:hidden" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                              </svg>
                              <svg 
                                className="w-4 h-4 text-gray-600 hidden group-hover:block" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(`${order.order_dt}${order.order_app_id}`);
                                  setIsToastVisible(true);
                                }}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                              </svg>
                              <p 
                                className="text-sm hover:underline" 
                                style={{color: "#000"}}
                              >
                                {order.order_dt}{order.order_app_id}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 mt-3">
                            {order.order_dt?.substring(0, 4)}년 {order.order_dt?.substring(4, 6)}월 {order.order_dt?.substring(6, 8)}일 {order.order_dt?.substring(8, 10)}시 {order.order_dt?.substring(10, 12)}분
                          </div>
                          <div className="text-sm mt-3">{order.mem_name}</div>
                        </div>
                      </td>
                      
                      <td className="w-2/5 py-4 h-full align-top">
                        <div className="flex items-center space-x-2">
                          {(() => {
                            const hasAnyPaymentComplete = order?.products
                              ? order.products.some((p: any) => p?.order_status === 'PAYMENT_COMPLETE')
                              : order?.order_status === 'PAYMENT_COMPLETE';
                            const allShippingComplete = order?.products
                              ? order.products.every((p: any) => p?.order_status === 'SHIPPING_COMPLETE')
                              : order?.order_status === 'SHIPPING_COMPLETE';
                            if (hasAnyPaymentComplete) {
                              return (
                                <>
                                  <img src={blueI} alt="blueIcon" className="w-4 h-4" />
                                  <span className="text-sm font-bold">배송필요</span>
                                </>
                              );
                            }
                            if (allShippingComplete) {
                              return (
                                <>
                                  <img src={grayI} alt="grayIcon" className="w-4 h-4" />
                                  <span className="text-sm font-bold">주문 처리 완료</span>
                                </>
                              );
                            }
                            return <></>;
                          })()}
                        </div>
                        
                        {/* 상품 정보: order_group 기준 동일 카드 내 섹션 분리 */}
                        {order.products && order.products.length > 0 && (() => {
                          const groupMap = new Map<number, any[]>();
                          order.products.forEach((p: any) => {
                            const g = Number(p?.order_group) || 1;
                            if (!groupMap.has(g)) groupMap.set(g, []);
                            groupMap.get(g)!.push(p);
                          });
                          const groups = Array.from(groupMap.entries()).sort((a, b) => a[0] - b[0]);
                          return groups.map(([groupNo, groupItems], idx) => {
                            const groupFirst = groupItems[0] || {} as any;
                            const groupStatus = String(groupFirst?.order_status || '');
                            const statusUpper = String(groupStatus).toUpperCase();
                            const useCompanyTracking = statusUpper === 'EXCHANGE_PAYMENT_COMPLETE' || statusUpper === 'EXCHANGE_SHIPPINGING' || statusUpper === 'EXCHANGE_SHIPPING_COMPLETE';
                            const groupTracking = useCompanyTracking
                              ? (groupFirst?.company_tracking_number || '')
                              : (groupFirst?.tracking_number || '');
                            const groupCourier = useCompanyTracking
                              ? (groupFirst?.company_courier_code || '')
                              : (groupFirst?.order_courier_code || groupFirst?.courier_code || '');
                            const groupHasOOS = groupItems.some((p: any) => p?.quantity == 0);
                            const groupOrderIds = groupItems.map((p: any) => p.order_detail_app_id).filter(Boolean);
                            const isGoodsflowInitiated = groupItems.some((p: any) => goodsflowInitiatedOrderIds.includes(p.order_detail_app_id));
                            const groupHasGoodsflowId = groupItems.some((p: any) => {
                              const id = p?.goodsflow_id;
                              return (typeof id === 'string' && id.trim() !== '') || (typeof id === 'number' && !isNaN(id));
                            });
                            const hasReturnStatus = groupItems.some((p: any) => ['RETURN_APPLY', 'RETURN_GET'].includes(String(p?.order_status || '')));
                            const hasExchangeStatus = groupItems.some((p: any) => ['EXCHANGE_APPLY', 'EXCHANGE_GET'].includes(String(p?.order_status || '')));
                            const hasCancelApply = groupItems.some((p: any) => String(p?.order_status || '') === 'CANCEL_APPLY');
                            
                            return (
                              <div key={`order-${order.order_app_id}-group-${groupNo}-wrap`}>
                                {hasCancelApply && (
                                  <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" shapeRendering="crispEdges">
                                      <path d="M12 3l9 16H3l9-16z" />
                                    </svg>
                                    <span className="text-sm font-bold">취소 필요</span>
                                  </div>
                                )}
                                {hasReturnStatus && (
                                  <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" shapeRendering="crispEdges">
                                      <path d="M12 3l9 16H3l9-16z" />
                                    </svg>
                                    <span className="text-sm font-bold">반품 필요</span>
                                  </div>
                                )}
                                {hasExchangeStatus && (
                                  <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" shapeRendering="crispEdges">
                                      <path d="M12 3l9 16H3l9-16z" />
                                    </svg>
                                    <span className="text-sm font-bold">교환 필요</span>
                                  </div>
                                )}

                                <div key={`order-${order.order_app_id}-group-${groupNo}`} className={`flex items-center mt-2 mb-2 space-x-2 border border-gray-200 p-4 rounded-lg ${idx > 0 ? 'mt-3' : ''}`}>
                                  <div className="text-sm w-full">
                                    <div>
                                      <p className="text-sm font-bold">
                                        {orderStatusCodeList.find(c => c.common_code === String(groupStatus || ''))?.common_code_name || ''}
                                      </p>
                                    </div>

                                    {groupHasOOS && groupItems.map((product: any, i: number) => (
                                      product.quantity == 0 && (
                                        <div key={`oos-${groupNo}-${i}`}>
                                          <div className="mt-2 bg-gray-100 px-2 py-1 flex items-center gap-2">
                                            <p className="border border-gray-400 rounded-full p-1"><span className="text-xs text-gray-400 w-2 h-2 flex items-center justify-center">i</span></p>
                                            <p className="text-xs font-semibold">{product.option_amount} {product.option_unit} {product.option_gender == 'W' ? '여성' : product.option_gender == 'M' ? '남성' : '공용'} 품절</p>
                                          </div>
                                        </div>
                                      )
                                    ))}

                                    <div className="mt-2 pl-2" style={{borderLeft: '4px solid #E2E5E9'}}>
                                      {groupStatus?.toUpperCase().includes('CANCEL') ? (
                                        <div className="flex items-center gap-2 bg-gray-50 p-2">
                                          <p className="text-sm mb-1 border border-gray-500 rounded-full p-1"><span className="text-xs text-gray-400 w-2 h-2 flex items-center justify-center">i</span></p>
                                          <p className="text-sm mb-1 font-semibold">
                                            {(() => {
                                              const groupReasonType = groupItems.map((p: any) => p?.return_reason_type).find((v: any) => v != null && String(v).trim() !== '') || (order as any)?.return_reason_type;
                                              return getReturnReasonName(String(groupReasonType));
                                            })() || '-'}
                                          </p>
                                        </div>
                                      ) : String(groupStatus || '').toUpperCase() === 'EXCHANGE_APPLY' ? (
                                        (() => {
                                          const exCustomerTracking = (() => {
                                            const vals = Array.from(new Set(groupItems.map((p: any) => String(p?.customer_tracking_number || '').trim()).filter((v: string) => v !== '')));
                                            return vals[0] || '';
                                          })();
                                          const exCustomerCourier = (() => {
                                            const vals = Array.from(new Set(groupItems.map((p: any) => String(p?.customer_courier_code || '').trim()).filter((v: string) => v !== '')));
                                            return vals[0] || '';
                                          })();
                                          const hasReturnGfId = groupItems.some((p: any) => String(p?.return_goodsflow_id || '').trim() !== '');
                                          if (exCustomerTracking && exCustomerCourier) {
                                            return (
                                              <div className="flex items-center gap-2">
                                                <p className="text-sm mb-1">
                                                  {deliveryCompanyList.find(company => company.common_code === exCustomerCourier)?.common_code_name || exCustomerCourier}
                                                  {exCustomerTracking ? ' ' + exCustomerTracking : '-'}
                                                </p>
                                                <a href={`https://search.naver.com/search.naver?where=nexearch&sm=top_sug.pre&fbm=0&acr=1&acq=%ED%83%9D%EB%B0%B0+&qdt=0&ie=utf8&query=%ED%83%9D%EB%B0%B0+%EB%B0%B0%EC%86%A1%EC%A1%B0%ED%9A%8C&ackey=gkzogb1b`} target="_blank" rel="noopener noreferrer">
                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                  </svg>
                                                </a>
                                              </div>
                                            );
                                          }
                                          if (hasReturnGfId) {
                                            return (
                                              <div className="flex items-center gap-2">
                                                <div className="text-sm mb-1 font-semibold" style={{ color: '#0090D4' }}>
                                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-7 text-blue-400">
                                                    <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h.375a3 3 0 1 1 6 0h3a.75.75 0 0 0 .75-.75V15Z" />
                                                    <path d="M8.25 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0ZM15.75 6.75a.75.75 0 0 0-.75.75v11.25c0 .087.015.17.042.248a3 3 0 0 1 5.958.464c.853-.175 1.522-.935 1.464-1.883a18.659 18.659 0 0 0-3.732-10.104 1.837 1.837 0 0 0-1.47-.725H15.75Z" />
                                                    <path d="M19.5 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
                                                  </svg>
                                                </div>
                                                <span className="text-sm mb-1 font-semibold" style={{ color: '#0090D4' }}>
                                                  반품 송장 정보를 받아오는중입니다
                                                </span>
                                              </div>
                                            );
                                          }
                                          return null;
                                        })()
                                      ) : String(groupStatus || '').toUpperCase() === 'EXCHANGE_PAYMENT_COMPLETE' ? (
                                        (() => {
                                          const exCompanyTracking = (() => {
                                            const vals = Array.from(new Set(groupItems.map((p: any) => String(p?.company_tracking_number || '').trim()).filter((v: string) => v !== '')));
                                            return vals[0] || '';
                                          })();
                                          const exCompanyCourier = (() => {
                                            const vals = Array.from(new Set(groupItems.map((p: any) => String(p?.company_courier_code || '').trim()).filter((v: string) => v !== '')));
                                            return vals[0] || '';
                                          })();
                                          if (exCompanyTracking && exCompanyCourier) {
                                            return (
                                              <div className="flex items-center gap-2">
                                                <p className="text-sm mb-1">
                                                  {deliveryCompanyList.find(company => company.common_code === exCompanyCourier)?.common_code_name || exCompanyCourier}
                                                  {exCompanyTracking ? ' ' + exCompanyTracking : '-'}
                                                </p>
                                                <a href={`https://search.naver.com/search.naver?where=nexearch&sm=top_sug.pre&fbm=0&acr=1&acq=%ED%83%9D%EB%B0%B0+&qdt=0&ie=utf8&query=%ED%83%9D%EB%B0%B0+%EB%B0%B0%EC%86%A1%EC%A1%B0%ED%9A%8C&ackey=gkzogb1b`} target="_blank" rel="noopener noreferrer">
                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                  </svg>
                                                </a>
                                              </div>
                                            );
                                          }
                                          // 회사 송장/택배사 중 하나라도 없으면 수동 입력 노출
                                          return (
                                            <p className="text-sm font-semibold" style={{ color: '#0090D4' }}>
                                              <span
                                                className="cursor-pointer"
                                                onClick={() => {
                                                  const orderDetailAppIds = groupOrderIds.length > 0 ? groupOrderIds : [order.order_detail_app_id];
                                                  setSelectedOrderDetailAppId(orderDetailAppIds);
                                                  setPopupMode('input');
                                                  setIsInvoicePopupOpen(true);
                                                  setIsExchangePaymentCompleteForPopup(false);
                                                }}
                                              >
                                                송장번호 입력 +
                                              </span>
                                            </p>
                                          );
                                        })()
                                      ) : groupTracking ? (
                                        <div className="flex items-center gap-2">
                                          <p className="text-sm mb-1">
                                            {deliveryCompanyList.find(company => company.common_code === groupCourier)?.common_code_name || groupCourier}
                                            {groupTracking ? ' ' + groupTracking : '-'}
                                          </p>
                                          <a href={`https://search.naver.com/search.naver?where=nexearch&sm=top_sug.pre&fbm=0&acr=1&acq=%ED%83%9D%EB%B0%B0+&qdt=0&ie=utf8&query=%ED%83%9D%EB%B0%B0+%EB%B0%B0%EC%86%A1%EC%A1%B0%ED%9A%8C&ackey=gkzogb1b`} target="_blank" rel="noopener noreferrer">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                          </a>
                                        </div>
                                      ) : (
                                        (() => {
                                          if (
                                            order.order_status === 'CANCEL_COMPLETE' ||
                                            groupHasOOS ||
                                            groupStatus?.toUpperCase().includes('CANCEL') ||
                                            groupStatus?.toUpperCase() === 'HOLD'
                                          ) {
                                            return null;
                                          }
                                          if (groupHasGoodsflowId || isGoodsflowInitiated) {
                                            return (
                                              <div className="flex items-center gap-2">
                                                <div className="text-sm mb-1 font-semibold" style={{ color: '#0090D4' }}>
                                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-7 text-blue-400">
                                                    <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h.375a3 3 0 1 1 6 0h3a.75.75 0 0 0 .75-.75V15Z" />
                                                    <path d="M8.25 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0ZM15.75 6.75a.75.75 0 0 0-.75.75v11.25c0 .087.015.17.042.248a3 3 0 0 1 5.958.464c.853-.175 1.522-.935 1.464-1.883a18.659 18.659 0 0 0-3.732-10.104 1.837 1.837 0 0 0-1.47-.725H15.75Z" />
                                                    <path d="M19.5 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
                                                  </svg>
                                                </div>
                                                <span className="text-sm mb-1 font-semibold" style={{ color: '#0090D4' }}>
                                                  굿스플로에서 송장번호를 받아오고 있습니다<br/>
                                                  (송장 출력을 하지 않았다면 송장삭제를 해주세요)
                                                </span>
                                              </div>
                                            );
                                          }
                                          return (
                                            <p className="text-sm font-semibold" style={{ color: '#0090D4' }}>
                                              <span
                                                className="cursor-pointer"
                                                onClick={() => {
                                                  const orderDetailAppIds = groupOrderIds.length > 0 ? groupOrderIds : [order.order_detail_app_id];
                                                  setSelectedOrderDetailAppId(orderDetailAppIds);
                                                  setPopupMode('input');
                                                  setIsInvoicePopupOpen(true);
                                                  setIsExchangePaymentCompleteForPopup(true);
                                                }}
                                              >
                                                송장번호 입력 +
                                              </span>
                                            </p>
                                          );
                                        })()
                                      )}
                                      {/* 주소 표시는 상품별 영역에서 출력 */}
                                    </div>

                                    <div>
                                      {groupItems.map((product: any, productIndex: number) => (
                                        <div key={`prod-${product.order_detail_app_id ?? `${order.order_app_id}-${groupNo}-${productIndex}`}` }>
                                          <div className="mb-4 border-l-4 border-gray-200 pl-2 pt-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <p className="text-xs font-medium">{product?.receiver_name ? product.receiver_name : '-'}</p>
                                              <p className="text-xs text-gray-500">{product?.receiver_phone ? product.receiver_phone : '-'}</p>
                                            </div>
                                            <p className="text-xs">{product?.zip_code ? '(' + product.zip_code + ')' : '(-)'} {product?.address ? product.address : '-'}{product?.address_detail ? ' ' + product.address_detail : ''}</p>
                                            <p className="text-xs text-gray-500">{product?.delivery_request ? product.delivery_request : '-'}</p>
                                          </div>
                                          <div className="flex items-start justify-between mb-3 last:mb-0">
                                            <div className="flex items-start justify-between">
                                              <img src={productImages.find(img => img.productAppId === product.product_app_id)?.imageUrl} alt="상품 이미지" className="w-12 h-12" />
                                              <div className="ml-4">
                                                <p className="text-xs text-gray-500">{product.order_dt}{product.order_app_id}-{product.product_detail_app_id || '00'}</p>
                                                <p className="font-medium">{product.product_name}</p>
                                                <p className="inline-block font-bold text-xs bg-gray-200 px-2 py-1 rounded-lg mt-2">{product.option_amount} {product.option_unit} {product.option_gender == 'W' ? '여성' : '남성'}</p>
                                              </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                              <p>x {product.order_quantity}</p>
                                              <p className="font-medium ml-4">{product.original_price.toLocaleString()} 원</p>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </td>
                      
                      {/* 배송지 / 결제정보 */}
                      <td className="w-1/5 p-4 align-top h-full">
                        <div className="p-4 rounded-lg" style={{backgroundColor: "#F5F5F5"}}>
                          <div className="flex items-center justify-between">
                            <p className="text-sm">결제 금액</p>
                            <p className="text-sm font-medium">{order?.payment_amount ? Number(order?.payment_amount)?.toLocaleString() : 0} 원</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">상품 금액</p>
                            <p className="text-sm text-gray-500">{(order?.original_price * order?.add_order_quantity)?.toLocaleString()} 원</p>
                          </div>
                          {/* {(order?.free_shipping_amount >= order?.payment_amount) && (
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-500">배송비</p>
                              <p className="text-sm text-gray-500">{order?.delivery_fee?.toLocaleString()} 원</p>
                            </div>
                          )} */}
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">할인</p>
                            <p className="text-sm text-gray-500">-{((order?.original_price * order?.add_order_quantity) * (order?.discount / 100)).toLocaleString()} 원</p>
                          </div>
                          {Number(order?.point_use_amount) !== 0 &&
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-500">적립금</p>
                              <p className="text-sm text-gray-500">{Number(order?.point_use_amount) > 0 ? '-' : ''}{Number(order?.point_use_amount)?.toLocaleString()} 원</p>
                            </div>
                          }
                          {Number(order?.coupon_discount_amount) !== 0 &&
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-500">쿠폰</p>
                              <p className="text-sm text-gray-500">
                                {Number(order?.coupon_discount_amount) > 0 ? '-' : ''}
                                {order?.coupon_discount_type === 'PERCENT' ? Number((Number(order?.coupon_discount_amount) * 1/100) * ( (order?.original_price * order?.add_order_quantity) * (order?.discount / 100))).toLocaleString() : Number(order?.coupon_discount_amount).toLocaleString()} 원
                              </p>
                            </div>
                          }
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">환불</p>
                            <p className="text-sm text-gray-500">{order?.refund_amount ? -Number(order?.refund_amount)?.toLocaleString() : '0'} 원</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">결제수단</p>
                            <p className="text-sm text-gray-500">{order.card_name? order.card_name : '앱 포인트'}</p>
                          </div>
                        </div>
                      </td>
                      
                      {/* 메모 */}
                      <td className="w-1/5 p-4 align-top hover:bg-gray-50" style={{ height: '100%' }}>
                        <div className="p-4 rounded-lg flex items-start min-h-full group" style={{backgroundColor: order.order_memo && order?.memo_del_yn === 'N' ? "#F5F5F5" : "transparent", height: '100%'}}>
                            {(order?.order_memo && order?.memo_del_yn === 'N') ? (
                              <div className="w-full">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm w-full font-bold">{user?.usr_name}</p>
                                  <div className="py-1 rounded-lg w-20 text-center group-hover:hidden" style={{backgroundColor: order?.memo_check_yn === 'Y' ? '#F8F9FB' : '#FFFBD8'}}>
                                    <p className="text-xs font-bold" style={{color: order?.memo_check_yn === 'Y' ? '#717680' : '#E28100'}}>{order?.memo_check_yn === 'Y' ? '해결' : '미해결'}</p>
                                  </div>
                                  <div className="hidden group-hover:flex items-center gap-4 mr-4">
                                    <button
                                      type="button"
                                      className="p-0 border-0 bg-transparent cursor-pointer flex-shrink-0"
                                      onClick={() => fn_modifyMemo(order.order_app_id, order.memo_check_yn === 'Y' ? 'N' : 'Y', undefined)}
                                      aria-label={order.memo_check_yn === 'Y' ? '미해결로 변경' : '해결로 변경'}
                                    >
                                      {
                                        order.memo_check_yn === 'Y' ? (
                                          <div className="w-4 h-4 flex-shrink-0" style={{backgroundColor: "#40B649", borderRadius: "50%"}} />
                                        ) : (
                                          <img src={checkGray} alt="" className="w-4 h-4 flex-shrink-0" />
                                        )
                                      }
                                    </button>
                                    <button 
                                      type="button"
                                      className="p-0 border-0 bg-transparent cursor-pointer flex-shrink-0"
                                      onClick={() => handleEditMemo(order.order_app_id, order.order_memo)}
                                      aria-label="메모 편집"
                                    >
                                      <img src={penGray} alt="" className="w-4 h-4 flex-shrink-0" />
                                    </button>
                                    <button 
                                      type="button"
                                      className="p-0 border-0 bg-transparent cursor-pointer flex-shrink-0"
                                      onClick={() => handleDeleteMemo(order.order_app_id)}
                                      aria-label="메모 삭제"
                                    >
                                      <img src={trashGray} alt="" className="w-4 h-4 flex-shrink-0" />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-xs w-full font-bold">{order?.order_memo_dt}</p>
                                <p className="text-sm w-full mt-2">{order?.order_memo}</p>
                              </div>
                            ) : (    
                              <div className="flex items-center gap-2 w-full">
                                <p className="text-sm w-full">메모없음</p>
                                <img src={editGray} alt="editGrayIcon" className="w-4 h-4 cursor-pointer hidden group-hover:block" onClick={() => handleEditMemo(order.order_app_id, order.order_memo)}/>
                              </div>
                            )}
                        </div>
                      </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
        
        {/* 페이지네이션 */}
        {totalCount > 0 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalItems={totalCount}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {/* 주문처리 버튼 - 체크박스 선택 시에만 표시 */}
      {checkedItems.some(checked => checked) && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-40">
          <div className="flex items-center justify-center max-w-7xl mx-auto">
            <div className="flex items-center gap-4 bg-black p-3 rounded-lg">
              <div className="relative">
                <button 
                  onClick={() => {
                    setIsOrderProcessOpen(!isOrderProcessOpen);
                    setIsOrderPrintOpen(false);
                  }}
                  className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50"
                >
                  <span className="text-sm font-bold">주문처리</span>
                  <svg className={`w-4 h-4 transition-transform ${isOrderProcessOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              
                {/* 드롭다운 메뉴 */}
                {isOrderProcessOpen && (
                <div className="absolute bottom-full right-2 mb-5 bg-gray-800 rounded-lg shadow-lg z-50 min-w-40" style={{backgroundColor: '#15181E'}}>
                  <div className="py-2">
                    {(() => {
                      const selectedOrders = getSelectedOrdersFromChecks();
                      const selectedOrderIds = getSelectedOrderIdsFromChecks();
                      

                      const allPaymentComplete = selectedOrders.every(order => {
                        if (order?.products) {
                          return order.products.every((product: any) => product.order_status === 'PAYMENT_COMPLETE');
                        } else {
                          return order?.order_status === 'PAYMENT_COMPLETE';
                        }
                      });

                      // 모든 선택된 주문이 배송완료 상태인지 확인
                      const allShippingComplete = selectedOrders.every(order => {
                        if (order?.products) {
                          return order.products.every((product: any) => product.order_status === 'SHIPPING_COMPLETE');
                        } else {
                          return order?.order_status === 'SHIPPING_COMPLETE';
                        }
                      });
                      
                      // 모든 선택된 주문이 배송중 상태인지 확인
                      const allShipping = selectedOrders.every(order => {
                        if (order?.products) {
                          return order.products.every((product: any) => product.order_status === 'SHIPPINGING');
                        } else {
                          return order?.order_status === 'SHIPPINGING';
                        }
                      });

                      
                      const allHaveTrackingNumber = selectedOrders.every(order => {
                        if (order?.products) {
                          return order.products.every((product: any) => product.tracking_number && product.tracking_number.trim() !== '');
                        } else {
                          return order?.tracking_number && order.tracking_number.trim() !== '';
                        }
                      });
                      
                      // 굿스플로 ID가 모두 존재하는지 확인 (tracking_number 없이 goodsflow_id만 있는 경우 삭제 허용)
                      const allHaveGoodsflowId = selectedOrders.every(order => {
                        if (order?.products) {
                          return order.products.every((product: any) => {
                            const id = product.goodsflow_id;
                            return (typeof id === 'string' && id.trim() !== '') || (typeof id === 'number' && !isNaN(id));
                          });
                        } else {
                          const id = (order as any)?.goodsflow_id;
                          return (typeof id === 'string' && id.trim() !== '') || (typeof id === 'number' && !isNaN(id));
                        }
                      });

                      // RETURN_/EXCHANGE_ 상태 포함 여부
                      const anyReturnOrExchange = selectedOrders.some(order => {
                        const has = (o: any) => {
                          const s = String(o?.order_status || '').toUpperCase();
                          return s.startsWith('RETURN_') || s.startsWith('EXCHANGE_');
                        };
                        if (order?.products) {
                          return order.products.some((p: any) => has(p));
                        }
                        return has(order);
                      });
                      
                      return (
                        <>
                          <p className={`px-4 py-2 text-sm cursor-pointer text-white hover:bg-gray-700`} onClick={() => {
                            const selectedOrders = checkedItems
                              .map((checked, index) => checked ? orderList[index] : null)
                              .filter((order): order is Order => order !== null);

                            if(!allPaymentComplete) {
                              setErrorMessage({
                                title: '송장등록 처리할 수 없어요',
                                content: '배송대기 상태가 아니라면 처리할 수 없어요'
                              });
                              setIsErrorPopupOpen(true);
                              setIsOrderProcessOpen(false);
                              return;
                            }

                            if(allHaveTrackingNumber) {
                              setErrorMessage({
                                title: '송장등록 처리할 수 없어요',
                                content: '송장번호가 존재하여 처리할 수 없어요'
                              });
                              setIsErrorPopupOpen(true);
                              setIsOrderProcessOpen(false);
                              return;
                            }
                            
                            setSelectedOrdersForGoodsflow(selectedOrders);
                            setIsGoodsflowModalOpen(true);
                            setIsOrderProcessOpen(false);
                          }}>송장등록 - 굿스플로</p>
                          <p className={`px-4 py-2 text-sm cursor-pointer text-white hover:bg-gray-700`} onClick={async () => {
                            if (!allPaymentComplete || !(allHaveTrackingNumber || allHaveGoodsflowId)) {
                              setErrorMessage({ 
                                title: '송장번호를 삭제할 수 없어요', 
                                content: '송장번호를 삭제할 수 없어요' 
                              });
                              setIsErrorPopupOpen(true);
                              setIsOrderProcessOpen(false);
                              return;
                            }
                            
                            // 굿스플로 취소 API 함께 호출 (선택 주문의 goodsflow_id 기준)
                            try {
                              const serviceIds: string[] = Array.from(new Set(
                                (selectedOrders as any[])
                                  .flatMap((order: any) => order?.products ? order.products : [order])
                                  .map((o: any) => o?.goodsflow_id)
                                  .filter((id: any) => typeof id === 'string' && id.trim() !== '')
                              ));
                              if (serviceIds.length > 0) {
                                await axios.delete(`${process.env.REACT_APP_API_URL}/app/goodsflow/deliveries/cancel`, {
                                  data: {
                                    items: serviceIds.map((id: string) => ({ id, reasonType: 'OTHER_SERVICE', contents: '고객취소' }))
                                  }
                                });
                              }
                            } catch (err) {
                              console.error('Goodsflow cancel error:', err);
                            }

                            setSelectedOrderDetailAppId(selectedOrderIds as number[]);
                            setPopupMode('delete');
                            setIsInvoicePopupOpen(true);
                            setIsOrderProcessOpen(false);
                          }}>송장삭제</p>
                          <p className={`px-4 py-2 text-sm cursor-pointer text-white hover:bg-gray-700`} onClick={async () => {           
                            if (!allPaymentComplete) { 
                              setErrorMessage({ 
                                title: '배송보류를 설정할 수 없어요', 
                                content: '배송전 상태가 아니면 설정할 수 없어요' 
                              });
                              setIsErrorPopupOpen(true);
                              setIsOrderProcessOpen(false);
                              return;
                            }

                            for (const orderDetailAppId of selectedOrderIds) {
                              await fn_updateOrderStatus(orderDetailAppId, 'HOLD');
                            }
                            
                            fn_memberOrderAppListInternal(false);
                            setIsOrderProcessOpen(false);
                            setToastMessage('배송보류로 설정되었습니다');
                            setIsToastVisible(true);
                          }}>배송보류 설정</p>
                          <p className={`px-4 py-2 text-sm cursor-pointer text-white hover:bg-gray-700`} onClick={async () => {
                            const allHold = selectedOrders.every(order => {
                              if (order?.products) {
                                return order.products.every((product: any) => product.order_status === 'HOLD');
                              } else {
                                return order?.order_status === 'HOLD';
                              }
                            });
                            
                            if (!allHold) {
                              setErrorMessage({
                                title: '배송보류 해제할 수 없어요',
                                content: '배송보류 상태가 아니면 해제할 수 없어요.'
                              });
                              setIsErrorPopupOpen(true);
                              setIsOrderProcessOpen(false);
                              return;
                            }
                            
                            for (const orderId of selectedOrderIds) {
                              await fn_updateOrderStatus(orderId, 'PAYMENT_COMPLETE');
                            }
                            
                            fn_memberOrderAppListInternal(false);
                            setIsOrderProcessOpen(false);
                            setToastMessage('배송보류가 해제되었습니다');
                            setIsToastVisible(true);
                          }}>배송보류 해제</p>
                          <p className={`px-4 py-2 text-sm cursor-pointer text-white hover:bg-gray-700`} onClick={async () => {
                            if (anyReturnOrExchange || !allHaveTrackingNumber || allShippingComplete || allShipping) {
                              setErrorMessage({
                                title: '배송중 처리할 수 없어요',
                                content: '배송중 처리할 수 있어요.'
                              });
                              setIsErrorPopupOpen(true);
                              setIsOrderProcessOpen(false);
                              return;
                            }

                            for (const orderId of selectedOrderIds) {
                              await fn_updateOrderStatus(orderId, 'SHIPPINGING');
                            }

                            // 배송중 알림 발송 (선택 항목 기준)
                            try {
                              for (const order of selectedOrders) {
                                if (order?.products && Array.isArray(order.products)) {
                                  for (const p of order.products) {
                                    await sendShippingNotification(order.mem_id, order.mem_name, p.product_name);
                                  }
                                } else {
                                  await sendShippingNotification(order.mem_id, order.mem_name, (order as any).product_name);
                                }
                              }
                            } catch {}

                            fn_memberOrderAppListInternal(false);
                            setIsOrderProcessOpen(false);
                          }}>배송중 처리</p>
                          <p className={`px-4 py-2 text-sm cursor-pointer text-white hover:bg-gray-700`} onClick={async () => {
                            if (anyReturnOrExchange || !allHaveTrackingNumber || allShippingComplete) {
                              setErrorMessage({
                                title: '배송완료 처리할 수 없어요',
                                content: '배송완료 처리할 수 없어요'
                              });
                              setIsErrorPopupOpen(true);
                              setIsOrderProcessOpen(false);
                              return;
                            }

                            for (const orderId of selectedOrderIds) {
                              await fn_updateOrderStatus(orderId, 'SHIPPING_COMPLETE');
                            }

                            // 배송완료 알림 발송 (선택 항목 기준)
                            try {
                              for (const order of selectedOrders) {
                                if (order?.products && Array.isArray(order.products)) {
                                  for (const p of order.products) {
                                    await sendShippingCompleteNotification(order.mem_id, order.mem_name, p.product_name);
                                  }
                                } else {
                                  await sendShippingCompleteNotification(order.mem_id, order.mem_name, (order as any).product_name);
                                }
                              }
                            } catch {}

                            fn_memberOrderAppListInternal(false);
                            setIsOrderProcessOpen(false);
                          }}>배송완료 처리</p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              {/* <button 
                onClick={() => {
                  setIsOrderPrintOpen(!isOrderPrintOpen);
                  setIsOrderProcessOpen(false);
                }}
                className="p-2 rounded-lg bg-gray-800 text-white"
              >
                <svg className="w-4 h-4 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button> */}
                
              {/* 주문서 출력 드롭다운 메뉴 */}
              {/* {isOrderPrintOpen && (
              <div className="absolute bottom-full right-0 mb-7 bg-gray-800 rounded-lg shadow-lg z-50 min-w-32" style={{backgroundColor: '#15181E'}}>
                <div className="py-2">
                  <div 
                    className="px-4 py-2 text-white text-sm hover:bg-gray-700 cursor-pointer"
                    onClick={() => {
                      const selectedOrders = checkedItems
                        .map((checked, index) => checked ? orderList[index] : null)
                        .filter((order): order is Order => order !== null);
                      
                      if (selectedOrders.length > 0) {
                        setSelectedOrderForPrint(selectedOrders);
                        setIsOrderPrintModalOpen(true);
                        setIsOrderPrintOpen(false);
                      }
                    }}
                  >
                    주문서 출력
                  </div>
                </div>
              </div>
              )} */}
            </div>
          </div>
        </div>
      </div>)}

      {/* 메모 추가 팝업 */}
      {isEditMemoOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">메모 추가</h3>
            <div className="relative">
              <textarea
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                placeholder="입력해 주세요."
                className="w-full h-36 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-black"
                rows={5}
                maxLength={1000}
              />
              <div className="absolute bottom-2 right-3 text-xs text-gray-500">
                {memoText.length} / 1000
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setIsEditMemoOpen(false);
                  setEditingOrderId(null);
                  setMemoText("");
                }}
                className="px-4 py-2 text-gray-600 rounded hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => fn_modifyMemo(editingOrderId || 0, undefined, undefined)}
                className="px-4 py-2 text-white bg-black rounded hover:bg-black-600 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}  

      {/* 메모 삭제 확인 팝업 */}
      {isDeleteMemoOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold mb-4">메모를 삭제할까요?</h3>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setIsDeleteMemoOpen(false);
                  setDeletingOrderId(null);
                }}
                className="px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-500 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => fn_modifyMemo(deletingOrderId || 0, undefined, 'Y')}
                className="px-4 py-2 text-sm text-white rounded-lg hover:opacity-80 transition-colors"
                style={{backgroundColor: "#ED1515"}}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 송장번호 입력/삭제 팝업 */}
      <MemberOrderAppPopup
        isOpen={isInvoicePopupOpen}
        onClose={() => {
          setIsInvoicePopupOpen(false);
          setSelectedOrderDetailAppId(null);
        }}
        onCancel={() => {
          setIsInvoicePopupOpen(false);
          setSelectedOrderDetailAppId(null);
        }}
        orderDetailAppId={selectedOrderDetailAppId}
        userId={user?.index || null}
        onSuccess={async (_trackingNumber, _courierCode, actionType) => {
          try {
            if (actionType === 'shipping_process' && Array.isArray(selectedOrderDetailAppId) && selectedOrderDetailAppId.length > 0) {
              const idSet = new Set<number>(selectedOrderDetailAppId);
              for (const order of orderList) {
                if (Array.isArray(order?.products) && order.products.length > 0) {
                  for (const p of order.products as any[]) {
                    if (idSet.has(p?.order_detail_app_id)) {
                      await sendShippingNotification(order.mem_id, order.mem_name, p?.product_name);
                    }
                  }
                } else {
                  const odid = (order as any)?.order_detail_app_id;
                  if (idSet.has(odid)) {
                    await sendShippingNotification(order.mem_id, order.mem_name, (order as any)?.product_name);
                  }
                }
              }
            }
          } catch {}
          fn_memberOrderAppListInternal(false);
        }}
        mode={popupMode}
      />

      {/* 에러 팝업 */}
      {isErrorPopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-96 max-w-md mx-4">
            <h2 className="text-xl font-bold text-black mb-2">
              {errorMessage.title}
            </h2>
            <div className="bg-red-50 rounded-lg p-4 mt-5 mb-6">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-sm font-medium">{errorMessage.content}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setIsErrorPopupOpen(false)}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 주문서 출력 모달 */}
      <OrderPrintModal
        orderDetail={selectedOrderForPrint}
        isOpen={isOrderPrintModalOpen}
        onClose={() => {
          setIsOrderPrintModalOpen(false);
          setSelectedOrderForPrint(null);
        }}
      />

      {/* 굿스플로 연동 모달 */}
      <GoodsflowModal
        selectedOrders={selectedOrdersForGoodsflow}
        isOpen={isGoodsflowModalOpen}
        onClose={() => {
          setIsGoodsflowModalOpen(false);
          setSelectedOrdersForGoodsflow([]);
        }}
        onSuccess={async () => {
          try {
            // 1) 상태 SHIPPINGING으로 변경
            const detailIds: number[] = [];
            (selectedOrdersForGoodsflow || []).forEach((order: any) => {
              if (Array.isArray(order?.products) && order.products.length > 0) {
                order.products.forEach((p: any) => {
                  if (typeof p?.order_detail_app_id === 'number') detailIds.push(p.order_detail_app_id);
                });
              } else if (typeof order?.order_detail_app_id === 'number') {
                detailIds.push(order.order_detail_app_id);
              }
            });
            for (const id of detailIds) {
              await fn_updateOrderStatus(id, 'SHIPPINGING');
            }

            // 2) 배송중 알림 발송
            for (const order of selectedOrdersForGoodsflow) {
              if ((order as any)?.products && Array.isArray((order as any).products)) {
                for (const p of (order as any).products) {
                  await sendShippingNotification((order as any).mem_id, (order as any).mem_name, p?.product_name);
                }
              } else {
                await sendShippingNotification((order as any).mem_id, (order as any).mem_name, (order as any).product_name);
              }
            }
          } catch {}
          fn_memberOrderAppListInternal(false);
        }}
      />

      <CustomToastModal
        message={toastMessage}
        isVisible={isToastVisible}
        variant="success"
        onClose={() => setIsToastVisible(false)}
      />
    </>
  );
};

export default MemberOrderAppList;
