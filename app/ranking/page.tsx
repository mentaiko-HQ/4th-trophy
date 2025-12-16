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
  order_am1: number | null;
  score_am1: number | null;
  bib_number: number; // entriesテーブルにあるbib_number
  participants: {
    name: string;
    dan_rank: string | null;
    teams: { name: string } | null;
  };
};

export default function RankingPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  // データ取得関数
  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from('entries')
      .select(
        `
        id,
        order_am1,
        score_am1,
        bib_number,
        participants (
          name,
          dan_rank,
          teams ( name )
        )
      `
      )
      // bib_numberを participants の中ではなく、ルート（entries）で取得するように変更しました
      .not('order_am1', 'is', null)
      .order('order_am1', { ascending: true });

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
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'entries',
        },
        () => {
          fetchEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          午前1 立順・的中速報
        </h1>
        <div className="flex items-center gap-2 text-xs text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          LIVE接続中
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500">
          データを読み込んでいます...
        </div>
      ) : (
        <div className="border rounded-lg shadow-sm overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[80px] text-center font-bold">
                  立順
                </TableHead>
                <TableHead className="font-bold">選手名 / 所属</TableHead>
                <TableHead className="text-center font-bold w-[80px]">
                  段位
                </TableHead>
                <TableHead className="text-right font-bold w-[80px]">
                  的中
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-slate-50/50">
                  <TableCell className="text-center font-medium text-lg">
                    {entry.order_am1}
                  </TableCell>
                  <TableCell>
                    <div className="text-base font-bold text-slate-900">
                      {entry.participants.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-2">
                      <span className="bg-slate-100 px-1.5 rounded">
                        {/* entry.bib_number を参照するように変更 */}
                        No.{entry.bib_number}
                      </span>
                      <span>{entry.participants.teams?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-xs text-slate-600">
                    {entry.participants.dan_rank}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-2xl font-bold text-indigo-600">
                      {entry.score_am1 !== null ? entry.score_am1 : '-'}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">/ 4</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
