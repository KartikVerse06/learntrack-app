import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token =
    req.cookies.get("learntrack_token")?.value ||
    req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json(
      { authenticated: false, token: null },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }

  return NextResponse.json(
    { authenticated: true, token },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    const response = NextResponse.json(
      { success: true },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );

    if (token) {
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      };
      response.cookies.set("learntrack_token", token, cookieOptions);
      response.cookies.set("token", token, cookieOptions);
    } else {
      response.cookies.delete("learntrack_token");
      response.cookies.delete("token");
    }

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json(
    { success: true },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );

  const clearCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  };

  response.cookies.set("learntrack_token", "", clearCookieOptions);
  response.cookies.set("token", "", clearCookieOptions);
  response.cookies.delete("learntrack_token");
  response.cookies.delete("token");

  return response;
}
