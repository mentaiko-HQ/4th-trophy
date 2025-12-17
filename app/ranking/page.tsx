'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// 型定義
type Entry = {
  id: string;
  bib_number: number;
  // 各立の立順
  order_am1: number | null;
  order_am2: number | null;
  order_pm1: number | null;
  // 各立の成績
  score_am1: number | null;
  score_am2: number | null;
  score_pm1: number | null;
  // 各立のステータス (追加)
  status_am1: string | null;
  status_am2: string | null;
  status_pm1: string | null;
  participants: {
    name: string;
    carriage: string | null;
    teams: { name: string } | null;
  };
};

export default function RankingPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'am1' | 'am2' | 'pm1'>('am1');

  // データ取得関数
  const fetchEntries = async () => {
    const { data, error } = await supabase.from('entries').select(`
        id,
        bib_number,
        order_am1, order_am2, order_pm1,
        score_am1, score_am2, score_pm1,
        status_am1, status_am2, status_pm1,
        participants (
          name,
          carriage,
          teams ( name )
        )
      `);

    if (error) {
      console.error('Error:', error);
      setLoading(false);
      return;
    }

    setEntries(data as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();

    const channel = supabase
      .channel('realtime-ranking')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'entries' },
        () => fetchEntries()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 現在のタブに基づいて表示データを加工（フィルタリング・ソート）
  const getDisplayData = () => {
    let targetOrderKey: 'order_am1' | 'order_am2' | 'order_pm1' = 'order_am1';

    if (activeTab === 'am2') targetOrderKey = 'order_am2';
    if (activeTab === 'pm1') targetOrderKey = 'order_pm1';

    return entries
      .filter((e) => e[targetOrderKey] !== null)
      .sort(
        (a, b) => (a[targetOrderKey] as number) - (b[targetOrderKey] as number)
      );
  };

  const displayEntries = getDisplayData();

  // データを5人ごとのチャンクに分割する
  const chunkedEntries: Entry[][] = [];
  for (let i = 0; i < displayEntries.length; i += 5) {
    chunkedEntries.push(displayEntries.slice(i, i + 5));
  }

  // タブ情報
  const getTabInfo = () => {
    if (activeTab === 'am1') return { title: '午前1', maxScore: 2 };
    if (activeTab === 'am2') return { title: '午前2', maxScore: 2 };
    return { title: '午後1', maxScore: 4 };
  };

  const { title, maxScore } = getTabInfo();

  // タブのスタイルクラス
  const getTabClass = (tabName: string) => {
    const baseClass =
      'flex-1 py-4 text-center font-bold text-sm sm:text-base transition-all duration-200 border-b-4 outline-none';
    const activeClass =
      'border-[#34675C] text-[#34675C] bg-white shadow-sm z-10 relative rounded-t-lg';
    const inactiveClass =
      'border-transparent text-[#7DA3A1] hover:text-[#34675C] hover:bg-[#7DA3A1]/10';
    return `${baseClass} ${
      activeTab === tabName ? activeClass : inactiveClass
    }`;
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#324857]">
          <span className="text-[#34675C]">{title}</span> 立順・的中速報
        </h1>
        <div className="flex items-center gap-2 text-xs text-[#34675C] font-bold bg-[#7DA3A1]/20 px-3 py-1 rounded-full">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#86AC41] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#34675C]"></span>
          </span>
          LIVE接続中
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="flex bg-[#7DA3A1]/20 p-1 rounded-t-xl overflow-hidden border-b border-[#7DA3A1]/30 mb-6">
        <button
          onClick={() => setActiveTab('am1')}
          className={getTabClass('am1')}
        >
          午前1
        </button>
        <button
          onClick={() => setActiveTab('am2')}
          className={getTabClass('am2')}
        >
          午前2
        </button>
        <button
          onClick={() => setActiveTab('pm1')}
          className={getTabClass('pm1')}
        >
          午後1
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-[#7DA3A1]">
          データを読み込んでいます...
        </div>
      ) : (
        <div className="border border-[#7DA3A1]/30 rounded-lg shadow-sm overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-[#7DA3A1]/20">
              <TableRow className="border-b border-[#7DA3A1]/30 hover:bg-[#7DA3A1]/10">
                <TableHead className="w-[80px] text-center font-bold text-[#34675C]">
                  立順
                </TableHead>
                <TableHead className="font-bold text-[#324857]">
                  選手名 / 所属
                </TableHead>
                <TableHead className="text-center font-bold w-[80px] text-[#324857]">
                  所作
                </TableHead>
                <TableHead className="text-right font-bold w-[100px] text-[#324857]">
                  的中
                </TableHead>
              </TableRow>
            </TableHeader>
            {/* 5人ごとのグループ（チャンク）単位で TableBody を生成 */}
            {chunkedEntries.length === 0 ? (
              <TableBody>
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-gray-500"
                  >
                    該当するデータがありません
                  </TableCell>
                </TableRow>
              </TableBody>
            ) : (
              chunkedEntries.map((group, groupIndex) => (
                <TableBody
                  key={groupIndex}
                  className="border-b-[3px] border-[#34675C]/30 last:border-0"
                >
                  {group.map((entry) => {
                    // 現在のタブに応じた立順、スコア、ステータスを取得
                    let orderVal: number | null = null;
                    let scoreVal: number | null = null;
                    let statusVal: string | null = null;

                    if (activeTab === 'am1') {
                      orderVal = entry.order_am1;
                      scoreVal = entry.score_am1;
                      statusVal = entry.status_am1;
                    } else if (activeTab === 'am2') {
                      orderVal = entry.order_am2;
                      scoreVal = entry.score_am2;
                      statusVal = entry.status_am2;
                    } else {
                      orderVal = entry.order_pm1;
                      scoreVal = entry.score_pm1;
                      statusVal = entry.status_pm1;
                    }

                    return (
                      <TableRow
                        key={entry.id}
                        className="hover:bg-[#7DA3A1]/10 border-b border-gray-100 last:border-0"
                      >
                        <TableCell className="text-center font-bold text-lg text-[#34675C]">
                          {orderVal}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base font-bold text-[#324857]">
                              {entry.participants.name}
                            </span>
                            {/* ステータスバッジの表示 */}
                            {statusVal === 'called' && (
                              <span className="text-[10px] font-bold text-white bg-[#86AC41] px-2 py-0.5 rounded-full animate-pulse shadow-sm whitespace-nowrap">
                                控えに準備
                              </span>
                            )}
                            {statusVal === 'shooting' && (
                              <span className="text-[10px] font-bold text-white bg-[#34675C] px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                                行射中
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#7DA3A1] mt-0.5 flex flex-wrap gap-2">
                            <span className="bg-[#7DA3A1]/10 px-1.5 py-0.5 rounded border border-[#7DA3A1]/20">
                              No.{entry.bib_number}
                            </span>
                            <span>{entry.participants.teams?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-xs text-gray-600">
                          {entry.participants.carriage}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-2xl font-bold text-[#86AC41]">
                            {scoreVal !== null ? scoreVal : '-'}
                          </span>
                          <span className="text-xs text-[#7DA3A1] ml-1 font-medium">
                            / {maxScore}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              ))
            )}
          </Table>
        </div>
      )}
    </div>
  );
}
