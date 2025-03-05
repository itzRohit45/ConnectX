import { clientServer } from "@/config";
import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/userLayout";
import { useEffect, useState } from "react";
import styles from "./index.module.css";
import { BASE_URL } from "@/config";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { getAllPosts } from "@/config/redux/action/postAction";
import {
  getAllConnections,
  sendConnectionRequest,
} from "@/config/redux/action/authAction";

export default function ViewProfilePage({ userProfile }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const postState = useSelector((state) => state.posts);
  const authState = useSelector((state) => state.auth);

  const [userPosts, setUserPosts] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("Connect");

  const loggedInUserId = authState.user?.userId?._id;
  const isOwnProfile = loggedInUserId === userProfile.userId._id;

  useEffect(() => {
    dispatch(getAllConnections({ token: localStorage.getItem("token") }));
    dispatch(getAllPosts());
  }, [dispatch]);

  useEffect(() => {
    let post = postState.posts.filter(
      (post) => post.userId.username === router.query.username
    );
    setUserPosts(post);
  }, [postState.posts]);

  useEffect(() => {
    if (!authState.connections || !authState.sentRequests) return;

    // Check if user is already connected
    const isConnected = authState.connections.some(
      (conn) => conn?._id === userProfile.userId._id
    );

    const isRequestPending = authState.sentRequests.some(
      (req) => req?.connectionId?._id === userProfile.userId._id
    );

    if (isConnected) {
      setConnectionStatus("Connected");
    } else if (isRequestPending) {
      setConnectionStatus("Pending");
    } else {
      setConnectionStatus("Connect");
    }
  }, [authState.connections, authState.sentRequests, userProfile.userId]);

  const handleConnectionRequest = () => {
    dispatch(
      sendConnectionRequest({
        token: localStorage.getItem("token"),
        user_id: userProfile.userId._id,
      })
    );
    setConnectionStatus("Pending");
  };

  return (
    <UserLayout>
      <DashboardLayout>
        <div className={styles.container}>
          <div className={styles.backDropContainer}>
            <img
              className={styles.backDrop}
              src={`${BASE_URL}/${userProfile.userId.profilePicture}`}
              alt="profilePic"
            />
          </div>
          <div className={styles.profileContainerDetails}>
            <div className={styles.profileContainer_flex}>
              <div style={{ flex: "0.7" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1.2rem",
                  }}
                >
                  <h2>{userProfile.userId.name}</h2>
                  <p style={{ color: "grey", marginTop: "4px" }}>
                    @{userProfile.userId.username}
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1.2rem",
                  }}
                >
                  {/* Show Connect button only if it's NOT the logged-in user */}
                  {!isOwnProfile && connectionStatus === "Connect" && (
                    <button
                      onClick={handleConnectionRequest}
                      className={styles.connectBtn}
                    >
                      Connect
                    </button>
                  )}
                  {!isOwnProfile && connectionStatus === "Pending" && (
                    <button className={styles.connectedBtn}>Pending</button>
                  )}
                  {!isOwnProfile && connectionStatus === "Connected" && (
                    <button className={styles.connectedBtn2}>Connected</button>
                  )}
                  <div
                    className={styles.download}
                    onClick={async () => {
                      const response = await clientServer.get(
                        `/user/download_resume?id=${userProfile.userId._id}`
                      );
                      window.open(
                        `${BASE_URL}/${response.data.message}`,
                        "blank"
                      );
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                      />
                    </svg>
                  </div>
                </div>
                <div
                  style={{
                    marginTop: "8px",
                    width: "fit-content",
                  }}
                >
                  <p style={{ marginBottom: "5px" }}>Bio: {userProfile.bio}</p>
                  <p>Current post: {userProfile.currentPost}</p>
                </div>
              </div>
              <div style={{ flex: "0.3" }}>
                <h3>Recent Activity</h3>
                {userPosts.map((post) => (
                  <div key={post._id} className={styles.postCard}>
                    <div className={styles.card}>
                      <div className={styles.card_profileContainer}>
                        {post.media !== "" ? (
                          <img src={`${BASE_URL}/${post.media}`} alt="media" />
                        ) : (
                          <div style={{ width: "3.4rem", height: "3.4rem" }} />
                        )}
                        <p>{post.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/*  Work History Section */}
          <div className={styles.workHistory}>
            <h3>Work History</h3>
            <div className={styles.workHistory_cont}>
              {userProfile.pastWork.map((work, index) => (
                <div key={index} className={styles.workHistoryCard}>
                  <p>
                    <strong>Company:</strong> {work.company} |{" "}
                    <strong>Position:</strong> {work.position}
                  </p>
                  <p>Year: {work.years}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Education Section */}
          <div className={styles.workHistory}>
            <h3>Education</h3>
            <div className={styles.workHistory_cont}>
              {userProfile.education.map((edu, index) => (
                <div key={index} className={styles.workHistoryCard}>
                  <p>
                    <strong>School/College:</strong> {edu.school} |{" "}
                    <strong>Degree:</strong> {edu.degree}
                  </p>
                  <p>Stream: {edu.fieldOfStudy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </UserLayout>
  );
}

export async function getServerSideProps(context) {
  const request = await clientServer.get("/user/get_profile_with_username", {
    params: { username: context.query.username },
  });

  return { props: { userProfile: request.data.profile } };
}
