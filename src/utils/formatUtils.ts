import dayjs from "dayjs";

export const formatToTimestamp = (date: any) => {
  return dayjs(date).format("YYYY-MM-DD HH:mm:ss");
};

export const convertDate = (date: any) => {
  return dayjs(date).format("YYYY-MM-DD");
};

export const convertDateYear = (date: any) => {
  return dayjs(date).format("YYYY");
};

export const convertDateWithoutYear = (date: any) => {
  return dayjs(date).format("MM-DD");
};

export const convertDateMonth = (date: any) => {
  return dayjs(date).format("MM");
};

export const convertDateTime = (date: any) => {
  return dayjs(date).format("HH:mm");
};

export const convertAmount = (amount: number) => {
  return amount?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const convertPhone = (phone?: string) => {
  return phone?.toString().replace(/\B(?=(\d{4})+(?!\d))/g, "-");
};

export const removeNonNumeric = (str: string) => {
  return str.replace(/[^0-9]/g, "");
};

export const calculatePercentage = (part: number, total: number) => {
  if (total === 0) return 0;
  return (part / total) * 100;
};

/**
 * 4자리 숫자 시간 데이터를 시간:분 형식으로 변환
 * @param timeData - 4자리 숫자 (앞 2자리는 시, 뒤 2자리는 분)
 * @returns 포맷된 시간 문자열
 */
export const formatExerciseTime = (timeData: number): string => {
  if (!timeData || timeData === 0) return '0분';
  
  const timeStr = timeData.toString().padStart(4, '0');
  const hours = parseInt(timeStr.substring(0, 2));
  const minutes = parseInt(timeStr.substring(2, 4));
  
  if (hours === 0 && minutes === 0) return '0분';
  if (hours === 0) return `${minutes}분`;
  if (minutes === 0) return `${hours}시간`;
  
  return `${hours}시 ${minutes}분`;
};

// YYYYMMDDHHmm 형태 문자열을 YYYY-MM-DD 오전/오후 HH:MM 로 변환
export const formatAmPmDate = (dateString?: string): string => {
  const ds = String(dateString || '');
  if (ds.length < 12) return ds || '';
  const y = ds.substring(0, 4);
  const m = ds.substring(4, 6);
  const d = ds.substring(6, 8);
  const hh = parseInt(ds.substring(8, 10), 10);
  const mm = ds.substring(10, 12);
  const isPm = hh >= 12;
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  const ampm = isPm ? '오후' : '오전';
  return `${y}-${m}-${d} ${ampm} ${String(hour12).padStart(2, '0')}:${mm}`;
};