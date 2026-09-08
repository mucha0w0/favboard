import { BENTO_COLS } from "./constants";

/** グリッドのセル辺長と gap（px）— ドラッグ換算用 */
export function measureBentoGridMetrics(el: HTMLElement): {
  cellSize: number;
  gap: number;
  step: number;
} {
  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  const gap = parseFloat(style.columnGap) || parseFloat(style.gap) || 0;
  const padX =
    parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const contentW = rect.width - padX;
  const cellSize = (contentW - gap * (BENTO_COLS - 1)) / BENTO_COLS;
  return { cellSize, gap, step: cellSize + gap };
}

/** 描画済みセルから実測のステップ幅を取得（計算値より優先） */
export function measureBentoGridStepFromDOM(gridEl: HTMLElement): {
  cellSize: number;
  gap: number;
  step: number;
} {
  const fallback = measureBentoGridMetrics(gridEl);
  const cells = gridEl.querySelectorAll(":scope > *");
  if (cells.length < 2) return fallback;

  const first = cells[0].getBoundingClientRect();
  const second = cells[1].getBoundingClientRect();
  const step = second.left - first.left;
  const cellSize = first.width;
  const gap = step - cellSize;

  if (step <= 0 || cellSize <= 0) return fallback;
  return { cellSize, gap, step };
}
