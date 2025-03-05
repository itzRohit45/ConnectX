import UserLayout from "@/layout/userLayout";
import React from "react";

const Features = () => {
  return (
    <UserLayout>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            color: "gray",
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          Platform Features
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          <div
            style={{
              background: "#f9f9f9",
              padding: "16px",
              borderRadius: "8px",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#333" }}>
              Genuine Stories
            </h3>
            <p style={{ color: "#555" }}>
              Share and explore real experiences, insights, and meaningful
              interactions with the community.
            </p>
          </div>

          <div
            style={{
              background: "#f9f9f9",
              padding: "16px",
              borderRadius: "8px",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#333" }}>
              Secure and Private
            </h3>
            <p style={{ color: "#555" }}>
              Your data and interactions are protected with advanced security
              features and encryption.
            </p>
          </div>

          <div
            style={{
              background: "#f9f9f9",
              padding: "16px",
              borderRadius: "8px",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#333" }}>
              Easy Networking
            </h3>
            <p style={{ color: "#555" }}>
              Connect with professionals and friends easily, expanding your
              network with real interactions.
            </p>
          </div>

          <div
            style={{
              background: "#f9f9f9",
              padding: "16px",
              borderRadius: "8px",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#333" }}>
              Download Real-time Resumes
            </h3>
            <p style={{ color: "#555" }}>
              Generate and download dynamic, real-time resumes based on profile
              and activity.
            </p>
          </div>

          <div
            style={{
              background: "#f9f9f9",
              padding: "16px",
              borderRadius: "8px",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#333" }}>
              Post Comments
            </h3>
            <p style={{ color: "#555" }}>
              Engage in discussions by commenting on posts and sharing your
              opinions in real time.
            </p>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default Features;
