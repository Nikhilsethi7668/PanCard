import Axios from "./Lib/Axios";

export const signup = async (data) => {
  try {
    const response = await Axios.post("/auth/signup", data);
    // console.log("response from signup", response);
    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const checkAuth = async () => {
  try {
    const response = await Axios.get("/auth/check-auth");
    console.log("response from checkAuth", response);
    return response;
  } catch (error) {
    return error;
  }
};

export const login = async (email, password) => {
  try {
    const response = await Axios.post("/auth/login", { email, password });
    console.log("response", response);
    return response.data;
  } catch (error) {
    console.log("error", error);
    throw error.response?.data?.message || "Error logging in";
  }
};

export const logout = async () => {
  try {
    await Axios.post("/auth/logout");
  } catch (error) {
    throw "Error logging out";
  }
};
