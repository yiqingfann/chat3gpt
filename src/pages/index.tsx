import { type NextPage } from "next";
import { type FormEvent, type ChangeEvent, useState, useEffect, useRef, type SetStateAction } from "react";
import type { ChatCompletionResponseMessage, ChatCompletionRequestMessage } from "openai";
import { api } from "~/utils/api";
import autosize from "autosize";

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
  const { data } = api.chat.getResponse.useQuery({
    messages: messages,
  }, {
    enabled: messages.length > 0 && messages[messages.length - 1]?.role === "user",
    refetchOnWindowFocus: false,
  });

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

      <div className="absolute bottom-0 sm:bottom-12 left-0 right-0 flex justify-center">
        <div className="bg-[#40414F] container p-3 rounded-md">
          <MessageInput setMessages={setMessages} />
        </div>
      </div>

    </div>
  );
};

export default Home;
