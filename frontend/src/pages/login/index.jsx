import UserLayout from "@/layout/userLayout";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./style.module.css";
import { loginUser, registerUser } from "@/config/redux/action/authAction";
import { reset, emptyMessage } from "@/config/redux/reducer/authReducer";
const LoginComponent = () => {
  const authState = useSelector((state) => state.auth);
  const router = useRouter();
  const dispatch = useDispatch();
  const [userLoginMethod, setUserLoginMethod] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (authState.loggedIn) {
      router.push("/dashboard");
    }
  }, [authState.loggedIn]);

  useEffect(() => {
    dispatch(emptyMessage());
  }, [userLoginMethod]);

  useEffect(() => {
    if (authState.isSuccess && !userLoginMethod) {
      resetForm();
    }
  }, [authState.isSuccess]);

  const handleRegister = () => {
    dispatch(registerUser({ username, password, email, name }));
    resetForm();
  };

  const handleLogin = () => {
    console.log("login");
    dispatch(loginUser({ email, password }));
    if (authState.isSuccess) {
      router.push("/dashboard");
    }
  };

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setName("");
  };
  return (
    <UserLayout>
      <div className={styles.container}>
        <div className={styles.cardContainer}>
          <div className={styles.cardContainer_left}>
            <h2 className={styles.cardleft_heading}>
              {userLoginMethod ? "Welcome Back!" : "Join Us Today! "}
            </h2>
            <p className={styles.subtitle}>
              {userLoginMethod
                ? "Sign in to continue your journey."
                : "Create an account to get started."}
            </p>

            <p style={{ color: authState.isError ? "red" : "green" }}>
              {authState.message}
            </p>

            <div className={styles.inputContainers}>
              {!userLoginMethod && (
                <div className={styles.inputRow}>
                  <div className={styles.inputBox}>
                    <i className="fas fa-user"></i>
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={styles.input_field}
                      type="text"
                      placeholder="Username"
                    />
                  </div>

                  <div className={styles.inputBox}>
                    <i className="fas fa-id-card"></i>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={styles.input_field}
                      type="text"
                      placeholder="Name"
                    />
                  </div>
                </div>
              )}

              <div className={styles.inputBox}>
                <i className="fas fa-envelope"></i>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input_field}
                  type="text"
                  placeholder="Email"
                />
              </div>

              <div className={styles.inputBox}>
                <i className="fas fa-lock"></i>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input_field}
                  type="password"
                  placeholder="Password"
                />
              </div>

              {userLoginMethod && (
                <p className={styles.forgotPassword}>Forgot Password?</p>
              )}

              <button
                onClick={() => {
                  if (userLoginMethod) {
                    handleLogin();
                  } else {
                    handleRegister();
                  }
                }}
                className={styles.primaryButton}
              >
                {userLoginMethod ? "Sign In" : "Sign Up"}
              </button>
            </div>
          </div>

          <div className={styles.cardContainer_right}>
            <div>
              {userLoginMethod ? (
                <p>Don't Have an Account?</p>
              ) : (
                <p>Already Have an Account?</p>
              )}

              <div
                onClick={() => {
                  setUserLoginMethod(!userLoginMethod);
                  if (!userLoginMethod) {
                    resetForm();
                  }
                }}
                className={styles.buttonWithOutline}
              >
                <p>{userLoginMethod ? "Sign Up" : "Sign In"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default LoginComponent;
