'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Teacher = {
  id: number;
  name: string;
  department: string;
};

type Review = {
  id: number;
  content: string;
  easiness: number;
  satisfaction: number;
  created_at: string;
};

export default function TeacherDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // ★追加: 投稿フォーム用の状態管理
  const [showForm, setShowForm] = useState(false);
  const [formContent, setFormContent] = useState('');
  const [formEasiness, setFormEasiness] = useState(3);
  const [formSatisfaction, setFormSatisfaction] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // データ取得関数を外に出して、投稿後にも再利用できるようにする
  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('teacher_id', id)
      .order('created_at', { ascending: false });

    if (!error) setReviews(data || []);
  };

  useEffect(() => {
    const init = async () => {
      if (!id) return;
      try {
        // 先生情報
        const { data: teacherData, error: teacherError } = await supabase
          .from('teachers')
          .select('*')
          .eq('id', id)
          .single();
        if (teacherError) throw teacherError;
        setTeacher(teacherData);

        // レビュー情報
        await fetchReviews();
      } catch (error) {
        console.error('エラー:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  // ★追加: レビュー送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim()) return alert('コメントを入力してください');
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('reviews').insert([
        {
          teacher_id: Number(id),
          content: formContent,
          easiness: formEasiness,
          satisfaction: formSatisfaction,
        },
      ]);

      if (error) throw error;

      // 成功したらフォームをリセットしてデータを再取得
      setFormContent('');
      setShowForm(false);
      await fetchReviews(); // リストを更新
      alert('投稿しました！');

    } catch (error) {
      console.error('投稿エラー:', error);
      alert('投稿に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">読み込み中...</div>;
  if (!teacher) return <div className="p-8 text-center">先生が見つかりませんでした。</div>;

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-blue-500 hover:underline mb-4 inline-block">
          &larr; 一覧に戻る
        </Link>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{teacher.name} 先生</h1>
          <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            {teacher.department}
          </span>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-700">みんなの評判 ({reviews.length}件)</h2>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition text-sm"
          >
            {showForm ? '× 閉じる' : '＋ 口コミを投稿'}
          </button>
        </div>

        {/* ★追加: 投稿フォームエリア */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6 border-2 border-blue-100">
            <h3 className="font-bold mb-4 text-lg">口コミを書く</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-bold mb-1">楽単度 (1-5)</label>
                <select 
                  value={formEasiness} 
                  onChange={(e) => setFormEasiness(Number(e.target.value))}
                  className="w-full p-2 border rounded"
                >
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num} - {'★'.repeat(num)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">充実度 (1-5)</label>
                <select 
                  value={formSatisfaction} 
                  onChange={(e) => setFormSatisfaction(Number(e.target.value))}
                  className="w-full p-2 border rounded"
                >
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num} - {'★'.repeat(num)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold mb-1">コメント</label>
              <textarea 
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                className="w-full p-2 border rounded h-24"
                placeholder="授業の様子や課題の多さなど..."
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSubmitting ? '送信中...' : '投稿する'}
            </button>
          </form>
        )}

        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-gray-500 bg-white p-6 rounded-lg text-center">
              まだ口コミがありません。<br />最初の投稿者になりましょう！
            </p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center space-x-4 mb-3 border-b pb-2">
                  <div className="text-sm">
                    <span className="font-bold text-gray-500">楽単度:</span> 
                    <span className="ml-1 text-yellow-500 text-lg">{'★'.repeat(review.easiness)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-bold text-gray-500">充実度:</span>
                    <span className="ml-1 text-yellow-500 text-lg">{'★'.repeat(review.satisfaction)}</span>
                  </div>
                </div>
                {/* ★修正箇所: break-all を追加 */}
                <p className="text-gray-800 whitespace-pre-wrap break-all">{review.content}</p>
                <p className="text-xs text-gray-400 mt-3 text-right">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
