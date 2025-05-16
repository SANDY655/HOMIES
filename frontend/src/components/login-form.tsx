import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { useState } from "react";
import { createRoute, RootRoute } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";

// Zod schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginSchema = z.infer<typeof loginSchema>;

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const onSubmit = async (data: LoginSchema) => {
    setLoading(true);
    setMessage("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/user/login",
        {
          email: data.email,
          password: data.password,
        },
        { withCredentials: true }
      );

      // Expecting backend to return { token, user }
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("userId", user._id); // ✅ Fix: store from response
      localStorage.setItem("email", JSON.stringify(user.email)); // ✅ Optional: or store full user object

      setMessage("Login Successful");
      const redirectTo = router.state.location.search.redirect ?? "/dashboard";
      router.navigate({ to: redirectTo });
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Login failed");
      } else {
        setMessage("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Login to your HOMIES account
                </p>
              </div>

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

              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>

              {message && (
                <p
                  className={`text-center text-sm ${
                    message.includes("Success")
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {message}
                </p>
              )}
            </div>
          </form>

          <div className="bg-muted relative hidden md:block">
            <img
              src="/img1.jpg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/login",
    getParentRoute: () => parentRoute,
    component: LoginForm,
    beforeLoad: () => {
      const isLoggedIn = !!localStorage.getItem("email");
      if (isLoggedIn) {
        throw redirect({ to: "/my-rooms" });
      }
    },
  });
