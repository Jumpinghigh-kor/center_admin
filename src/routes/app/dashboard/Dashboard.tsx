import axios from "axios";
import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useUserStore } from "../../../store/store";
import DashboardMemberPopup from "../../../components/DashboardMemberPopup";

// 샘플 데이터
const userGrowthData = [
  { month: "1월", users: 400, active: 240 },
  { month: "2월", users: 300, active: 139 },
  { month: "3월", users: 600, active: 980 },
  { month: "4월", users: 800, active: 390 },
  { month: "5월", users: 1200, active: 480 },
  { month: "6월", users: 1800, active: 380 },
];

interface Member {
  mem_id: number;
  mem_name: string;
  mem_nickname: string;
  login_id: string;
  mem_phone: string;
  status: string;
  mem_gender: string;
  mem_birthday: string;
  mem_role: string;
  reg_dt: string;
  exit_dt: string;
  month_num: string;
  active_count: number;
  proceed_count: number;
  exit_count: number;
}

interface MemberCount {
  status: string;
  count: number;
  recent_cnt: number;
  reg_cnt: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [memberCount, setMemberCount] = useState<MemberCount[]>([]);
  const [monthlyMemberList, setMonthlyMemberList] = useState<Member[]>([]);
  const [paymentAnalysisList, setPaymentAnalysisList] = useState<any[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedMemberType, setSelectedMemberType] = useState<string>('');
  const [recentYn, setRecentYn] = useState<string>('');
  const [monthRegYn, setMonthRegYn] = useState<string>('');
  const [recentCount, setRecentCount] = useState<number>(0);
  const [monthRegCount, setMonthRegCount] = useState<number>(0);
  const [noticesAppList, setNoticesAppList] = useState<any[]>([]);
  const [updateLogList, setUpdateLogList] = useState<any[]>([]);
  const [centerList, setCenterList] = useState<Array<{ center_id: number; center_name: string }>>([]);
  const [selectedCenterId, setSelectedCenterId] = useState<string>("");
  const [url, setUrl] = useState<string[]>([]);

  const getEffectiveCenterId = (overrideCenterId?: string | number | null) => {
    if (overrideCenterId !== undefined && overrideCenterId !== null) {
      const v = String(overrideCenterId).trim();
      return v === "" ? null : v;
    }
    const picked = String(selectedCenterId || "").trim();
    if (picked) return picked;
    return null;
  };
  // 매출 차트 관련 상태
  const [salesPeriod, setSalesPeriod] = useState<string>('day');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  
  // 결제 수단 건수 관련 상태
  const [paymentMethodData, setPaymentMethodData] = useState<any[]>([]);
  const [paymentMethodLoading, setPaymentMethodLoading] = useState(false);
  
  // 카테고리 별 매출 관련 상태
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  
  // 시간대별 주문 현황 관련 상태
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [hourlyLoading, setHourlyLoading] = useState(false);
  
  const user = useUserStore((state) => state.user);

  // 센터 목록 불러오기
  const selectCenterList = async () => {
    if(user?.usr_role !== 'admin') return;

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/center/list`,
        {
          params: user
        }
      );

      setCenterList(response.data.result);
    } catch (err) {
      console.error("센터 목록 로딩 오류:", (err as Error).message);
    } finally {
    }
  };

  // 매출 데이터 조회 API
  const selectSalesList = async (period: string, year: number, month: number, centerIdOverride?: string | number | null) => {
    const centerId = user?.usr_role !== 'admin' ? user?.center_id : getEffectiveCenterId(centerIdOverride);

    try {
      setSalesLoading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/dashboard/selectSalesList`,
        {
          period,
          year,
          month,
          center_id: centerId,
        }
      );
      
      // API 응답 데이터를 차트 형태로 매핑
      const mappedData = (response.data.result || []).map((item: any) => {
        let formattedDate = '';
        
        if (period === 'day') {
          // 일별: MM/DD 형태
          const date = new Date(item.day);
          formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
        } else if (period === 'week') {
          // 주별: X주차 형태 (W1, W2, W3 -> 1주차, 2주차, 3주차)
          const weekNumber = item.week_label?.replace('W', '') || item.week_num || '1';
          formattedDate = `${weekNumber}주차`;
        } else if (period === 'month') {
          // 월별: X월 형태 (2025-01 -> 1월)
          const monthNumber = item.month_label?.split('-')[1] || item.month_num || '01';
          formattedDate = `${parseInt(monthNumber)}월`;
        } else if (period === 'year') {
          // 연별: YYYY 형태
          formattedDate = item.year_label.toString();
        }
        
        return {
          date: formattedDate,
          sales: item.total_amount || 0,
          orders: item.order_count || 0
        };
      });
      
      setSalesData(mappedData);
    } catch (err) {
      console.error("매출 데이터 조회 오류:", err);
      setSalesData([]);
    } finally {
      setSalesLoading(false);
    }
  };

  // 결제 수단 건수 조회 API
  const selectPaymentMethodList = async (centerIdOverride?: string | number | null) => {
    const centerId = user?.usr_role !== 'admin' ? user?.center_id : getEffectiveCenterId(centerIdOverride);

    try {
      setPaymentMethodLoading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/dashboard/selectPaymentMethodList`,
        {
          center_id: centerId,
        }
      );
      
      // API 응답 데이터를 차트 형태로 매핑
      const mappedData = (response.data.result || []).map((item: any, index: number) => {
        const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA726", "#9C88FF", "#FF9F43"];
        return {
          name: item.card_name || `결제수단 ${index + 1}`,
          value: item.card_count || 0,
          color: colors[index % colors.length]
        };
      });
      
      setPaymentMethodData(mappedData);
    } catch (err) {
      console.error("결제 수단 건수 조회 오류:", err);
      setPaymentMethodData([]);
    } finally {
      setPaymentMethodLoading(false);
    }
  };

  // 카테고리 별 매출 조회 API
  const selectCategorySalesList = async (centerIdOverride?: string | number | null) => {
    const centerId = user?.usr_role !== 'admin' ? user?.center_id : getEffectiveCenterId(centerIdOverride);

    try {
      setCategoryLoading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/dashboard/selectCategorySalesList`,
        {
          center_id: centerId,
        }
      );
      
      // API 응답 데이터를 차트 형태로 매핑
      const mappedData = (response.data.result || []).map((item: any) => ({
        category: item.category_name || '기타',
        sales: item.category_sales || 0
      }));
      
      setCategoryData(mappedData);
    } catch (err) {
      console.error("카테고리 별 매출 조회 오류:", err);
      setCategoryData([]);
    } finally {
      setCategoryLoading(false);
    }
  };

  // 시간대별 주문 현황 조회 API
  const selectHourlySalesList = async (centerIdOverride?: string | number | null) => {
    const centerId = user?.usr_role !== 'admin' ? user?.center_id : getEffectiveCenterId(centerIdOverride);

    try {
      setHourlyLoading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/dashboard/selectHourlySalesList`,
        {
          center_id: centerId,
        }
      );
      
      // API 응답 데이터를 차트 형태로 매핑
      const mappedData = (response.data.result || []).map((item: any) => ({
        hour: item.time_range || '00',
        orders: item.order_count || 0
      }));
      
      setHourlyData(mappedData);
    } catch (err) {
      console.error("시간대별 주문 현황 조회 오류:", err);
      setHourlyData([]);
    } finally {
      setHourlyLoading(false);
    }
  };

  // 기간 변경 핸들러
  const handlePeriodChange = (period: string) => {
    setSalesPeriod(period);
    selectSalesList(period, selectedYear, selectedMonth, selectedCenterId);
    selectPaymentAnalysisList(selectedCenterId);
  };

  // 연도 변경 핸들러
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    selectSalesList(salesPeriod, year, selectedMonth, selectedCenterId);
    selectPaymentAnalysisList(selectedCenterId);
  };

  // 월 변경 핸들러
  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    selectSalesList(salesPeriod, selectedYear, month, selectedCenterId);
    selectPaymentAnalysisList(selectedCenterId);
  };

  // 주 변경 핸들러 제거됨 - 사용되지 않음

  // 월별 차트 데이터 변환 함수
  const convertMonthlyData = () => {
    if (!monthlyMemberList || monthlyMemberList.length === 0) {
      return userGrowthData; // 기본 데이터 사용
    }

    return monthlyMemberList.map(item => {
      const monthStr = item.month_num.slice(-2); // 뒤 2자리 가져오기
      const monthNum = parseInt(monthStr, 10);
      const monthName = `${monthNum}월`;
      
      return {
        month: monthName,
        activeMembers: item.active_count || 0,
        proceedMembers: item.proceed_count || 0,
        exitMembers: item.exit_count || 0,
      };
    });
  };

  const monthlyChartData = convertMonthlyData();

  // 사용자 통계 개요 조회
  const selectMemberCount = async (centerIdOverride?: string | number | null) => {
    try {
      const centerId = user?.usr_role !== 'admin' ? user?.center_id : getEffectiveCenterId(centerIdOverride);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/dashboard/selectMemberCount`,
        {
          center_id: centerId,
        }
      );
      
      setMemberCount(response.data.result);
      
      const total = response.data.result.reduce((sum: number, item: MemberCount) => {
        return sum + Number(item.recent_cnt);
      }, 0);
      setRecentCount(total);

      const monthRegTotal = response.data.result.reduce((sum: number, item: MemberCount) => {
        return sum + Number(item.reg_cnt);
      }, 0);
      setMonthRegCount(monthRegTotal);
    } catch (err) {
      console.error("사용자 통계 개요 조회 오류:", err);
    } finally {
    }
  };

  // 월별 가입 된 회원수 조회
  const selectMonthlyMemberList = async (centerIdOverride?: string | number | null) => {
    try {
      const centerId = user?.usr_role !== 'admin' ? user?.center_id : getEffectiveCenterId(centerIdOverride);
      // center_id를 숫자로 변환 (null이 아닐 경우)
      const centerIdNum = centerId ? (typeof centerId === 'string' ? parseInt(centerId, 10) : centerId) : null;
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/dashboard/selectMonthlyMemberList`,
        {
          center_id: centerIdNum,
        }
      );
      
      setMonthlyMemberList(response.data.result);
    } catch (err) {
      console.error("월별 가입 된 회원수 조회 오류:", err);
    } finally {
    }
  };

  // 결제 분석 조회
  const selectPaymentAnalysisList = async (centerIdOverride?: string | number | null) => {

    try {
      const centerId = user?.usr_role !== 'admin' ? user?.center_id : getEffectiveCenterId(centerIdOverride);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/dashboard/selectPaymentAnalysisList`,
        {
          center_id: centerId,
        }
      );

      setPaymentAnalysisList(response.data.result);
    } catch (err) {
      console.error("결제 분석 조회 오류:", err);
    } finally {
    }
  };
  

  // 공지사항 조회
  const selectNoticesAppList = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/app/noticesApp/selectNoticesAppList`);

      setNoticesAppList(response.data.result || response.data || []);
    } catch (err) {
      console.error("공지사항 조회 오류:", err);
      setNoticesAppList([]);
    } finally {
    }
  };

  //  업데이트 로그 조회
  const selectUpdateLogAppList = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/app/updateLogApp/selectUpdateLogAppList`);

      setUpdateLogList(response.data.result || response.data || []);
    } catch (err) {
      console.error("업데이트 로그 조회 오류:", err);
      setUpdateLogList([]);
    } finally {
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.post(
          `${process.env.REACT_APP_API_URL}/video`,
          {
            pl_type: "APP_GUIDE",
          }
        );

        const playlist = res.data.result[0].pl_url;
        
        setUrl(playlist);
      } catch (e) {
        console.log(e);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if(user) {
      selectCenterList();
      selectMemberCount(selectedCenterId);
      selectMonthlyMemberList(selectedCenterId);
      selectSalesList(salesPeriod, selectedYear, selectedMonth, selectedCenterId);
      selectPaymentMethodList(selectedCenterId);
      selectCategorySalesList(selectedCenterId);
      selectHourlySalesList(selectedCenterId);
      selectNoticesAppList();
      selectUpdateLogAppList();
      selectPaymentAnalysisList(selectedCenterId);
    }
  }, [user]);

  // 쇼핑 결제 분석: 센터/기간 변경 시 즉시 재조회
  useEffect(() => {
    if (!user) return;
    selectPaymentAnalysisList(selectedCenterId);
  }, [selectedCenterId, salesPeriod, selectedYear, selectedMonth]);

  // 매출/주문 추이: 센터/기간 변경 시 즉시 재조회
  useEffect(() => {
    if (!user) return;
    selectSalesList(salesPeriod, selectedYear, selectedMonth, selectedCenterId);
  }, [selectedCenterId, salesPeriod, selectedYear, selectedMonth]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">대시보드</h1>
      
      {user?.usr_role === 'admin' && (
        <div className="mb-4 flex items-center gap-2">
          <p>매장 선택(관리자만 노출) : </p> 
          <select
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedCenterId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedCenterId(val);
              setTimeout(() => {
                selectMemberCount(val);
                selectMonthlyMemberList(val);
                selectSalesList(salesPeriod, selectedYear, selectedMonth, val);
                selectPaymentMethodList(val);
                selectCategorySalesList(val);
                selectHourlySalesList(val);
                selectPaymentAnalysisList(val);
              }, 0);
            }}
          >
            <option value="">전체</option>
            {centerList.map((c) => (
              <option key={c.center_id} value={String(c.center_id)}>{c.center_name}</option>
            ))}
          </select>
        </div>
      )}

      <section className="mb-8">
        <NavLink
          target="_blank"
          to={`https://youtu.be/${url}`}
        >
          <div className="h-auto p-6 bg-white border max-w-full flex items-center border-gray-200 rounded-sm shadow hover:bg-gray-100">
            <div className="flex">
              <span className="m-0 font-bold">가이드 영상 보러 가기</span>
              <svg
                className="w-4 h-4 text-gray-800"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 14v4.833A1.166 1.166 0 0 1 16.833 20H5.167A1.167 1.167 0 0 1 4 18.833V7.167A1.166 1.166 0 0 1 5.167 6h4.618m4.447-2H20v5.768m-7.889 2.121 7.778-7.778"
                />
              </svg>
            </div>
            <span className="[&>svg]:h-6 [&>svg]:w-6 ml-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="red"
                viewBox="0 0 576 512"
              >
                <path d="M549.7 124.1c-6.3-23.7-24.8-42.3-48.3-48.6C458.8 64 288 64 288 64S117.2 64 74.6 75.5c-23.5 6.3-42 24.9-48.3 48.6-11.4 42.9-11.4 132.3-11.4 132.3s0 89.4 11.4 132.3c6.3 23.7 24.8 41.5 48.3 47.8C117.2 448 288 448 288 448s170.8 0 213.4-11.5c23.5-6.3 42-24.2 48.3-47.8 11.4-42.9 11.4-132.3 11.4-132.3s0-89.4-11.4-132.3zm-317.5 213.5V175.2l142.7 81.2-142.7 81.2z" />
              </svg>
            </span>
          </div>
        </NavLink>
      </section>

      {/* 1. 사용자 통계 개요 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b-2 border-blue-200 pb-2">👥 사용자 통계 개요</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-3 text-gray-700">📉 회원 상태별 분포</h3>
            <p className="text-xs text-gray-500 mb-2">그래프를 클릭하면 회원 목록을 확인할 수 있습니다.</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "활동 회원", value: memberCount.find(item => item.status === 'ACTIVE')?.count || 0, color: "#0088FE", type: "ACTIVE" },
                      { name: "가입중 회원", value: memberCount.find(item => item.status === 'PROCEED')?.count || 0, color: "#00C49F", type: "PROCEED" },
                      { name: "탈퇴 회원", value: memberCount.find(item => item.status === 'EXIT')?.count || 0, color: "#FFBB28", type: "EXIT" }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    labelLine={false}
                    label={(props) => {
                      const v = typeof props.value === 'number' ? props.value : Number(props.value ?? 0);
                      const n = String(props.name ?? "");
                      return v > 0 ? `${n}: ${v}명` : "";
                    }}
                    onClick={(data) => {
                      if (data) {
                        setSelectedMemberType(data.type);
                        setIsPopupOpen(true);
                      }
                    }}
                  >
                    {[
                      { name: "활동 회원", value: memberCount.find(item => item.status === 'ACTIVE')?.count || 0, color: "#0088FE", type: "ACTIVE" },
                      { name: "가입중 회원", value: memberCount.find(item => item.status === 'PROCEED')?.count || 0, color: "#00C49F", type: "PROCEED" },
                      { name: "탈퇴 회원", value: memberCount.find(item => item.status === 'EXIT')?.count || 0, color: "#FFBB28", type: "EXIT" }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} style={{ cursor: 'pointer' }} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}명`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 오른쪽: 통계 카드들 */}
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-blue-700 mb-2">📊 총 회원 수</h4>
                <button className="text-sm text-blue-500 hover:text-blue-700" onClick={() => {
                  setSelectedMemberType('');
                  setIsPopupOpen(true);
                }}>더보기</button>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {memberCount.reduce((sum, item) => sum + item.count, 0)}명
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-green-700 mb-2">🟢 금일 로그인 인원</h4>
                <button className="text-sm text-green-500 hover:text-green-700" onClick={() => {
                  setRecentYn('Y');
                  setIsPopupOpen(true);
                }}>더보기</button>
              </div>
                <p className="text-2xl font-bold text-green-900">{recentCount}명</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-purple-700 mb-2">🆕 이번 달 신규 가입</h4>
              <button className="text-sm text-purple-500 hover:text-purple-700" onClick={() => {
                setMonthRegYn('Y');
                setIsPopupOpen(true);
              }}>더보기</button>
              </div>
              <p className="text-2xl font-bold text-purple-900">{monthRegCount}명</p>
            </div>
          </div>
        </div>

        <div className="flex">
          <div className="bg-gray-50 pt-6 pb-6 p-4 w-1/2 border-radius-md mr-6">
            <p>활동회원 - 계정생성 후 로그인을 한 회원</p>
            <p>가입중회원 - 계정만 생성한 회원</p>
            <p>탈퇴회원 - 활동회원에서 탈퇴를 한 회원</p>
          </div>
          <div className="w-1/2 border-radius-md"></div>
        </div>
      </section>

      <section className="mb-8">
        {/* 사용자 증가 추이 차트 */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-medium mb-3 text-gray-700">📈 월별 사용자 증가 추이</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${value}명`} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="activeMembers"
                  stackId="1"
                  stroke="#0088FE"
                  fill="#0088FE"
                  name="활동 회원"
                />
                <Area
                  type="monotone"
                  dataKey="proceedMembers"
                  stackId="2"
                  stroke="#00C49F"
                  fill="#00C49F"
                  name="가입중 회원"
                />
                <Area
                  type="monotone"
                  dataKey="exitMembers"
                  stackId="3"
                  stroke="#FFBB28"
                  fill="#FFBB28"
                  name="탈퇴 회원"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* 3. 쇼핑 결제 분석 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b-2 border-red-200 pb-2">
          💰 쇼핑 결제 분석
        </h2>
        
        {/* 매출 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h4 className="text-sm font-medium text-red-700">금일 매출</h4>
            <p className="text-xl font-bold">{paymentAnalysisList[0]?.today_order_amount ? parseInt(paymentAnalysisList[0]?.today_order_amount).toLocaleString() : 0}원</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-700">금일 주문 수</h4>
            <p className="text-xl font-bold">{paymentAnalysisList[0]?.today_order_count ? parseInt(paymentAnalysisList[0]?.today_order_count).toLocaleString() : 0}건</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="text-sm font-medium text-green-700">평균 주문금액</h4>
            <p className="text-xl font-bold">{paymentAnalysisList[0]?.avg_order_amount ? parseInt(paymentAnalysisList[0]?.avg_order_amount).toLocaleString() : 0}원</p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="text-sm font-medium text-yellow-700">환불률</h4>
            <p className="text-xl font-bold">{paymentAnalysisList[0]?.refund_rate_percent ? paymentAnalysisList[0]?.refund_rate_percent : 0}%</p>
          </div>
        </div>

        {/* 매출 추이 차트 */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700 mb-2 sm:mb-0">📈 매출 및 주문 수 추이</h3>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              
              {/* 날짜 선택 */}
              <div className="flex items-center gap-2">
                {/* 연도 선택 (연 기간일 때 숨김) */}
                {salesPeriod !== 'year' && (
                  <div className="flex items-center gap-1">
                    <label className="text-sm font-medium text-gray-600">연도:</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => handleYearChange(parseInt(e.target.value))}
                      className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 4 + i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                )}
                 
                {/* 월 선택 (일, 주 기간일 때 표시) */}
                {(salesPeriod === 'day' || salesPeriod === 'week') && (
                  <div className="flex items-center gap-1">
                    <label className="text-sm font-medium text-gray-600">월:</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                      className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>{month}월</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 기간 선택 드롭다운 */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-600">기간:</label>
                  <select 
                    value={salesPeriod} 
                    onChange={(e) => handlePeriodChange(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="day">일</option>
                    <option value="week">주</option>
                    <option value="month">월</option>
                    <option value="year">연</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {/* 스크롤 가능한 차트 컨테이너 */}
          <div className="overflow-x-auto">
            {salesLoading ? (
              <div className="flex justify-center items-center h-80">
                <div className="text-gray-500">매출 데이터를 불러오는 중...</div>
              </div>
            ) : (
              <div style={{ minWidth: salesPeriod === 'day' && salesData.length > 7 ? '800px' : '100%', height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      interval={salesPeriod === 'day' && salesData.length > 15 ? 'preserveStartEnd' : 0}
                    />
                    <YAxis 
                      yAxisId="left" 
                      tickFormatter={(value) => `${value.toLocaleString()}원`}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      tickFormatter={(value) => `${value}건`}
                      allowDecimals={false}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === "매출 (원)") {
                          return `₩${value.toLocaleString()}`;
                        }
                        return `${value}건`;
                      }}
                      labelStyle={{ fontSize: '12px' }}
                      contentStyle={{ fontSize: '12px' }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="sales" fill="#8884d8" name="매출 (원)" />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#ff7300" 
                      strokeWidth={2}
                      name="주문 수"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* 결제 방법 & 카테고리별 매출 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* 결제 방법별 비율 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-3 text-gray-700">💳 결제 수단 건수</h3>
            <div className="h-64">
              {paymentMethodLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-gray-500">결제 수단 데이터를 불러오는 중...</div>
                </div>
              ) : paymentMethodData.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-gray-500">결제 수단 데이터가 없습니다.</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}건`}
                    >
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}건`} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* 카테고리별 매출 */}
          <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
            <h3 className="text-lg font-medium mb-3 text-gray-700">🛍️ 카테고리별 매출</h3>
            <div className="h-64">
              {categoryLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-gray-500">카테고리 매출 데이터를 불러오는 중...</div>
                </div>
              ) : categoryData.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-gray-500">카테고리 매출 데이터가 없습니다.</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="horizontal" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="category" dataKey="category" />
                    <YAxis type="number" dataKey="sales" tickFormatter={(value) => `${value.toLocaleString()}원`} />
                    <Tooltip formatter={(value) => `${value.toLocaleString()}원`} />
                    <Bar dataKey="sales" fill="#82ca9d" name="매출" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* 시간대별 주문 현황 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3 text-gray-700">🕐 시간대별 주문 현황</h3>
          <div className="h-52">
            {hourlyLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-gray-500">시간대별 주문 데이터를 불러오는 중...</div>
              </div>
            ) : hourlyData.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-gray-500">시간대별 주문 데이터가 없습니다.</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#8884d8" 
                    fill="#8884d8"
                    fillOpacity={0.6}
                    name="주문수"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* 4. 최근 활동 및 공지사항 */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b-2 border-purple-200 pb-2">
          🔔 최근 활동 및 공지사항
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-700">📢 공지사항</h3>
                <button className="text-sm text-blue-500 hover:text-blue-700" onClick={() => {
                  navigate('/app/noticesAppList');
                }}>더보기</button>
            </div>
            <div className="space-y-2">
              {noticesAppList.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-gray-500">공지사항 목록이 없습니다.</div>
                </div>
              ) : (
               noticesAppList.slice(0, 3).map((item, index) => {
                  return (
                  <div className="flex items-center justify-between p-2 bg-white rounded" key={index}>
                    <span className="text-sm">{item.noticesType === 'NOTICE' ? '[공지사항]' : item.noticesType === 'EVENT' ? '[이벤트]' : '[가이드]'} {item.title}</span>
                    <span className="text-xs text-gray-500">{item.reg_dt}</span>
                  </div>
                  )
                })
              )}               
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-700">🔄 업데이트</h3>
              <button className="text-sm text-blue-500 hover:text-blue-700" onClick={() => {
                navigate('/app/updateLogApp');
              }}>더보기</button>
            </div>
            <div className="space-y-2">
              {updateLogList.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-gray-500">업데이트 로그 목록이 없습니다.</div>
                </div>
              ) : (
                 updateLogList.slice(0, 3).map((item, index) => (
                   <div className="p-2 bg-white rounded" key={index}>
                    <span className="text-sm font-medium">{item.up_app_version} 업데이트</span>
                    <p className="text-xs text-gray-600 mt-1">{item.up_app_desc}</p>
                  </div>
               )))}
            </div>
          </div>
        </div>
      </section>

      {/* 회원 목록 팝업 */}
      <DashboardMemberPopup 
        isOpen={isPopupOpen}
        onClose={() => {
          setIsPopupOpen(false);
          setSelectedMemberType('');
          setRecentYn('');
          setMonthRegYn('');
        }}
        title={selectedMemberType ? `${selectedMemberType === 'ACTIVE' ? '활성' 
                                  : selectedMemberType === 'PROCEED' ? '가입중' 
                                  : '탈퇴'} 회원 목록` 
                                  :  (!selectedMemberType && !recentYn && !monthRegYn) ? '전체 회원 목록' 
                                  : recentYn === 'Y' ? '금일 로그인 회원 목록' 
                                  : monthRegYn === 'Y' ? '이번 달 가입 회원 목록' : ''}
        type={selectedMemberType}
        recentYn={recentYn}
        monthRegYn={monthRegYn}
      />
    </div>
  );
};

export default Dashboard;
