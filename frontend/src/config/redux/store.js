// steps for state management
// submit action
// handle action in its Reducer
// register here->reducer
import authReducer from "./reducer/authReducer";
import { configureStore } from "@reduxjs/toolkit";
import postReducer from "./reducer/postReducer";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postReducer,
  },
});
