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
  checkSocketConnection,
  reconnectSocket,
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
  const [socketStatus, setSocketStatus] = useState({ connected: false });
  const [retryCount, setRetryCount] = useState(0);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [errorState, setErrorState] = useState(null);
  const messagesEndRef = useRef(null);

  // Initialize socket connection when component mounts
  useEffect(() => {
    if (user?._id) {
      // Initialize socket connection
      try {
        console.log("Initializing socket connection with user ID:", user._id);
        initializeSocket(user._id);

        // Check socket connection status periodically
        const intervalId = setInterval(() => {
          const status = checkSocketConnection();
          setSocketStatus(status);

          // Auto reconnect if disconnected and we haven't retried too many times
          if (!status.connected && retryCount < 3) {
            console.log(
              `Socket disconnected. Attempting reconnection #${retryCount + 1}`
            );
            reconnectSocket(user._id);
            setRetryCount((prev) => prev + 1);
          }
        }, 5000);

        return () => clearInterval(intervalId);
      } catch (error) {
        console.error("Socket initialization error:", error);
        setErrorState({
          type: "socket",
          message: "Failed to connect to chat server",
        });
      }
    }
  }, [user?._id]);

  // Get user conversations with error handling and retries
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token && authState.profileFetched) {
          console.log(
            "About to dispatch getUserConversations with token:",
            token.substring(0, 10) + "..."
          );

          // Try using direct fetch API as a fallback if dispatch fails
          try {
            await dispatch(getUserConversations({ token })).unwrap();
            setErrorState(null);
          } catch (dispatchError) {
            console.error(
              "Redux dispatch failed, trying direct fetch:",
              dispatchError
            );

            // Direct fetch as backup
            const response = await fetch(
              `${BASE_URL}/chat/conversations?token=${token}`
            );
            if (response.ok) {
              const data = await response.json();
              console.log("Direct fetch successful:", data);
              // Handle the data manually
              setErrorState(null);
            } else {
              throw new Error(
                `API returned ${response.status}: ${response.statusText}`
              );
            }
          }
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
        setErrorState({
          type: "api",
          message: `Failed to load conversations: ${
            error.message || "Unknown error"
          }`,
          details: error.response?.data || error.message,
        });

        // Retry after a delay if we haven't tried too many times
        if (retryCount < 3) {
          setTimeout(() => {
            console.log(`Retrying conversation fetch #${retryCount + 1}`);
            setRetryCount((prev) => prev + 1);
            // The next useEffect cycle will try again
          }, 3000);
        }
      }
    };

    fetchConversations();
  }, [authState.profileFetched, dispatch, retryCount]);

  // Listen for socket events and load chat history
  useEffect(() => {
    if (user?._id) {
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

        return () => {
          socket.off("private message");
          socket.off("typing");
          socket.off("stop typing");
        };
      }
    }
  }, [user?._id, chatState.currentChat.user, dispatch]);

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

  // Handle receiverId from URL query parameter
  useEffect(() => {
    if (receiverId && user?._id && chatState.conversations.length > 0) {
      console.log(`Received receiverId from URL: ${receiverId}`);

      // Check if the receiverId is in our conversations
      const conversation = chatState.conversations.find(
        (conv) => conv.user._id === receiverId
      );

      if (conversation) {
        console.log(`Found conversation with ${receiverId}, selecting it`);
        selectConversation(receiverId);
      } else {
        console.log(
          `Could not find conversation with ${receiverId} in loaded conversations`
        );
        // We might want to handle this case differently - perhaps create a new conversation?
        setErrorState({
          type: "conversation",
          message: "Could not find the specified conversation",
        });
      }
    }
  }, [receiverId, user?._id, chatState.conversations]);

  // Load chat history when currentChat changes
  useEffect(() => {
    if (chatState.currentChat.user?._id && user?._id) {
      loadChatHistory(chatState.currentChat.user._id);
    }
  }, [chatState.currentChat.user?._id, user?._id]);

  // Load chat history for a specific user
  const loadChatHistory = async (receiverId) => {
    try {
      setLoadingMessages(true);
      const token = localStorage.getItem("token");
      if (token) {
        await dispatch(getChatHistory({ token, receiverId })).unwrap();

        // Mark messages as read
        dispatch(
          markMessagesAsRead({
            token,
            senderId: receiverId,
          })
        );

        setErrorState(null);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
      setErrorState({
        type: "chat-history",
        message: "Failed to load chat messages",
      });
    } finally {
      setLoadingMessages(false);
    }
  };

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

        {/* Connection status */}
        {!socketStatus.connected && (
          <div className={styles.connectionAlert}>
            <p>⚠️ Chat connection is offline. Messages may not send.</p>
            <button onClick={() => reconnectSocket(user?._id)}>
              Reconnect
            </button>
          </div>
        )}

        {/* Error banner */}
        {errorState && (
          <div className={styles.errorAlert}>
            <p>Error: {errorState.message}</p>
            <button onClick={() => setErrorState(null)}>Dismiss</button>
          </div>
        )}

        {/* Sidebar with conversations */}
        <div
          className={`${styles.sidebar} ${
            !showSidebar && isMobileView ? styles.sidebarHidden : ""
          }`}
        >
          <div className={styles.sidebarHeader}>
            <h3>Messages</h3>
            {/* Status indicator */}
            <div
              className={`${styles.statusIndicator} ${
                socketStatus.connected ? styles.connected : styles.disconnected
              }`}
            >
              {socketStatus.connected ? "Online" : "Offline"}
            </div>
          </div>
          <div className={styles.conversationList}>
            {chatState.loading && (
              <div className={styles.loadingState}>
                Loading conversations...
              </div>
            )}
            {!chatState.loading && chatState.conversations.length === 0 && (
              <div className={styles.noConversations}>
                {errorState?.type === "api"
                  ? "Failed to load conversations. Please try again."
                  : "No conversations yet. Connect with users to start chatting."}
              </div>
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
                  {conversation.user?.profilePicture ? (
                    <img
                      src={`${BASE_URL}/${conversation.user.profilePicture}`}
                      alt={conversation.user?.name || "User"}
                    />
                  ) : (
                    <div className={styles.defaultAvatar}>
                      {conversation.user?.name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>
                <div className={styles.conversationInfo}>
                  <div className={styles.conversationHeader}>
                    <h4>{conversation.user?.name || "Unknown User"}</h4>
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
                  {chatState.currentChat.user?.profilePicture ? (
                    <img
                      src={`${BASE_URL}/${chatState.currentChat.user.profilePicture}`}
                      alt={chatState.currentChat.user?.name || "User"}
                    />
                  ) : (
                    <div className={styles.defaultAvatar}>
                      {chatState.currentChat.user?.name?.charAt(0) || "?"}
                    </div>
                  )}
                  <div className={styles.userInfo}>
                    <h3>
                      {chatState.currentChat.user?.name || "Unknown User"}
                    </h3>
                    {chatState.isTyping.get(chatState.currentChat.user._id) && (
                      <p className={styles.typingIndicator}>typing...</p>
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
