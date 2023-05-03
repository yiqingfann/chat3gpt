import { useState, useEffect, useRef, type Dispatch } from "react";
import autosize from "autosize";
import uuid from "react-uuid";

import type { NextPage } from "next";
import type { FormEvent, ChangeEvent, SetStateAction, KeyboardEvent } from "react";
import type { ChatCompletionRequestMessage } from "openai";
import type { Message } from "~/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMessage, faTrashCan } from "@fortawesome/free-regular-svg-icons";
import { faCheck, faPencil, faPlus, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";

// ------------------types------------------

type MessageInputProps = {
  setMessages: React.Dispatch<SetStateAction<ChatCompletionRequestMessage[]>>;
};

type Conversation = {
  conversationId: string,
  title: string,
  createdAt: string,
  userId: string,
};

type HistoryConversationsProps = {
  conversationId: string,
  setConversationId: Dispatch<SetStateAction<string>>,
};

// ------------------utils to interact with database------------------

const persistMessagetoDb = async (message: Message) => {
  await fetch("/api/persist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
}

const fetchAllConversations = async () => {
  const rsp = await fetch("/api/conversations");
  const data = await rsp.json() as { conversations: Conversation[] };
  return data.conversations;
}

const createNewConversation = async () => {
  const rsp = await fetch("/api/conversations", { method: "POST" });
  const data = await rsp.json() as { conversation: Conversation };
  return data.conversation;
}

const fetchAllMessages = async (conversationId: string) => {
  const rsp = await fetch(`/api/messages?conversationId=${conversationId}`); // Q: better way to pass query params?
  const data = await rsp.json() as { messages: Message[] };
  return data.messages;
}

const updateConversationTitle = async (conversationId: string, newTitle: string) => {
  await fetch(`/api/conversations?conversationId=${conversationId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newTitle }),
  });
}

const deleteConversation = async (conversationId: string) => {
  await fetch(`/api/conversations?conversationId=${conversationId}`, {
    method: "DELETE"
  });
}

// ------------------components------------------

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

const HistoryConversations = ({ conversationId, setConversationId }: HistoryConversationsProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState<string | null>(null);

  const handleClickNewConversation = async () => {
    const newConversation = await createNewConversation();
    const allConversations = await fetchAllConversations(); // Q: what is best practice - append new item or fetch all items again?
    setConversations(allConversations);
    setConversationId(newConversation.conversationId); // Q: what is best practice - should I avoid sequential setState?
  }

  const hancleClickEdit = (conversationId: string) => {
    console.log("edit conversation", conversationId);
    setIsEditing(true);
  }

  const handleConfirmEdit = async (conversationId: string, newTitle: string, idx: number) => {
    await updateConversationTitle(conversationId, newTitle);
    const _conversations = [...conversations];
    _conversations[idx]!.title = newTitle;
    setConversations(_conversations);
    setIsEditing(false);
    setNewTitle(null);
  }

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNewTitle(null);
  }

  const handleClickDelete = async (conversationId: string, idx: number) => {
    await deleteConversation(conversationId);
    const _conversations = [...conversations];
    _conversations.splice(idx, 1);
    setConversations(_conversations);
    setConversationId("");
  }

  useEffect(() => {
    const init = async () => {
      const allConversations = await fetchAllConversations();
      setConversations(allConversations);
    }

    void init();
  }, []);

  return (
    <div className="w-64 bg-[#202123] p-2 space-y-2 overflow-auto">
      <button
        className="w-full p-3 rounded-lg hover:bg-white/20 text-white flex items-center space-x-2 border-2 border-slate-300"
        onClick={() => void handleClickNewConversation()}
      >
        <FontAwesomeIcon icon={faPlus} size="sm" />
        <div className="text-sm">New Conversation</div>
      </button>

      {conversations.map((c, idx) => {
        const isActive = c.conversationId === conversationId;

        return (
          <button
            key={c.conversationId}
            className={`w-full p-3 rounded-lg flex justify-between items-center text-white ${isActive ? "bg-white/20" : "hover:bg-white/10"}`}
          >
            <div
              className="flex items-center space-x-2 min-w-0"
              onClick={() => setConversationId(c.conversationId)}
            >
              <FontAwesomeIcon icon={faMessage} size="sm" />

              {isActive && isEditing
                ? (
                  <input
                    className="bg-transparent text-sm"
                    value={newTitle ?? c.title}
                    onChange={(e) => setNewTitle(e.target.value)}
                    autoFocus={true}
                  />
                )
                : (
                  <div className="text-sm truncate">
                    {c.title}
                  </div>
                )
              }

            </div>

            {isActive && (
              <div>
                {isEditing
                  ? (
                    // confirm or cancel edit
                    <div className="flex items-center space-x-2">
                      <FontAwesomeIcon
                        icon={faCheck}
                        size="sm"
                        className="hover:text-pink-400"
                        onClick={() => {
                          if (!newTitle) return;
                          void handleConfirmEdit(c.conversationId, newTitle, idx);
                        }}
                      />
                      <FontAwesomeIcon
                        icon={faXmark}
                        size="sm"
                        className="hover:text-pink-400"
                        onClick={handleCancelEdit}
                      />
                    </div>
                  )
                  : (
                    // edit or delete
                    <div className="flex items-center space-x-2">
                      <FontAwesomeIcon
                        icon={faPencil}
                        size="sm"
                        className="hover:text-pink-400"
                        onClick={() => hancleClickEdit(c.conversationId)}
                      />
                      <FontAwesomeIcon
                        icon={faTrashCan}
                        size="sm"
                        className="hover:text-pink-400"
                        onClick={() => void handleClickDelete(c.conversationId, idx)}
                      />
                    </div>
                  )}
              </div>
            )}
          </button>
        );
      })}

    </div >
  );
}

// ------------------main component------------------

const Home: NextPage = () => {
  const [conversationId, setConversationId] = useState(""); // Q: empty string or null?
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

  // fetch and display all messages when conversationId changes
  useEffect(() => {
    if (!conversationId.length) {
      setMessages([]);
      return;
    }

    const updateAllMessages = async () => {
      const allMessages = await fetchAllMessages(conversationId);
      setMessages(allMessages);
    }

    void updateAllMessages();
  }, [conversationId]);

  // if (!conversationId.length) {
  //   return (
  //     <div className="h-screen w-screen flex justify-center items-center">
  //       <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] text-white" />
  //     </div>
  //   );
  // }

  return (
    <>
      <div className="absolute left-0 right-0 top-0 bottom-0 flex">
        {/* side bar */}
        <HistoryConversations
          conversationId={conversationId}
          setConversationId={setConversationId}
        />

        {/* conversation area */}
        <div className="grow relative">
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

          {!!conversationId.length && (
            <div className="absolute left-0 right-0 bottom-0 sm:px-10 sm:py-10 bg-gradient-to-t from-[#343541] from-50% to-transparent">
              <div className="max-w-4xl mx-auto p-3 rounded-md bg-[#40414F]">
                <MessageInput setMessages={setMessages} />
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default Home;
