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
import {
  createRoute,
  RootRoute,
  redirect,
  useNavigate,
} from "@tanstack/react-router";

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
    trigger,
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
  });
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");

  const sendOtp = async () => {
    setMessage(""); // Clear previous messages

    // Manually trigger validation for initial fields
    const isValid = await trigger([
      "name",
      "email",
      "password",
      "confirmPassword",
    ]);

    if (!isValid) {
      return;
    }

    setLoading(true);

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
    if (!data.otp) {
      setMessage("Please enter the OTP.");
      return;
    }

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
      // Corrected the navigate call with a single search object
      navigate({
        to: "/",
        search: { modal: "login" },
      });
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

  // Determine which submit handler to use based on otpSent state
  const currentSubmitHandler = otpSent ? verifyOtp : sendOtp;

  return (
    <div className={cn("flex justify-center", className)} {...props}>
      <Card className="w-full max-w-md border-none">
        <CardContent className="p-6 md:p-8">
          <form
            onSubmit={handleSubmit(currentSubmitHandler)}
            className="grid gap-6"
            noValidate
          >
            <div className="flex flex-col items-center text-center gap-2">
              <h1 className="text-2xl font-bold">Welcome</h1>
              <p className="text-muted-foreground text-balance">
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
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
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
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
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
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
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
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Send OTP button */}
            {!otpSent && (
              <Button type="submit" className="w-full" disabled={loading}>
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
                    {...register("otp", { required: "OTP is required" })}
                    className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.otp && (
                    <p className="text-sm text-red-500">{errors.otp.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Verifying..." : "Verify OTP"}
                </Button>
              </>
            )}

            {message && (
              <p
                className={`text-center text-sm ${
                  message.includes("Success")
                    ? "text-green-500"
                    : message.includes("verified")
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {message}
              </p>
            )}
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
