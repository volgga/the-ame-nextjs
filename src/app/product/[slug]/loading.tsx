export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-page-bg">
      <div className="container mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Слева: большой квадрат (имитация фото) */}
          <div className="w-full md:w-1/2 shrink-0">
            <div
              className="w-full aspect-square max-w-[min(620px,100%)] max-h-[400px] md:max-h-[600px] bg-gray-200 rounded-2xl animate-pulse"
              aria-hidden
            />
          </div>

          {/* Справа: заголовок, цена, кнопки */}
          <div className="flex-1 min-w-0 space-y-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4" aria-hidden />
            <div className="h-6 bg-gray-200 rounded animate-pulse w-1/4" aria-hidden />
            <div className="h-12 bg-gray-200 rounded-xl animate-pulse w-full max-w-[200px] mt-6" aria-hidden />
            <div className="h-12 bg-gray-200 rounded-xl animate-pulse w-full max-w-[280px]" aria-hidden />
            <div className="space-y-2 mt-8">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full" aria-hidden />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" aria-hidden />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-4/5" aria-hidden />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
