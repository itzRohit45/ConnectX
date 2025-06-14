import { getAllUsers } from "@/config/redux/action/authAction";
import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/userLayout";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BASE_URL } from "@/config";
import styles from "./index.module.css";
import { useRouter } from "next/router";

const Discover = () => {
  const authState = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!authState.all_profiles_fetched) {
      dispatch(getAllUsers());
    }
  }, [authState.all_profiles_fetched, dispatch]);

  // Get the logged-in user ID
  const loggedInUserId = authState.user?.userId?._id;

  // Filter users: Remove logged-in user from the list and handle null/undefined userId
  const filteredUsers = authState.all_users
    ?.filter((user) => {
      // Skip users with null or undefined userId
      if (!user || !user.userId) return false;

      return (
        user.userId._id !== loggedInUserId && // ✅ Exclude logged-in user
        (user.userId.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.userId.username
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()))
      );
    })
    ?.filter(Boolean);

  return (
    <UserLayout>
      <DashboardLayout>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Discover..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.allUserProfile}>
          {authState.all_profiles_fetched && filteredUsers?.length > 0 ? (
            filteredUsers.map((user) => (
              <div
                onClick={() => {
                  router.push(`/view_profile/${user.userId.username}`);
                }}
                key={user._id}
                className={styles.userCard}
              >
                <img
                  className={styles.userCard_image}
                  src={`${BASE_URL}/${
                    user.userId.profilePicture || "default.jpg"
                  }`}
                  alt="profile"
                />
                <div className={styles.name}>
                  <h2>{user.userId.name || "Unknown"}</h2>
                  <p>{user.userId.username || "unknown"}</p>
                </div>
              </div>
            ))
          ) : (
            <p className={styles.noUserFound}>No users found</p>
          )}
        </div>
      </DashboardLayout>
    </UserLayout>
  );
};

export default Discover;
