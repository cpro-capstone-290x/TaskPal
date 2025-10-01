import React, { useState } from 'react';

const SelectionIcons = () => {
    // State for the currently selected option
    const [selectedOption, setSelectedOption] = useState(null);

    // Array of options to display under the search bar
    const options = [
        { id: 1, icon: '🧹', label: 'Cleaning' },
        { id: 2, icon: '🚚', label: 'Moving' },
        { id: 3, icon: '🌱', label: 'Gardening' },
    ];

    // Function to handle option selection
    const handleOptionClick = (optionId) => {
        setSelectedOption(optionId);
        // You would typically trigger a search or state change here
        console.log(`Option selected: ${options.find(o => o.id === optionId)?.label}`);
    };

    return (
        // 1. Full-screen container (using 'hero' component for clean centering)
        <div className="bg-gray-100 hero min-h-screen">
            {/* 2. Content Container (Centered) */}
            <div className="hero-content text-center max-w-2xl w-full">
                <div className="flex flex-col items-center w-full">
                    {/* Optional: Clean Logo/Title */}
                    <h1 className="text-9xl font-extrabold text-primary mb-10 tracking-tight">
                        <span className="text-secondary">Task</span>Pal
                    </h1>
                    {/* Subtitle - Provides context */}
                    <p className="text-2xl text-base-content/70 mb-12 text-zinc-950">
                        Select a category to begin exploring our resources.
                    </p>
                    
                    {/* 3. Button Grid/Layout */}
                    <div className="flex flex-wrap justify-center gap-4">
                        {options.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => handleOptionClick(option.id)}
                                // Styling for a prominent, pill-shaped button
                                className={`
                                    btn btn-xl rounded-full px-15 text-3xl font-semibold transition-all duration-300 shadow-md 
                                    ${selectedOption === option.id 
                                        // Active State: Use 'btn-primary' for high visibility
                                        ? 'btn-primary text-primary-content shadow-xl scale-105'
                                        // Default State: Use 'btn-outline' or 'btn-ghost' for cleanliness
                                        : 'btn-outline btn-neutral hover:shadow-lg hover:scale-[1.02] hover:bg-base-200'
                                    }
                                `}
                            >
                                <span className="mr-2 text-xl">{option.icon}</span>
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SelectionIcons;