"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { LoginSchema, type LoginInput } from "@/server/validators/auth";
import { loginApi } from "@/lib/api/auth";
import { getClientAuthToken } from "@/lib/api/client";
import { LearnTrackLogo } from "@/components/common/logo";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      const result = await loginApi(data);
      if (!result.success || !result.data) {
        setServerError(result.error?.message || "Invalid email or password.");
        return;
      }

      // Sync session bridge to Next.js middleware with resilient fallback
      try {
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: result.data.token }),
        });
      } catch (bridgeErr) {
        console.warn("Session bridge call failed, relying on client cookie token", bridgeErr);
      }

      const activeToken = getClientAuthToken();
      if (!activeToken && !result.data.token) {
        setServerError("Session establishment failed. Please attempt login again.");
        return;
      }

      router.push(callbackUrl);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "An unexpected authentication error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoCredentials = () => {
    setValue("email", "demo@learntrack.app");
    setValue("password", "Password123!");
    setServerError(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-lg border-border/80">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <LearnTrackLogo variant="auth" priority />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Sign in to LearnTrack
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Deliberate learning planner, 45m focus blocks, and spaced revisions
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            {serverError && (
              <div
                className="flex items-center gap-2 p-3 text-xs rounded-md bg-destructive/10 text-destructive border border-destructive/20 animate-in fade-in-50"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="alex@example.com"
                autoComplete="email"
                disabled={isSubmitting}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isSubmitting}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Demo Account Auto-Fill Helper */}
            <div className="pt-1">
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Click here to fill demo learner credentials</span>
              </button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary font-medium hover:underline">
                Create account
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
