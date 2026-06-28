import React from "react";

const DeveloperBadge: React.FC = () => {
  return (
    <a
      href="https://gnanadeepstudio.vercel.app"
      target="_blank"
      rel="noopener noreferrer"
      style={styles.badge}
    >
      <div style={styles.profilePicContainer}>
        <img src="/logo.png" alt="Gnanadeep Gumpula" style={styles.profilePic} />
      </div>
      <span style={styles.text}>Developed by Gnanadeep Gumpula</span>
    </a>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  badge: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#ffffff",
    color: "#1a1a1a",
    padding: "8px 14px 8px 8px",
    borderRadius: "30px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: "13px",
    fontWeight: 500,
    textDecoration: "none",
    zIndex: 9999,
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    border: "1px solid rgba(0, 0, 0, 0.05)",
  },
  profilePicContainer: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
  },
  profilePic: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  text: {
    whiteSpace: "nowrap",
  },
};

export default DeveloperBadge;
