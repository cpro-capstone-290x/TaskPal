import React from "react";

const ChatMessage = ({ message, isSender }) => {
  return (
    <div className={`flex ${isSender ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-xs px-4 py-2 rounded-2xl text-white ${
          isSender
            ? "bg-purple-600 rounded-br-none" // sender bubble
            : "bg-gray-700 rounded-bl-none"   // receiver bubble
        }`}
      >
        <p>{message.text}</p>
        <span className="block text-xs text-gray-300 mt-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;
