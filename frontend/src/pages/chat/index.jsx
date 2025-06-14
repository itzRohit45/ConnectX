import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import UserLayout from "@/layout/userLayout";
import {
  getChatHistory,
  getUserConversations,
  markMessagesAsRead,
} from "@/config/redux/action/chatAction";
import {
  addMessage,
  setCurrentChatUser,
  setTypingStatus,
} from "@/config/redux/reducer/chatReducer";
import {
  initializeSocket,
  getSocket,
  sendPrivateMessage,
  emitTyping,
  emitStopTyping,
} from "@/services/socketService";
import { BASE_URL } from "@/config";
import styles from "./index.module.css";

const Chat = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { receiverId } = router.query;

  const chatState = useSelector((state) => state.chat);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const authState = useSelector((state) => state.auth);
  const user = authState.user?.userId;

  const [message, setMessage] = useState("");
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);

  // Initialize socket connection when component mounts
  useEffect(() => {
    if (user?._id) {
      // Initialize socket connection
      initializeSocket(user._id);

      // Get user conversations
      const token = localStorage.getItem("token");
      if (token) {
        dispatch(getUserConversations({ token }));
      }

      // Listen for socket events
      const socket = getSocket();
      if (socket) {
        socket.on("private message", (message) => {
          dispatch(addMessage(message));

          // Mark as read if it's in the current chat
          if (
            chatState.currentChat.user &&
            message.sender._id === chatState.currentChat.user._id
          ) {
            const token = localStorage.getItem("token");
            if (token) {
              dispatch(
                markMessagesAsRead({
                  token,
                  senderId: message.sender._id,
                })
              );
            }
          }
        });

        socket.on("typing", (data) => {
          if (
            chatState.currentChat.user &&
            data.sender === chatState.currentChat.user._id
          ) {
            dispatch(setTypingStatus({ sender: data.sender, isTyping: true }));
          }
        });

        socket.on("stop typing", (data) => {
          if (
            chatState.currentChat.user &&
            data.sender === chatState.currentChat.user._id
          ) {
            dispatch(setTypingStatus({ sender: data.sender, isTyping: false }));
          }
        });
      }

      return () => {
        // Clean up socket events when component unmounts
        const socket = getSocket();
        if (socket) {
          socket.off("private message");
          socket.off("typing");
          socket.off("stop typing");
        }
      };
    }
  }, [dispatch, user?._id]);

  // Detect mobile view
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth <= 768);
    };

    // Check initial size
    checkMobileView();

    // Add resize listener
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

  // Auto-hide sidebar when user selects a chat on mobile
  useEffect(() => {
    if (isMobileView && receiverId) {
      setShowSidebar(false);
    }
  }, [isMobileView, receiverId]);

  // Load chat when receiverId changes or if a user is selected from conversation list
  useEffect(() => {
    if (receiverId && user?._id) {
      const token = localStorage.getItem("token");

      // Find the user in conversations
      const selectedConversation = chatState.conversations.find(
        (conv) => conv.user._id === receiverId
      );

      if (selectedConversation) {
        dispatch(setCurrentChatUser(selectedConversation.user));
      } else {
        // Need to fetch user details if not in conversations
        // For now, just set the ID and it will be populated later
        dispatch(setCurrentChatUser({ _id: receiverId }));
      }

      // Get chat history
      if (token) {
        dispatch(getChatHistory({ token, receiverId }));

        // Mark messages as read
        dispatch(markMessagesAsRead({ token, senderId: receiverId }));
      }
    }
  }, [dispatch, receiverId, user?._id, chatState.conversations]);

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatState.currentChat.messages]);

  const handleSendMessage = () => {
    if (!message.trim() || !chatState.currentChat.user) return;

    const token = localStorage.getItem("token");
    if (!token || !user?._id) return;

    // Send message via socket
    const success = sendPrivateMessage(
      user._id,
      chatState.currentChat.user._id,
      message.trim(),
      token
    );

    if (success) {
      // Clear message input
      setMessage("");

      // Clear typing timeout and emit stop typing
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
        emitStopTyping(user._id, chatState.currentChat.user._id);
      }
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);

    // Handle typing indicator
    if (chatState.currentChat.user) {
      if (!typingTimeout) {
        emitTyping(user._id, chatState.currentChat.user._id);
      }

      // Clear existing timeout and set a new one
      if (typingTimeout) clearTimeout(typingTimeout);

      const timeout = setTimeout(() => {
        emitStopTyping(user._id, chatState.currentChat.user._id);
        setTypingTimeout(null);
      }, 2000); // Stop typing indicator after 2 seconds of no typing

      setTypingTimeout(timeout);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectConversation = (userId) => {
    router.push(`/chat?receiverId=${userId}`);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <UserLayout>
      <div className={styles.chatContainer}>
        {/* Mobile new chat button (only visible when in chat view on mobile) */}
        {isMobileView && !showSidebar && (
          <button
            className={styles.newChatButton}
            onClick={() => setShowSidebar(true)}
          >
            +
          </button>
        )}

        {/* Sidebar with conversations */}
        <div
          className={`${styles.sidebar} ${
            !showSidebar && isMobileView ? styles.sidebarHidden : ""
          }`}
        >
          <div className={styles.sidebarHeader}>
            <h3>Messages</h3>
          </div>
          <div className={styles.conversationList}>
            {chatState.conversations.length === 0 && (
              <div className={styles.noConversations}>No conversations yet</div>
            )}
            {chatState.conversations.map((conversation) => (
              <div
                key={conversation.user._id}
                className={`${styles.conversationItem} ${
                  chatState.currentChat.user?._id === conversation.user._id
                    ? styles.activeConversation
                    : ""
                }`}
                onClick={() => selectConversation(conversation.user._id)}
              >
                <div className={styles.conversationAvatar}>
                  {conversation.user.profilePicture ? (
                    <img
                      src={`${BASE_URL}/${conversation.user.profilePicture}`}
                      alt={conversation.user.name}
                    />
                  ) : (
                    <div className={styles.defaultAvatar}>
                      {conversation.user.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className={styles.conversationInfo}>
                  <div className={styles.conversationHeader}>
                    <h4>{conversation.user.name}</h4>
                    {conversation.lastMessage && (
                      <span className={styles.messageTime}>
                        {formatTime(conversation.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className={styles.conversationPreview}>
                    <p>
                      {conversation.lastMessage
                        ? conversation.lastMessage.message.length > 30
                          ? conversation.lastMessage.message.substring(0, 30) +
                            "..."
                          : conversation.lastMessage.message
                        : "No messages yet"}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className={styles.unreadBadge}>
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat main area */}
        <div
          className={`${styles.chatMain} ${
            showSidebar && isMobileView ? styles.chatMainHidden : ""
          }`}
        >
          {chatState.currentChat.user ? (
            <>
              {/* Chat header */}
              <div className={styles.chatHeader}>
                {isMobileView && (
                  <button
                    className={styles.backButton}
                    onClick={() => setShowSidebar(true)}
                  >
                    ← Back
                  </button>
                )}
                <div className={styles.chatHeaderUser}>
                  {chatState.currentChat.user.profilePicture ? (
                    <img
                      src={`${BASE_URL}/${chatState.currentChat.user.profilePicture}`}
                      alt={chatState.currentChat.user.name}
                    />
                  ) : (
                    <div className={styles.defaultAvatar}>
                      {chatState.currentChat.user.name?.charAt(0)}
                    </div>
                  )}
                  <div className={styles.userInfo}>
                    <h3>{chatState.currentChat.user.name}</h3>
                    {chatState.currentChat.isTyping && (
                      <span className={styles.typingIndicator}>typing...</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages area */}
              <div className={styles.messagesContainer}>
                {chatState.currentChat.messages.length === 0 ? (
                  <div className={styles.noMessages}>
                    <p>No messages yet. Start a conversation!</p>
                  </div>
                ) : (
                  <>
                    {chatState.currentChat.messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`${styles.messageItem} ${
                          msg.sender._id === user?._id
                            ? styles.sentMessage
                            : styles.receivedMessage
                        }`}
                      >
                        <div className={styles.messageContent}>
                          <p>{msg.message}</p>
                          <div className={styles.messageInfo}>
                            <span className={styles.messageTime}>
                              {formatTime(msg.createdAt)}
                            </span>
                            {msg.sender._id === user?._id && (
                              <span className={styles.readStatus}>
                                {msg.read ? "✓✓" : "✓"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message input area */}
              <div className={styles.messageInputContainer}>
                <textarea
                  className={styles.messageInput}
                  value={message}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  rows={1}
                />
                <button
                  className={styles.sendButton}
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className={styles.noChatSelected}>
              <div className={styles.noChatContent}>
                <h3>Select a conversation to start chatting</h3>
                <p>Choose from your connections on the left</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
};

export default Chat;
