import React from "react";
import User from "./components/user";
import Header from "../components/Header";
import useAutoLogout from "../../hooks/useAutoLogout";


const Profile = () => {
    useAutoLogout();
    return(
        <div className="min-h-screen bg-gray-50 font-sans">
            <Header />
            <User />
        </div>
    )
}


export default Profile;