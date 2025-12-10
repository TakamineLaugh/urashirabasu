'use client';

import { useEffect, useState, use, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Post = {
  id: number;
  name: string;
  content: string;
  created_at: string;
};

type Thread = {
  id: number;
  title: string;
};

export default function ThreadDetail({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = use(params);

  const [posts, setPosts] = useState<Post[]>([]);
  const [thread, setThread] = useState<Thread | null>(null);
  const [content, setContent] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // ★追加: 画面の一番下を特定するための「目印」
  const bottomRef = useRef<HTMLDivElement>(null);

  // データ取得
  const fetchData = async () => {
    // ローディング中も画面を消さないようにsetIsLoadingは触らない（更新ボタン用）
    try {
      const { data: threadData, error: threadError } = await supabase.from('threads').select('*').eq('id', threadId).single();
      if (threadError || !threadData) {
        setThread(null);
      } else {
        setThread(threadData);
      }
      const { data: postsData } = await supabase.from('posts').select('*').eq('thread_id', threadId).order('created_at', { ascending: true });
      if (postsData) setPosts(postsData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [threadId]);

  // ★追加: 一番下までスクロールする関数
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ★追加: 更新ボタンを押したときの処理
  const handleReload = async () => {
    await fetchData(); // 最新データを取得
    setTimeout(scrollToBottom, 100); // ちょっと待ってから一番下にスクロール
  };

  // 書き込み送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    const submitName = name.trim() || '名無しの大和学生';

    const cleanedContent = content.replace(/\n{3,}/g, '\n\n').trim();

    const { error } = await supabase.from('posts').insert([
      {
        thread_id: Number(threadId),
        name: submitName,
        content: cleanedContent,
      },
    ]);

    if (error) {
      console.error(error);
      alert('書き込みに失敗しました');
    } else {
      setContent('');
      await fetchData();     // データを再取得して
      setTimeout(scrollToBottom, 100); // 自分の書き込みが見えるようにスクロール
    }
    setIsSubmitting(false);
  };

  if (isLoading) return <div className="p-8 text-center">読み込み中...</div>;
  if (!thread) return (
    <div className="p-8 text-center">
      <p className="text-xl font-bold text-gray-600 mb-4">このスレッドは見つかりませんでした。</p>
      <Link href="/board" className="text-blue-500 hover:underline">掲示板一覧に戻る</Link>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/board" className="text-blue-500 hover:underline mb-4 inline-block">&larr; 掲示板一覧に戻る</Link>

        <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border-b-4 border-green-500">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 break-all">{thread.title}</h1>
        </div>

        <div className="space-y-4 pb-64">
          {posts.length === 0 ? <p className="text-center text-gray-500 py-8">まだ書き込みがありません。<br/>1コメをゲットしよう！</p> : posts.map((post, index) => (
            <div key={post.id} className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                <span className="font-bold text-green-700">{index + 1}. {post.name}</span>
                <span className="text-gray-400 text-xs">{new Date(post.created_at).toLocaleString()}</span>
              </div>
              <p className="text-gray-800 whitespace-pre-wrap break-all">{post.content}</p>
            </div>
          ))}
          {/* ★追加: ここがスクロールの目的地（見えない目印） */}
          <div ref={bottomRef} />
        </div>

        {/* 書き込みフォーム */}
        <div className="bg-white p-4 md:p-6 rounded-t-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] fixed bottom-0 left-0 right-0 md:relative md:rounded-lg md:shadow-md border-t border-gray-200 md:border-2">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <input
                  type="text"
                  className="w-full p-2 border border-gray-400 rounded bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="名前（省略可：名無しの大和学生）"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex gap-2 items-center">
                <textarea
                  className="flex-1 p-3 border border-gray-400 rounded bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 h-20 resize-none"
                  placeholder="コメントを入力..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
                
                <div className="flex flex-col gap-2">
                  <button type="submit" disabled={isSubmitting} className="bg-green-600 text-white font-bold px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 shadow-md h-10 w-20 flex items-center justify-center text-sm">
                    送信
                  </button>
                  
                  {/* ★追加: リロードボタン */}
                  <button 
                    type="button" 
                    onClick={handleReload}
                    className="bg-gray-500 text-white font-bold px-4 py-2 rounded hover:bg-gray-600 shadow-md h-8 w-20 flex items-center justify-center"
                    title="更新して最新へ"
                  >
                    {/* 更新アイコン（SVG） */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
