import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/userLayout";
import React from "react";
import { clientServer } from "@/config";
import { useEffect, useState } from "react";
import styles from "./index.module.css";
import { BASE_URL } from "@/config";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { getAboutUser } from "@/config/redux/action/authAction";
import { getAllPosts } from "@/config/redux/action/postAction";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const postState = useSelector((state) => state.posts);
  const [userProfile, setUserProfile] = useState({
    userId: {},
    bio: "",
    currentPost: "",
    pastWork: [],
    education: [],
  });
  const [userPosts, setUserPosts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModal2Open, setIsModal2Open] = useState(false);

  const [inputData, setInputData] = useState({
    company: "",
    position: "",
    years: "",
  });

  const handleWorkInputChange = (e) => {
    const { name, value } = e.target;
    setInputData({ ...inputData, [name]: value });
  };

  useEffect(() => {
    dispatch(getAboutUser({ token: localStorage.getItem("token") }));
    dispatch(getAllPosts());
  }, []);

  const [educationData, setEducationData] = useState({
    school: "",
    degree: "",
    fieldOfStudy: "",
  });

  const handleEducationInputChange = (e) => {
    const { name, value } = e.target;
    setEducationData({ ...educationData, [name]: value });
  };

  useEffect(() => {
    if (authState.user) {
      setUserProfile({
        ...authState.user,
        pastWork: authState.user.pastWork || [],
        education: authState.user.education || [],
      });

      let post =
        postState.posts?.filter(
          (post) => post.userId?.username === authState.user?.userId?.username
        ) || [];

      setUserPosts(post);
    }
  }, [authState.user, postState.posts]);

  const updateProfilePicture = async (file) => {
    const formData = new FormData();
    formData.append("profile_picture", file);
    formData.append("token", localStorage.getItem("token"));
    const response = await clientServer.post(
      "/update_profile_picture",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    dispatch(getAboutUser({ token: localStorage.getItem("token") }));
  };

  const updateProfileData = async () => {
    if (!userProfile?.userId) return;

    const request = await clientServer.post("/user_update", {
      token: localStorage.getItem("token"),
      name: userProfile.userId.name || "",
    });

    const response = await clientServer.post("/update_profile_data", {
      token: localStorage.getItem("token"),
      bio: userProfile.bio || "",
      currentPost: userProfile.currentPost || "",
      pastWork: userProfile.pastWork || [],
      education: userProfile.education || [],
    });

    dispatch(getAboutUser({ token: localStorage.getItem("token") }));
  };

  return (
    <UserLayout>
      <DashboardLayout>
        {authState.user && userProfile.userId && (
          <div className={styles.container}>
            <div className={styles.backDropContainer}>
              <label
                htmlFor="profilePictureUpload"
                className={styles.backDrop_overlay}
              >
                <p>Edit</p>
              </label>
              <input
                onChange={(e) => {
                  updateProfilePicture(e.target.files[0]);
                }}
                hidden
                type="file"
                id="profilePictureUpload"
              ></input>
              <img
                className={styles.backDrop}
                src={`${BASE_URL}/${
                  userProfile.userId?.profilePicture || "default.jpg"
                }`}
                alt="profilePic"
              />
            </div>
            <div className={styles.profileContainerDetails}>
              <div className={styles.profileContainerDetails}>
                <div style={{ flex: "0.7" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1.2rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        width: "fit-content",
                        alignItems: "center",
                        gap: "1.2rem",
                      }}
                    >
                      <label htmlFor="nameInput" className={styles.inputLabel}>
                        Name:
                      </label>
                      <input
                        id="nameInput"
                        className={styles.nameEdit}
                        type="text"
                        value={userProfile.userId?.name || ""}
                        onChange={(e) => {
                          setUserProfile({
                            ...userProfile,
                            userId: {
                              ...userProfile.userId,
                              name: e.target.value,
                            },
                          });
                        }}
                      ></input>
                      <label htmlFor="postInput" className={styles.inputLabel}>
                        CurrentPost:
                      </label>
                      <input
                        id="postInput"
                        className={styles.currentPostEdit}
                        type="text"
                        value={userProfile.currentPost || ""}
                        onChange={(e) => {
                          setUserProfile({
                            ...userProfile,
                            currentPost: e.target.value,
                          });
                        }}
                      ></input>
                    </div>
                  </div>

                  <div style={{ marginTop: "5px" }}>
                    <label htmlFor="bioInput" className={styles.inputLabel}>
                      Bio:
                    </label>
                    <textarea
                      id="bioInput"
                      value={userProfile.bio || ""}
                      onChange={(e) => {
                        setUserProfile({ ...userProfile, bio: e.target.value });
                      }}
                      rows={Math.max(
                        3,
                        Math.ceil((userProfile.bio?.length || 0) / 80)
                      )}
                      style={{ width: "100%" }}
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* Work History */}
            <div className={styles.workHistory}>
              <h3>Work History</h3>
              <div className={styles.workHistory_cont}>
                {(userProfile.pastWork || []).map((work, index) => (
                  <div key={index} className={styles.workHistoryCard}>
                    <p
                      style={{
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.8rem",
                        marginBottom: "5px",
                      }}
                    >
                      Company: {work?.company || "N/A"} | Position:{" "}
                      {work?.position || "N/A"}
                    </p>
                    <p>Year: {work?.years || "N/A"}</p>
                  </div>
                ))}
                <button
                  className={styles.addWorkButton}
                  onClick={() => {
                    setIsModalOpen(true);
                  }}
                >
                  Add Work
                </button>
              </div>
            </div>
            {/* Education */}
            <div className={styles.workHistory}>
              <h3>Education</h3>
              <div className={styles.workHistory_cont}>
                {(userProfile.education || []).map((edu, index) => (
                  <div key={index} className={styles.workHistoryCard}>
                    <p
                      style={{
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.8rem",
                        marginBottom: "5px",
                      }}
                    >
                      School/College: {edu?.school || "N/A"} | Degree:{" "}
                      {edu?.degree || "N/A"}
                    </p>
                    <p>Stream: {edu?.fieldOfStudy || "N/A"}</p>
                  </div>
                ))}
                <button
                  className={styles.addWorkButton}
                  onClick={() => {
                    setIsModal2Open(true);
                  }}
                >
                  Add Education
                </button>
              </div>
            </div>
            {userProfile !== authState.user && (
              <div
                onClick={() => {
                  updateProfileData();
                }}
                className={styles.connectBtn}
              >
                Update Profile
              </div>
            )}
          </div>
        )}

        {isModalOpen && (
          <div
            onClick={() => {
              setIsModalOpen(false);
            }}
            className={styles.commentsContainer}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
              }}
              className={styles.allCommentsContainer}
            >
              <input
                onChange={handleWorkInputChange}
                name="company"
                className={styles.input_field}
                type="text"
                placeholder="Enter Company"
              />
              <input
                onChange={handleWorkInputChange}
                name="position"
                className={styles.input_field}
                type="text"
                placeholder="Enter Position"
              />
              <input
                onChange={handleWorkInputChange}
                name="years"
                className={styles.input_field}
                type="number"
                placeholder="Enter Years"
              />
              <div
                onClick={() => {
                  setUserProfile({
                    ...userProfile,
                    pastWork: [...(userProfile.pastWork || []), inputData],
                  });
                  setIsModalOpen(false);
                }}
                className={styles.connectBtn}
              >
                Add Work
              </div>
            </div>
          </div>
        )}

        {isModal2Open && (
          <div
            onClick={() => {
              setIsModal2Open(false);
            }}
            className={styles.commentsContainer}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
              }}
              className={styles.allCommentsContainer}
            >
              <input
                onChange={handleEducationInputChange}
                name="school"
                className={styles.input_field}
                type="text"
                placeholder="Enter School"
              />
              <input
                onChange={handleEducationInputChange}
                name="degree"
                className={styles.input_field}
                type="text"
                placeholder="Enter Degree"
              />
              <input
                onChange={handleEducationInputChange}
                name="fieldOfStudy"
                className={styles.input_field}
                type="text"
                placeholder="Field of Study"
              />
              <div
                onClick={() => {
                  setUserProfile({
                    ...userProfile,
                    education: [
                      ...(userProfile.education || []),
                      educationData,
                    ],
                  });
                  setIsModal2Open(false);
                }}
                className={styles.connectBtn}
              >
                Add Education
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </UserLayout>
  );
};

export default ProfilePage;
