// Vercel Routing Middleware — Basic認証
// 本番は Vercel 環境変数 BASIC_AUTH_USER / BASIC_AUTH_PASS で上書きする

export const config = {
  matcher: '/:path*',
};

function nextResponse() {
  return new Response(null, {
    headers: { 'x-middleware-next': '1' },
  });
}

function isPublicDailyRoute(request) {
  const url = new URL(request.url);
  return (url.pathname === '/' || url.pathname === '/index.html') && url.searchParams.has('daily');
}

export default function middleware(request) {
  if (isPublicDailyRoute(request)) {
    return nextResponse();
  }

  const auth = request.headers.get('authorization');

  const validUser = process.env.BASIC_AUTH_USER || 'yoshida';
  const validPass = process.env.BASIC_AUTH_PASS || 'test';
  const expected = 'Basic ' + btoa(`${validUser}:${validPass}`);

  if (auth === expected) {
    // 認証OK → 後続の静的配信へ通す
    return nextResponse();
  }

  return new Response('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area", charset="UTF-8"',
      'Cache-Control': 'no-store',
    },
  });
}
