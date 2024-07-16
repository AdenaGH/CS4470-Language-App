import { useEffect, useRef, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";
import { format } from "timeago.js";
import OpenAI from "openai";
import languages from "../util/languages";

const Chat = () => {
  const [chat, setChat] = useState();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({
    file: null,
    url: "",
  });
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState(languages[0].value);
  const [generatedTranslation, setGeneratedTranslation] = useState("");
  const [generatedTranslations, setGeneratedTranslations] = useState({});
  const [activeMessageId, setActiveMessageId] = useState(null);
  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });
  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } =
    useChatStore();

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  useEffect(() => {
    if (!chatId) return;
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data());
    });

    return () => {
      unSub();
    };
  }, [chatId]);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  const handleImg = (e) => {
    if (e.target.files[0]) {
      setImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleSend = async () => {
    if (text === "") return;

    let imgUrl = null;

    try {
      if (img.file) {
        imgUrl = await upload(img.file);
      }

      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({
          senderId: currentUser.id,
          text,
          createdAt: new Date(),
          ...(imgUrl && { img: imgUrl }),
        }),
      });

      const userIDs = [currentUser.id, user.id];

      userIDs.forEach(async (id) => {
        const userChatsRef = doc(db, "userchats", id);
        const userChatsSnapshot = await getDoc(userChatsRef);

        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();

          const chatIndex = userChatsData.chats.findIndex(
            (c) => c.chatId === chatId
          );

          userChatsData.chats[chatIndex].lastMessage = text;
          userChatsData.chats[chatIndex].isSeen =
            id === currentUser.id ? true : false;
          userChatsData.chats[chatIndex].updatedAt = Date.now();

          await updateDoc(userChatsRef, {
            chats: userChatsData.chats,
          });
        }
      });
    } catch (err) {
      console.log(err);
    } finally {
      setImg({
        file: null,
        url: "",
      });

      setText("");
    }
  };

  async function handleTranslate(messageID, messageText) {
    if (activeMessageId === messageID && generatedTranslations[messageID]) {
      setActiveMessageId(null);
      return;
    }
    setLoading(true);
    setActiveMessageId(messageID);
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a translator. Please translate the following text into ${language}. The translation should be grammatically correct.`,
        },
        { role: "user", content: `${messageText}`},
      ],
      model: "gpt-3.5-turbo",
    });
    const translation = completion.choices[0].message.content;
    setGeneratedTranslations({...generatedTranslations,
      [messageID]: translation,
    });
    setLoading(false);
  }

  const handleLanguageChange = (e) => {
    const selectedValue = e.target.value;
    const selectedLabel = languages.find((language) => language.value === selectedValue)?.value;

    if (selectedLabel) {
      setLanguage(selectedLabel);
    }
  }

  useEffect(() => {
    if (generatedTranslation) {
      console.log("Generated Translation Updated: ", generatedTranslation);
      
    }
  }, [generatedTranslation]);

  
  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{user?.username}</span>
            <p>Lorem ipsum dolor, sit amet.</p>
          </div>
        </div>
        <div className="select">
          <img src="./translate.svg"/>
          <select
            id="language"
            value={language}
            onChange={handleLanguageChange}
          >
            {languages.map((language) => (
              <option key={language.value} value={language.value}>
                {language.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="center">
        {chat?.messages?.length > 0 ? (
          chat.messages.map((message) => (
            <div
              className={
                message.senderId === currentUser?.id ? "message own" : "message"
              }
              key={message.createdAt}
            >
              <div className="texts">
                {message.img && <img src={message.img} alt="" />}
                <p onClick={() => handleTranslate(message.createdAt, message.text)}>{message.text}</p>
                <span>{format(message.createdAt.toDate())}</span>
                {loading && activeMessageId === message.createdAt && <p>Translating...</p>}
                {activeMessageId === message.createdAt && generatedTranslations[message.createdAt] && (
                  <p>{generatedTranslations[message.createdAt]}</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>No messages yet</p>
        )}
        {img.url && (
          <div className="message own">
            <div className="texts">
              <img src={img.url} alt="" />
            </div>
          </div>
        )}
        <div ref={endRef}></div>
      </div>
      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="" />
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleImg}
          />
          <img src="./camera.png" alt="" />
          <img src="./mic.png" alt="" />
        </div>
        <input
          type="text"
          placeholder={
            isCurrentUserBlocked || isReceiverBlocked
              ? "You cannot send a message"
              : "Type a message..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <div className="emoji">
          <img
            src="./emoji.png"
            alt=""
            onClick={() => setOpen((prev) => !prev)}
          />
          <div className="picker">
            <EmojiPicker open={open} onEmojiClick={handleEmoji} />
          </div>
        </div>
        <button
          className="sendButton"
          onClick={handleSend}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
