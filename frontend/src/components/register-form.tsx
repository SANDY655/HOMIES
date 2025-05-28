import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRoute, RootRoute, redirect } from "@tanstack/react-router";

// Zod schema
const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be atleast 2 characters")
      .regex(
        /^[a-zA-Z][a-zA-Z0-9]*$/,
        "Name must start with a letter and be alphanumeric"
      ),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Password must be at least 6 characters"),
    otp: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type RegisterSchema = z.infer<typeof registerSchema>;

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
  });

  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");

  const sendOtp = async () => {
    setLoading(true);
    setMessage("");
    try {
      const { name, email, password, confirmPassword } = watch();
      const res = await axios.post(
        "http://localhost:5000/api/user/send-otp",
        {
          name,
          email,
          password,
          confirmPassword,
        },
        { withCredentials: true }
      );

      setOtpSent(true);
      setMessage(res.data.message || "OTP sent to your email");
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "Failed to send OTP");
      } else {
        setMessage("Unexpected error");
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (data: RegisterSchema) => {
    setLoading(true);
    setMessage("");
    try {
      const res = await axios.post(
        "http://localhost:5000/api/user/verify-otp",
        {
          email: data.email,
          otp: data.otp,
        },
        { withCredentials: true }
      );

      setMessage(res.data.message || "Account verified and registered!");
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.message || "OTP verification failed");
      } else {
        setMessage("Unexpected error during verification");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="bg-muted relative hidden md:block">
            <img
              src="/img1.jpg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
          <form
            className="p-6 md:p-8"
            onSubmit={handleSubmit(verifyOtp)}
            noValidate
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Welcome</h1>
                <p className="text-muted-foreground">
                  Register your HOMIES account
                </p>
              </div>

              {/* Name */}
              <div className="grid gap-3">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Send OTP button */}
              {!otpSent && (
                <Button type="button" onClick={sendOtp} disabled={loading}>
                  {loading ? "Sending OTP..." : "Get OTP"}
                </Button>
              )}

              {/* OTP Input & Verify */}
              {otpSent && (
                <>
                  <div className="grid gap-3">
                    <Label htmlFor="otp">Enter OTP</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter the OTP"
                      {...register("otp")}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Verifying..." : "Verify OTP"}
                  </Button>
                </>
              )}

              {message && (
                <p className="text-center text-sm text-muted-foreground">
                  {message}
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/register",
    getParentRoute: () => parentRoute,
    component: RegisterForm,
    beforeLoad: () => {
      const isLoggedIn = !!localStorage.getItem("email");
      if (isLoggedIn) {
        throw redirect({ to: "/my-rooms" });
      }
    },
  });
