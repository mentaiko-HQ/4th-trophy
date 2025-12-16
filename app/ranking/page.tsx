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
  participants: {
    name: string;
    dan_rank: string | null;
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
        participants (
          name,
          dan_rank,
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

    // 立順が設定されているデータのみ抽出し、立順昇順でソート
    return entries
      .filter((e) => e[targetOrderKey] !== null)
      .sort(
        (a, b) => (a[targetOrderKey] as number) - (b[targetOrderKey] as number)
      );
  };

  const displayEntries = getDisplayData();

  // 現在のタブに応じたラベル情報などを取得
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
      'border-[#CD2C58] text-[#CD2C58] bg-white shadow-sm z-10 relative';
    const inactiveClass =
      'border-transparent text-gray-500 hover:text-[#CD2C58] hover:bg-[#FFE6D4]';
    return `${baseClass} ${
      activeTab === tabName ? activeClass : inactiveClass
    }`;
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          <span className="text-[#CD2C58]">{title}</span> 立順・的中速報
        </h1>
        <div className="flex items-center gap-2 text-xs text-[#CD2C58] font-bold bg-[#FFE6D4] px-3 py-1 rounded-full">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E06B80] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#CD2C58]"></span>
          </span>
          LIVE接続中
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="flex bg-[#FFE6D4] p-1 rounded-t-xl overflow-hidden border-b border-[#FFC69D] mb-6">
        <button
          onClick={() => setActiveTab('am1')}
          className={`rounded-t-lg ${getTabClass('am1')}`}
        >
          午前1
        </button>
        <button
          onClick={() => setActiveTab('am2')}
          className={`rounded-t-lg ${getTabClass('am2')}`}
        >
          午前2
        </button>
        <button
          onClick={() => setActiveTab('pm1')}
          className={`rounded-t-lg ${getTabClass('pm1')}`}
        >
          午後1
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">
          データを読み込んでいます...
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-[#FFE6D4]">
              <TableRow className="border-b border-[#FFC69D] hover:bg-[#FFE6D4]">
                <TableHead className="w-[80px] text-center font-bold text-[#CD2C58]">
                  立順
                </TableHead>
                <TableHead className="font-bold text-gray-700">
                  選手名 / 所属
                </TableHead>
                <TableHead className="text-center font-bold w-[80px] text-gray-700">
                  段位
                </TableHead>
                <TableHead className="text-right font-bold w-[100px] text-gray-700">
                  的中
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayEntries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-gray-500"
                  >
                    該当するデータがありません
                  </TableCell>
                </TableRow>
              ) : (
                displayEntries.map((entry) => {
                  // 現在のタブに応じた立順とスコアを取得
                  let orderVal: number | null = null;
                  let scoreVal: number | null = null;

                  if (activeTab === 'am1') {
                    orderVal = entry.order_am1;
                    scoreVal = entry.score_am1;
                  } else if (activeTab === 'am2') {
                    orderVal = entry.order_am2;
                    scoreVal = entry.score_am2;
                  } else {
                    orderVal = entry.order_pm1;
                    scoreVal = entry.score_pm1;
                  }

                  return (
                    <TableRow
                      key={entry.id}
                      className="hover:bg-[#FFE6D4]/30 border-b border-gray-100 last:border-0"
                    >
                      <TableCell className="text-center font-bold text-lg text-gray-800">
                        {orderVal}
                      </TableCell>
                      <TableCell>
                        <div className="text-base font-bold text-gray-800">
                          {entry.participants.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-2">
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                            No.{entry.bib_number}
                          </span>
                          <span>{entry.participants.teams?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-xs text-gray-600">
                        {entry.participants.dan_rank}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-2xl font-bold text-[#CD2C58]">
                          {scoreVal !== null ? scoreVal : '-'}
                        </span>
                        <span className="text-xs text-gray-400 ml-1 font-medium">
                          / {maxScore}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
