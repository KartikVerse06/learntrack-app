"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { z } from "zod";
import { RegisterSchema } from "@/server/validators/auth";
import { registerApi } from "@/lib/api/auth";
import { getClientAuthToken } from "@/lib/api/client";
import { LearnTrackLogo } from "@/components/common/logo";

const RegisterFormSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
    email: z.string().trim().email("Please enter a valid email address.").toLowerCase(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Za-z]/, "Password must contain at least one letter.")
      .regex(/[0-9]/, "Password must contain at least one number."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
    timezone: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof RegisterFormSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const detectedTimezone =
    typeof window !== "undefined" && Intl?.DateTimeFormat?.()
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      timezone: detectedTimezone || "UTC",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      const result = await registerApi({
        name: data.name,
        email: data.email,
        password: data.password,
        timezone: data.timezone,
      });

      if (!result.success || !result.data) {
        setServerError(
          result.error?.message || "Registration failed. Please check your details."
        );
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);

      // Sync token to the server-side HttpOnly cookie on the Vercel domain so
      // the Next.js middleware can read it on the very next server-rendered request.
      try {
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: result.data.token }),
        });
      } catch {
        // Bridge failed. Client-side cookie set by registerApi acts as fallback.
      }

      // Confirm a usable token is present (bridge or client cookie) before navigating.
      if (!getClientAuthToken() && !result.data.token) {
        setServerError("Session could not be established. Please try signing in.");
        setIsSubmitting(false);
        return;
      }

      window.location.replace("/dashboard");
    } catch (err: any) {
      setServerError(err?.message || "An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
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
              Create your LearnTrack Account
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Start structuring your daily learning and spaced revisions
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

            {isSuccess && (
              <div className="flex items-center gap-2 p-3 text-xs rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Account created! Redirecting to your workspace...</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Alex Learner"
                autoComplete="name"
                disabled={isSubmitting}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

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
                placeholder="At least 8 characters (letters & numbers)"
                autoComplete="new-password"
                disabled={isSubmitting}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                disabled={isSubmitting}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <input type="hidden" value={detectedTimezone} {...register("timezone")} />
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
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Register & Begin Learning</span>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
