import React, { useState, useEffect } from "react";
import { useChat } from "../../context/ChatProvider.jsx";
import ChatMessage from "./ChatMessage.jsx";

const ProviderChatRoom = () => {
  const { client, user } = useChat();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // Always run hooks, don't skip them
  useEffect(() => {
    if (!client) return;

    const channel = client.channel("messaging", "booking-1");
    channel.watch().then(() => {
      channel.on("message.new", (event) => {
        setMessages((prev) => [...prev, event.message]);
      });
    });
  }, [client]);

  const handleSend = async () => {
    if (!input.trim() || !client) return;
    const channel = client.channel("messaging", "booking-1");
    await channel.sendMessage({ text: input });
    setInput("");
  };

  // Instead of skipping hooks, handle loading here
  if (!client) {
    return <div className="p-4">Loading chat...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="p-4 bg-gray-800 flex justify-between items-center">
        <h2 className="font-bold">Provider Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={{ text: msg.text, timestamp: msg.created_at }}
            isSender={msg.user.id === user}
          />
        ))}
      </div>

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

export default ProviderChatRoom;
