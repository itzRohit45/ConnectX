import React, { useState, useRef, useEffect } from "react";
import styles from "./styles.module.css";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import Person4Icon from "@mui/icons-material/Person4";
import ChatIcon from "@mui/icons-material/Chat";
import { reset } from "@/config/redux/reducer/authReducer";
import { getUserConversations } from "@/config/redux/action/chatAction";

const NavBar = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const chatState = useSelector((state) => state.chat);

  const toggleMenu = () => setShowMenu((prev) => !prev);

  // Get unread message count
  const unreadMessagesCount =
    chatState.conversations?.reduce(
      (total, conv) => total + (conv.unreadCount || 0),
      0
    ) || 0;

  // Load conversations when logged in
  useEffect(() => {
    if (authState.profileFetched) {
      const token = localStorage.getItem("token");
      if (token) {
        dispatch(getUserConversations({ token }));
      }
    }
  }, [authState.profileFetched, dispatch]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.container}>
      <nav className={styles.navBar}>
        <img
          src="/images/logo.webp"
          className={styles.logo}
          onClick={() => {
            localStorage.removeItem("token");
            router.push("/");
            dispatch(reset());
          }}
          alt="Logo"
        />

        {!authState.profileFetched && (
          <div className={styles.navLinks}>
            <span
              onClick={() => router.push("/about")}
              className={styles.navItem}
            >
              About Us
            </span>
            <span
              onClick={() => router.push("/features")}
              className={styles.navItem}
            >
              Features
            </span>
            <span
              onClick={() => router.push("/helpSupport")}
              className={styles.navItem}
            >
              Help & Support
            </span>
          </div>
        )}

        {authState.profileFetched && (
          <div className={styles.profileContainer}>
            <div
              className={styles.iconWrapper}
              onClick={() => router.push("/chat")}
              style={{ marginRight: "10px" }}
            >
              <ChatIcon fontSize="large" />
              {unreadMessagesCount > 0 && (
                <span className={styles.unreadBadge}>
                  {unreadMessagesCount}
                </span>
              )}
            </div>

            <div className={styles.iconWrapper} onClick={toggleMenu}>
              <Person4Icon fontSize="large" />
            </div>

            {showMenu && authState.user && authState.user.userId && (
              <div className={styles.dropdownMenu} ref={menuRef}>
                <p
                  onClick={() => {
                    if (authState.user?.userId?.username) {
                      router.push(
                        `/view_profile/${authState.user.userId.username}`
                      );
                    }
                  }}
                  className={styles.userName}
                >
                  {authState.user?.userId?.name || "User"}
                </p>
                <div
                  style={{ cursor: "pointer", borderBottom: "1px solid #ccc" }}
                  onClick={() => {
                    router.push("/profile");
                  }}
                >
                  Edit Profile
                </div>

                <div
                  className={styles.logoutBtn}
                  onClick={() => {
                    localStorage.removeItem("token");
                    router.push("/");
                    dispatch(reset());
                  }}
                >
                  Logout
                </div>
              </div>
            )}
          </div>
        )}

        {!authState.profileFetched && (
          <div className={styles.navBarOptionContainer}>
            <div
              onClick={() => router.push("/login")}
              className={styles.buttonJoin}
            >
              Be a part
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};

export default NavBar;
