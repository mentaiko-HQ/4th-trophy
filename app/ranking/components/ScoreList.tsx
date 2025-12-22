'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Trophy,
  Target,
  Filter,
  ChevronRight,
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
} from 'lucide-react';

// 大会設定の型定義
export interface TournamentSettings {
  current_phase: 'preparing' | 'qualifier' | 'tally' | 'final' | 'finished';
  announcement: string | null;
  individual_prize_count: number;
  team_prize_count: number;
}

// データの型定義
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
}

interface ScoreListProps {
  players: PlayerData[];
  settings?: TournamentSettings | null;
  playoffPlayers?: PlayerData[];
}

// ソートキーの型定義
type SortKey =
  | 'bib_number'
  | 'player_name'
  | 'order_am1'
  | 'order_am2'
  | 'order_pm1';

export default function ScoreList({
  players = [],
  settings,
  playoffPlayers = [],
}: ScoreListProps) {
  const [activeTab, setActiveTab] = useState<
    'order_list' | 'total' | 'am1' | 'am2' | 'pm1'
  >('order_list');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  // ソート状態の管理
  const [sortKey, setSortKey] = useState<SortKey>('bib_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // アニメーション表示状態の管理
  const [showOpening, setShowOpening] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // 初回訪問判定とアニメーション制御
  useEffect(() => {
    setIsClient(true);
    const hasSeen = sessionStorage.getItem('hasSeenRankingOpening');

    if (!hasSeen) {
      setShowOpening(true);
      sessionStorage.setItem('hasSeenRankingOpening', 'true');

      const timer = setTimeout(() => {
        setShowOpening(false);
      }, 1500); // アニメーション時間に合わせて調整
      return () => clearTimeout(timer);
    }
  }, []);

  // 安全な配列データを確保
  const safePlayers = useMemo(
    () => (Array.isArray(players) ? players : []),
    [players]
  );
  const safePlayoffPlayers = useMemo(
    () => (Array.isArray(playoffPlayers) ? playoffPlayers : []),
    [playoffPlayers]
  );

  const getPhaseInfo = (phase?: string) => {
    switch (phase) {
      case 'preparing':
        return {
          label: '準備中。。。',
          containerClass: 'bg-teal-50 border-teal-500',
          textClass: 'text-teal-800',
          iconClass: 'text-teal-600',
        };
      case 'qualifier':
        return {
          label: '予選進行中',
          containerClass: 'bg-blue-50 border-blue-500',
          textClass: 'text-blue-800',
          iconClass: 'text-blue-600',
        };
      case 'tally':
        return {
          label: '集計中',
          containerClass: 'bg-orange-50 border-orange-500',
          textClass: 'text-orange-800',
          iconClass: 'text-orange-600',
        };
      case 'final':
        return {
          label: '決勝進行中',
          containerClass: 'bg-red-50 border-red-500',
          textClass: 'text-red-800',
          iconClass: 'text-red-600',
        };
      case 'finished':
        return {
          label: '全日程終了',
          containerClass: 'bg-gray-100 border-gray-500',
          textClass: 'text-gray-800',
          iconClass: 'text-gray-600',
        };
      default:
        return {
          label: '',
          containerClass: 'bg-gray-50 border-gray-300',
          textClass: 'text-gray-500',
          iconClass: 'text-gray-400',
        };
    }
  };

  const phaseInfo = getPhaseInfo(settings?.current_phase);

  const renderScore = (score: number | null | undefined, maxScore: number) => {
    if (score == null) return <span className="text-gray-400">-</span>;
    const isMax = score === maxScore;
    return (
      <div className="flex items-center justify-center gap-1">
        <span className="font-bold">{score}中</span>
        {isMax && (
          <Star
            size={14}
            className="text-yellow-500 fill-yellow-500"
            aria-label="皆中"
          />
        )}
      </div>
    );
  };

  const renderOrderInfo = (
    order: number | null | undefined,
    status: string | null | undefined
  ) => {
    const orderDisplay = order ? (
      <span className="text-lg font-bold text-[#324857]">{order}番</span>
    ) : (
      <span className="text-gray-400">-</span>
    );

    if (status === 'shooting') {
      return (
        <div className="flex flex-col items-center">
          {orderDisplay}
          <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold border border-red-200 animate-pulse whitespace-nowrap">
            行射中
          </span>
        </div>
      );
    }
    if (status === 'called') {
      return (
        <div className="flex flex-col items-center">
          {orderDisplay}
          <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200 whitespace-nowrap">
            控えに待機
          </span>
        </div>
      );
    }
    return orderDisplay;
  };

  const displayOrder = (order: number | null | undefined) =>
    order ? `${order}番` : '-';

  // フィルタリングとソート処理
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
            (b.order_am1 ?? Number.MAX_SAFE_INTEGER)
        );
        break;
      case 'am2':
        sortedResult.sort(
          (a, b) =>
            (a.order_am2 ?? Number.MAX_SAFE_INTEGER) -
            (b.order_am2 ?? Number.MAX_SAFE_INTEGER)
        );
        break;
      case 'pm1':
        sortedResult.sort(
          (a, b) =>
            (a.order_pm1 ?? Number.MAX_SAFE_INTEGER) -
            (b.order_pm1 ?? Number.MAX_SAFE_INTEGER)
        );
        break;
      case 'total':
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

  const isGroupedView = activeTab !== 'total';
  const playerGroups = isGroupedView
    ? createPlayerGroups(filteredPlayers)
    : [filteredPlayers];

  // =========================================================
  // レンダリング
  // =========================================================
  return (
    <>
      {/* アニメーション用オーバーレイ */}
      {isClient && showOpening && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
          <style jsx global>{`
            .poyon {
              animation: poyon 2.1s linear 0s 1;
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
            {/* 画像への差し替え */}
            <img
              src="/images/matomentaiko.png"
              alt="Opening Animation"
              width={200}
              height={200}
              className="object-contain"
            />
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <div className="max-w-3xl mx-auto pb-10 font-sans text-gray-800 relative">
        {/* ステータス・お知らせ・競射情報エリア */}
        <div className="mb-4 space-y-2 px-1">
          {settings?.current_phase && (
            <div
              className={`${phaseInfo.containerClass} border-l-4 p-3 rounded-r-lg shadow-sm flex items-center justify-between`}
            >
              <span
                className={`font-bold text-sm flex items-center ${phaseInfo.textClass}`}
              >
                <Activity size={16} className={`mr-2 ${phaseInfo.iconClass}`} />
                現在の状況: {phaseInfo.label}
              </span>
            </div>
          )}

          {settings?.announcement && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-lg shadow-sm flex items-start">
              <Megaphone
                size={16}
                className="text-yellow-600 mt-0.5 mr-2 flex-shrink-0"
              />
              <p className="text-sm text-yellow-800 whitespace-pre-wrap leading-relaxed">
                {settings.announcement}
              </p>
            </div>
          )}

          {safePlayoffPlayers.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center mb-2">
                <Target className="text-red-600 mr-2" size={20} />
                <h3 className="font-bold text-red-800">
                  順位決定戦（競射）対象者
                </h3>
              </div>
              <p className="text-xs text-red-600 mb-2">
                入賞枠（{settings?.individual_prize_count}
                位まで）を決定するため、以下の選手は競射の対象となります。
              </p>
              <div className="flex flex-wrap gap-2">
                {safePlayoffPlayers.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-bold bg-white text-red-700 border border-red-200 shadow-sm"
                  >
                    <span className="text-xs text-red-400 mr-1">
                      No.{p.bib_number}
                    </span>
                    {p.player_name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ヘルプボタンエリア */}
        <div className="flex justify-end mb-3 pt-2 px-1">
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center text-xs font-bold text-[#34675C] hover:text-[#2a524a] bg-white px-3 py-1.5 rounded-full border border-[#34675C]/30 shadow-sm transition-all hover:bg-[#34675C]/5"
          >
            <Info size={16} className="mr-1.5" />
            画面の見方・ルール
          </button>
        </div>

        {/* タブナビゲーション */}
        <div className="flex bg-white shadow-sm mb-4 rounded-lg overflow-hidden border border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('order_list')}
            className={`flex-1 min-w-[70px] py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors duration-200 whitespace-nowrap ${
              activeTab === 'order_list'
                ? 'border-[#34675C] text-[#34675C] bg-[#34675C]/5'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            立順表
          </button>
          <button
            onClick={() => setActiveTab('am1')}
            className={`flex-1 min-w-[70px] py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors duration-200 whitespace-nowrap ${
              activeTab === 'am1'
                ? 'border-[#34675C] text-[#34675C] bg-[#34675C]/5'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            午前1
          </button>
          <button
            onClick={() => setActiveTab('am2')}
            className={`flex-1 min-w-[70px] py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors duration-200 whitespace-nowrap ${
              activeTab === 'am2'
                ? 'border-[#34675C] text-[#34675C] bg-[#34675C]/5'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            午前2
          </button>
          <button
            onClick={() => setActiveTab('pm1')}
            className={`flex-1 min-w-[70px] py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors duration-200 whitespace-nowrap ${
              activeTab === 'pm1'
                ? 'border-[#34675C] text-[#34675C] bg-[#34675C]/5'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            午後1
          </button>
          <button
            onClick={() => setActiveTab('total')}
            className={`flex-1 min-w-[70px] py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors duration-200 whitespace-nowrap ${
              activeTab === 'total'
                ? 'border-[#34675C] text-[#34675C] bg-[#34675C]/5'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            総合成績
          </button>
        </div>

        <div className="space-y-4">
          {/* ヘッダー操作部 */}
          <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm mb-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-gray-500 ml-2">
                表示件数:{' '}
                <span className="text-[#34675C] text-sm">
                  {filteredPlayers.length}
                </span>{' '}
                / {safePlayers.length}件
              </span>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center text-xs font-bold border rounded px-3 py-1.5 shadow-sm transition-colors
                          ${
                            isFilterOpen
                              ? 'bg-[#34675C] text-white border-[#34675C]'
                              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                          }`}
              >
                <Filter size={12} className="mr-1" />
                {isFilterOpen ? '閉じる' : '絞り込み'}
              </button>
            </div>

            {/* 立順表タブ専用ソートUI */}
            {activeTab === 'order_list' && (
              <div className="flex justify-end items-center gap-2 mb-2 px-1 border-t border-gray-100 pt-2">
                <span className="text-xs font-bold text-gray-500 flex items-center">
                  <ArrowUpDown size={12} className="mr-1" />
                  並び替え:
                </span>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="text-xs border border-gray-300 rounded px-2 py-1.5 bg-gray-50 focus:outline-none focus:border-[#34675C] focus:ring-1 focus:ring-[#34675C]"
                >
                  <option value="bib_number">No. (ID)</option>
                  <option value="player_name">氏名</option>
                  <option value="order_am1">午前1立順</option>
                  <option value="order_am2">午前2立順</option>
                  <option value="order_pm1">午後立順</option>
                </select>
                <button
                  onClick={() =>
                    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                  }
                  className="p-1.5 border border-gray-300 rounded hover:bg-gray-100 text-gray-600 transition-colors"
                  title={sortOrder === 'asc' ? '昇順' : '降順'}
                >
                  {sortOrder === 'asc' ? (
                    <ArrowUp size={14} />
                  ) : (
                    <ArrowDown size={14} />
                  )}
                </button>
              </div>
            )}

            {isFilterOpen && (
              <div className="mt-2 pt-2 border-t border-gray-100 animate-in slide-in-from-top-1 fade-in duration-200">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="選手名、チーム名、No.で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#34675C]/20 focus:border-[#34675C]"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 選手リスト表示 (グループごとに表示) */}
          {playerGroups.map((group, groupIndex) => (
            <div key={groupIndex} className={isGroupedView ? 'mb-6' : ''}>
              <div className="space-y-4">
                {group.map((player) => {
                  // 立順表タブ
                  if (activeTab === 'order_list') {
                    return (
                      <div
                        key={player.id}
                        className="bg-white rounded-xl shadow-sm border border-[#E8ECEF] overflow-hidden hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="p-4 border-b border-[#E8ECEF]">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-[#E8ECEF] text-[#7B8B9A] text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap">
                              No.{player.bib_number}
                            </span>
                            <div className="font-bold text-[#324857] truncate text-lg">
                              {player.player_name}
                            </div>
                          </div>
                          <div className="text-xs text-[#7B8B9A] font-medium truncate pl-1">
                            {player.team_name}
                          </div>
                        </div>
                        <div className="flex bg-[#F8FAFC] divide-x divide-[#E8ECEF]">
                          <div className="flex-1 py-3 flex flex-col items-center justify-center">
                            <span className="text-[10px] text-[#7B8B9A] font-bold mb-0.5">
                              午前1立順
                            </span>
                            {renderOrderInfo(
                              player.order_am1,
                              player.status_am1
                            )}
                          </div>
                          <div className="flex-1 py-3 flex flex-col items-center justify-center">
                            <span className="text-[10px] text-[#7B8B9A] font-bold mb-0.5">
                              午前2立順
                            </span>
                            {renderOrderInfo(
                              player.order_am2,
                              player.status_am2
                            )}
                          </div>
                          <div className="flex-1 py-3 flex flex-col items-center justify-center">
                            <span className="text-[10px] text-[#7B8B9A] font-bold mb-0.5">
                              午後立順
                            </span>
                            {renderOrderInfo(
                              player.order_pm1,
                              player.status_pm1
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 予選タブ
                  if (activeTab !== 'total') {
                    const data = getCurrentTabData(player);
                    const maxScore = activeTab === 'pm1' ? 4 : 2;

                    return (
                      <div
                        key={player.id}
                        className="bg-white rounded-xl shadow-sm border border-[#E8ECEF] overflow-hidden hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="p-4 border-b border-[#E8ECEF]">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-[#E8ECEF] text-[#7B8B9A] text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap">
                              No.{player.bib_number}
                            </span>
                            <div className="font-bold text-[#324857] truncate text-lg">
                              {player.player_name}
                            </div>
                          </div>
                          <div className="text-xs text-[#7B8B9A] font-medium truncate pl-1">
                            {player.team_name}
                          </div>
                        </div>
                        <div className="flex bg-[#F8FAFC]">
                          <div className="flex-1 py-3 flex flex-col items-center justify-center border-r border-[#E8ECEF]">
                            <div className="flex items-center text-xs text-[#7B8B9A] mb-1 font-bold">
                              <ListOrdered size={14} className="mr-1" />
                              <span>立順</span>
                            </div>
                            <div>
                              {renderOrderInfo(data?.order, data?.status)}
                            </div>
                          </div>
                          <div className="flex-1 py-3 flex flex-col items-center justify-center">
                            <div className="flex items-center text-xs text-[#7B8B9A] mb-1 font-bold">
                              <Target size={14} className="mr-1" />
                              <span>的中数</span>
                            </div>
                            <div className="text-xl font-bold text-[#324857]">
                              {renderScore(data?.score, maxScore)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 総合成績タブ
                  return (
                    <div
                      key={player.id}
                      className="bg-white rounded-xl shadow-sm border border-[#E8ECEF] overflow-hidden hover:shadow-md transition-shadow duration-200"
                    >
                      {/* 1行目 */}
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="bg-[#E8ECEF] text-[#7B8B9A] text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap">
                                No.{player.bib_number}
                              </span>
                              <div className="font-bold text-[#324857] truncate text-lg">
                                {player.player_name}
                              </div>
                            </div>
                            <div className="text-xs text-[#7B8B9A] font-medium truncate pl-1">
                              {player.team_name}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2行目 */}
                      <div className="flex border-t border-[#E8ECEF] bg-white divide-x divide-[#E8ECEF]">
                        <div className="flex-1 py-2 flex flex-col items-center justify-center">
                          <span className="text-[10px] text-[#7B8B9A] font-bold mb-0.5">
                            午前1
                          </span>
                          <span className="text-sm font-bold text-[#324857]">
                            {renderScore(player.score_am1, 2)}
                          </span>
                        </div>
                        <div className="flex-1 py-2 flex flex-col items-center justify-center">
                          <span className="text-[10px] text-[#7B8B9A] font-bold mb-0.5">
                            午前2
                          </span>
                          <span className="text-sm font-bold text-[#324857]">
                            {renderScore(player.score_am2, 2)}
                          </span>
                        </div>
                        <div className="flex-1 py-2 flex flex-col items-center justify-center">
                          <span className="text-[10px] text-[#7B8B9A] font-bold mb-0.5">
                            午後1
                          </span>
                          <span className="text-sm font-bold text-[#324857]">
                            {renderScore(player.score_pm1, 4)}
                          </span>
                        </div>
                      </div>

                      {/* 3行目 */}
                      <div className="flex border-t border-[#E8ECEF] bg-[#F8FAFC]">
                        <div className="flex-1 py-3 flex flex-col items-center justify-center border-r border-[#E8ECEF]">
                          <div className="flex items-center text-xs text-[#7B8B9A] mb-1 font-bold">
                            <Target size={14} className="mr-1" />
                            <span>合計的中数</span>
                          </div>
                          <div className="text-xl font-bold text-[#324857]">
                            {player.total_score}
                            <span className="text-xs font-normal text-[#7B8B9A] ml-1">
                              中
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 py-3 flex flex-col items-center justify-center">
                          <div className="flex items-center text-xs text-[#7B8B9A] mb-1 font-bold">
                            <Trophy size={14} className="mr-1" />
                            <span>暫定順位</span>
                          </div>
                          <div className="flex items-center justify-center">
                            <span className="text-xl font-bold text-[#324857] mr-2">
                              {player.provisional_ranking
                                ? `${player.provisional_ranking}位`
                                : '-'}
                            </span>
                            {player.provisional_ranking && (
                              <div className="flex items-center justify-center w-6 h-6 bg-[#34675C] rounded-full text-white shadow-sm">
                                <span className="text-[10px] font-bold">
                                  {player.provisional_ranking}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 決勝詳細 */}
                      {(player.playoff_type ||
                        player.semifinal_score != null ||
                        player.semifinal_results != null) && (
                        <div className="flex border-t border-[#E8ECEF] bg-blue-50/40 items-center justify-around py-2">
                          <div className="flex flex-col items-center min-w-[3rem]">
                            <span className="text-[10px] text-gray-500 font-bold mb-0.5">
                              方式
                            </span>
                            <span
                              className={`text-sm font-bold ${
                                player.playoff_type === 'izume'
                                  ? 'text-pink-600'
                                  : player.playoff_type === 'enkin'
                                  ? 'text-teal-600'
                                  : 'text-gray-400'
                              }`}
                            >
                              {player.playoff_type === 'izume'
                                ? '射詰！'
                                : player.playoff_type === 'enkin'
                                ? '遠近！'
                                : '-'}
                            </span>
                          </div>

                          <div className="flex flex-col items-center border-l border-gray-200 pl-6 min-w-[4rem]">
                            <span className="text-[10px] text-gray-500 font-bold mb-0.5 flex items-center">
                              <Crosshair size={10} className="mr-1" /> 射詰的中
                            </span>
                            <span className="text-sm font-bold text-gray-700">
                              {player.semifinal_score != null
                                ? `${player.semifinal_score}中`
                                : '-'}
                            </span>
                          </div>

                          <div className="flex flex-col items-center border-l border-gray-200 pl-6 min-w-[4rem]">
                            <span className="text-[10px] text-gray-500 font-bold mb-0.5 flex items-center">
                              <HelpCircle size={10} className="mr-1" /> 射遠順位
                            </span>
                            <span className="text-sm font-bold text-gray-700">
                              {player.semifinal_results != null
                                ? `${player.semifinal_results}位`
                                : '-'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 4行目 */}
                      <div className="flex border-t border-[#E8ECEF] bg-yellow-50/50">
                        <div className="flex-1 py-3 flex flex-col items-center justify-center">
                          <div className="flex items-center text-xs text-[#b45309] mb-1 font-bold">
                            <Medal size={14} className="mr-1" />
                            <span>最終順位</span>
                          </div>
                          <div className="text-2xl font-bold text-[#324857]">
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
              {/* 区切り線 (グループ表示時かつ最後のグループでない場合) */}
              {isGroupedView && groupIndex < playerGroups.length - 1 && (
                <div className="flex items-center my-6">
                  <div className="flex-grow border-t-2 border-dashed border-gray-300"></div>
                </div>
              )}
            </div>
          ))}

          {filteredPlayers.length === 0 && (
            <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
              <p>該当する選手が見つかりません</p>
              <button
                onClick={() => setSearchTerm('')}
                className="text-[#34675C] text-sm font-bold mt-2 hover:underline"
              >
                検索条件をクリア
              </button>
            </div>
          )}
        </div>

        {/* ヘルプモーダル */}
        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center bg-[#34675C] px-5 py-4">
                <h3 className="text-white font-bold text-lg flex items-center">
                  <Info size={24} className="mr-2" />
                  画面の見方・ルール
                </h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto text-sm space-y-6 text-gray-700 leading-relaxed">
                <section>
                  <h4 className="font-bold text-[#34675C] border-l-4 border-[#34675C] pl-2 mb-2 text-base">
                    表示について
                  </h4>
                  <ul className="space-y-2 ml-1">
                    <li className="flex items-start">
                      <span className="inline-block w-1.5 h-1.5 bg-[#34675C] rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      <span>
                        <span className="font-bold text-gray-900">
                          立順表タブ:
                        </span>{' '}
                        ID（ゼッケン）順に表示されます。
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-1.5 h-1.5 bg-[#34675C] rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      <span>
                        <span className="font-bold text-gray-900">
                          午前・午後タブ:
                        </span>{' '}
                        立順（射位順）の昇順で表示されます。
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-1.5 h-1.5 bg-[#34675C] rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      <span>
                        <span className="font-bold text-gray-900">
                          総合成績タブ:
                        </span>{' '}
                        合計的中数が多い順に表示されます。同中の場合は、決勝（射詰・遠近）の結果に基づいて順位が決定します。
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block mt-0.5 mr-2 flex-shrink-0">
                        <Star
                          size={14}
                          className="text-yellow-500 fill-yellow-500"
                        />
                      </span>
                      <span>
                        <span className="font-bold text-gray-900">
                          ★マーク:
                        </span>{' '}
                        各立の満点（皆中）のスコアに表示されます。
                      </span>
                    </li>
                  </ul>
                </section>

                <section>
                  <h4 className="font-bold text-[#34675C] border-l-4 border-[#34675C] pl-2 mb-2 text-base">
                    操作方法
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="mb-2">
                      <span className="font-bold">絞り込み機能:</span>
                    </p>
                    <p>
                      「絞り込み」ボタンを押すと検索バーが表示されます。選手名、所属チーム名、ゼッケン番号を入力して、表示する選手を絞り込むことができます。
                    </p>
                  </div>
                </section>

                <section>
                  <h4 className="font-bold text-[#34675C] border-l-4 border-[#34675C] pl-2 mb-2 text-base">
                    順位決定ルール
                  </h4>
                  <p className="mb-2">
                    総合成績の順位は、以下の優先順位で決定されます。
                  </p>
                  <ol className="list-decimal pl-5 space-y-1 font-medium bg-yellow-50/50 p-3 rounded-lg border border-yellow-100 text-gray-800">
                    <li>合計的中数（多い順）</li>
                    <li>射詰的中数（多い順）</li>
                    <li>射遠順位（数字が小さい順）</li>
                    <li>
                      <span className="text-xs font-normal text-gray-500">
                        ※上記全て同じ場合は同順位となります
                      </span>
                    </li>
                  </ol>
                </section>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
                <button
                  onClick={() => setShowHelp(false)}
                  className="bg-[#34675C] text-white px-8 py-2.5 rounded-lg font-bold hover:bg-[#2a524a] transition-all shadow-sm active:scale-95"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
