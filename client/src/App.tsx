import { AppRoutes } from "@/routes";
import Nav from "@/components/Nav";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Nav />
        <main>
          <AppRoutes />
        </main>
        <Toaster />
      </div>
    </AuthProvider>
  );
}

export default App;