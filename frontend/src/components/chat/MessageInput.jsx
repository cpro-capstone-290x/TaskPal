// src/components/chat/MessageInput.jsx
import React from "react";

const MessageInput = ({ value, onChange, onSend }) => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSend();
    }
  };

  return (
    <div className="p-4 bg-white border-t border-gray-200 flex items-center gap-2">
      <input
        type="text"
        placeholder="Type your message..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-sky-400 focus:outline-none text-gray-700"
      />
      <button
        onClick={onSend}
        className="bg-sky-600 text-white rounded-full px-5 py-2 font-semibold hover:bg-sky-700 transition"
      >
        Send
      </button>
    </div>
  );
};

export default MessageInput;
