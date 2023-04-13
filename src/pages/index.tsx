import { type NextPage } from "next";
import { type FormEvent, useState, useEffect } from "react";
import type { ChatCompletionResponseMessage, ChatCompletionRequestMessage } from "openai";
import { api } from "~/utils/api";

const Home: NextPage = () => {
  const [curUserMessage, setCurUserMessage] = useState("");
  const [messages, setMessages] = useState<ChatCompletionRequestMessage[]>([
    // { role: "user", content: "Hello, I'm Frank" },
    // { role: "assistant", content: "Hi, I'm ChatGPT" },
  ]);
  const { data } = api.chat.getResponse.useQuery({
    messages: messages,
  }, {
    enabled: messages.length > 0 && messages[messages.length - 1]?.role === "user",
    refetchOnWindowFocus: false,
  });

  const handleSendMessage = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "user", content: curUserMessage },
    ]);
    setCurUserMessage("");
  }

  useEffect(() => {
    if (!data) return;
    if (!data.curAssistantMessage) return;

    setMessages((prevMessages) => [
      ...prevMessages,
      data.curAssistantMessage as ChatCompletionResponseMessage,
    ]);
  }, [data]);

  return (
    <>
      {messages.map((m, i) => {
        return (
          <div key={i} className={m.role === "user" ? "bg-blue-100" : "bg-pink-100"}>
            <div>{m.content}</div>
          </div>
        );
      })}

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
