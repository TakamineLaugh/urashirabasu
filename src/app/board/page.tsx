'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Thread = {
  id: number;
  title: string;
  created_at: string;
};

export default function BoardList() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);

  // スレッド一覧を取得
  const fetchThreads = async () => {
    // ★追加: データ取得の前に、古いスレッド（12時間以上書き込みなし）をお掃除する
    const { error: deleteError } = await supabase.rpc('delete_old_threads');
    
    if (deleteError) {
      console.error('お掃除失敗:', deleteError);
      // お掃除に失敗しても一覧表示は止まらないようにする
    }

    // ここからは元のコードと同じ：一覧を取得
    const { data, error } = await supabase
      .from('threads')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setThreads(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  // 新しいスレッドを作成
  const createThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const { error } = await supabase
      .from('threads')
      .insert([{ title: newTitle }]);

    if (error) {
      console.error(error);
      alert('作成に失敗しました');
    } else {
      setNewTitle('');
      await fetchThreads(); // 一覧更新（ここでもお掃除が走ります）
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-blue-500 hover:underline mb-6 inline-block">
          &larr; 裏シラバスに戻る
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 mb-8">大和大学 匿名掲示板</h1>

        {/* スレッド作成フォーム */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border-l-4 border-blue-500">
          <h2 className="font-bold text-lg mb-4">新しいスレッドを立てる</h2>
          <form onSubmit={createThread} className="flex gap-2">
            <input
              type="text"
              className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="スレッドのタイトル（例：情報学部のテストについて）"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white font-bold px-6 rounded-lg hover:bg-blue-700 transition"
            >
              作成
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-2">※12時間書き込みがないスレッドは自動的に削除されます。</p>
        </div>

        {/* スレッド一覧 */}
        <h2 className="text-xl font-bold text-gray-700 mb-4">スレッド一覧</h2>
        <div className="space-y-4">
          {loading ? (
            <p>読み込み中...</p>
          ) : threads.length === 0 ? (
            <p className="text-gray-500">まだスレッドがありません</p>
          ) : (
            threads.map((thread) => (
              <Link href={`/board/${thread.id}`} key={thread.id}>
                <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition cursor-pointer mb-3">
                  <h3 className="text-xl font-bold text-gray-800">{thread.title}</h3>
                  <p className="text-sm text-gray-400 mt-2">
                    作成日: {new Date(thread.created_at).toLocaleDateString()} {new Date(thread.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
