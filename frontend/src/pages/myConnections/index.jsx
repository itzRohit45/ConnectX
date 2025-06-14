import {
  acceptConnectionRequest,
  getAllConnections,
} from "@/config/redux/action/authAction";
import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/userLayout";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BASE_URL } from "@/config";
import styles from "./index.module.css";
import { useRouter } from "next/router";

const MyConnections = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const router = useRouter();

  const loggedInUserId = authState.user?.userId?._id; // Get current user ID

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      dispatch(getAllConnections({ token }));
    }
  }, [dispatch]);

  return (
    <UserLayout>
      <DashboardLayout>
        <div className={styles.container}>
          <h3>Pending Requests</h3>
          {(!authState.receivedRequests ||
            authState.receivedRequests.length === 0) && (
            <h2>No Incoming Requests</h2>
          )}
          {authState.receivedRequests?.map(
            (user, index) =>
              user?.userId && (
                <div key={index} className={styles.userCard}>
                  <div className={styles.profilePic}>
                    {user.userId?.profilePicture ? (
                      <img
                        src={`${BASE_URL}/${user.userId.profilePicture}`}
                        alt="profile"
                      />
                    ) : (
                      <div className={styles.placeholderImage}>No Image</div>
                    )}
                  </div>
                  <div className={styles.userInfo}>
                    <h3>{user.userId?.name || "Unknown"}</h3>
                    <p>@{user.userId?.username || "unknown"}</p>
                  </div>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();

                      console.log("Sending Accept Request:", {
                        connectionId: user._id,
                        token: localStorage.getItem("token"),
                        action_type: "accepted",
                      });

                      await dispatch(
                        acceptConnectionRequest({
                          connectionId: user._id,
                          token: localStorage.getItem("token"),
                          action_type: "accepted",
                        })
                      );

                      dispatch(
                        getAllConnections({
                          token: localStorage.getItem("token"),
                        })
                      );
                    }}
                    className={styles.connectedBtn}
                  >
                    Accept
                  </button>
                </div>
              )
          )}

          <h3>My Networks</h3>
          {(!authState.connections || authState.connections.length === 0) && (
            <h2>No Connections Yet</h2>
          )}
          {authState.connections?.map((user, index) =>
            user && user._id !== loggedInUserId ? (
              <div key={index} className={styles.userCard}>
                <div className={styles.profilePic}>
                  {user?.profilePicture ? (
                    <img
                      src={`${BASE_URL}/${user.profilePicture}`}
                      alt="profile"
                    />
                  ) : (
                    <div className={styles.placeholderImage}>No Image</div>
                  )}
                </div>
                <div className={styles.userInfo}>
                  <h3
                    onClick={() => {
                      router.push(`/view_profile/${user.username}`);
                    }}
                  >
                    {user?.name || "Unknown"}
                  </h3>
                  <p>@{user?.username || "unknown"}</p>
                </div>
                <div className={styles.actionButtons}>
                  <button
                    onClick={() =>
                      user?._id && router.push(`/chat?receiverId=${user._id}`)
                    }
                    className={styles.chatBtn}
                  >
                    Chat
                  </button>
                </div>
              </div>
            ) : null
          )}
        </div>
      </DashboardLayout>
    </UserLayout>
  );
};

export default MyConnections;
