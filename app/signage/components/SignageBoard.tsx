'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Settings, RefreshCw, Loader2 } from 'lucide-react';

type SignagePlayer = {
  id: string;
  bib_number: string;
  player_name: string;
  team_name: string;
  order: number;
  status: string;
};

export default function SignageBoard() {
  const supabase = createClient();
  const [currentTab, setCurrentTab] = useState<'am1' | 'am2' | 'pm1'>('am1');
  const [shootingPlayers, setShootingPlayers] = useState<SignagePlayer[]>([]);
  const [calledPlayers, setCalledPlayers] = useState<SignagePlayer[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const statusCol = `status_${currentTab}`;
      const orderCol = `order_${currentTab}`;

      const { data: entries, error } = await supabase
        .from('entries')
        .select(
          `
          id,
          bib_number,
          ${orderCol},
          ${statusCol},
          participants (
            name,
            teams ( name )
          )
        `
        )
        .neq('is_absent', true)
        .in(statusCol, ['shooting', 'called'])
        .order(orderCol, { ascending: true });

      if (error) throw error;

      const players: SignagePlayer[] = (entries || []).map((entry: any) => ({
        id: entry.id,
        bib_number: entry.bib_number,
        player_name: entry.participants?.name || '不明',
        team_name: entry.participants?.teams?.name || '',
        order: entry[orderCol],
        status: entry[statusCol],
      }));

      setShootingPlayers(players.filter((p) => p.status === 'shooting'));
      setCalledPlayers(players.filter((p) => p.status === 'called'));
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Signage fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, currentTab]);

  // 【修正箇所】setIntervalを廃止し、Supabase Realtimeを使用
  useEffect(() => {
    // 1. 初回データ取得
    fetchData();

    // 2. リアルタイム購読の設定
    const channel = supabase
      .channel('entries_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // 更新があった時のみ反応
          schema: 'public',
          table: 'entries',
        },
        () => {
          // 変更を検知したらデータを再取得
          fetchData();
        }
      )
      .subscribe();

    // 3. クリーンアップ
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, supabase]);

  const toggleSettings = () => setShowSettings(!showSettings);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans overflow-hidden flex flex-col relative">
      {/* 上段: 行射中 (Shooting) */}
      <div className="flex-1 flex flex-col border-b-8 border-gray-800 bg-[#34675C]/10">
        <div className="bg-[#34675C] px-8 py-3 flex justify-between items-center shadow-md shrink-0">
          <h1 className="text-3xl md:text-4xl font-bold tracking-wider text-white flex items-center">
            <span className="inline-block w-5 h-5 bg-red-500 rounded-full animate-pulse mr-4"></span>
            ただいまの立 (行射)
          </h1>
          <span className="text-xl font-mono opacity-80">Current Shooting</span>
        </div>

        <div className="flex-1 p-4 w-full flex items-center">
          {shootingPlayers.length > 0 ? (
            <div className="grid grid-cols-5 gap-4 w-full h-full max-h-[80vh] items-center">
              {shootingPlayers.map((player) => (
                <PlayerCard key={player.id} player={player} type="shooting" />
              ))}
            </div>
          ) : (
            <div className="w-full text-center text-gray-500 text-4xl font-bold animate-pulse">
              行射中の選手はいません
            </div>
          )}
        </div>
      </div>

      {/* 下段: 呼出/控え (Called) */}
      <div className="flex-1 flex flex-col bg-[#F0F4F5]/5">
        <div className="bg-[#5C7C8A] px-8 py-3 flex justify-between items-center shadow-md shrink-0">
          <h1 className="text-3xl md:text-4xl font-bold tracking-wider text-white">
            次の立 (控え)
          </h1>
          <span className="text-xl font-mono opacity-80">Next / Standby</span>
        </div>

        <div className="flex-1 p-4 w-full flex items-center">
          {calledPlayers.length > 0 ? (
            <div className="grid grid-cols-5 gap-4 w-full h-full max-h-[80vh] items-center">
              {calledPlayers.map((player) => (
                <PlayerCard key={player.id} player={player} type="called" />
              ))}
            </div>
          ) : (
            <div className="w-full text-center text-gray-600 text-3xl font-bold opacity-50">
              呼出中の選手はいません
            </div>
          )}
        </div>
      </div>

      {/* フッター・設定エリア */}
      <div className="absolute bottom-4 right-4 flex items-center gap-4 z-50">
        <div className="text-gray-500 text-xs font-mono bg-black/50 px-2 py-1 rounded">
          Last update: {lastUpdated.toLocaleTimeString()}
        </div>

        <button
          onClick={toggleSettings}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full shadow-lg text-white transition-colors"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <Settings />}
        </button>

        {showSettings && (
          <div className="absolute bottom-14 right-0 bg-white text-gray-900 p-4 rounded-lg shadow-xl w-64 border border-gray-200 animate-in slide-in-from-bottom-2 fade-in">
            <h3 className="font-bold mb-3 border-b pb-1 text-gray-700">
              表示設定
            </h3>
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-1">対象の予選を選択</p>
              <div className="grid grid-cols-3 gap-2">
                {(['am1', 'am2', 'pm1'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setCurrentTab(tab);
                      fetchData();
                    }}
                    className={`py-2 px-1 text-sm font-bold rounded border ${
                      currentTab === tab
                        ? 'bg-[#34675C] text-white border-[#34675C]'
                        : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {tab === 'am1'
                      ? '午前1'
                      : tab === 'am2'
                      ? '午前2'
                      : '午後1'}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={fetchData}
              className="mt-4 w-full flex items-center justify-center py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-bold text-gray-700"
            >
              <RefreshCw size={14} className="mr-2" />
              即時更新
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// 選手表示用カードコンポーネント
const PlayerCard = ({
  player,
  type,
}: {
  player: SignagePlayer;
  type: 'shooting' | 'called';
}) => {
  const isShooting = type === 'shooting';

  return (
    <div
      className={`
      relative overflow-hidden rounded-xl shadow-lg border-l-8 h-full flex flex-col justify-center
      ${
        isShooting
          ? 'bg-white border-l-[#34675C]'
          : 'bg-gray-100 border-l-[#5C7C8A]'
      }
      transform transition-all duration-500 w-full
    `}
    >
      {/* 立順バッジ */}
      <div className="absolute top-0 right-0 bg-gray-200 text-gray-600 px-3 py-1 rounded-bl-lg font-mono font-bold text-lg">
        {player.order}
      </div>

      <div className="p-3 md:p-4 lg:p-5">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`
             font-mono font-bold px-2 py-0.5 rounded text-xs md:text-sm
             ${
               isShooting
                 ? 'bg-[#34675C]/10 text-[#34675C]'
                 : 'bg-gray-200 text-gray-600'
             }
           `}
          >
            No.{player.bib_number}
          </span>
        </div>

        <div
          className={`
          font-bold mb-1 truncate leading-tight
          ${
            isShooting
              ? 'text-2xl md:text-3xl lg:text-4xl text-gray-900'
              : 'text-xl md:text-2xl lg:text-3xl text-gray-800'
          }
        `}
        >
          {player.player_name}
        </div>

        <div
          className={`
          truncate font-medium
          ${
            isShooting
              ? 'text-base md:text-lg lg:text-xl text-gray-600'
              : 'text-sm md:text-base lg:text-lg text-gray-500'
          }
        `}
        >
          {player.team_name}
        </div>
      </div>
    </div>
  );
};
