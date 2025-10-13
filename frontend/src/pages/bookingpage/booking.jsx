import React from "react";
import SearchBooking from "./components/searchbooking";
import Header from "../components/Header";

const BookingPage = () => {
    return(
        <div className="min-h-screen bg-gray-50 font-sans">
            <Header />
            <SearchBooking />
        </div>
    )
}

export default BookingPage;