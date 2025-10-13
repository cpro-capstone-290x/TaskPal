import React from "react";

const Header = () => {

    const navLinks = [
        { name: "Home", path: "/" },
        { name: "About", path: "/about" },
        { name: "Services", path: "/services" },
        { name: "Contact", path: "/contact" },
        { name: "Login", path: "/login" },
    ];
    return (
        <header className="bg-white shadow-md">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div className="text-2xl font-extrabold text-primary tracking-tight">
                    <span className="text-secondary">Task</span>Pal</div>
                <nav>
                    <ul className="flex space-x-4">
                        {navLinks.map((link) => (
                            <li key={link.name}>
                                <a href={link.path} className="text-gray-600 hover:text-gray-800">
                                    {link.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </header>
    )
}
export default Header;