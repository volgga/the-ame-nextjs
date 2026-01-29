/**
 * Footer компонент (заглушка)
 * Пока показывает базовую структуру, позже перенесём логику из старого проекта
 */
export function Footer() {
  return (
    <footer className="bg-white border-t mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Логотип и описание */}
          <div>
            <div className="text-3xl font-serif mb-2">The Áme</div>
            <p className="text-[#7e7e7e] text-sm">
              Премиальные букеты из Сочи, вдохновлённые французской эстетикой.
            </p>
          </div>

          {/* Навигация */}
          <div>
            <h3 className="font-semibold mb-4">Навигация</h3>
            <nav className="space-y-2">
              <a href="/" className="block text-[#7e7e7e] hover:text-black transition-colors">
                Главная
              </a>
              <a href="/catalog" className="block text-[#7e7e7e] hover:text-black transition-colors">
                Каталог
              </a>
              <a href="/about" className="block text-[#7e7e7e] hover:text-black transition-colors">
                О нас
              </a>
              <a href="/contact" className="block text-[#7e7e7e] hover:text-black transition-colors">
                Контакты
              </a>
            </nav>
          </div>

          {/* Контакты */}
          <div>
            <h3 className="font-semibold mb-4">Контакты</h3>
            <p className="text-[#7e7e7e] text-sm">
              Сочи, ул. Донская, 10А
            </p>
            <p className="text-[#7e7e7e] text-sm mt-2">
              2025 © The Áme
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
