import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // ページごとに異なるユーザー名とパスワードを設定
  // 本番環境では環境変数 (process.env) での管理を強く推奨します
  let validUser = '';
  let validPass = '';

  if (pathname.startsWith('/admin')) {
    // 管理画面用の認証情報
    validUser = process.env.ADMIN_USER || 'admin';
    validPass = process.env.ADMIN_PASS || 'm2025a';
  } else if (pathname.startsWith('/input')) {
    // 成績入力ページ用の認証情報
    validUser = process.env.INPUT_USER || 'input';
    validPass = process.env.INPUT_PASS || 'm2025i';
  } else if (pathname.startsWith('/call')) {
    // 選手呼出ページ用の認証情報
    validUser = process.env.CALL_USER || 'call';
    validPass = process.env.CALL_PASS || 'm2025c';
  } else {
    // matcherで指定されていないパスへのアクセス（念のため）
    return NextResponse.next();
  }

  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    // base64デコード
    const [user, pwd] = atob(authValue).split(':');

    if (user === validUser && pwd === validPass) {
      return NextResponse.next();
    }
  }

  // 認証に失敗、または未認証の場合は401を返して入力を求める
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

export const config = {
  // ミドルウェアを適用するパスのパターン
  matcher: ['/input/:path*', '/call/:path*', '/admin/:path*'],
};
