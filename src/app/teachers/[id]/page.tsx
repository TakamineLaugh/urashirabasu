'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Teacher = { id: number; name: string; department: string; };
type Review = { id: number; content: string; easiness: number; satisfaction: number; created_at: string; };

export default function TeacherDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formContent, setFormContent] = useState('');
  const [formEasiness, setFormEasiness] = useState(3);
  const [formSatisfaction, setFormSatisfaction] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReviews = async () => {
    const { data, error } = await supabase.from('reviews').select('*').eq('teacher_id', id).order('created_at', { ascending: false });
    if (!error) setReviews(data || []);
  };

  useEffect(() => {
    const init = async () => {
      if (!id) return;
      try {
        const { data: teacherData, error: teacherError } = await supabase.from('teachers').select('*').eq('id', id).single();
        if (teacherError) throw teacherError;
        setTeacher(teacherData);
        await fetchReviews();
      } catch (error) { console.error('エラー:', error); } finally { setLoading(false); }
    };
    init();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim()) return alert('コメントを入力してください');
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert([{ teacher_id: Number(id), content: formContent, easiness: formEasiness, satisfaction: formSatisfaction, }]);
      if (error) throw error;
      setFormContent(''); setShowForm(false); await fetchReviews(); alert('投稿しました！');
    } catch (error) { console.error('投稿エラー:', error); alert('投稿に失敗しました'); } finally { setIsSubmitting(false); }
  };

  // ★修正: 未選択の星を濃く(text-gray-300 -> text-gray-400)
  const StarInput = ({ label, value, onChange }: { label: string, value: number, onChange: (val: number) => void }) => (
    <div className="mb-4">
      <label className="block text-sm font-bold mb-2 text-gray-800">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={`text-3xl focus:outline-none transition-transform active:scale-90 ${num <= value ? 'text-yellow-400 drop-shadow-sm' : 'text-gray-300'}`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) return <div className="p-8 text-center">読み込み中...</div>;
  if (!teacher) return <div className="p-8 text-center">先生が見つかりませんでした。</div>;

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-blue-500 hover:underline mb-4 inline-block">&larr; 一覧に戻る</Link>
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{teacher.name} 先生</h1>
          <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">{teacher.department}</span>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-700">みんなの評判 ({reviews.length}件)</h2>
          <button onClick={() => setShowForm(!showForm)} className="bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 transition text-sm font-bold shadow-lg">
            {showForm ? '× 閉じる' : '＋ 口コミ投稿'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-200 animate-in slide-in-from-top-2 duration-300">
            <h3 className="font-bold mb-6 text-lg text-center border-b pb-2 text-gray-800">口コミを書く</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
              <StarInput label="楽単度 (取りやすさ)" value={formEasiness} onChange={setFormEasiness} />
              <StarInput label="授業の充実度" value={formSatisfaction} onChange={setFormSatisfaction} />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold mb-2 text-gray-800">コメント</label>
              {/* ★修正: 文字色を真っ黒(text-gray-900)、枠線を濃く、プレースホルダーを濃く */}
              <textarea 
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                className="w-full p-3 border border-gray-400 rounded-lg h-32 text-gray-900 bg-white shadow-sm placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                placeholder="授業の様子や課題の多さなど..."
                required
              />
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition shadow-md">
              {isSubmitting ? '送信中...' : '投稿する'}
            </button>
          </form>
        )}

        <div className="space-y-4 pb-20">
          {reviews.length === 0 ? <p className="text-gray-500 bg-white p-6 rounded-lg text-center">まだ口コミがありません。<br />最初の投稿者になりましょう！</p> : reviews.map((review) => (
            <div key={review.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 border-b border-gray-50 pb-2">
                <div className="text-sm"><span className="font-bold text-gray-500 text-xs">楽単度</span> <span className="ml-1 text-yellow-400 text-lg">{'★'.repeat(review.easiness)}</span></div>
                <div className="text-sm"><span className="font-bold text-gray-500 text-xs">充実度</span> <span className="ml-1 text-yellow-400 text-lg">{'★'.repeat(review.satisfaction)}</span></div>
              </div>
              <p className="text-gray-800 whitespace-pre-wrap break-all leading-relaxed text-sm md:text-base">{review.content}</p>
              <p className="text-xs text-gray-400 mt-3 text-right">{new Date(review.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
