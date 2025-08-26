import React, { useState } from "react";
import axios from "axios";

interface PortoneProps {
  impUid?: string | null;
  merchantUid?: string | null;
  amount?: number | null;
  reason?: string | null;
  onRefundResult?: (result: any) => void;
}

const mask = (token?: string | null) => {
  if (!token) return "";
  const str = String(token);
  if (str.length <= 10) return str;
  return `${str.slice(0, 6)}...${str.slice(-4)}`;
};

const Portone: React.FC<PortoneProps> = ({
  impUid = null,
  merchantUid = null,
  amount = null,
  reason = "결제 취소",
  onRefundResult,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastToken, setLastToken] = useState<string>("");
  const [lastResult, setLastResult] = useState<any>(null);

  const apiBase = process.env.REACT_APP_API_URL;

  const getToken = async () => {
    if (!apiBase) {
      alert("REACT_APP_API_URL 이 설정되지 않았습니다.");
      return;
    }
    try {
      setIsLoading(true);
      const { data } = await axios.post(`${apiBase}/app/portone/getPortOneToken`);
      setLastToken(data?.token || "");
    } catch (e: any) {
      console.error("PortOne 토큰 발급 오류:", e?.response?.data || e?.message || e);
      alert("토큰 발급 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const requestRefund = async () => {
    if (!apiBase) {
      alert("REACT_APP_API_URL 이 설정되지 않았습니다.");
      return;
    }
    try {
      setIsLoading(true);
      const payload: any = {
        imp_uid: impUid,
        merchant_uid: merchantUid,
        refundAmount: amount ?? undefined,
        reason: reason || undefined,
      };
      const { data } = await axios.post(`${apiBase}/app/portone/requestPortOneRefund`, payload);
      setLastResult(data);
      onRefundResult?.(data);
      alert("포트원 환불 요청이 처리되었습니다. 결과는 콘솔을 확인해주세요.");
      // eslint-disable-next-line no-console
      console.log("[Portone Refund Result]", data);
    } catch (e: any) {
      console.error("PortOne 환불 요청 오류:", e?.response?.data || e?.message || e);
      alert("환불 요청 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <button
          className="px-3 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
          onClick={getToken}
          disabled={isLoading}
        >
          포트원 토큰 발급 테스트
        </button>
        <span className="text-xs text-gray-500">{lastToken ? `Token: ${mask(lastToken)}` : ""}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="px-3 py-2 text-sm rounded bg-black text-white hover:opacity-90 disabled:opacity-50"
          onClick={requestRefund}
          disabled={isLoading}
        >
          포트원 결제 취소 요청
        </button>
      </div>

      {!!lastResult && (
        <pre className="mt-3 text-xs bg-gray-50 p-2 rounded border border-gray-200 overflow-auto">
{JSON.stringify(lastResult, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default Portone;


