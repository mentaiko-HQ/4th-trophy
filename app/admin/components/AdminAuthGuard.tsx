'use client';

import React, { useState, useEffect } from 'react';
import { Lock, LogIn } from 'lucide-react';

export default function AdminAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputId, setId] = useState('');
  const [inputPass, setPass] = useState('');
  const [error, setError] = useState('');

  // ログイン状態の確認（セッションストレージを利用してリロード後も維持する場合）
  useEffect(() => {
    const session = sessionStorage.getItem('admin_auth');
    if (session === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // 環境変数から正解を取得（設定がない場合はデフォルト値を使用）
    const correctId = process.env.NEXT_PUBLIC_ADMIN_ID || 'admin';
    const correctPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'password';

    if (inputId === correctId && inputPass === correctPass) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      setError('');
    } else {
      setError('IDまたはパスワードが間違っています');
    }
  };

  // 認証済みなら子要素（管理パネル）を表示
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // 未認証ならログインフォームを表示
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-200">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Lock className="w-8 h-8 text-gray-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">管理者認証</h2>
          <p className="text-sm text-gray-500 mt-2">
            管理画面へアクセスするには
            <br />
            IDとパスワードを入力してください。
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              ID
            </label>
            <input
              type="text"
              value={inputId}
              onChange={(e) => setId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="管理者ID"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              パスワード
            </label>
            <input
              type="password"
              value={inputPass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="パスワード"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center font-bold bg-red-50 p-2 rounded">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-gray-800 text-white font-bold py-3 rounded-lg hover:bg-gray-900 transition-all flex items-center justify-center shadow-md active:scale-95"
          >
            <LogIn className="w-5 h-5 mr-2" />
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
}
