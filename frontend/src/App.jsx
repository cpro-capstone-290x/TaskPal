import {BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import Home from "./pages/home";
import RegisterPage from "./pages/RegisterPage/RegisterPage";
import LoginPage from "./pages/LoginPage/LoginPage";
import ChatRoom from "./pages/components/ChatRoom";
import Profile from "./pages/profile/profile";
import ProfileProvider from "./pages/profile/profileProvider";
import BookingPage from "./pages/bookingpage/booking";
import BookingInitializePage from "./pages/bookingpage/initiateBook";
import PaymentSuccess from "./pages/payment/paymentSuccess";
import Execution from "./pages/execution/execution";
import ServicesPage from "./pages/services/ServicesPage";
import ForgotPasswordUser from "./pages/LoginPage/components/forgotPassword";

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
        <Route path="/booking" element={<BookingPage />} /> {/* ✅ ADD THIS */}
        <Route path="/booking/initiate/:providerId" element={<BookingInitializePage  />} /> {/* ✅ ADD THIS */}
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/execution/:bookingId" element={<Execution />} />
        <Route path="/provider/execution/:bookingId" element={<Execution />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordUser />} />
      </Routes>
    </div>
  );
}

export default App;
