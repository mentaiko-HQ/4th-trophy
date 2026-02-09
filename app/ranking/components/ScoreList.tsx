'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Trophy,
  Target,
  Filter,
  ChevronRight,
  ChevronLeft,
  Search,
  X,
  Medal,
  Crosshair,
  HelpCircle,
  ListOrdered,
  Star,
  Info,
  Activity,
  Megaphone,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  BarChart2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';

// ------------------------------------------------------------------
// 型定義
// ------------------------------------------------------------------

export interface TournamentSettings {
  current_phase: 'preparing' | 'qualifier' | 'tally' | 'final' | 'finished';
  announcement: string | null;
  individual_prize_count: number;
  team_prize_count: number;
  show_phase?: boolean;
  show_announcement?: boolean;
}

export interface PlayerData {
  id: string;
  bib_number: string | number;
  player_name: string;
  team_name: string;
  order_am1?: number | null;
  order_am2?: number | null;
  order_pm1?: number | null;
  status_am1?: string | null;
  status_am2?: string | null;
  status_pm1?: string | null;
  score_am1: number | null;
  score_am2: number | null;
  score_pm1: number | null;
  total_score: number;
  provisional_ranking: number | null;
  final_ranking?: number | null;
  prev_ranking?: number | null;
  playoff_type?: 'izume' | 'enkin' | null;
  semifinal_score?: number | null;
  semifinal_results?: number | null;
  dan_rank?: string | null;
  carriage?: string | null;
}

interface ScoreListProps {
  players: PlayerData[];
  settings?: TournamentSettings | null;
  playoffPlayers?: PlayerData[];
}

type SortKey =
  | 'bib_number'
  | 'player_name'
  | 'order_am1'
  | 'order_am2'
  | 'order_pm1';

// ------------------------------------------------------------------
// コンポーネント実装
// ------------------------------------------------------------------

export default function ScoreList({
  players = [],
  settings,
  playoffPlayers = [],
}: ScoreListProps) {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<
    'order_list' | 'total' | 'am1' | 'am2' | 'pm1' | 'reference'
  >('order_list');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('bib_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showOpening, setShowOpening] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const tabsListRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel('score-list-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entries' },
        () => {
          router.refresh();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tournament_settings' },
        () => {
          router.refresh();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  const checkScroll = () => {
    if (tabsListRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsListRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsListRef.current) {
      const scrollAmount = 150;
      tabsListRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    setIsClient(true);
    const hasSeen = sessionStorage.getItem('hasSeenRankingOpening');

    if (!hasSeen) {
      setShowOpening(true);
      const timer = setTimeout(() => {
        setShowOpening(false);
        sessionStorage.setItem('hasSeenRankingOpening', 'true');
      }, 1500);

      setIsInitialized(true);
      setTimeout(checkScroll, 1600);
      return () => clearTimeout(timer);
    } else {
      setShowOpening(false);
      setIsInitialized(true);
      setTimeout(checkScroll, 0);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const safePlayers = useMemo(
    () => (Array.isArray(players) ? players : []),
    [players],
  );
  const safePlayoffPlayers = useMemo(
    () => (Array.isArray(playoffPlayers) ? playoffPlayers : []),
    [playoffPlayers],
  );

  const getPhaseInfo = (phase?: string) => {
    const baseClass =
      'border-4 rounded-xl font-bold px-4 py-2 flex items-center justify-between shadow-sm';
    switch (phase) {
      case 'preparing':
        return {
          label: '準備中。。。',
          className: `${baseClass} bg-teal-100 border-teal-700 text-teal-900`,
          iconClass: 'text-teal-700',
        };
      case 'qualifier':
        return {
          label: '予選進行中',
          className: `${baseClass} bg-blue-100 border-blue-700 text-blue-900`,
          iconClass: 'text-blue-700',
        };
      case 'tally':
        return {
          label: '集計中',
          className: `${baseClass} bg-bk-orange border-bk-brown text-bk-brown`,
          iconClass: 'text-bk-brown',
        };
      case 'final':
        return {
          label: '決勝進行中',
          className: `${baseClass} bg-bk-red border-bk-brown text-white`,
          iconClass: 'text-white',
        };
      case 'finished':
        return {
          label: '全日程終了',
          className: `${baseClass} bg-gray-200 border-gray-600 text-gray-800`,
          iconClass: 'text-gray-600',
        };
      default:
        return {
          label: '',
          className: `${baseClass} bg-gray-100 border-gray-400 text-gray-600`,
          iconClass: 'text-gray-400',
        };
    }
  };

  const phaseInfo = getPhaseInfo(settings?.current_phase);

  const renderScore = (score: number | null | undefined, maxScore: number) => {
    if (score == null) return <span className="text-gray-400 font-pop">-</span>;
    const isMax = score === maxScore;
    return (
      <div className="flex items-center justify-center gap-1">
        <span
          className={`font-pop font-black text-xl ${isMax ? 'text-bk-red' : 'text-bk-brown'}`}
        >
          {score}
        </span>
        {isMax && (
          <Star
            size={16}
            className="text-bk-orange fill-bk-orange"
            aria-label="皆中"
          />
        )}
      </div>
    );
  };

  const renderOrderInfo = (
    order: number | null | undefined,
    status: string | null | undefined,
  ) => {
    const orderDisplay = order ? (
      <span className="text-lg font-pop font-black text-bk-brown">{order}</span>
    ) : (
      <span className="text-gray-400">-</span>
    );
    if (status === 'shooting') {
      return (
        <div className="flex flex-col items-center">
          {orderDisplay}
          <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full bg-bk-red text-white text-[10px] font-bold border-2 border-bk-brown animate-pulse whitespace-nowrap">
            行射中
          </span>
        </div>
      );
    }
    if (status === 'called') {
      return (
        <div className="flex flex-col items-center">
          {orderDisplay}
          <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold border-2 border-blue-800 whitespace-nowrap">
            控え
          </span>
        </div>
      );
    }
    return orderDisplay;
  };

  const displayOrder = (order: number | null | undefined) =>
    order ? (
      <span className="font-pop font-black text-lg text-bk-brown">{order}</span>
    ) : (
      '-'
    );

  const filteredPlayers = useMemo(() => {
    if (!Array.isArray(safePlayers)) return [];
    let result = safePlayers;
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = safePlayers.filter((player) => {
        return (
          player.player_name.toLowerCase().includes(lowerTerm) ||
          player.team_name.toLowerCase().includes(lowerTerm) ||
          String(player.bib_number).includes(lowerTerm)
        );
      });
    }
    const sortedResult = [...result];
    switch (activeTab) {
      case 'order_list':
        sortedResult.sort((a, b) => {
          let compareVal = 0;
          if (sortKey === 'bib_number') {
            compareVal =
              (Number(a.bib_number) || 0) - (Number(b.bib_number) || 0);
          } else if (sortKey === 'player_name') {
            compareVal = a.player_name.localeCompare(b.player_name, 'ja');
          } else {
            const valA = a[sortKey] ?? Number.MAX_SAFE_INTEGER;
            const valB = b[sortKey] ?? Number.MAX_SAFE_INTEGER;
            compareVal = valA - valB;
          }
          return sortOrder === 'asc' ? compareVal : -compareVal;
        });
        break;
      case 'am1':
        sortedResult.sort(
          (a, b) =>
            (a.order_am1 ?? Number.MAX_SAFE_INTEGER) -
            (b.order_am1 ?? Number.MAX_SAFE_INTEGER),
        );
        break;
      case 'am2':
        sortedResult.sort(
          (a, b) =>
            (a.order_am2 ?? Number.MAX_SAFE_INTEGER) -
            (b.order_am2 ?? Number.MAX_SAFE_INTEGER),
        );
        break;
      case 'pm1':
        sortedResult.sort(
          (a, b) =>
            (a.order_pm1 ?? Number.MAX_SAFE_INTEGER) -
            (b.order_pm1 ?? Number.MAX_SAFE_INTEGER),
        );
        break;
      case 'total':
      case 'reference':
      default:
        break;
    }
    return sortedResult;
  }, [safePlayers, searchTerm, activeTab, sortKey, sortOrder]);

  const getCurrentTabData = (player: PlayerData) => {
    switch (activeTab) {
      case 'am1':
        return {
          order: player.order_am1,
          score: player.score_am1,
          status: player.status_am1,
        };
      case 'am2':
        return {
          order: player.order_am2,
          score: player.score_am2,
          status: player.status_am2,
        };
      case 'pm1':
        return {
          order: player.order_pm1,
          score: player.score_pm1,
          status: player.status_pm1,
        };
      default:
        return null;
    }
  };

  const createPlayerGroups = <T,>(array: T[]): T[][] => {
    const totalPlayers = array.length;
    if (totalPlayers === 0) return [];

    const maxPerGroup = 5;
    const totalGroups = Math.ceil(totalPlayers / maxPerGroup);
    const numGroupsOf4 = totalGroups * maxPerGroup - totalPlayers;

    if (numGroupsOf4 > totalGroups) {
      const baseSize = Math.floor(totalPlayers / totalGroups);
      const remainder = totalPlayers % totalGroups;
      const groups: T[][] = [];
      let startIndex = 0;
      for (let i = 0; i < totalGroups; i++) {
        const size = baseSize + (i < remainder ? 1 : 0);
        groups.push(array.slice(startIndex, startIndex + size));
        startIndex += size;
      }
      return groups;
    }

    const numGroupsOf5 = totalGroups - numGroupsOf4;
    const groups: T[][] = [];
    let startIndex = 0;

    for (let i = 0; i < numGroupsOf5; i++) {
      groups.push(array.slice(startIndex, startIndex + 5));
      startIndex += 5;
    }
    for (let i = 0; i < numGroupsOf4; i++) {
      groups.push(array.slice(startIndex, startIndex + 4));
      startIndex += 4;
    }
    return groups;
  };

  const isGroupedView = activeTab !== 'total' && activeTab !== 'reference';
  const playerGroups = isGroupedView
    ? createPlayerGroups(filteredPlayers)
    : [filteredPlayers];

  const calculateReferenceStats = (
    key: 'team_name' | 'dan_rank' | 'carriage',
  ) => {
    const groups: Record<
      string,
      { count: number; am1: number; am2: number; pm1: number }
    > = {};
    safePlayers.forEach((player) => {
      const groupKey = player[key] ?? '未設定';
      if (!groups[groupKey]) {
        groups[groupKey] = { count: 0, am1: 0, am2: 0, pm1: 0 };
      }
      groups[groupKey].count += 1;
      groups[groupKey].am1 += player.score_am1 || 0;
      groups[groupKey].am2 += player.score_am2 || 0;
      groups[groupKey].pm1 += player.score_pm1 || 0;
    });
    return Object.entries(groups)
      .map(([name, stats]) => ({
        name,
        count: stats.count,
        avg_am1: (stats.am1 / stats.count).toFixed(2),
        avg_am2: (stats.am2 / stats.count).toFixed(2),
        avg_pm1: (stats.pm1 / stats.count).toFixed(2),
        avg_total: ((stats.am1 + stats.am2 + stats.pm1) / stats.count).toFixed(
          2,
        ),
      }))
      .sort((a, b) => parseFloat(b.avg_total) - parseFloat(a.avg_total));
  };

  if (!isInitialized) return <div className="min-h-screen bg-bk-beige"></div>;

  return (
    <>
      {isClient && showOpening && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
          <style jsx global>{`
            .poyon {
              animation: poyon 1.1s linear 0s 1;
            }
            @keyframes poyon {
              0% {
                transform: scale(0.8, 1.4) translate(0%, -100%);
                opacity: 0;
              }
              10% {
                transform: scale(0.8, 1.4) translate(0%, -15%);
                opacity: 1;
              }
              20% {
                transform: scale(1.4, 0.6) translate(0%, 30%);
              }
              30% {
                transform: scale(0.9, 1.1) translate(0%, -10%);
              }
              40% {
                transform: scale(0.95, 1.2) translate(0%, -30%);
              }
              50% {
                transform: scale(0.95, 1.2) translate(0%, -10%);
              }
              60% {
                transform: scale(1.1, 0.9) translate(0%, 5%);
              }
              70% {
                transform: scale(1, 1) translate(0%, 0%);
              }
              100% {
                transform: scale(1, 1) translate(0%, 0%);
              }
            }
          `}</style>
          <div className="poyon flex flex-col items-center">
            <Image
              src="/images/matomentaiko.png"
              alt="Opening Animation"
              width={200}
              height={200}
              className="object-contain w-[40vw] max-w-50 h-auto"
              priority={true}
              unoptimized={true}
            />
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto pb-10 font-sans text-bk-brown relative">
        <div className="mb-6 space-y-3 px-1">
          {settings?.show_phase !== false && settings?.current_phase && (
            <div className={phaseInfo?.className}>
              <span className="font-bold text-sm flex items-center">
                <Activity
                  size={20}
                  className={`mr-2 ${phaseInfo?.iconClass}`}
                />
                現在の状況:{' '}
                <span className="ml-2 text-lg font-black">
                  {phaseInfo?.label}
                </span>
              </span>
            </div>
          )}

          {settings?.show_announcement !== false && settings?.announcement && (
            <div className="bg-white border-4 border-bk-orange p-4 rounded-xl shadow-sm flex items-start">
              <Megaphone
                size={24}
                className="text-bk-orange mt-0.5 mr-3 shrink-0"
              />
              <p className="text-base font-bold text-bk-brown whitespace-pre-wrap leading-relaxed">
                {settings.announcement}
              </p>
            </div>
          )}

          {safePlayoffPlayers.length > 0 && (
            <div className="bg-red-100 border-4 border-bk-red p-4 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center mb-2">
                <Target className="text-bk-red mr-2" size={24} />
                <h3 className="font-black text-xl text-bk-red">
                  順位決定戦（競射）対象者
                </h3>
              </div>
              <p className="text-sm font-bold text-bk-red mb-3">
                入賞枠（{settings?.individual_prize_count}
                位まで）を決定するため、以下の選手は競射の対象となります。
              </p>
              <div className="flex flex-wrap gap-2">
                {safePlayoffPlayers.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-base font-black bg-white text-bk-red border-2 border-bk-red shadow-sm"
                  >
                    <span className="text-xs mr-1 font-normal opacity-80">
                      No.{p.bib_number}
                    </span>
                    {p.player_name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mb-4 px-1">
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center text-xs font-black text-bk-brown bg-white px-4 py-2 rounded-full border-2 border-bk-brown hover:bg-bk-beige transition-all shadow-[2px_2px_0px_0px_rgba(80,35,20,1)] active:shadow-none active:translate-y-[2px]"
          >
            <Info size={16} className="mr-1.5" />
            画面の見方・ルール
          </button>
        </div>

        <div className="relative mb-6 group">
          {canScrollLeft && (
            <button
              onClick={() => scrollTabs('left')}
              className="absolute left-0 top-0 bottom-0 z-10 w-10 bg-linear-to-r from-bk-beige to-transparent flex items-center justify-start pl-1"
              aria-label="左へスクロール"
            >
              <ChevronLeft size={24} className="text-bk-brown drop-shadow-sm" />
            </button>
          )}

          <div
            ref={tabsListRef}
            onScroll={checkScroll}
            className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth relative px-1 pb-2"
          >
            {[
              { id: 'order_list', label: '立順表' },
              { id: 'am1', label: '午前' },
              { id: 'am2', label: '午後1' },
              { id: 'pm1', label: '午後2' },
              { id: 'total', label: '総合' },
              { id: 'reference', label: '参考' },
            ].map((tab) => (
              <button
                key={tab.id}
                data-tab={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex-shrink-0 min-w-20 py-2 px-4 text-sm font-black rounded-full border-2 transition-all duration-200 whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? 'bg-bk-brown text-white border-bk-brown shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)]'
                      : 'bg-white text-bk-brown border-bk-brown hover:bg-bk-beige shadow-[2px_2px_0px_0px_rgba(80,35,20,1)]'
                  }
                  active:translate-y-[2px] active:shadow-none
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {canScrollRight && (
            <button
              onClick={() => scrollTabs('right')}
              className="absolute right-0 top-0 bottom-0 z-10 w-10 bg-linear-to-l from-bk-beige to-transparent flex items-center justify-end pr-1"
              aria-label="右へスクロール"
            >
              <ChevronRight
                size={24}
                className="text-bk-brown drop-shadow-sm"
              />
            </button>
          )}
        </div>

        <div className="space-y-4 px-1">
          {activeTab === 'reference' ? (
            <div className="space-y-6">
              {['team_name', 'dan_rank', 'carriage'].map((key) => {
                const title =
                  key === 'team_name'
                    ? 'チーム別成績'
                    : key === 'dan_rank'
                      ? '段位別成績'
                      : '所作別成績';
                const stats = calculateReferenceStats(key as any);
                return (
                  <div
                    key={key}
                    className="bg-white rounded-2xl border-4 border-bk-brown overflow-hidden shadow-[6px_6px_0px_0px_rgba(80,35,20,0.2)]"
                  >
                    <div className="bg-bk-green px-4 py-3 border-b-4 border-bk-brown flex items-center text-white">
                      <BarChart2 size={24} className="mr-2" />
                      <h3 className="font-black text-lg">{title}</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-center">
                        <thead className="text-xs text-bk-brown bg-bk-beige/50 uppercase font-bold border-b-2 border-bk-brown">
                          <tr>
                            <th className="px-4 py-3 text-left">名称</th>
                            <th className="px-2 py-3">人数</th>
                            <th className="px-2 py-3">午前</th>
                            <th className="px-2 py-3">午後１</th>
                            <th className="px-2 py-3">午後２</th>
                            <th className="px-2 py-3 bg-bk-orange/20 text-bk-brown font-black">
                              平均
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-bk-brown/10">
                          {stats.map((row) => (
                            <tr key={row.name} className="hover:bg-yellow-50">
                              <td className="px-4 py-3 text-left font-bold text-bk-brown">
                                {row.name}
                              </td>
                              <td className="px-2 py-3 font-medium">
                                {row.count}
                              </td>
                              <td className="px-2 py-3 font-pop">
                                {row.avg_am1}
                              </td>
                              <td className="px-2 py-3 font-pop">
                                {row.avg_am2}
                              </td>
                              <td className="px-2 py-3 font-pop">
                                {row.avg_pm1}
                              </td>
                              <td className="px-2 py-3 bg-bk-orange/10 font-pop font-black text-bk-red text-lg">
                                {row.avg_total}
                              </td>
                            </tr>
                          ))}
                          {stats.length === 0 && (
                            <tr>
                              <td
                                colSpan={6}
                                className="py-8 text-gray-400 font-bold"
                              >
                                データがありません
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              {/* コントロールバー */}
              <div className="bg-white border-4 border-bk-brown rounded-2xl p-3 shadow-[6px_6px_0px_0px_rgba(80,35,20,0.2)] mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-black text-bk-brown ml-1">
                    HIT:{' '}
                    <span className="text-bk-red text-lg font-pop">
                      {filteredPlayers.length}
                    </span>{' '}
                    / {safePlayers.length}
                  </span>
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`flex items-center text-xs font-black border-2 rounded-full px-4 py-2 transition-all active:translate-y-0.5 ${isFilterOpen ? 'bg-bk-brown text-white border-bk-brown' : 'bg-white text-bk-brown border-bk-brown hover:bg-bk-beige'}`}
                  >
                    <Filter size={14} className="mr-1" />
                    {isFilterOpen ? 'CLOSE' : 'FILTER'}
                  </button>
                </div>
                {activeTab === 'order_list' && (
                  <div className="flex justify-end items-center gap-2 mb-1 px-1 border-t-2 border-bk-brown/10 pt-2">
                    <span className="text-xs font-bold text-gray-500 flex items-center">
                      <ArrowUpDown size={14} className="mr-1" />
                      SORT:
                    </span>
                    <select
                      value={sortKey}
                      onChange={(e) => setSortKey(e.target.value as SortKey)}
                      className="text-xs border-2 border-bk-brown rounded-lg px-2 py-1.5 bg-white font-bold focus:outline-none focus:ring-2 focus:ring-bk-orange"
                    >
                      <option value="bib_number">No. (ID)</option>
                      <option value="player_name">氏名</option>
                      <option value="order_am1">午前立順</option>
                      <option value="order_am2">午後１立順</option>
                      <option value="order_pm1">午後２立順</option>
                    </select>
                    <button
                      onClick={() =>
                        setSortOrder((prev) =>
                          prev === 'asc' ? 'desc' : 'asc',
                        )
                      }
                      className="p-1.5 border-2 border-bk-brown rounded-lg hover:bg-bk-beige text-bk-brown transition-colors"
                      title={sortOrder === 'asc' ? '昇順' : '降順'}
                    >
                      {sortOrder === 'asc' ? (
                        <ArrowUp size={16} />
                      ) : (
                        <ArrowDown size={16} />
                      )}
                    </button>
                  </div>
                )}
                {isFilterOpen && (
                  <div className="mt-2 pt-2 border-t-2 border-bk-brown/10 animate-in slide-in-from-top-1 fade-in duration-200">
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        type="text"
                        placeholder="NAME / TEAM / No."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 text-sm font-bold border-2 border-gray-300 rounded-xl focus:outline-none focus:border-bk-orange focus:ring-0 text-bk-brown placeholder:text-gray-400"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-bk-red"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {playerGroups.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className={isGroupedView ? 'mb-8 relative' : ''}
                >
                  {/* 区切り線（グループ表示時） */}
                  {isGroupedView && (
                    <div className="absolute -top-4 left-0 right-0 flex items-center justify-center">
                      <div className="bg-bk-beige px-3 text-xs font-black text-bk-brown/30">
                        GROUP {groupIndex + 1}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {group.map((player) => {
                      if (activeTab === 'order_list') {
                        return (
                          <div
                            key={player.id}
                            className="bg-white rounded-2xl border-4 border-bk-brown overflow-hidden shadow-[6px_6px_0px_0px_rgba(80,35,20,0.15)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
                          >
                            <div className="p-4 border-b-2 border-bk-brown/10 bg-white">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="bg-bk-brown text-white text-xs font-pop font-black px-2 py-0.5 rounded">
                                  No.{player.bib_number}
                                </span>
                                <div className="font-bold text-bk-brown truncate text-lg">
                                  {player.player_name}
                                </div>
                              </div>
                              <div className="text-sm font-bold text-gray-500 truncate pl-1">
                                {player.team_name}
                              </div>
                            </div>
                            <div className="flex bg-bk-beige/30 divide-x-2 divide-bk-brown/10">
                              <div className="flex-1 py-3 flex flex-col items-center justify-center">
                                <span className="text-[10px] text-gray-500 font-bold mb-0.5">
                                  午前
                                </span>
                                {renderOrderInfo(
                                  player.order_am1,
                                  player.status_am1,
                                )}
                              </div>
                              <div className="flex-1 py-3 flex flex-col items-center justify-center">
                                <span className="text-[10px] text-gray-500 font-bold mb-0.5">
                                  午後1
                                </span>
                                {renderOrderInfo(
                                  player.order_am2,
                                  player.status_am2,
                                )}
                              </div>
                              <div className="flex-1 py-3 flex flex-col items-center justify-center">
                                <span className="text-[10px] text-gray-500 font-bold mb-0.5">
                                  午後2
                                </span>
                                {renderOrderInfo(
                                  player.order_pm1,
                                  player.status_pm1,
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      if (activeTab !== 'total') {
                        const data = getCurrentTabData(player);
                        const maxScore = activeTab === 'pm1' ? 4 : 2;
                        return (
                          <div
                            key={player.id}
                            className="bg-white rounded-2xl border-4 border-bk-brown overflow-hidden shadow-[6px_6px_0px_0px_rgba(80,35,20,0.15)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
                          >
                            <div className="p-4 border-b-2 border-bk-brown/10">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="bg-bk-brown text-white text-xs font-pop font-black px-2 py-0.5 rounded">
                                  No.{player.bib_number}
                                </span>
                                <div className="font-bold text-bk-brown truncate text-lg">
                                  {player.player_name}
                                </div>
                              </div>
                              <div className="text-sm font-bold text-gray-500 truncate pl-1">
                                {player.team_name}
                              </div>
                            </div>
                            <div className="flex bg-bk-beige/30">
                              <div className="flex-1 py-3 flex flex-col items-center justify-center border-r-2 border-bk-brown/10">
                                <div className="flex items-center text-xs text-gray-500 font-bold mb-1">
                                  <ListOrdered size={14} className="mr-1" />
                                  <span>立順</span>
                                </div>
                                <div>
                                  {renderOrderInfo(data?.order, data?.status)}
                                </div>
                              </div>
                              <div className="flex-1 py-3 flex flex-col items-center justify-center">
                                <div className="flex items-center text-xs text-gray-500 font-bold mb-1">
                                  <Target size={14} className="mr-1" />
                                  <span>的中</span>
                                </div>
                                <div className="text-xl font-pop font-black text-bk-brown">
                                  {renderScore(data?.score, maxScore)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={player.id}
                          className="bg-white rounded-2xl border-4 border-bk-brown overflow-hidden shadow-[6px_6px_0px_0px_rgba(80,35,20,0.15)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
                        >
                          <div className="p-4 flex items-center justify-between border-b-2 border-bk-brown/10">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="bg-bk-brown text-white text-xs font-pop font-black px-2 py-0.5 rounded">
                                  No.{player.bib_number}
                                </span>
                                <div className="font-bold text-bk-brown truncate text-lg">
                                  {player.player_name}
                                </div>
                              </div>
                              <div className="text-sm font-bold text-gray-500 truncate pl-1">
                                {player.team_name}
                              </div>
                            </div>
                          </div>
                          <div className="flex border-b-2 border-bk-brown/10 bg-white divide-x-2 divide-bk-brown/10">
                            <div className="flex-1 py-2 flex flex-col items-center justify-center">
                              <span className="text-[10px] text-gray-400 font-bold mb-0.5">
                                午前
                              </span>
                              <span className="text-sm font-bold">
                                {renderScore(player.score_am1, 2)}
                              </span>
                            </div>
                            <div className="flex-1 py-2 flex flex-col items-center justify-center">
                              <span className="text-[10px] text-gray-400 font-bold mb-0.5">
                                午後1
                              </span>
                              <span className="text-sm font-bold">
                                {renderScore(player.score_am2, 2)}
                              </span>
                            </div>
                            <div className="flex-1 py-2 flex flex-col items-center justify-center">
                              <span className="text-[10px] text-gray-400 font-bold mb-0.5">
                                午後2
                              </span>
                              <span className="text-sm font-bold">
                                {renderScore(player.score_pm1, 4)}
                              </span>
                            </div>
                          </div>
                          <div className="flex border-b-2 border-bk-brown/10 bg-bk-beige/30">
                            <div className="flex-1 py-3 flex flex-col items-center justify-center border-r-2 border-bk-brown/10">
                              <div className="flex items-center text-xs text-gray-500 font-bold mb-1">
                                <Target size={16} className="mr-1" />
                                <span>合計</span>
                              </div>
                              <div className="text-2xl font-pop font-black text-bk-brown">
                                {player.total_score}
                                <span className="text-xs font-bold ml-1 text-gray-500">
                                  中
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 py-3 flex flex-col items-center justify-center">
                              <div className="flex items-center text-xs text-gray-500 font-bold mb-1">
                                <Trophy size={16} className="mr-1" />
                                <span>暫定順位</span>
                              </div>
                              <div className="flex items-center justify-center">
                                <span className="text-2xl font-pop font-black text-bk-brown mr-2">
                                  {player.provisional_ranking
                                    ? `${player.provisional_ranking}`
                                    : '-'}
                                </span>
                                {player.provisional_ranking && (
                                  <div className="flex items-center justify-center w-6 h-6 bg-bk-green rounded-full text-white shadow-sm border border-bk-brown">
                                    <span className="text-[10px] font-black">
                                      {player.provisional_ranking}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          {(player.playoff_type ||
                            player.semifinal_score != null ||
                            player.semifinal_results != null) && (
                            <div className="flex border-b-2 border-bk-brown/10 bg-bk-orange/10 items-center justify-around py-2">
                              <div className="flex flex-col items-center min-w-12">
                                <span className="text-[10px] text-gray-500 font-bold mb-0.5">
                                  方式
                                </span>
                                <span
                                  className={`text-sm font-black ${player.playoff_type === 'izume' ? 'text-bk-red' : player.playoff_type === 'enkin' ? 'text-teal-600' : 'text-gray-400'}`}
                                >
                                  {player.playoff_type === 'izume'
                                    ? '射詰'
                                    : player.playoff_type === 'enkin'
                                      ? '遠近'
                                      : '-'}
                                </span>
                              </div>
                              <div className="flex flex-col items-center border-l-2 border-bk-brown/10 pl-4 min-w-16">
                                <span className="text-[10px] text-gray-500 font-bold mb-0.5 flex items-center">
                                  <Crosshair size={12} className="mr-1" />{' '}
                                  決勝射詰
                                </span>
                                <span className="text-sm font-pop font-black text-bk-brown">
                                  {player.semifinal_score != null
                                    ? `${player.semifinal_score}中`
                                    : '-'}
                                </span>
                              </div>
                              <div className="flex flex-col items-center border-l-2 border-bk-brown/10 pl-4 min-w-16">
                                <span className="text-[10px] text-gray-500 font-bold mb-0.5 flex items-center">
                                  <HelpCircle size={12} className="mr-1" />{' '}
                                  決勝射遠
                                </span>
                                <span className="text-sm font-pop font-black text-bk-brown">
                                  {player.semifinal_results != null
                                    ? `${player.semifinal_results}位`
                                    : '-'}
                                </span>
                              </div>
                            </div>
                          )}
                          <div className="flex bg-bk-orange/20">
                            <div className="flex-1 py-3 flex flex-col items-center justify-center">
                              <div className="flex items-center text-xs text-bk-brown font-black mb-1">
                                <Medal size={16} className="mr-1" />
                                <span>最終順位</span>
                              </div>
                              <div className="text-3xl font-pop font-black text-bk-red drop-shadow-sm">
                                {player.final_ranking
                                  ? `${player.final_ranking}位`
                                  : '-'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {filteredPlayers.length === 0 && (
                <div className="text-center py-12 text-gray-400 bg-white/50 rounded-2xl border-4 border-dashed border-gray-300 font-bold">
                  <p>NO DATA</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-bk-red text-sm font-black mt-2 hover:underline uppercase"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl border-4 border-bk-brown shadow-[8px_8px_0px_0px_rgba(80,35,20,0.5)] overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center bg-bk-green px-5 py-4 border-b-4 border-bk-brown">
                <h3 className="text-white font-black text-xl flex items-center uppercase">
                  <Info size={24} className="mr-2" />
                  HELP & RULES
                </h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-white hover:text-bk-beige transition-colors p-1 rounded-full hover:bg-white/20"
                >
                  <X size={28} strokeWidth={3} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto text-sm space-y-6 text-bk-brown leading-relaxed font-medium">
                <section>
                  <h4 className="font-black text-bk-red text-lg border-b-2 border-bk-brown/20 pb-1 mb-3">
                    DISPLAY
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="inline-block w-3 h-3 bg-bk-brown rounded-full mt-1.5 mr-3 shrink-0"></span>
                      <span>
                        <span className="font-bold text-bk-red">
                          ORDER LIST:
                        </span>{' '}
                        ID（ゼッケン）順に表示されます。
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-3 h-3 bg-bk-brown rounded-full mt-1.5 mr-3 shrink-0"></span>
                      <span>
                        <span className="font-bold text-bk-red">
                          AM/PM ROUNDS:
                        </span>{' '}
                        立順（射位順）の昇順で表示されます。
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-3 h-3 bg-bk-brown rounded-full mt-1.5 mr-3 shrink-0"></span>
                      <span>
                        <span className="font-bold text-bk-red">
                          TOTAL RANKING:
                        </span>{' '}
                        合計的中数が多い順に表示されます。
                      </span>
                    </li>
                  </ul>
                </section>
                <section>
                  <h4 className="font-black text-bk-red text-lg border-b-2 border-bk-brown/20 pb-1 mb-3">
                    HOW TO USE
                  </h4>
                  <div className="bg-bk-beige p-4 rounded-xl border-2 border-bk-brown">
                    <p className="mb-2">
                      <span className="font-black">FILTER:</span>
                    </p>
                    <p>
                      ボタンを押すと検索バーが表示され、選手名や所属で絞り込みが可能です。
                    </p>
                  </div>
                </section>
                <section>
                  <h4 className="font-black text-bk-red text-lg border-b-2 border-bk-brown/20 pb-1 mb-3">
                    RANKING RULES
                  </h4>
                  <ol className="list-decimal pl-5 space-y-2 font-bold marker:text-bk-orange">
                    <li>合計的中数（多い順）</li>
                    <li>射詰的中数（多い順）</li>
                    <li>射遠順位（数字が小さい順）</li>
                  </ol>
                </section>
              </div>
              <div className="p-4 border-t-4 border-bk-brown bg-bk-beige text-center">
                <button
                  onClick={() => setShowHelp(false)}
                  className="bg-bk-brown text-white px-8 py-3 rounded-full font-black hover:bg-bk-red transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-none uppercase"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
