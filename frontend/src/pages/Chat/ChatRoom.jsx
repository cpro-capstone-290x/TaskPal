import React, { useState } from "react";
import ChatMessage from "./ChatMessage.jsx"; // ✅ fixed import

const ChatRoom = () => {
  const [messages, setMessages] = useState([
    { id: 1, sender: "client", text: "Hi, can you do the task tomorrow?", timestamp: new Date() },
    { id: 2, sender: "provider", text: "Yes, I’m available in the afternoon.", timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([
      ...messages,
      { id: Date.now(), sender: "client", text: input, timestamp: new Date() },
    ]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 bg-gray-800 flex justify-between items-center">
        <h2 className="font-bold">Chat with Provider</h2>
        <button className="bg-purple-600 px-3 py-1 rounded">Call Back</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isSender={msg.sender === "client"}
          />
        ))}
      </div>

      {/* Input */}
      <div className="p-4 bg-gray-800 flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 rounded-l-lg bg-gray-700 text-white focus:outline-none"
        />
        <button
          onClick={handleSend}
          className="bg-purple-600 px-4 py-2 rounded-r-lg"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;
