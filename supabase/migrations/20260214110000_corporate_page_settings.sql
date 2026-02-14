-- Страница «Корпоративные заказы»: одна запись (id = 1), редактируется из админки «Корпоративы».

CREATE TABLE IF NOT EXISTS public.corporate_page_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  title text,
  "text" text,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  max_link text,
  seo_title text,
  seo_description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.corporate_page_settings IS 'Настройки страницы «Корпоративные заказы» (одна запись id=1)';
COMMENT ON COLUMN public.corporate_page_settings.images IS 'Массив URL фото галереи (string[])';
COMMENT ON COLUMN public.corporate_page_settings.max_link IS 'URL кнопки MAX (если пусто — использовать глобальный из contactProviders)';

-- RLS: читать могут все, писать только через service role (админка)
ALTER TABLE public.corporate_page_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read"
  ON public.corporate_page_settings FOR SELECT
  USING (true);

CREATE POLICY "Service role full access"
  ON public.corporate_page_settings FOR ALL
  USING (auth.role() = 'service_role');

-- Вставка дефолтной записи (опционально, можно создавать при первом GET в API)
INSERT INTO public.corporate_page_settings (id, title, "text", images, max_link, seo_title, seo_description)
VALUES (
  1,
  'Оформление мероприятий',
  'Команда The Ame с любовью оформит ваш фасад, входную группу или мероприятие под ключ, поможет создать вау-эффект и повысить узнаваемость вашего бизнеса, отразив его ценности и настроение!',
  '[]'::jsonb,
  NULL,
  'Оформление мероприятий от цветочной студии The Ame в Сочи',
  'Команда The Ame с любовью оформит ваш фасад, входную группу или мероприятие под ключ, поможет создать вау-эффект и повысить узнаваемость вашего бизнеса, отразив его ценности и настроение!'
)
ON CONFLICT (id) DO NOTHING;
