/**
 * Анимация «полёт» иконки из карточки товара к иконке в шапке (корзина / избранное).
 * Запускается по клику; оптимистично, не ждёт ответа сервера.
 */

const FLY_DURATION_MS = 420;
const FLY_SIZE = 36;
const LANDED_CLASS = "fly-landed";
const LANDED_CLASS_DURATION_MS = 350;

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

const CART_SVG = `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>`;

const HEART_SVG = `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>`;

export type FlyTarget = "cart" | "favorite";

/**
 * Запускает анимацию полёта иконки от sourceRect к соответствующей иконке в шапке.
 * В конце добавляет класс fly-landed целевому элементу для подсветки.
 */
export function runFlyToHeader(type: FlyTarget, sourceRect: DOMRect): void {
  if (typeof document === "undefined" || typeof window === "undefined") return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) return;

  const targetId = type === "cart" ? "header-cart" : "header-favorites";
  const targetEl = document.getElementById(targetId);
  if (!targetEl) return;

  const targetRect = targetEl.getBoundingClientRect();
  const startX = sourceRect.left + sourceRect.width / 2 - FLY_SIZE / 2;
  const startY = sourceRect.top + sourceRect.height / 2 - FLY_SIZE / 2;
  const endX = targetRect.left + targetRect.width / 2 - FLY_SIZE / 2;
  const endY = targetRect.top + targetRect.height / 2 - FLY_SIZE / 2;

  const fly = document.createElement("div");
  fly.setAttribute("aria-hidden", "true");
  fly.style.cssText = `
    position: fixed;
    left: ${startX}px;
    top: ${startY}px;
    width: ${FLY_SIZE}px;
    height: ${FLY_SIZE}px;
    border-radius: 50%;
    background-color: var(--header-bg);
    color: var(--header-foreground);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 9999;
    box-shadow: 0 2px 12px rgba(0,0,0,0.15);
  `;
  fly.innerHTML = type === "cart" ? CART_SVG : HEART_SVG;
  document.body.appendChild(fly);

  const startTime = performance.now();

  function tick(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / FLY_DURATION_MS, 1);
    const eased = easeOutQuad(progress);

    const x = startX + (endX - startX) * eased;
    const y = startY + (endY - startY) * eased;
    const scale = 1 - 0.25 * eased;

    fly.style.left = `${x}px`;
    fly.style.top = `${y}px`;
    fly.style.transform = `scale(${scale})`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      fly.remove();
      if (targetEl) {
        targetEl.classList.add(LANDED_CLASS);
        setTimeout(() => targetEl.classList.remove(LANDED_CLASS), LANDED_CLASS_DURATION_MS);
      }
    }
  }

  requestAnimationFrame(tick);
}
