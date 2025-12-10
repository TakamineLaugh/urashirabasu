'use client';

import { useEffect, useState, use } from 'react';
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

  // データ取得
  const fetchData = async () => {
    setIsLoading(true);
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

  // 書き込み送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    const submitName = name.trim() || '名無しの大和学生';

    // ★修正ポイント1: 改行制限（3つ以上の改行を2つに縮める）
    const cleanedContent = content.replace(/\n{3,}/g, '\n\n').trim();

    const { error } = await supabase.from('posts').insert([
      {
        thread_id: Number(threadId),
        name: submitName,
        content: cleanedContent, // 加工したテキストを送信
      },
    ]);

    if (error) {
      console.error(error);
      alert('書き込みに失敗しました');
    } else {
      setContent('');
      await fetchData();
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

        {/* ★修正ポイント2: 下の余白を pb-64 にして、スマホで隠れないようにする */}
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
              <div className="flex gap-2">
                <textarea
                  className="flex-1 p-3 border border-gray-400 rounded bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 h-20 resize-none"
                  placeholder="コメントを入力..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
                <button type="submit" disabled={isSubmitting} className="bg-green-600 text-white font-bold px-6 rounded hover:bg-green-700 disabled:bg-gray-400 shadow-md">
                  送信
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
