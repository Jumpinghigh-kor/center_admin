export function openInputDatePicker(el: HTMLInputElement | null | undefined): void {
  if (!el) return;
  try {
    (el as any).showPicker ? (el as any).showPicker() : el.focus();
  } catch {
    el.focus();
    el.click();
  }
}

// 전역: native date/datetime-local/time/month 선택 시 자동 닫기(blur)
export function installAutoCloseNativePickers(): void {
  // prevent duplicate global listeners (multiple pages may call this)
  const w = window as any;
  if (w.__autoCloseNativePickersInstalled) return;
  w.__autoCloseNativePickersInstalled = true;

  const handler = (e: Event) => {
    const t = e.target as HTMLInputElement | null;
    if (!t) return;
    const types = ["date", "datetime-local", "time", "month"];
    if (!types.includes(t.type)) return;

    // Some browsers fire `change` after the picker closes.
    // `input` usually fires on selection; blur in next tick closes the picker reliably.
    setTimeout(() => {
      try {
        t.blur();
      } catch {}
    }, 0);
  };

  document.addEventListener("input", handler, true);
  document.addEventListener("change", handler, true);
}

// YYYYMMDDHHMM(12) 또는 YYYYMMDDHHMMSS(14) 형태의 문자열 기준으로 종료일이 시작일보다 빠른지 검사
// 둘 다 값이 있을 때만 검사하며, 하나라도 비어있으면 true(유효) 처리
export function isValidDateRange(start?: string | null, end?: string | null): boolean {
  if (!start || !end) return true;
  const norm = (v: string) => (v.length >= 12 ? v.slice(0, 12) : v.padEnd(12, "0"));
  const s = norm(start);
  const e = norm(end);
  return e >= s;
}

// 체크박스 공통: 전체 선택 / 개별 선택 유틸 (id 배열 기반)
export function toggleSelectAll<T extends string | number>(allIds: T[], checked: boolean): T[] {
  return checked ? [...allIds] : [];
}

export function toggleSelectOne<T extends string | number>(
  selectedIds: T[],
  id: T,
  checked: boolean
): T[] {
  const has = selectedIds.includes(id);
  if (checked) return has ? selectedIds : [...selectedIds, id];
  return has ? selectedIds.filter((v) => v !== id) : selectedIds;
}

export function isAllSelected<T extends string | number>(allIds: T[], selectedIds: T[]): boolean {
  if (!allIds.length) return false;
  const set = new Set(selectedIds);
  return allIds.every((id) => set.has(id));
}