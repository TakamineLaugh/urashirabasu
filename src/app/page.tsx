import InternCalendar from '@/components/InternCalendar';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            就活・インターンカレンダー
          </h1>
          <p className="text-gray-600">
            開催日程や締切を一目でチェック
          </p>
        </header>

        {/* カレンダーコンポーネントの配置 */}
        <section>
          <InternCalendar />
        </section>
      </div>
    </main>
  );
}
