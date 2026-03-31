import { RouterProvider } from "react-router";
import { router } from "./routes";
import { TradeProvider } from "./context/TradeContext";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <div className="dark">
      <AuthProvider>
        <TradeProvider>
          <RouterProvider router={router} />
          <Toaster />
        </TradeProvider>
      </AuthProvider>
    </div>
  );
}
