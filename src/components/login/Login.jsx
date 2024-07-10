import { useState } from "react";
import "./login.css";
import { toast } from "react-toastify";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import upload from "../../lib/upload";

const Login = () => {
  const [avatar, setAvatar] = useState({
    file: null,
    url: "",
  });

  const [loading, setLoading] = useState(false);

  const handleAvatar = (e) => {
    if (e.target.files[0]) {
      setAvatar({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const { username, email, password } = Object.fromEntries(formData);
  
    // VALIDATE INPUTS
    if (!username || !email || !password) {
      setLoading(false);
      return toast.warn("Please enter inputs!");
    }
    if (!avatar.file) {
      setLoading(false);
      return toast.warn("Please upload an avatar!");
    }
  
    // VALIDATE UNIQUE USERNAME
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username));
      console.log("Querying for username:", username);
      const querySnapshot = await getDocs(q);
      console.log("QuerySnapshot:", querySnapshot);
      if (!querySnapshot.empty) {
        setLoading(false);
        return toast.warn("Select another username");
      }
    } catch (err) {
      console.log("Error checking username:", err);
      setLoading(false);
      return toast.error("Error checking username");
    }
  
    try {
      console.log("Creating user...");
      const res = await createUserWithEmailAndPassword(auth, email, password);
  
      console.log("Uploading avatar...");
      const imgUrl = await upload(avatar.file);
      console.log("Avatar uploaded:", imgUrl);
  
      console.log("Setting user document...");
      await setDoc(doc(db, "users", res.user.uid), {
        username,
        email,
        avatar: imgUrl,
        id: res.user.uid,
        blocked: [],
      });
  
      console.log("Setting userchats document...");
      await setDoc(doc(db, "userchats", res.user.uid), {
        chats: [],
      });
  
      toast.success("Account created! You can login now!");
    } catch (err) {
      console.log("Error during registration:", err);
      toast.error("Error during registration: " + err.message);
    } finally {
      setLoading(false);
      console.log("Loading state set to false");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const { email, password } = Object.fromEntries(formData);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.log(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="item">
        <h2>Welcome back,</h2>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="Email" name="email" />
          <input type="password" placeholder="Password" name="password" />
          <button disabled={loading}>{loading ? "Loading" : "Sign In"}</button>
        </form>
      </div>
      <div className="separator"></div>
      <div className="item">
        <h2>Create an Account</h2>
        <form onSubmit={handleRegister}>
          <label htmlFor="file">
            <img src={avatar.url || "./avatar.png"} alt="" />
            Upload an image
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleAvatar}
          />
          <input type="text" placeholder="Username" name="username" />
          <input type="text" placeholder="Email" name="email" />
          <input type="password" placeholder="Password" name="password" />
          <button disabled={loading}>{loading ? "Loading" : "Sign Up"}</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
