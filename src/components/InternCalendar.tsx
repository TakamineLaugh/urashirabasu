'use client';

import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

// イベントデータの型定義
interface InternEvent {
  title: string;
  start: string; // 'YYYY-MM-DD'
  url?: string;
  color?: string;
  description?: string;
}

export default function InternCalendar() {
  const [events, setEvents] = useState<InternEvent[]>([]);
  
  // モーダル（ポップアップ）用の状態管理
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [dailyEvents, setDailyEvents] = useState<InternEvent[]>([]);
  
  // ★追加: Hydrationエラーを防ぐためのフラグ
  const [isMounted, setIsMounted] = useState(false);

  // データ取得
  useEffect(() => {
    // コンポーネントがブラウザにマウントされたことを記録
    setIsMounted(true);

    fetch('/events.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then((data) => setEvents(data))
      .catch((err) => console.error('データ取得エラー:', err));
  }, []);

  // ■ 日付のマス目がクリックされた時の処理
  const handleDateClick = (arg: any) => {
    const clickedDate = arg.dateStr;
    const targetEvents = events.filter((event) => event.start === clickedDate);
    
    setSelectedDate(clickedDate);
    setDailyEvents(targetEvents);
    setIsOpen(true);
  };

  // ■ カレンダー内のイベントバーがクリックされた時の処理
  const handleEventClick = (info: any) => {
    info.jsEvent.preventDefault();
    const clickedDate = info.event.startStr;
    const targetEvents = events.filter((event) => event.start === clickedDate);
    
    setSelectedDate(clickedDate);
    setDailyEvents(targetEvents);
    setIsOpen(true);
  };

  // ★重要: サーバー側でのレンダリング時は何も表示しない（これでエラーが消える）
  if (!isMounted) {
    return <div className="p-4 bg-white rounded-lg shadow-md h-96 flex items-center justify-center">Loading...</div>;
  }

  return (
    <>
      {/* CSSのグローバル適用はNext.jsと競合しやすいため、styleタグを修正 */}
      <style jsx global>{`
        .fc-toolbar-title { font-size: 1.1rem !important; font-weight: bold; }
        .fc-button { background-color: #2563EB !important; border: none !important; font-size: 0.8rem !important; }
        .fc-day-sun .fc-col-header-cell-cushion { color: #EF4444; }
        .fc-day-sat .fc-col-header-cell-cushion { color: #3B82F6; }
        .fc-event { border: none; font-size: 0.75rem; cursor: pointer; }
      `}</style>

      <div className="p-4 bg-white rounded-lg shadow-md relative z-0">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="ja"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth',
          }}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="auto"
          contentHeight="auto"
          dayCellClassNames="hover:bg-blue-50 cursor-pointer transition-colors"
        />
      </div>

      {/* ■ ポップアップ（モーダル）部分 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
              <h2 className="text-lg font-bold">
                {selectedDate} の開催情報
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-blue-700 rounded-full p-1"
              >
                ✕ 閉じる
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {dailyEvents.length > 0 ? (
                <div className="space-y-3">
                  {dailyEvents.map((evt, index) => (
                    <a 
                      key={index} 
                      href={evt.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all group"
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-1 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: evt.color || '#3B82F6' }}></span>
                        <div>
                          <p className="font-bold text-gray-800 group-hover:text-blue-600">
                            {evt.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            詳細を見る →
                          </p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>この日の予定はありません</p>
                  <p className="text-xs mt-2">他の日付をタップしてみてね</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-gray-50 border-t text-center">
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-medium text-sm"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
