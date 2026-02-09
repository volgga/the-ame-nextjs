-- =============================================================================
-- Миграция: проставить slug подкатегориям категории "По поводу", где slug пустой
-- Описание: витрина "По поводу" показывает чипы по подкатегориям; для URL нужен slug.
--           Если slug в subcategories не заполнен, чипы не отображались.
--           В коде есть fallback (slugify(name)), эта миграция сохраняет slug в БД.
-- Запуск: Supabase SQL Editor → вставить и выполнить.
-- =============================================================================

-- Обновляем slug по имени подкатегории (транслит как в @/utils/slugify)
UPDATE public.subcategories s
SET slug = v.slug
FROM (
  SELECT sub.id AS sub_id,
    CASE sub.name
      WHEN 'День рождения' THEN 'den-rozhdeniya'
      WHEN '14 февраля' THEN '14-fevralya'
      WHEN '8 марта' THEN '8-marta'
      WHEN 'Свадьба' THEN 'svadba'
      WHEN 'Юбилей' THEN 'yubiley'
      WHEN 'Рождение ребёнка' THEN 'rozhdenie-rebenka'
      WHEN 'Извиниться' THEN 'izvinitsya'
      WHEN 'Сказать спасибо' THEN 'skazat-spasibo'
      WHEN 'Признание' THEN 'priznanie'
      WHEN 'Без повода' THEN 'bez-povoda'
    END AS slug
  FROM public.subcategories sub
  JOIN public.categories oc ON oc.id = sub.category_id AND oc.slug = 'po-povodu'
  WHERE (sub.slug IS NULL OR trim(sub.slug) = '')
    AND sub.name IN (
      'День рождения', '14 февраля', '8 марта', 'Свадьба', 'Юбилей',
      'Рождение ребёнка', 'Извиниться', 'Сказать спасибо', 'Признание', 'Без повода'
    )
) v
WHERE s.id = v.sub_id AND v.slug IS NOT NULL;
