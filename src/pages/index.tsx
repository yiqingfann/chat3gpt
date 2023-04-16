import { useState, useEffect, useRef } from "react";
import autosize from "autosize";

import type { NextPage } from "next";
import type { FormEvent, ChangeEvent, SetStateAction } from "react";
import type { ChatCompletionRequestMessage } from "openai";

type MessageInputProps = {
  setMessages: React.Dispatch<SetStateAction<ChatCompletionRequestMessage[]>>;
};

const MessageInput = ({ setMessages }: MessageInputProps) => {
  const [curUserMessage, setCurUserMessage] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!textAreaRef.current) return;

    // apply autosize
    autosize(textAreaRef.current);
    // limit max height to 8 lines
    const lineHeight = parseInt(getComputedStyle(textAreaRef.current).lineHeight);
    textAreaRef.current.style.maxHeight = `${8 * lineHeight}px`
  }, [textAreaRef]);

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    // save message to state
    setCurUserMessage(e.target.value);

    // hide the bottom scrollbar
    if (!textAreaRef.current) return;
    textAreaRef.current.style.overflow = "auto";
  }

  const handleSendMessage = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // update messages state to trigger RPC
    if (curUserMessage.trim().length) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "user", content: curUserMessage },
      ]);
    }

    // clean up the textarea
    setCurUserMessage("");
    if (!textAreaRef.current) return;
    textAreaRef.current.style.height = "auto";
  }

  return (
    <form
      onSubmit={handleSendMessage}
      className="flex"
    >
      <textarea
        className="flex-1 bg-transparent text-white focus:outline-none resize-none"
        rows={1}
        ref={textAreaRef}
        placeholder="Write something..."
        value={curUserMessage}
        onChange={handleInputChange}
      />
      <button className="px-2 text-white">Send</button>
    </form>
  );
}

const Home: NextPage = () => {
  const [messages, setMessages] = useState<ChatCompletionRequestMessage[]>([
    // { role: "user", content: "Hello, I'm Frank" },
    // { role: "assistant", content: "Hi, I'm ChatGPT" },
  ]);

  const dummyMessageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // scroll conversation to bottom
    dummyMessageRef.current?.scrollIntoView({ behavior: "smooth" });

    const latestMessage = messages[messages.length - 1];
    if (!latestMessage) return;
    if (latestMessage.role === "assistant") return;

    // fetch assistant message stream
    const fetchAssistantMessageStream = async () => {
      const rsp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messages }),
      });
      if (!rsp.ok) throw new Error("Response not ok");

      const data = rsp.body;
      if (!data) throw new Error("No response body");

      const reader = data.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let curAssistantMessage = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        curAssistantMessage += chunkValue;

        setMessages((prevMessages) => {
          const lastMessage = prevMessages[prevMessages.length - 1];
          if (!lastMessage) return [];

          const newMessages = [...prevMessages];
          if (lastMessage.role === "user") {
            newMessages.push({ role: "assistant", content: curAssistantMessage });
          } else if (lastMessage.role === "assistant") {
            newMessages[newMessages.length - 1] = { role: "assistant", content: curAssistantMessage };
          }
          return newMessages;
        });
      }
    }

    void fetchAssistantMessageStream();
  }, [messages]);

  return (
    <div className="h-screen bg-[#343540] relative">

      <div className="h-screen overflow-auto">
        {messages.map((m, i) => {
          return (
            <div key={i} className={m.role === "user" ? "bg-[#343541]" : "bg-[#444654]"}>
              <div className="container mx-auto px-5 sm:px-48 py-5 text-white whitespace-pre-wrap">
                {m.content}
              </div>
            </div>
          );
        })}
        <div className="h-32" ref={dummyMessageRef} />
      </div>

      <div className="absolute left-0 right-0 bottom-0 py-10 bg-gradient-to-t from-[#343541] from-50% to-transparent">
        <div className="container mx-auto p-3 rounded-md bg-[#40414F]">
          <MessageInput setMessages={setMessages} />
        </div>
      </div>

    </div>
  );
};

export default Home;
