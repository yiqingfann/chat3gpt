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

    if (!curUserMessage.trim().length) return;

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
    <div className="h-screen bg-[#343540] relative">

      <div>
        {messages.map((m, i) => {
          return (
            <div key={i} className={m.role === "user" ? "bg-[#343541]" : "bg-[#444654]"}>
              <div className="text-white p-5">{m.content}</div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-0 sm:bottom-12 left-0 right-0">
        <div className="bg-[#40414F] container mx-auto p-3 rounded-md">
          <form
            onSubmit={handleSendMessage}
            className="flex"
          >
            <textarea
              className="flex-1 bg-transparent text-white focus:outline-none resize-none h-auto"
              rows={1}
              placeholder="Write something..."
              value={curUserMessage}
              onChange={(e) => setCurUserMessage(e.target.value)}
            />
            <button className="px-2 text-white">Send</button>
          </form>
        </div>
      </div>

    </div>
  );
};

export default Home;
