import React from "react";
import Provider from "./provider/provider";
import Header from "../components/Header";
import useAutoLogout from "../../hooks/useAutoLogout";


const ProfileProvider = () => {
    useAutoLogout
    return(
        <div className="min-h-screen bg-gray-50 font-sans">
            <Header />
            <Provider />
        </div>
    )
}

export default ProfileProvider;