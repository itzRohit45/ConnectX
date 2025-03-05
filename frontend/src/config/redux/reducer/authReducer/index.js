import { createSlice } from "@reduxjs/toolkit";

import {
  acceptConnectionRequest,
  getAboutUser,
  getAllUsers,
  getAllConnections,
  sendConnectionRequest,
  loginUser,
  registerUser,
} from "../../action/authAction";

const initialState = {
  user: {},
  isError: false,
  isSuccess: false,
  isLoading: false,
  loggedIn: false,
  message: "",
  isTokenThere: false,
  profileFetched: false,
  connections: [],
  sentRequests: [],
  receivedRequests: [],
  all_users: [],
  all_profiles_fetched: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    reset: () => initialState,
    emptyMessage: (state) => {
      state.message = "";
    },
    setIsTokenThere: (state) => {
      state.isTokenThere = true;
    },
    setIsTokenNotThere: (state) => {
      state.isTokenThere = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login & Register Handling
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.message = "Logging in...";
      })
      .addCase(loginUser.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.loggedIn = true;
        state.message = "Login successful";
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload.message;
      })
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.message = "Registering...";
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = "Registration successful. Please login.";
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Fetch User Data
      .addCase(getAboutUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profileFetched = true;
        state.user = action.payload;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.all_profiles_fetched = true;
        state.all_users = action.payload.profiles;
      })

      // Fetch All Connection Requests (sent, received, accepted)
      .addCase(getAllConnections.fulfilled, (state, action) => {
        const loggedInUserId = state.user?.userId?._id; // Get the logged-in user ID

        state.sentRequests = action.payload.sentRequests; // Requests user has sent
        state.receivedRequests = action.payload.receivedRequests; // Requests received by user

        //Ensure connections only show the OTHER person
        state.connections = action.payload.acceptedConnections.map(
          (connection) => {
            return connection.userId._id === loggedInUserId
              ? connection.connectionId
              : connection.userId;
          }
        );
      })

      .addCase(getAllConnections.rejected, (state, action) => {
        state.message = action.payload;
      })

      // Send Connection Request
      .addCase(sendConnectionRequest.fulfilled, (state, action) => {
        state.sentRequests.push(action.payload.request); // Immediately add sent request
      })

      // Accept Connection Request
      .addCase(acceptConnectionRequest.fulfilled, (state, action) => {
        const requestId = action.meta.arg.connectionId;
        state.receivedRequests = state.receivedRequests.filter(
          (req) => req._id !== requestId
        ); //  Remove accepted request
        state.connections.push(action.payload.connection); //Move to connections
      });
  },
});

export const { emptyMessage, reset, setIsTokenThere, setIsTokenNotThere } =
  authSlice.actions;
export default authSlice.reducer;
