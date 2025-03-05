import NavBar from "@/Components/Navbar";
import React from "react";

const UserLayout = ({ children }) => {
  return (
    <div>
      <NavBar />
      {children}
    </div>
  );
};

export default UserLayout;
