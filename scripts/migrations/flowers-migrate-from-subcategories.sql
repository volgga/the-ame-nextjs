-- =============================================================================
-- Миграция: перенос данных "Цветы в составе" из subcategories в flowers
-- Запуск: выполнить ПОСЛЕ flowers-create-table.sql и product-flowers-create-table.sql.
-- 1) Копирует подкатегории категории "Цветы в составе" в таблицу flowers.
-- 2) Заполняет product_flowers из composition_flowers товаров (по нормализованному имени).
-- 3) Для товаров, привязанных к подкатегориям-цветам, добавляет связи в product_flowers.
-- =============================================================================

DO $$
DECLARE
  cat_id UUID;
  flower_rec RECORD;
  sub_rec RECORD;
  prod_id TEXT;
  flower_id_val UUID;
  norm_slug TEXT;
  comp_flowers TEXT[];
  f TEXT;
BEGIN
  -- Найти категорию "Цветы в составе"
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'cvety-v-sostave' LIMIT 1;
  IF cat_id IS NULL THEN
    RAISE NOTICE 'Категория cvety-v-sostave не найдена, пропуск миграции подкатегорий.';
    RETURN;
  END IF;

  -- 1) Копируем подкатегории этой категории в flowers (по slug/name не дублируем)
  FOR sub_rec IN
    SELECT id, name, slug, title, description, seo_title, seo_description, sort_order, is_active
    FROM public.subcategories
    WHERE category_id = cat_id
  LOOP
    norm_slug := LOWER(TRIM(sub_rec.slug));
    IF norm_slug IS NULL OR norm_slug = '' THEN
      norm_slug := LOWER(REGEXP_REPLACE(TRIM(sub_rec.name), '[^a-zA-Zа-яА-ЯёЁ0-9]+', '-', 'g'));
      norm_slug := TRIM(BOTH '-' FROM norm_slug);
    END IF;

    INSERT INTO public.flowers (slug, name, title, description, seo_title, seo_description, is_active, sort_order)
    VALUES (
      COALESCE(NULLIF(TRIM(norm_slug), ''), 'flower-' || sub_rec.id::TEXT),
      sub_rec.name,
      sub_rec.title,
      sub_rec.description,
      sub_rec.seo_title,
      sub_rec.seo_description,
      COALESCE(sub_rec.is_active, true),
      COALESCE(sub_rec.sort_order, 0)
    )
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      seo_title = EXCLUDED.seo_title,
      seo_description = EXCLUDED.seo_description,
      is_active = EXCLUDED.is_active,
      sort_order = EXCLUDED.sort_order,
      updated_at = NOW();
  END LOOP;

  -- 2) product_flowers из product_subcategories (подкатегории категории "Цветы в составе")
  -- Сопоставляем subcategory -> flower по name (после копирования в flowers)
  FOR sub_rec IN
    SELECT s.id AS sub_id, f2.id AS flower_id
    FROM public.subcategories s
    JOIN public.flowers f2 ON LOWER(TRIM(s.name)) = LOWER(TRIM(f2.name))
    WHERE s.category_id = cat_id
  LOOP
    FOR prod_id IN
      SELECT product_id FROM public.product_subcategories WHERE subcategory_id = sub_rec.sub_id
    LOOP
      INSERT INTO public.product_flowers (product_id, flower_id)
      VALUES (prod_id, sub_rec.flower_id)
      ON CONFLICT (product_id, flower_id) DO NOTHING;
    END LOOP;
  END LOOP;

  -- 3) product_flowers из composition_flowers (products): по совпадению имени с flowers.name (normalized)
  FOR prod_id IN SELECT id::TEXT FROM public.products
  LOOP
    SELECT ARRAY_AGG(TRIM(elem))
    INTO comp_flowers
    FROM (
      SELECT UNNEST(composition_flowers) AS elem
      FROM public.products
      WHERE id::TEXT = prod_id AND composition_flowers IS NOT NULL AND array_length(composition_flowers, 1) > 0
    ) t;
    IF comp_flowers IS NOT NULL THEN
      FOREACH f IN ARRAY comp_flowers
      LOOP
        IF f IS NOT NULL AND TRIM(f) <> '' THEN
          SELECT id INTO flower_id_val
          FROM public.flowers
          WHERE LOWER(TRIM(name)) = LOWER(TRIM(f))
          LIMIT 1;
          IF flower_id_val IS NOT NULL THEN
            INSERT INTO public.product_flowers (product_id, flower_id)
            VALUES (prod_id, flower_id_val)
            ON CONFLICT (product_id, flower_id) DO NOTHING;
          END IF;
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  -- 4) product_flowers из variant_products.composition_flowers (по имени)
  FOR prod_id IN SELECT id::TEXT FROM public.variant_products
  LOOP
    SELECT ARRAY_AGG(TRIM(elem))
    INTO comp_flowers
    FROM (
      SELECT UNNEST(composition_flowers) AS elem
      FROM public.variant_products
      WHERE id::TEXT = prod_id AND composition_flowers IS NOT NULL AND array_length(composition_flowers, 1) > 0
    ) t;
    IF comp_flowers IS NOT NULL THEN
      FOREACH f IN ARRAY comp_flowers
      LOOP
        IF f IS NOT NULL AND TRIM(f) <> '' THEN
          SELECT id INTO flower_id_val
          FROM public.flowers
          WHERE LOWER(TRIM(name)) = LOWER(TRIM(f))
          LIMIT 1;
          IF flower_id_val IS NOT NULL THEN
            INSERT INTO public.product_flowers (product_id, flower_id)
            VALUES (prod_id, flower_id_val)
            ON CONFLICT (product_id, flower_id) DO NOTHING;
          END IF;
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  RAISE NOTICE 'Миграция flowers из subcategories и composition_flowers завершена.';
END $$;
