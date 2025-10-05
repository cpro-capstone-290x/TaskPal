import { Routes, Route } from "react-router-dom";

// Pages
import Home from "./pages/home";
import AuthPage from "./pages/AuthPage/AuthPage";
import ChatRoom from "./pages/components/ChatRoom";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/chat/:bookingId/:role" element={<ChatRoom />} />
      </Routes>
    </div>
  );
}

export default App;
