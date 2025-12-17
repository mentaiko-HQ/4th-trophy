'use client';

import React, { useState } from 'react';
import {
  Trophy,
  Target,
  Filter,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronRight,
} from 'lucide-react';

// データの型定義
// 予選スコア (score_am1, score_am2, score_pm1) を追加
export interface PlayerData {
  id: string;
  bib_number: string | number;
  player_name: string;
  team_name: string;
  score_am1: number | null; // 午前1
  score_am2: number | null; // 午前2
  score_pm1: number | null; // 午後1
  total_score: number; // 合計的中数
  provisional_ranking: number | null; // 暫定順位
  prev_ranking?: number | null; // 前回順位
}

interface ScoreListProps {
  players: PlayerData[];
}

export default function ScoreList({ players }: ScoreListProps) {
  // 初期表示タブは 'total'（総合成績）
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

  // スコア表示用のヘルパー（nullの場合は '-' を表示）
  const displayScore = (score: number | null) => (score !== null ? score : '-');

  return (
    <div className="max-w-3xl mx-auto pb-10 font-sans text-gray-800">
      {/* タブナビゲーション */}
      <div className="flex bg-white shadow-sm mb-4 rounded-lg overflow-hidden border border-gray-200">
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
                {/* ========================================================================
                    1行目: 選手基本情報 (Rankバッジ削除)
                   ======================================================================== */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* 名前・所属・ゼッケン */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {/* ゼッケン番号 */}
                        <span className="bg-[#E8ECEF] text-[#7B8B9A] text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap">
                          No.{player.bib_number}
                        </span>
                        {/* 選手名 */}
                        <div className="font-bold text-[#324857] truncate text-lg">
                          {player.player_name}
                        </div>
                      </div>
                      {/* チーム名 */}
                      <div className="text-xs text-[#7B8B9A] font-medium truncate pl-1">
                        {player.team_name}
                      </div>
                    </div>

                    {/* 詳細リンク用アイコン */}
                    <ChevronRight className="text-gray-300" size={20} />
                  </div>
                </div>

                {/* ========================================================================
                    2行目: 各回スコア (午前1, 午前2, 午後1)
                   ======================================================================== */}
                <div className="flex border-t border-[#E8ECEF] bg-white divide-x divide-[#E8ECEF]">
                  <div className="flex-1 py-2 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-[#7B8B9A] font-bold mb-0.5">
                      午前1
                    </span>
                    <span className="text-sm font-bold text-[#324857]">
                      {displayScore(player.score_am1)}
                    </span>
                  </div>
                  <div className="flex-1 py-2 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-[#7B8B9A] font-bold mb-0.5">
                      午前2
                    </span>
                    <span className="text-sm font-bold text-[#324857]">
                      {displayScore(player.score_am2)}
                    </span>
                  </div>
                  <div className="flex-1 py-2 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-[#7B8B9A] font-bold mb-0.5">
                      午後1
                    </span>
                    <span className="text-sm font-bold text-[#324857]">
                      {displayScore(player.score_pm1)}
                    </span>
                  </div>
                </div>

                {/* ========================================================================
                    3行目: 合計成績・順位 (合計的中数, 暫定順位)
                   ======================================================================== */}
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
                        // 順位バッジのデザインを維持しつつ、小さいアイコンとして表示
                        <div className="flex items-center justify-center w-6 h-6 bg-[#34675C] rounded-full text-white shadow-sm">
                          <span className="text-[10px] font-bold">
                            {player.provisional_ranking}
                          </span>
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
