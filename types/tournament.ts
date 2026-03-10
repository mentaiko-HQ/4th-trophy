export interface TournamentSettings {
  id: string; // uuidのためstring型
  current_phase: 'preparing' | 'qualifier' | 'tally' | 'final' | 'finished';
  announcement: string | null;
  individual_prize_count: number;
  team_prize_count: number;
  show_phase?: boolean;
  show_announcement?: boolean;
  show_playoff_players?: boolean;
}
export interface PlayerEntry {
  id: string;
  bib_number: number;
  participant_id: string;
  // entriesテーブルの他のカラムがあれば追加（例: is_present など）
  participants: {
    name: string;
    teams: {
      name: string;
    } | null;
  } | null;
  [key: string]: unknown; 
}