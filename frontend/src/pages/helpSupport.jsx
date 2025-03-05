import UserLayout from "@/layout/userLayout";
import React from "react";
import {
  FaPhone,
  FaEnvelope,
  FaLinkedin,
  FaInstagram,
  FaTwitter,
} from "react-icons/fa";

const HelpSupport = () => {
  return (
    <UserLayout>
      <div
        style={{
          maxWidth: "600px",
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
          Help & Support
        </h1>
        <p style={{ fontSize: "18px", color: "#555", marginBottom: "24px" }}>
          For any assistance, please reach out to our support team through the
          following channels:
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FaPhone style={{ color: "#333" }} />
            <span style={{ fontSize: "16px", color: "#555" }}>
              +91 7209087597
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FaEnvelope style={{ color: "#333" }} />
            <span style={{ fontSize: "16px", color: "#555" }}>
              rohit9060755@gmail.com
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FaLinkedin style={{ color: "#0077b5" }} />
            <a
              href="https://www.linkedin.com/in/rohit-kumar-86a437282/"
              style={{
                fontSize: "16px",
                color: "#0077b5",
                textDecoration: "none",
              }}
            >
              LinkedIn
            </a>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FaInstagram style={{ color: "#e4405f" }} />
            <a
              href="https://www.instagram.com/____rohit__28/"
              style={{
                fontSize: "16px",
                color: "#e4405f",
                textDecoration: "none",
              }}
            >
              Instagram
            </a>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FaTwitter style={{ color: "#1877f2" }} />
            <a
              href="https://x.com/Itzz_rohit88"
              style={{
                fontSize: "16px",
                color: "#1877f2",
                textDecoration: "none",
              }}
            >
              Twitter
            </a>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default HelpSupport;
