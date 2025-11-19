// src/components/chat/MessageBubble.jsx
import React from "react";

const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const MessageBubble = ({ message, isSender, senderName }) => {
  return (
    <div className={`flex ${isSender ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
          isSender
            ? "bg-sky-600 text-white rounded-br-none"
            : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.message}</p>
        <div
          className={`text-[11px] mt-1 ${
            isSender ? "text-gray-200 text-right" : "text-gray-500 text-left"
          }`}
        >
          {senderName} • {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
