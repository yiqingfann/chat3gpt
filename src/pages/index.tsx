import { type NextPage } from "next";
import { type FormEvent, useState, useEffect } from "react";

import { api } from "~/utils/api";

type Message = {
  role: "user" | "assistant" | "system",
  content: string,
};

const Home: NextPage = () => {
  const [curUserMessage, setCurUserMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    // { role: "user", content: "Hello, I'm Frank" },
    // { role: "assistant", content: "Hi, I'm ChatGPT" },
  ]);
  const { data, refetch } = api.chat.getResponse.useQuery({
    messages: messages,
  }, {
    enabled: false,
  });

  const handleSendMessage = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessages((prevMessages) => [...prevMessages, { role: "user", content: curUserMessage }]);
    setCurUserMessage("");
  }

  useEffect(() => {
    if (!messages.length) return;
    void refetch();
  }, [messages, refetch]);

  return (
    <>
      {messages.map((m) => {
        return (
          <div key={m.content} className={m.role === "user" ? "bg-blue-100" : "bg-pink-100"}>
            <div>{m.content}</div>
          </div>
        );
      })}

      <div className="bg-yellow-100">{data?.curAssistantMessage}</div>

      <form onSubmit={handleSendMessage}>
        <input
          value={curUserMessage}
          onChange={(e) => setCurUserMessage(e.target.value)}
        />
        <button>Send</button>
      </form>
    </>
  );
};

export default Home;
