import { useEffect, useRef } from "react";
import { parseCompositionFlowers } from "@/lib/parseCompositionFlowers";

/**
 * Хук для автосинхронизации списка выбранных цветов из поля "Состав".
 * Автоматически добавляет найденные цветы в список, но не удаляет существующие,
 * которые были выбраны пользователем вручную.
 *
 * @param composition - текст состава (например "гортензия 1шт, диантус 3шт")
 * @param availableFlowers - список всех доступных цветов для фильтра
 * @param selectedFlowers - текущий список выбранных цветов
 * @param setSelectedFlowers - функция для обновления списка выбранных цветов
 */
export function useAutoSyncCompositionFlowers(
  composition: string,
  availableFlowers: string[],
  selectedFlowers: string[],
  setSelectedFlowers: (flowers: string[] | ((prev: string[]) => string[])) => void
) {
  // Отслеживаем, какие цветы были выбраны пользователем вручную
  const manuallySelectedRef = useRef<Set<string>>(new Set());
  const lastCompositionRef = useRef<string>("");

  // Инициализируем множество вручную выбранных цветов при первом рендере
  useEffect(() => {
    if (selectedFlowers.length > 0 && manuallySelectedRef.current.size === 0) {
      selectedFlowers.forEach((flower) => manuallySelectedRef.current.add(flower.toLowerCase()));
    }
  }, []); // Только при монтировании

  // Автосинхронизация при изменении состава
  useEffect(() => {
    // Пропускаем, если состав не изменился
    if (composition === lastCompositionRef.current) return;
    lastCompositionRef.current = composition;

    // Если состав пустой, ничего не делаем
    if (!composition || composition.trim().length === 0) return;

    // Парсим цветы из состава
    const parsedFlowers = parseCompositionFlowers(composition);
    if (parsedFlowers.length === 0) return;

    // Обновляем список: добавляем найденные цветы, сохраняем вручную выбранные
    setSelectedFlowers((prev) => {
      const manuallySelected = new Set(manuallySelectedRef.current);

      // Объединяем:
      // 1. Цветы, найденные в составе (если они есть в availableFlowers)
      // 2. Цветы, выбранные вручную пользователем
      const newSet = new Set<string>();

      // Добавляем найденные в составе цветы (только если они есть в списке доступных)
      parsedFlowers.forEach((flower) => {
        const lower = flower.toLowerCase();
        // Проверяем, есть ли точное совпадение в availableFlowers (case-insensitive)
        const existsInAvailable = availableFlowers.some((af) => af.toLowerCase() === lower);
        if (existsInAvailable) {
          // Находим правильное написание из availableFlowers
          const correctName = availableFlowers.find((af) => af.toLowerCase() === lower) || flower;
          newSet.add(correctName);
        } else {
          // Если цветка нет в списке, добавляем как есть (будет добавлен в список)
          newSet.add(flower);
        }
      });

      // Добавляем вручную выбранные цветы
      prev.forEach((flower) => {
        const lower = flower.toLowerCase();
        if (manuallySelected.has(lower)) {
          newSet.add(flower);
        }
      });

      return Array.from(newSet).sort((a, b) => a.localeCompare(b, "ru"));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composition, availableFlowers]);

  /**
   * Отмечает цветок как выбранный вручную пользователем
   */
  const markAsManuallySelected = (flower: string) => {
    manuallySelectedRef.current.add(flower.toLowerCase());
  };

  /**
   * Снимает отметку о ручном выборе цветка
   */
  const unmarkAsManuallySelected = (flower: string) => {
    manuallySelectedRef.current.delete(flower.toLowerCase());
  };

  /**
   * Обработчик изменения чекбокса цветка
   */
  const handleFlowerToggle = (flower: string, isChecked: boolean) => {
    if (isChecked) {
      markAsManuallySelected(flower);
      setSelectedFlowers((prev) => {
        if (prev.includes(flower)) return prev;
        return [...prev, flower].sort((a, b) => a.localeCompare(b, "ru"));
      });
    } else {
      unmarkAsManuallySelected(flower);
      setSelectedFlowers((prev) => prev.filter((f) => f !== flower));
    }
  };

  return {
    handleFlowerToggle,
    markAsManuallySelected,
    unmarkAsManuallySelected,
  };
}
