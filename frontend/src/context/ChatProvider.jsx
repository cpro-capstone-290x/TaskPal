import React, { createContext, useContext, useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import { useLocation } from "react-router-dom";
import axios from "axios";

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [client, setClient] = useState(null);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const initChat = async () => {
      try {
        // figure out role based on URL
        let userId;
        if (location.pathname.includes("/chat/client")) {
          userId = "client-1";
        } else if (location.pathname.includes("/chat/provider")) {
          userId = "provider-1";
        } else {
          return; // not on a chat page
        }

        setUser(userId);

        // request token from backend
        const tokenResponse = await axios.post("http://localhost:5000/api/chat/token", {
          userId,
        });

        const apiKey = import.meta.env.VITE_STREAM_API_KEY;
        const chatClient = StreamChat.getInstance(apiKey);

        await chatClient.connectUser(
          { id: userId, name: userId }, 
          tokenResponse.data.token
        );

        setClient(chatClient);
      } catch (err) {
        console.error("❌ Error initializing chat:", err);
      }
    };

    initChat();

    return () => {
      if (client) client.disconnectUser();
    };
  }, [location.pathname]);

  return (
    <ChatContext.Provider value={{ client, user }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
