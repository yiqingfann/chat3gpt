import { useState, useEffect, useRef } from "react";
import autosize from "autosize";
import uuid from "react-uuid";

import type { NextPage } from "next";
import type { FormEvent, ChangeEvent, SetStateAction, KeyboardEvent } from "react";
import type { ChatCompletionRequestMessage } from "openai";
import type { Message } from "~/types";

type MessageInputProps = {
  setMessages: React.Dispatch<SetStateAction<ChatCompletionRequestMessage[]>>;
};

type Conversation = {
  conversation: {
    conversationId: string,
    title: string,
    createdAt: string,
    userId: string,
  },
}

// type PersistMessageResponse = {
//   message: Message,
// };

const persistMessagetoDb = async (message: Message) => {
  await fetch("/api/persist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
}

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

  const handleSendMessage = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();

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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
        onKeyDown={handleKeyDown}
      />
      <button className="px-2 text-white">Send</button>
    </form>
  );
}

const Home: NextPage = () => {
  const [conversationId, setConversationId] = useState("");
  const [messages, setMessages] = useState<ChatCompletionRequestMessage[]>([
    // { role: "user", content: "Hello, I'm Frank" },
    // { role: "assistant", content: "Hi, I'm ChatGPT" },
  ]);

  const conversationAreaRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  // listen for user scroll
  useEffect(() => {
    // whenever the conversation area is scrolled, decide if should scroll to bottom later
    const onScroll = () => {
      if (!conversationAreaRef.current) return;
      const { scrollTop, clientHeight, scrollHeight } = conversationAreaRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10 for some accuracy tolerance
      setShouldScrollToBottom(isAtBottom);
    }

    conversationAreaRef.current?.addEventListener("scroll", onScroll);
    return () => conversationAreaRef.current?.removeEventListener("scroll", onScroll);
  }, []);

  // auto scroll to bottom when new messages are added
  useEffect(() => {
    // whenever the conversation area changes in scrollHeight, scroll to bottom if nessessary
    if (!shouldScrollToBottom) return;
    if (!conversationAreaRef.current) return;

    const conversationAreaDiv = conversationAreaRef.current;
    conversationAreaDiv.scrollTop = conversationAreaDiv.scrollHeight - conversationAreaDiv.clientHeight;
  }, [conversationAreaRef.current?.scrollHeight]);

  // fetch assistant message when user message is added
  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage) return;
    if (latestMessage.role === "assistant") return;

    // I think this is redundant, 
    // but somehow useEffect for scrollHeight is not always fired after a user message is added to messages,
    // so also scroll to bottom if nessessary here
    if (shouldScrollToBottom && conversationAreaRef.current) {
      const conversationAreaDiv = conversationAreaRef.current;
      conversationAreaDiv.scrollTop = conversationAreaDiv.scrollHeight - conversationAreaDiv.clientHeight;
    }

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

      return curAssistantMessage;
    }

    const persistAndFetch = async () => {
      // persist user message to db
      const userMessageNum = messages.length - 1;
      const userMessageContent = latestMessage.content;
      const userMessage: Message = {
        conversationId: conversationId,
        messageNum: userMessageNum,
        role: "user",
        content: userMessageContent,
      };
      await persistMessagetoDb(userMessage);

      // persist assistant message to db
      const assistantMessageNum = userMessageNum + 1;
      const assistantMessageContent = await fetchAssistantMessageStream();
      const assistantMessage: Message = {
        conversationId: conversationId,
        messageNum: assistantMessageNum,
        role: "assistant",
        content: assistantMessageContent,
      };
      await persistMessagetoDb(assistantMessage);
    }

    void persistAndFetch();
  }, [messages]);

  const handleClickNewConversation = async () => {
    const rsp = await fetch("/api/conversations", { method: "POST" });
    const data = await rsp.json() as Conversation;
    console.log(`---data = ${JSON.stringify(data, null, 2)}`);
    const conversationId = data.conversation.conversationId;
    setConversationId(conversationId);
  }

  return (
    <>
      <button
        className="bg-pink-300 px-3 py-2 rounded-lg hover:cursor-pointer z-50 relative"
        onClick={() => void handleClickNewConversation()}
      >
        + New Conversation
      </button>

      <div className="absolute left-0 right-0 top-0 bottom-0 overflow-auto" ref={conversationAreaRef}>
        {messages.map((m, i) => {
          return (
            <div key={i} className={m.role === "user" ? "bg-[#343541]" : "bg-[#444654]"}>
              <div className="container mx-auto px-5 sm:px-48 py-5 text-white whitespace-pre-wrap">
                {m.content}
              </div>
            </div>
          );
        })}
        <div className="h-32" />
      </div>

      <div className="absolute left-0 right-0 bottom-0 sm:py-10 bg-gradient-to-t from-[#343541] from-50% to-transparent">
        <div className="container mx-auto p-3 rounded-md bg-[#40414F]">
          <MessageInput setMessages={setMessages} />
        </div>
      </div>
    </>
  );
};

export default Home;
