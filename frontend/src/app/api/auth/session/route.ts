import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token =
    req.cookies.get("learntrack_token")?.value ||
    req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json(
      { authenticated: false, token: null },
      { status: 401 }
    );
  }

  return NextResponse.json(
    { authenticated: true, token },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    const response = NextResponse.json({ success: true });

    if (token) {
      response.cookies.set("learntrack_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
    } else {
      response.cookies.delete("learntrack_token");
    }

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("learntrack_token");
  return response;
}
