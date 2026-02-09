-- =============================================================================
-- Миграция: таблица about_page для редактируемой страницы "О нас"
-- Таблица: about_page (singleton, одна запись с id = 1)
-- Запуск: Supabase SQL Editor.
-- =============================================================================

-- Создание таблицы about_page
CREATE TABLE IF NOT EXISTS public.about_page (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  title TEXT,
  content TEXT NOT NULL DEFAULT '',
  cover_image_path TEXT,
  cover_image_url TEXT,
  cover_alt TEXT,
  cover_caption TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT about_page_singleton CHECK (id = 1)
);

-- Ограничение: только одна запись (singleton) через триггер
CREATE OR REPLACE FUNCTION prevent_multiple_about_page_rows()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.about_page) > 1 THEN
    RAISE EXCEPTION 'Может быть только одна запись в таблице about_page';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_multiple_about_page_rows ON public.about_page;
CREATE TRIGGER trigger_prevent_multiple_about_page_rows
  AFTER INSERT OR UPDATE ON public.about_page
  FOR EACH ROW
  EXECUTE FUNCTION prevent_multiple_about_page_rows();

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_about_page_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS trigger_update_about_page_updated_at ON public.about_page;
CREATE TRIGGER trigger_update_about_page_updated_at
  BEFORE UPDATE ON public.about_page
  FOR EACH ROW
  EXECUTE FUNCTION update_about_page_updated_at();

-- RLS (Row Level Security) политики
ALTER TABLE public.about_page ENABLE ROW LEVEL SECURITY;

-- Политика для публичного чтения: все могут читать
CREATE POLICY "Публичное чтение страницы О нас"
  ON public.about_page
  FOR SELECT
  USING (true);

-- Политика для админских операций: все операции через service role
-- (Админские операции выполняются через API routes с проверкой сессии и использованием service role)

-- Комментарии к таблице и колонкам
COMMENT ON TABLE public.about_page IS 'Редактируемая страница "О нас" (singleton, одна запись)';
COMMENT ON COLUMN public.about_page.id IS 'Уникальный идентификатор (всегда 1)';
COMMENT ON COLUMN public.about_page.title IS 'Заголовок страницы (опционально)';
COMMENT ON COLUMN public.about_page.content IS 'HTML контент страницы (rich text)';
COMMENT ON COLUMN public.about_page.cover_image_path IS 'Путь к обложке в Supabase Storage';
COMMENT ON COLUMN public.about_page.cover_image_url IS 'Публичный URL обложки';
COMMENT ON COLUMN public.about_page.cover_alt IS 'Alt-текст для обложки';
COMMENT ON COLUMN public.about_page.cover_caption IS 'Подпись к обложке';
COMMENT ON COLUMN public.about_page.updated_at IS 'Дата последнего обновления';

-- Создаем дефолтную запись если её нет
INSERT INTO public.about_page (id, content)
SELECT 1, '<p>Добро пожаловать на страницу "О нас".</p>'
WHERE NOT EXISTS (SELECT 1 FROM public.about_page WHERE id = 1);
