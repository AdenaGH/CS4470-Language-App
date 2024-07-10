import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "./firebase";

const upload = async (file) => {
  const date = new Date().toISOString();
  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const storageRef = ref(storage, `images/${date}_${sanitizedFilename}`);

  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");
      },
      (error) => {
        console.error("Upload error:", error);
        reject("Something went wrong! " + error.code);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          resolve(downloadURL);
        }).catch(error => {
          console.error("Failed to get download URL:", error);
          reject("Failed to get download URL: " + error.message);
        });
      }
    );
  });
};

export default upload;