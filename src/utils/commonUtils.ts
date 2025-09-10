export function openInputDatePicker(el: HTMLInputElement | null | undefined): void {
  if (!el) return;
  try {
    (el as any).showPicker ? (el as any).showPicker() : el.focus();
  } catch {
    el.focus();
    el.click();
  }
}