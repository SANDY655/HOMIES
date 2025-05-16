import { useNavigate } from "@tanstack/react-router";
import { LoginForm } from "./components/login-form";
import { RegisterForm } from "./components/register-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { io } from "socket.io-client";
import { useEffect } from "react";
import { scheduleAutoLogout } from "./utils/authUtils";

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = !!localStorage.getItem("email");
    if (isLoggedIn) {
      navigate({ to: "/dashboard" });
    }
    scheduleAutoLogout(navigate);
  }, []);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <Tabs defaultValue="Login" className="items-center">
          <TabsList>
            <TabsTrigger value="Login">Login</TabsTrigger>
            <TabsTrigger value="Register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="Login">
            <LoginForm />
          </TabsContent>
          <TabsContent value="Register">
            <RegisterForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
