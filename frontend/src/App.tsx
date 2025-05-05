import { LoginForm } from "./components/login-form";
import { RegisterForm } from "./components/register-form";
import logo from "./logo.svg";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function App() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        {/* <LoginForm />
        <RegisterForm /> */}
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
