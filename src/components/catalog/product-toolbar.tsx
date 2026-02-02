"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Search, ChevronDown } from "lucide-react";

export type SortValue = "default" | "price_asc" | "price_desc";

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: "default", label: "Порядок: по умолчанию" },
  { value: "price_asc", label: "Порядок: цена: по возрастанию" },
  { value: "price_desc", label: "Порядок: цена: по убыванию" },
];

function buildQueryString(
  params: URLSearchParams,
  updates: { minPrice?: string; maxPrice?: string; sort?: string; q?: string }
) {
  const next = new URLSearchParams(params);
  const keys = ["minPrice", "maxPrice", "sort", "q"] as const;
  keys.forEach((k) => {
    const v = updates[k];
    if (v === undefined) return;
    if (v === "") next.delete(k);
    else next.set(k, v);
  });
  const s = next.toString();
  return s ? `?${s}` : "";
}

function formatPrice(n: number) {
  return n.toLocaleString("ru-RU") + " ₽";
}

const rangeInputClass =
  "absolute inset-0 w-full h-6 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-runnable-track]:pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-color-bg-main [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-20 [&::-moz-range-track]:pointer-events-none [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-color-bg-main [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:relative [&::-moz-range-thumb]:z-20";

type ProductToolbarProps = {
  /** [min, max] цены по товарам текущей категории */
  priceBounds: [number, number];
};

/**
 * ProductToolbar — панель фильтров: цена (popover со слайдером), поиск, сортировка.
 * Управление через URL: minPrice, maxPrice, sort, q.
 */
export function ProductToolbar({ priceBounds }: ProductToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const popoverRef = useRef<HTMLDivElement>(null);

  const [priceMin, priceMax] = priceBounds;
  const hasValidBounds = Number.isFinite(priceMin) && Number.isFinite(priceMax) && priceMin < priceMax;

  const minPriceParam = searchParams.get("minPrice");
  const maxPriceParam = searchParams.get("maxPrice");
  const sort = (searchParams.get("sort") as SortValue) ?? "default";
  const qParam = searchParams.get("q") ?? "";

  const [searchInput, setSearchInput] = useState(qParam);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [localMin, setLocalMin] = useState(minPriceParam ? Number(minPriceParam) : priceMin);
  const [localMax, setLocalMax] = useState(maxPriceParam ? Number(maxPriceParam) : priceMax);

  useEffect(() => setSearchInput(qParam), [qParam]);

  // Синхронизация localMin/localMax с URL при открытии поповера
  useEffect(() => {
    if (popoverOpen) {
      const urlMin = minPriceParam ? Number(minPriceParam) : priceMin;
      const urlMax = maxPriceParam ? Number(maxPriceParam) : priceMax;
      setLocalMin(Math.max(priceMin, Math.min(priceMax, urlMin)));
      setLocalMax(Math.max(priceMin, Math.min(priceMax, urlMax)));
    }
  }, [popoverOpen, minPriceParam, maxPriceParam, priceMin, priceMax]);

  const applyUrl = useCallback(
    (updates: { minPrice?: string; maxPrice?: string; sort?: string; q?: string }) => {
      startTransition(() => {
        const qs = buildQueryString(searchParams, updates);
        router.push(`${pathname}${qs}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  const step = hasValidBounds ? Math.max(1, Math.floor((priceMax - priceMin) / 100)) : 100;

  const handleMinChange = (v: number) => {
    setLocalMin(Math.min(v, localMax - step));
  };

  const handleMaxChange = (v: number) => {
    setLocalMax(Math.max(v, localMin + step));
  };

  const handlePriceReset = () => {
    setLocalMin(priceMin);
    setLocalMax(priceMax);
    applyUrl({ minPrice: "", maxPrice: "" });
    setPopoverOpen(false);
  };

  const handleApplyPrice = () => {
    applyUrl({
      minPrice: localMin === priceMin ? "" : String(localMin),
      maxPrice: localMax === priceMax ? "" : String(localMax),
    });
    setPopoverOpen(false);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value as SortValue;
    applyUrl({ sort: v === "default" ? "" : v });
  };

  const handleSearch = () => {
    applyUrl({ q: searchInput.trim() || "" });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleReset = () => {
    setSearchInput("");
    setLocalMin(priceMin);
    setLocalMax(priceMax);
    applyUrl({ minPrice: "", maxPrice: "", sort: "", q: "" });
    setPopoverOpen(false);
  };

  // Popover: закрытие по клику вне и Esc
  useEffect(() => {
    if (!popoverOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPopoverOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [popoverOpen]);

  const hasFilters =
    (minPriceParam && Number(minPriceParam) !== priceMin) ||
    (maxPriceParam && Number(maxPriceParam) !== priceMax) ||
    (sort && sort !== "default") ||
    qParam;

  const priceLabel =
    localMin === priceMin && localMax === priceMax ? "Цена" : `${formatPrice(localMin)} – ${formatPrice(localMax)}`;

  const controlH = "h-9";

  return (
    <div
      className="flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center justify-between gap-3"
      role="group"
      aria-label="Фильтры и поиск"
    >
      {/* Левая зона: Цена (trigger + popover) */}
      <div className="relative" ref={popoverRef}>
        <button
          type="button"
          onClick={() => setPopoverOpen((o) => !o)}
          className={`${controlH} w-full md:w-auto inline-flex items-center justify-between md:justify-start gap-2 rounded-full border border-[var(--color-outline-border)] bg-white px-3 py-2 text-sm text-color-text-main hover:bg-[rgba(31,42,31,0.06)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2`}
          aria-expanded={popoverOpen}
          aria-haspopup="true"
          aria-label="Фильтр по цене"
        >
          <span>{priceLabel}</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-color-text-secondary transition-transform ${popoverOpen ? "rotate-180" : ""}`}
          />
        </button>

        {popoverOpen && hasValidBounds && (
          <div
            className="absolute left-0 top-full z-50 mt-2 w-[min(100vw-2rem,380px)] rounded-lg border border-border-block bg-white p-4 shadow-elegant"
            role="dialog"
            aria-label="Выбор диапазона цен"
          >
            {/* Одна строка: От [значение] | [range slider] | До [значение] */}
            <div className="flex items-center gap-3 mb-4">
              <div className="shrink-0 min-w-[72px]">
                <span className="block text-xs text-color-text-secondary">От</span>
                <span className="text-sm font-medium text-color-text-main">{formatPrice(localMin)}</span>
              </div>

              <div className="flex-1 min-w-0 relative h-6 flex items-center">
                {/* Фон трека */}
                <div className="absolute inset-x-0 h-2 rounded-full bg-[rgba(31,42,31,0.12)] pointer-events-none" />
                {/* Заливка выбранного диапазона */}
                <div
                  className="absolute h-2 rounded-full bg-[rgba(111,131,99,0.35)] pointer-events-none"
                  style={{
                    left: `${((localMin - priceMin) / (priceMax - priceMin)) * 100}%`,
                    width: `${((localMax - localMin) / (priceMax - priceMin)) * 100}%`,
                  }}
                />
                {/* Клик по треку: двигаем ближайший ползунок */}
                <div
                  className="absolute inset-0 cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = (e.clientX - rect.left) / rect.width;
                    const value = Math.round(priceMin + pct * (priceMax - priceMin));
                    const valueStepped = Math.round(value / step) * step;
                    const clamped = Math.max(priceMin, Math.min(priceMax, valueStepped));
                    if (clamped < (localMin + localMax) / 2) {
                      handleMinChange(Math.min(clamped, localMax - step));
                    } else {
                      handleMaxChange(Math.max(clamped, localMin + step));
                    }
                  }}
                  role="presentation"
                />
                {/* Два range input — thumbs перекрывают клик-слой по z-index */}
                <input
                  type="range"
                  min={priceMin}
                  max={priceMax}
                  step={step}
                  value={localMin}
                  onChange={(e) => handleMinChange(Number(e.target.value))}
                  className={rangeInputClass}
                  aria-label="Минимальная цена"
                />
                <input
                  type="range"
                  min={priceMin}
                  max={priceMax}
                  step={step}
                  value={localMax}
                  onChange={(e) => handleMaxChange(Number(e.target.value))}
                  className={rangeInputClass}
                  aria-label="Максимальная цена"
                />
              </div>

              <div className="shrink-0 min-w-[72px] text-right">
                <span className="block text-xs text-color-text-secondary">До</span>
                <span className="text-sm font-medium text-color-text-main">{formatPrice(localMax)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePriceReset}
                className="flex-1 h-9 rounded-full border border-[var(--color-outline-border)] bg-white px-3 text-sm text-color-text-secondary hover:bg-[rgba(31,42,31,0.06)] hover:text-color-text-main transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2"
                aria-label="Сбросить цену"
              >
                Сброс
              </button>
              <button
                type="button"
                onClick={handleApplyPrice}
                className="flex-1 h-9 rounded-full text-white px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-accent-btn hover:bg-accent-btn-hover active:bg-accent-btn-active"
                aria-label="Применить"
              >
                Применить
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Правая зона: Поиск + Порядок */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 md:flex-initial min-w-0">
        {/* Поиск: input с встроенной кнопкой-лупой */}
        <div
          className={`flex ${controlH} w-full sm:w-[180px] md:w-[200px] rounded-full border border-[var(--color-outline-border)] bg-white overflow-hidden transition-colors focus-within:ring-2 focus-within:ring-color-bg-main focus-within:ring-offset-2`}
        >
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Поиск"
            className="flex-1 min-w-0 px-3 py-2 text-sm text-color-text-main placeholder:text-[rgba(31,42,31,0.45)] bg-transparent border-0 focus:outline-none focus:ring-0"
            aria-label="Поиск по каталогу"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="w-9 shrink-0 h-full flex items-center justify-center border-l border-border-block text-color-text-main hover:bg-[rgba(31,42,31,0.06)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-inset"
            aria-label="Выполнить поиск"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        {/* Порядок: селект */}
        <select
          value={sort}
          onChange={handleSortChange}
          className={`${controlH} w-full sm:w-[220px] md:w-[240px] rounded-full border border-[var(--color-outline-border)] bg-white px-3 py-2 text-sm text-color-text-main hover:bg-[rgba(31,42,31,0.06)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%231F2A1F%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10`}
          aria-label="Порядок сортировки"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Сброс всех фильтров */}
      {hasFilters && (
        <button
          type="button"
          onClick={handleReset}
          className={`${controlH} rounded-full border border-[var(--color-outline-border)] bg-white px-3 py-2 text-sm text-color-text-secondary hover:bg-[rgba(31,42,31,0.06)] hover:text-color-text-main transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2`}
          aria-label="Сбросить фильтры"
        >
          Сброс
        </button>
      )}
    </div>
  );
}
