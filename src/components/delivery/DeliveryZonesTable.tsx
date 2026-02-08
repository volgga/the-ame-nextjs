"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { DeliveryZone } from "@/types/delivery";
import { ChevronDown, ChevronRight } from "lucide-react";

type DeliveryZonesTableProps = {
  zones: DeliveryZone[];
};

export function DeliveryZonesTable({ zones }: DeliveryZonesTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardContent className="p-6 md:p-8">
        <div className="divide-y divide-[#eaeaea]">
          {zones.map((z) => {
            const hasSubareas = !!z.conditions?.trim();
            const isExpanded = expandedIds.has(z.id);

            return (
              <div key={z.id} className="py-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="flex items-start gap-1.5 min-w-0">
                    {hasSubareas && (
                      <button
                        type="button"
                        onClick={() => toggle(z.id)}
                        className="mt-0.5 shrink-0 rounded p-0.5 text-[#7e7e7e] hover:text-[#000] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-color-text-main/30"
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? "Свернуть" : "Развернуть"}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" strokeWidth={2} />
                        ) : (
                          <ChevronRight className="w-5 h-5" strokeWidth={2} />
                        )}
                      </button>
                    )}
                    <div className="min-w-0">
                      <div className="text-base md:text-lg text-[#000] font-medium">
                        {z.title}
                      </div>
                      {hasSubareas && (
                        <div
                          className="overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
                          style={{
                            maxHeight: isExpanded ? "200px" : "0",
                            opacity: isExpanded ? 1 : 0,
                          }}
                        >
                          <p className="pt-1.5 text-xs md:text-sm text-[#7e7e7e] leading-relaxed">
                            {z.conditions}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm md:text-base md:shrink-0">
                    <div className="text-[#7e7e7e]">
                      до {z.paidUpTo.toLocaleString("ru-RU")} ₽ —{" "}
                      <span className="text-[#000] font-medium">
                        {z.price.toLocaleString("ru-RU")} ₽
                      </span>
                    </div>
                    <div className="text-[#7e7e7e] sm:ml-4">
                      от {z.freeFrom.toLocaleString("ru-RU")} ₽ —{" "}
                      <span className="text-[#000] font-medium">Бесплатно</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-sm md:text-base text-[#7e7e7e] text-left">
          Доставка работает круглосуточно. Стоимость доставки с 22:00 до 09:00
          осуществляется по двойному тарифу.
        </p>
      </CardContent>
    </Card>
  );
}
