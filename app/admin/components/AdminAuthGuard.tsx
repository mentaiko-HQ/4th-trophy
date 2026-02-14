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

  useEffect(() => {
    const session = sessionStorage.getItem('admin_auth');
    if (session === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const correctId = process.env.NEXT_PUBLIC_ADMIN_ID || 'admin';
    const correctPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'password';

    // ▼▼▼ この2行を追加して確認する ▼▼▼
    console.log('入力されたID:', inputId);
    console.log('正解のID:', correctId);
    console.log('入力されたPASS:', inputPass);
    console.log('正解のPASS:', correctPass);
    // ▲▲▲▲▲▲

    if (inputId === correctId && inputPass === correctPass) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      setError('');
    } else {
      setError('IDまたはパスワードが間違っています');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bk-beige p-4 font-sans text-bk-brown">
      <div className="bg-white p-8 rounded-3xl border-4 border-bk-brown shadow-[8px_8px_0px_0px_rgba(80,35,20,0.2)] max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-bk-orange rounded-full mb-4 border-4 border-bk-brown shadow-sm">
            <Lock className="w-10 h-10 text-bk-brown" strokeWidth={3} />
          </div>
          <h2 className="text-3xl font-black text-bk-brown font-pop uppercase tracking-tight">
            ADMIN LOGIN
          </h2>
          <p className="text-sm font-bold text-gray-500 mt-2">
            管理画面へアクセスするには
            <br />
            IDとパスワードを入力してください。
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-black text-bk-brown mb-2 ml-1">
              ID
            </label>
            <input
              type="text"
              value={inputId}
              onChange={(e) => setId(e.target.value)}
              className="w-full p-3 border-4 border-gray-300 rounded-xl focus:outline-none focus:border-bk-orange focus:ring-0 font-bold text-lg transition-colors placeholder:text-gray-300"
              placeholder="Admin ID"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-bk-brown mb-2 ml-1">
              PASSWORD
            </label>
            <input
              type="password"
              value={inputPass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full p-3 border-4 border-gray-300 rounded-xl focus:outline-none focus:border-bk-orange focus:ring-0 font-bold text-lg transition-colors placeholder:text-gray-300"
              placeholder="Password"
            />
          </div>

          {error && (
            <p className="text-bk-red text-sm text-center font-black bg-red-100 p-3 rounded-lg border-2 border-bk-red">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-bk-brown text-white font-black py-4 rounded-xl hover:bg-bk-brown/90 transition-all flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(80,35,20,0.3)] active:translate-y-[2px] active:shadow-none uppercase"
          >
            <LogIn className="w-5 h-5 mr-2" strokeWidth={3} />
            LOGIN
          </button>
        </form>
      </div>
    </div>
  );
}
