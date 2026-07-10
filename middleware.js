// Vercel Routing Middleware — Basic認証
// 環境変数 BASIC_AUTH_USER / BASIC_AUTH_PASS を
// Vercelダッシュボード → Settings → Environment Variables で設定してください
// (未設定の場合は下記デフォルト値が使われます)

export const config = {
  matcher: '/:path*',
};

export default function middleware(request) {
  const auth = request.headers.get('authorization');

  const validUser = process.env.BASIC_AUTH_USER || 'kosei-do';
  const validPass = process.env.BASIC_AUTH_PASS || 'sukuyo2026';
  const expected = 'Basic ' + btoa(validUser + ':' + validPass);

  if (auth === expected) {
    return; // 認証OK、そのまま通す
  }

  return new Response('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area", charset="UTF-8"',
    },
  });
}
