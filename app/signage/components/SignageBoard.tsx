'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Settings, RefreshCw, Loader2, Target, Users } from 'lucide-react';

// 表示するデータの型
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
        `,
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

  // Realtime更新の導入 (ポーリング廃止)
  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('signage-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entries' },
        () => {
          fetchData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, supabase]);

  const toggleSettings = () => setShowSettings(!showSettings);

  return (
    <div className="min-h-screen font-sans overflow-hidden flex flex-col relative bg-bk-beige text-bk-brown">
      {/* ============================================================
          上段: 行射中 (Shooting)
          背景: 薄い赤、ヘッダー: 赤
         ============================================================ */}
      <div className="flex-1 flex flex-col border-b-8 border-bk-brown bg-[#FFF5F5]">
        <div className="bg-bk-red px-8 py-4 flex justify-between items-center shadow-md border-b-4 border-bk-brown shrink-0">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white flex items-center uppercase font-pop">
            <Target size={48} className="mr-4 text-bk-orange fill-bk-orange" />
            SHOOTING{' '}
            <span className="ml-4 text-2xl md:text-4xl font-bold bg-white text-bk-red px-4 py-1 rounded-full">
              ただいまの立
            </span>
          </h1>
          <span className="text-xl md:text-2xl font-black text-white/80 font-pop">
            Current Status
          </span>
        </div>

        <div className="flex-1 p-6 w-full flex items-center justify-center">
          {shootingPlayers.length > 0 ? (
            <div className="grid grid-cols-5 gap-6 w-full h-full max-h-[85vh] items-center">
              {shootingPlayers.map((player) => (
                <PlayerCard key={player.id} player={player} type="shooting" />
              ))}
            </div>
          ) : (
            <div className="w-full text-center text-bk-brown/30 text-5xl font-black font-pop uppercase tracking-widest">
              No Players
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          下段: 呼出/控え (Called)
          背景: 薄い緑、ヘッダー: 緑
         ============================================================ */}
      <div className="flex-1 flex flex-col bg-[#F0FFF4]">
        <div className="bg-bk-green px-8 py-4 flex justify-between items-center shadow-md border-y-4 border-bk-brown shrink-0">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white flex items-center uppercase font-pop">
            <Users size={48} className="mr-4 text-white" />
            STANDBY{' '}
            <span className="ml-4 text-2xl md:text-4xl font-bold bg-white text-bk-green px-4 py-1 rounded-full">
              次の立（控え）
            </span>
          </h1>
          <span className="text-xl md:text-2xl font-black text-white/80 font-pop">
            Next Group
          </span>
        </div>

        <div className="flex-1 p-6 w-full flex items-center justify-center">
          {calledPlayers.length > 0 ? (
            <div className="grid grid-cols-5 gap-6 w-full h-full max-h-[85vh] items-center">
              {calledPlayers.map((player) => (
                <PlayerCard key={player.id} player={player} type="called" />
              ))}
            </div>
          ) : (
            <div className="w-full text-center text-bk-brown/30 text-4xl font-black font-pop uppercase tracking-widest">
              Waiting...
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          フッター・設定エリア
         ============================================================ */}
      <div className="absolute bottom-6 right-6 flex items-center gap-4 z-50">
        <div className="bg-bk-brown text-bk-beige text-sm font-bold px-3 py-1.5 rounded-full border-2 border-white shadow-lg font-pop">
          UPDATE: {lastUpdated.toLocaleTimeString()}
        </div>

        <button
          onClick={toggleSettings}
          className="p-3 bg-white hover:bg-bk-beige rounded-full shadow-[4px_4px_0px_0px_rgba(80,35,20,1)] text-bk-brown border-4 border-bk-brown transition-all active:translate-y-[2px] active:shadow-none"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Settings size={28} />
          )}
        </button>

        {showSettings && (
          <div className="absolute bottom-20 right-0 bg-white text-bk-brown p-5 rounded-2xl shadow-[8px_8px_0px_0px_rgba(80,35,20,0.3)] w-72 border-4 border-bk-brown animate-in slide-in-from-bottom-2 fade-in">
            <h3 className="font-black mb-3 border-b-2 border-bk-brown/20 pb-2 text-lg uppercase font-pop">
              Settings
            </h3>
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase">
                Target Round
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(['am1', 'am2', 'pm1'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setCurrentTab(tab);
                      fetchData();
                    }}
                    className={`py-2 px-1 text-sm font-black rounded-lg border-2 transition-all font-pop uppercase ${
                      currentTab === tab
                        ? 'bg-bk-orange text-bk-brown border-bk-brown shadow-sm'
                        : 'bg-white text-gray-400 border-gray-300 hover:border-bk-brown'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={fetchData}
              className="mt-6 w-full flex items-center justify-center py-3 bg-bk-brown hover:bg-[#3a190f] rounded-xl text-sm font-black text-white shadow-sm active:scale-95 transition-all"
            >
              <RefreshCw size={16} className="mr-2" />
              REFRESH
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
      relative overflow-hidden rounded-3xl border-4 h-full flex flex-col justify-center w-full shadow-[6px_6px_0px_0px_rgba(80,35,20,0.15)]
      ${isShooting ? 'bg-white border-bk-brown' : 'bg-white border-bk-green'}
      transition-all duration-500
    `}
    >
      {/* 立順バッジ */}
      <div
        className={`
        absolute top-0 right-0 px-4 py-2 rounded-bl-2xl font-black font-pop text-2xl border-b-4 border-l-4
        ${isShooting ? 'bg-bk-red text-white border-bk-brown' : 'bg-bk-green text-white border-bk-green'}
      `}
      >
        {player.order}
      </div>

      <div className="p-4 md:p-6 flex flex-col h-full justify-center">
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`
             font-pop font-black px-3 py-1 rounded-full text-base md:text-lg border-2
             ${
               isShooting
                 ? 'bg-bk-brown text-white border-bk-brown'
                 : 'bg-bk-beige text-bk-brown border-bk-brown'
             }
           `}
          >
            No.{player.bib_number}
          </span>
        </div>

        {/* 名前 */}
        <div
          className={`
          font-black mb-2 truncate leading-tight tracking-tight
          ${
            isShooting
              ? 'text-3xl md:text-4xl lg:text-5xl text-bk-brown'
              : 'text-2xl md:text-3xl lg:text-4xl text-gray-800'
          }
        `}
        >
          {player.player_name}
        </div>

        {/* チーム名 */}
        <div
          className={`
          truncate font-bold
          ${
            isShooting
              ? 'text-xl md:text-2xl text-bk-red'
              : 'text-lg md:text-xl text-bk-green'
          }
        `}
        >
          {player.team_name}
        </div>
      </div>
    </div>
  );
};
