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
  const [name, setName] = useState(''); // 名前入力用
  const [isSubmitting, setIsSubmitting] = useState(false);

  // データ取得
  const fetchData = async () => {
    // スレッド情報の取得
    const { data: threadData } = await supabase
      .from('threads')
      .select('*')
      .eq('id', threadId)
      .single();
    
    if (threadData) setThread(threadData);

    // 書き込み一覧の取得
    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true }); // 古い順（チャット形式）

    if (postsData) setPosts(postsData);
  };

  useEffect(() => {
    fetchData();
  }, [threadId]);

  // 書き込み送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);

    // 名前が空ならデフォルト名を入れる
    const submitName = name.trim() || '名無しの大和学生';

    const { error } = await supabase.from('posts').insert([
      {
        thread_id: Number(threadId),
        name: submitName,
        content: content,
      },
    ]);

    if (error) {
      console.error(error);
      alert('書き込みに失敗しました');
    } else {
      setContent('');
      // 名前はそのまま残す（連続投稿しやすくするため）
      await fetchData();
    }
    setIsSubmitting(false);
  };

  if (!thread) return <div className="p-8">読み込み中...</div>;

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/board" className="text-blue-500 hover:underline mb-4 inline-block">
          &larr; 掲示板一覧に戻る
        </Link>

        {/* スレッドタイトル */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border-b-4 border-green-500">
          <h1 className="text-2xl font-bold text-gray-800">{thread.title}</h1>
        </div>

        {/* 書き込みリスト */}
        <div className="space-y-4 mb-8">
          {posts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">まだ書き込みがありません。<br/>1コメをゲットしよう！</p>
          ) : (
            posts.map((post, index) => (
              <div key={post.id} className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                  {/* ★修正箇所: post.index ではなく index + 1 を使用 */}
                  <span className="font-bold text-green-700">{index + 1}. {post.name}</span>
                  <span className="text-gray-400">{new Date(post.created_at).toLocaleString()}</span>
                  <span className="text-gray-300">ID:{index + 1}</span>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap break-all">{post.content}</p>
              </div>
            ))
          )}
        </div>

        {/* 書き込みフォーム */}
        <div className="bg-white p-6 rounded-lg shadow-md sticky bottom-4 border-2 border-gray-200">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input
                type="text"
                className="w-full p-2 border rounded bg-gray-50"
                placeholder="名前（省略可：名無しの大和学生）"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <textarea
                className="flex-1 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 h-20"
                placeholder="コメントを入力..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 text-white font-bold px-6 rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                送信
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
