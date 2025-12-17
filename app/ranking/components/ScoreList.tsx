'use client';

import React, { useState } from 'react';
import {
  Trophy,
  Target,
  User,
  Filter,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronRight,
} from 'lucide-react';

// 【重要】ここで export を付けて、外部から PlayerData 型を参照できるようにする
export interface PlayerData {
  id: string;
  bib_number: string | number;
  player_name: string;
  team_name: string;
  total_score: number; // 合計的中数
  provisional_ranking: number | null; // 暫定順位
  prev_ranking?: number | null; // 前回順位（変動表示用）
}

interface ScoreListProps {
  players: PlayerData[];
}

export default function ScoreList({ players }: ScoreListProps) {
  // 初期表示タブは 'total'（総合成績）とする
  const [activeTab, setActiveTab] = useState<'total' | 'category'>('total');

  // 順位変動アイコンを取得するヘルパー関数
  const getRankChangeIcon = (
    current: number | null,
    prev: number | null | undefined
  ) => {
    if (!current || !prev) return <Minus size={16} className="text-gray-300" />;
    if (current < prev) return <ArrowUp size={16} className="text-red-500" />; // ランクアップ
    if (current > prev)
      return <ArrowDown size={16} className="text-blue-500" />; // ランクダウン
    return <Minus size={16} className="text-gray-400" />;
  };

  return (
    <div className="max-w-3xl mx-auto pb-10 font-sans text-gray-800">
      {/* タブナビゲーション */}
      <div className="flex bg-white shadow-sm mb-4 rounded-lg overflow-hidden border border-gray-200">
        {/* 左側: 部門別成績 */}
        <button
          onClick={() => setActiveTab('category')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors duration-200 ${
            activeTab === 'category'
              ? 'border-[#34675C] text-[#34675C] bg-[#34675C]/5'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          部門別成績
        </button>

        {/* 右側: 総合成績 */}
        <button
          onClick={() => setActiveTab('total')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors duration-200 ${
            activeTab === 'total'
              ? 'border-[#34675C] text-[#34675C] bg-[#34675C]/5'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          総合成績
        </button>
      </div>

      {/* メインリスト表示エリア */}
      <div className="space-y-4">
        {activeTab === 'total' && (
          <>
            {/* ヘッダー操作部 */}
            <div className="flex justify-between items-center px-1 mb-2">
              <span className="text-xs font-bold text-gray-500">
                表示件数: {players.length}件
              </span>
              <button className="flex items-center text-xs font-bold bg-white border border-gray-300 rounded px-3 py-1.5 shadow-sm text-gray-600">
                <Filter size={12} className="mr-1" /> 絞り込み
              </button>
            </div>

            {/* 選手カードリスト */}
            {players.map((player) => (
              <div
                key={player.id}
                className="bg-white rounded-xl shadow-sm border border-[#E8ECEF] overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                {/* 1行目: 選手基本情報 */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* 順位バッジ/アイコン */}
                    <div className="flex-shrink-0">
                      {player.provisional_ranking &&
                      player.provisional_ranking <= 3 ? (
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm
                                ${
                                  player.provisional_ranking === 1
                                    ? 'bg-yellow-400'
                                    : player.provisional_ranking === 2
                                    ? 'bg-gray-400'
                                    : 'bg-orange-400'
                                }`}
                        >
                          {player.provisional_ranking}
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                          <User size={24} />
                        </div>
                      )}
                    </div>

                    {/* 名前・所属・ゼッケン */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="font-bold text-[#324857] truncate text-lg">
                          {player.player_name}
                        </div>
                      </div>
                      <div className="flex items-center text-xs text-[#7B8B9A] gap-2">
                        <span className="bg-[#E8ECEF] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                          No.{player.bib_number}
                        </span>
                        <span className="truncate font-medium">
                          {player.team_name}
                        </span>
                      </div>
                    </div>

                    {/* 詳細リンク用アイコン */}
                    <ChevronRight className="text-gray-300" size={20} />
                  </div>
                </div>

                {/* 2行目: 成績情報 */}
                <div className="flex border-t border-[#E8ECEF] bg-[#F8FAFC]">
                  {/* 合計的中数 */}
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

                  {/* 暫定順位 */}
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
                        <div className="flex items-center bg-white rounded-full px-1 py-0.5 shadow-sm border border-gray-100">
                          {getRankChangeIcon(
                            player.provisional_ranking,
                            player.prev_ranking
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* 部門別成績タブの内容 */}
        {activeTab === 'category' && (
          <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
            部門別成績は準備中です
          </div>
        )}

        {/* データ無し時の表示 */}
        {players.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            データが見つかりません
          </div>
        )}
      </div>
    </div>
  );
}
