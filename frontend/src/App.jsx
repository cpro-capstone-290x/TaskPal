import { Routes, Route } from "react-router-dom";

// Pages
import Home from "./pages/home";
import AuthPage from "./pages/AuthPage/AuthPage";
import ClientChatRoom from "./pages/Chat/ClientChatRoom.jsx";
import ProviderChatRoom from "./pages/Chat/ProviderChatRoom.jsx";
import BookTask from "./pages/Chat/BookTask.jsx";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Chat Routes */}
        <Route path="/chat/client/:bookingId" element={<ClientChatRoom />} />
        <Route path="/chat/provider/:bookingId" element={<ProviderChatRoom />} />

        {/* Booking Routes */}
        <Route path="/book" element={<BookTask />} />
        <Route path="/book/:taskId" element={<BookTask />} />
      </Routes>
    </div>
  );
}

export default App;
