'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// データの型定義
type Teacher = {
  id: number;
  name: string;
  department: string;
};

// レビューの型定義
type ReviewWithTeacher = {
  id: number;
  content: string;
  easiness: number;
  satisfaction: number;
  created_at: string;
  teacher_id: number;
  teacher_name: string;
};

// 先生ごとの統計データの型
type TeacherStat = {
  avgRating: number; // 満足度の平均
  reviewCount: number; // レビュー数
};

// 学部ごとの色設定
const getDepartmentStyle = (dept: string) => {
  switch (dept) {
    case '情報学部':
      return 'bg-sky-200 text-sky-900 border-sky-300 hover:bg-sky-300';
    case '理工学部':
      return 'bg-green-200 text-green-900 border-green-300 hover:bg-green-300';
    case '政治経済学部':
      return 'bg-orange-200 text-orange-900 border-orange-300 hover:bg-orange-300';
    case '教育学部':
      return 'bg-yellow-200 text-yellow-900 border-yellow-300 hover:bg-yellow-300';
    case '保健医療学部':
      return 'bg-pink-200 text-pink-900 border-pink-300 hover:bg-pink-300';
    case '社会学部':
      return 'bg-red-200 text-red-900 border-red-300 hover:bg-red-300';
    default:
      return 'bg-gray-200 text-gray-900 border-gray-300 hover:bg-gray-300';
  }
};

const departments = ['情報学部', '理工学部', '政治経済学部', '教育学部', '保健医療学部', '社会学部'];

export default function Home() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [recentReviews, setRecentReviews] = useState<ReviewWithTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 選択中の学部
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  // 先生ごとの統計情報（IDをキーにしたオブジェクト）
  const [teacherStats, setTeacherStats] = useState<Record<number, TeacherStat>>({});

  // 初回データ取得
  useEffect(() => {
    const fetchTeachers = async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('*');

      if (error) {
        console.error('エラー詳細:', JSON.stringify(error, null, 2));
      } else {
        setTeachers(data || []);
      }
      setLoading(false);
    };

    fetchTeachers();
  }, []);

  // 学部が選択されたら、その学部の最新レビューと「★平均評価」を取得
  useEffect(() => {
    const fetchDeptData = async () => {
      if (!selectedDept || teachers.length === 0) return;

      // 1. その学部に所属する先生のIDリストを作る
      const deptTeacherIds = teachers
        .filter(t => t.department === selectedDept)
        .map(t => t.id);
      
      if (deptTeacherIds.length === 0) {
        setRecentReviews([]);
        setTeacherStats({});
        return;
      }

      // --- A. 最新の口コミを取得 ---
      const { data: recentData } = await supabase
        .from('reviews')
        .select('*')
        .in('teacher_id', deptTeacherIds)
        .order('created_at', { ascending: false })
        .limit(4);

      // ★修正箇所: IDの型変換(String)を追加して確実にマッチさせる
      const reviewsWithNames = (recentData || [])
        .map((r: any) => {
          // 数値と文字列の違いで失敗しないように String() で比較
          const teacher = teachers.find(t => String(t.id) === String(r.teacher_id));
          
          // 先生がいなければ null を返す
          if (!teacher) return null;
          
          return {
            ...r,
            teacher_name: teacher.name
          };
        })
        // null を取り除くフィルタリング
        .filter((r) => r !== null) as ReviewWithTeacher[];

      setRecentReviews(reviewsWithNames);

      // --- B. 平均点計算用にその学部の全レビューを取得 ---
      const { data: allReviews } = await supabase
        .from('reviews')
        .select('teacher_id, satisfaction') // 必要なカラムだけ取得
        .in('teacher_id', deptTeacherIds);

      // 計算処理
      const stats: Record<number, TeacherStat> = {};
      
      (allReviews || []).forEach((r: any) => {
        if (!stats[r.teacher_id]) {
          stats[r.teacher_id] = { avgRating: 0, reviewCount: 0 };
        }
        stats[r.teacher_id].avgRating += r.satisfaction;
        stats[r.teacher_id].reviewCount += 1;
      });

      // 合計を個数で割って平均を出す
      Object.keys(stats).forEach((key: any) => {
        const id = Number(key);
        stats[id].avgRating = stats[id].avgRating / stats[id].reviewCount;
      });

      setTeacherStats(stats);
    };

    fetchDeptData();
  }, [selectedDept, teachers]);

  // フィルタリング処理
  const filteredTeachers = teachers.filter((teacher) => {
    if (teacher.department !== selectedDept) return false;
    const term = searchTerm.toLowerCase();
    return teacher.name.includes(term);
  });

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center tracking-wider">
          裏シラバス
        </h1>
        
        <p className="text-center text-xs text-gray-500 mb-6 bg-gray-100 inline-block px-4 py-1 rounded-full mx-auto block w-fit">
          🔒 このサイトは完全に匿名です。誰が投稿したか特定されることはありません。
        </p>

        {/* 掲示板へのリンクボタン */}
        <div className="text-center mb-10">
          <Link 
            href="/board" 
            className="inline-flex items-center gap-2 bg-gray-800 text-white font-bold py-2 px-6 rounded-full hover:bg-black transition shadow-lg transform hover:-translate-y-1"
          >
            <span>💬</span> 匿名掲示板へ
          </Link>
        </div>

        {/* 画面切り替えロジック */}
        {!selectedDept ? (
          /* ▼ パターンA：学部選択画面 ▼ */
          <div className="animate-in fade-in zoom-in duration-300">
            <h2 className="text-xl text-center text-gray-600 mb-6 font-bold">学部を選んでください</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`
                    ${getDepartmentStyle(dept)}
                    py-8 text-xl font-bold rounded-2xl shadow-md border-b-4 active:border-b-0 active:translate-y-1 transition-all
                  `}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ▼ パターンB：先生一覧画面 ▼ */
          <div className="animate-in slide-in-from-right duration-300">
            {/* ナビゲーション */}
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={() => {
                  setSelectedDept(null); 
                  setSearchTerm('');
                  setRecentReviews([]);
                  setTeacherStats({}); // リセット
                }}
                className="text-gray-500 hover:text-gray-800 font-bold flex items-center gap-1"
              >
                &larr; 学部選択に戻る
              </button>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${getDepartmentStyle(selectedDept)}`}>
                {selectedDept}
              </span>
            </div>

            {/* 新着口コミエリア */}
            {recentReviews.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
                  🔥 {selectedDept}の新着口コミ
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {recentReviews.map((review) => (
                    <Link href={`/teachers/${review.teacher_id}`} key={review.id}>
                      <div className="bg-white border-l-4 border-yellow-400 p-3 rounded shadow-sm hover:shadow-md transition cursor-pointer">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm text-gray-800">{review.teacher_name} 先生</span>
                          <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                        {/* break-all で長文対策済み */}
                        <p className="text-gray-600 text-sm line-clamp-2 break-all">{review.content}</p>
                        <div className="mt-2 text-xs text-yellow-500">
                          楽単: {'★'.repeat(review.easiness)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 検索バー */}
            <div className="mb-6">
              <input
                type="text"
                placeholder={`${selectedDept}の先生を検索...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-4 rounded-xl shadow-sm border border-gray-200 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* 先生リスト */}
            <div className="bg-white p-6 rounded-2xl shadow-xl min-h-[300px]">
              <h2 className="text-xl font-bold mb-4 pb-2 border-b border-gray-100 text-gray-700 flex justify-between items-end">
                <span>教員一覧</span>
                <span className="text-sm font-normal text-gray-400">{filteredTeachers.length}名</span>
              </h2>
              
              {loading ? (
                <div className="py-10 text-center text-gray-500">読み込み中...</div>
              ) : filteredTeachers.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-lg">該当する先生が見つかりません 😢</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredTeachers.map((teacher) => {
                    // この先生の統計データを取得
                    const stat = teacherStats[teacher.id];
                    
                    return (
                      <Link href={`/teachers/${teacher.id}`} key={teacher.id}>
                        <div className="group border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition bg-white cursor-pointer h-full flex items-center justify-between">
                          <div>
                            <span className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition block">
                              {teacher.name} <span className="text-sm font-normal text-gray-400 ml-1">先生</span>
                            </span>
                            
                            {/* 平均評価の表示エリア */}
                            <div className="text-sm mt-1 text-gray-500 flex items-center gap-2">
                              {stat ? (
                                <>
                                  <span className="text-yellow-400">
                                    {'★'.repeat(Math.round(stat.avgRating))}
                                    <span className="text-gray-300">
                                      {'★'.repeat(5 - Math.round(stat.avgRating))}
                                    </span>
                                  </span>
                                  <span className="text-xs text-gray-400">({stat.reviewCount}件)</span>
                                </>
                              ) : (
                                <span className="text-xs text-gray-300">評価なし</span>
                              )}
                            </div>
                          </div>

                          <span className="text-gray-300 group-hover:text-blue-400">&rarr;</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
