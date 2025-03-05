import UserLayout from "@/layout/userLayout";
import React from "react";

const AboutUs = () => {
  return (
    <UserLayout>
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            color: "gray",
            marginBottom: "16px",
          }}
        >
          ConnectX
        </h1>
        <p style={{ fontSize: "18px", color: "#666", marginBottom: "24px" }}>
          ConnectX is a modern social media platform designed to bring people
          together, share thoughts, and build meaningful connections. Whether
          you're looking to express yourself, discover new content, or expand
          your network, ConnectX provides the perfect space for social
          engagement.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "20px",
            marginTop: "32px",
          }}
        >
          <div
            style={{
              background: "#fff",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
              padding: "16px",
              borderRadius: "12px",
              flex: "1",
            }}
          >
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#333",
                marginBottom: "12px",
              }}
            >
              Our Mission
            </h3>
            <p style={{ color: "#666" }}>
              To create an inclusive social platform where users can freely
              share their thoughts, connect with like-minded individuals, and
              stay updated with trending content.
            </p>
          </div>

          <div
            style={{
              background: "#fff",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
              padding: "16px",
              borderRadius: "12px",
              flex: "1",
            }}
          >
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#333",
                marginBottom: "12px",
              }}
            >
              Our Vision
            </h3>
            <p style={{ color: "#666" }}>
              To be the ultimate social networking space where users can build
              communities, engage with diverse content, and foster genuine
              interactions.
            </p>
          </div>

          <div
            style={{
              background: "#fff",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
              padding: "16px",
              borderRadius: "12px",
              flex: "1",
            }}
          >
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#333",
                marginBottom: "12px",
              }}
            >
              Why ConnectX?
            </h3>
            <p style={{ color: "#666" }}>
              Unlike traditional social platforms, ConnectX focuses on real-time
              engagement, meaningful connections, and a user-friendly experience
              that keeps you connected with what matters most.
            </p>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default AboutUs;
