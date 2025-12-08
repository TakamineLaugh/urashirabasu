'use client'; // Next.jsのApp Routerでクライアント側の動き(クリック等)をするために必要

import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'; // 月表示用
import interactionPlugin from '@fullcalendar/interaction'; // クリック操作用

// イベントデータの型定義
interface InternEvent {
  title: string;
  start: string; // 'YYYY-MM-DD' 形式
  end?: string;
  url?: string; // イベントのリンク先
  color?: string; // イベントの背景色
}

// サンプルデータ（実際はここをDBやAPIから取得するように変えます）
const SAMPLE_EVENTS: InternEvent[] = [
  {
    title: '【Web系】A社 1day仕事体験',
    start: new Date().toISOString().slice(0, 10), // 今日の日付
    color: '#3B82F6', // 青
    url: 'https://google.com/search?q=A社インターン',
  },
  {
    title: '【メーカー】B社 説明会',
    start: '2025-12-15',
    color: '#10B981', // 緑
    url: 'https://google.com/search?q=B社説明会',
  },
  {
    title: '【商社】C社 ES締切',
    start: '2025-12-20',
    color: '#EF4444', // 赤（締切など）
    url: 'https://google.com/search?q=C社ES',
  },
];

export default function InternCalendar() {
  
  // イベントがクリックされた時の動作
  const handleEventClick = (info: any) => {
    info.jsEvent.preventDefault(); // デフォルトのリンク遷移を防ぐ
    if (info.event.url) {
      window.open(info.event.url, '_blank'); // 別タブで開く
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth" // 月表示
        locale="ja" // 日本語化
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek',
        }}
        events={SAMPLE_EVENTS} // データをセット
        eventClick={handleEventClick} // クリック時の挙動
        height="auto" // 高さを自動調整
        contentHeight="auto"
        dayCellClassNames="hover:bg-gray-50 cursor-pointer" // マウスオーバー時のスタイル
      />
      
      {/* カレンダーのスタイル調整（Tailwind CSSと競合しないための最低限のCSS） */}
      <style jsx global>{`
        .fc-toolbar-title { font-size: 1.25rem !important; font-weight: bold; }
        .fc-button { background-color: #2563EB !important; border: none !important; }
        .fc-button:hover { background-color: #1D4ED8 !important; }
        .fc-day-today { background-color: #EFF6FF !important; }
        .fc-event { cursor: pointer; border: none; padding: 2px; font-size: 0.85rem; }
        /* 日曜日の日付を赤くする */
        .fc-day-sun .fc-col-header-cell-cushion { color: red; }
        /* 土曜日の日付を青くする */
        .fc-day-sat .fc-col-header-cell-cushion { color: blue; }
      `}</style>
    </div>
  );
}
