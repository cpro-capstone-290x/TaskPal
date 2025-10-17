// useAutoLogout.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const useAutoLogout = (timeout = 0.20 * 60 * 1000) => { 
  const navigate = useNavigate();

  useEffect(() => {
    let timer;

    const handleLogout = () => {
      // ✅ Use the same keys as your Header and Login
      localStorage.removeItem("authToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("userRole");
      localStorage.removeItem("pendingRedirect");
      sessionStorage.clear();

      // 🧁 Clear cookies if any
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      alert("👋 You have been logged out due to inactivity.");
      navigate("/");
      window.location.reload(); // flushes any cached React state
    };

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(handleLogout, timeout);
    };

    const activityEvents = ["mousemove", "keydown", "click", "scroll"];
    activityEvents.forEach((event) =>
      window.addEventListener(event, resetTimer)
    );

    resetTimer(); // start timer on mount

    return () => {
      clearTimeout(timer);
      activityEvents.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }, [navigate, timeout]);
};

export default useAutoLogout;
