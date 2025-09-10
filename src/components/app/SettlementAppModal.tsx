import React, { useMemo, useState, useEffect } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import axios from "axios";
import { useUserStore } from "../../store/store";

interface SettlementOrderItem {
  order_dt: string; // 'YYYY-MM-DD HH:mm:ss'
  purchase_confirm_dt?: string; // 'YYYY-MM-DD HH:mm:ss' (구매확정 일시)
  order_status: string; // expect 'PURCHASE_CONFIRM' for confirmed
  center_payback: number | string; // can be formatted string with commas
}

interface SettlementAppModalProps {
  open: boolean;
  onClose: () => void;
  orders: SettlementOrderItem[];
}

const parseNumber = (value: number | string | null | undefined): number => {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  const cleaned = String(value).replace(/,/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getRecentMonths = (numMonths: number): string[] => {
  const result: string[] = [];
  const now = new Date();
  for (let i = 0; i < numMonths; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    result.push(`${y}-${m}`);
  }
  return result;
};

const getRecentYears = (numYears: number): string[] => {
  const result: string[] = [];
  const now = new Date();
  for (let i = 0; i < numYears; i += 1) {
    result.push(String(now.getFullYear() - i));
  }
  return result;
};

const SettlementAppModal: React.FC<SettlementAppModalProps> = ({ open, onClose, orders }) => {
  const [viewType, setViewType] = useState<"month" | "year">("month");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const user = useUserStore((state) => state.user);
  const [ordersData, setOrdersData] = useState<SettlementOrderItem[]>([]);

  const getDateString = (item: any): string => {
    const pc = item?.formatted_purchase_confirm_dt || "";
    const od = item?.formatted_order_dt || "";
    if (typeof pc === "string" && pc) return pc;
    if (typeof od === "string" && od) return od;
    return "";
  };

  useEffect(() => {
    if (!open) return;
    const now = new Date();
    const y = String(now.getFullYear());
    const m = String(now.getMonth() + 1).padStart(2, "0");
    if (!selectedYear) setSelectedYear(y);
    if (!selectedMonth) setSelectedMonth(`${y}-${m}`);
  }, [open, selectedMonth, selectedYear]);

  const months = useMemo(() => getRecentMonths(12), []);
  const years = useMemo(() => getRecentYears(7), []);

  useEffect(() => {
    if (!open) return;
    if (!user || !user.center_id) return;
    let cancelled = false;
    const fetchOrders = async () => {
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/app/memberOrderApp/selectCenterMemberOrderAppList`,
          { center_id: user.center_id }
        );
        if (!cancelled) setOrdersData(response.data || []);
      } catch (e) {
        console.error('fetch error:', e);
        if (!cancelled) setOrdersData([]);
      }
    };
    fetchOrders();
    return () => { cancelled = true; };
  }, [open, user]);

  const { bars, total, maxTotal, ticks } = useMemo(() => {
    const isConfirm = (status: string) => String(status || "").toUpperCase() === "PURCHASE_CONFIRM";

    if (viewType === "month") {
      if (!selectedMonth) {
        return { bars: [] as number[], total: 0, maxTotal: 0, ticks: [] as string[] };
      }
      const [yStr, mStr] = selectedMonth.split("-");
      const year = Number(yStr);
      const monthIdx = Number(mStr) - 1;
      const days = new Date(year, monthIdx + 1, 0).getDate();
      const totals = Array.from({ length: days }, () => 0);
      const labels = Array.from({ length: days }, (_, i) => String(i + 1));

      for (const item of ordersData || []) {
        if (!isConfirm(item.order_status)) continue;
        const dateStr = getDateString(item);
        if (!dateStr) continue;
        if (dateStr.slice(0, 7) !== selectedMonth) continue;
        const day = Number(dateStr.slice(8, 10));
        const payback = parseNumber(item.center_payback);
        if (day >= 1 && day <= days) totals[day - 1] += payback;
      }

      const sum = totals.reduce((a, b) => a + b, 0);
      const max = totals.reduce((a, b) => (a > b ? a : b), 0);
      return { bars: totals, total: sum, maxTotal: max, ticks: labels };
    }

    // year view
    const y = selectedYear || String(new Date().getFullYear());
    const totals = Array.from({ length: 12 }, () => 0);
    const labels = Array.from({ length: 12 }, (_, i) => String(i + 1));

    for (const item of ordersData || []) {
      if (!isConfirm(item.order_status)) continue;
      const dateStr = getDateString(item);
      if (!dateStr) continue;
      if (dateStr.slice(0, 4) !== y) continue;
      const month = Number(dateStr.slice(5, 7));
      const payback = parseNumber(item.center_payback);
      if (month >= 1 && month <= 12) totals[month - 1] += payback;
    }

    const sum = totals.reduce((a, b) => a + b, 0);
    const max = totals.reduce((a, b) => (a > b ? a : b), 0);
    return { bars: totals, total: sum, maxTotal: max, ticks: labels };
  }, [ordersData, selectedMonth, selectedYear, viewType]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg w-[95%] max-w-6xl max-h-[95vh] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-lg font-semibold">정산금 정보</h3>
          <button onClick={onClose} className="px-3 py-1 text-2xl">x</button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between space-x-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="viewType"
                    value="month"
                    checked={viewType === 'month'}
                    onChange={() => setViewType('month')}
                    className="mr-1"
                  />
                  <span className="text-sm">월</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="viewType"
                    value="year"
                    checked={viewType === 'year'}
                    onChange={() => setViewType('year')}
                    className="mr-1"
                  />
                  <span className="text-sm">연</span>
                </label>
              </div>

              {viewType === 'month' ? (
                <>
                  <label className="text-sm font-medium">연월</label>
                  <select
                    className="px-2 py-1 border border-gray-300 rounded"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    {months.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label className="text-sm font-medium">연도</label>
                  <select
                    className="px-2 py-1 border border-gray-300 rounded"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
          
            <div className="ml-auto text-sm">
              {viewType === 'month' 
                ? `${selectedMonth ? `${parseInt(selectedMonth.split('-')[1])}` : ''}월 합계` 
                : `${selectedYear ? `${parseInt(selectedYear)}` : ''}년 합계`}: <span className="font-semibold">{total.toLocaleString()}원</span>
            </div>
          </div>

          <div className="border rounded p-3">
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticks.map((label, i) => ({ label, value: bars[i] || 0 }))} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v: number) => `${v.toLocaleString()}원`} tick={{ fontSize: 10 }} />
                  <Tooltip 
                    formatter={(value: number) => [`${Number(value).toLocaleString()}원`, '금액']}
                    labelFormatter={(label: string) => (viewType === 'year' ? `${label}월` : `${label}일`)}
                    labelStyle={{ fontSize: '12px' }} 
                    contentStyle={{ fontSize: '12px' }} 
                  />
                  <Bar dataKey="value" fill="#4F46E5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettlementAppModal;


