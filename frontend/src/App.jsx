import { Routes, Route } from "react-router-dom";

// Pages
import Home from "./pages/home";
import RegisterPage from "./pages/RegisterPage/RegisterPage";
import LoginPage from "./pages/LoginPage/LoginPage";
import ChatRoom from "./pages/components/ChatRoom";
import Profile from "./pages/profile/profile";
import ProfileProvider from "./pages/profile/profileProvider";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/chat/:bookingId/:role" element={<ChatRoom />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/profileProvider/:id" element={<ProfileProvider />} />
      </Routes>
    </div>
  );
}

export default App;
