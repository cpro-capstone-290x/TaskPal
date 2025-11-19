import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/Header";
import ExecutionPage from "./components/executionPage";
import ExecutionPageProvider from "./components/executionPageProvider";

const Execution = () => {
  const { bookingId } = useParams();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    setUserRole(storedRole || "client");
  }, []);

  if (!userRole) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading role...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header />

      {userRole === "provider" ? (
        <ExecutionPageProvider key={bookingId} bookingId={bookingId} />
      ) : (
        <ExecutionPage key={bookingId} bookingId={bookingId} />
      )}
    </div>
  );
};

export default Execution;
