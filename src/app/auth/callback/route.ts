import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const redirectTo = `${origin}${next}`;

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=auth`);
  }

  // 200 + HTML로 응답해서 쿠키가 저장된 뒤 meta refresh로 이동 (리다이렉트 직후 쿠키 미포함 이슈 회피)
  const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${redirectTo}"></head><body>Redirecting...</body></html>`;
  const response = new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

  const supabase = createServerClient(
    "https://cjrpeyrqetdgmcrcprok.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqcnBleXJxZXRkZ21jcmNwcm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NTQ2ODUsImV4cCI6MjA4NzEzMDY4NX0.Pb1XfQ-gDKZfXleDW6aObWviSXY-s1lgB3KOdi0pYYo",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          const secure = origin.startsWith("https://");
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...(options as object),
              path: "/",
              sameSite: "lax",
              secure,
              httpOnly: true,
            })
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/?error=auth`);
  }

  return response;
}
