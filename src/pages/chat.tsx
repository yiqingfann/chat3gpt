import { useState, useEffect, useRef, type Dispatch, Fragment } from "react";
import autosize from "autosize";
import uuid from "react-uuid";

import type { NextPage } from "next";
import type { FormEvent, ChangeEvent, SetStateAction, KeyboardEvent } from "react";
import type { ChatCompletionRequestMessage } from "openai";
import type { Message } from "~/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleLeft, faMessage, faTrashCan } from "@fortawesome/free-regular-svg-icons";
import { faCheck, faPencil, faPlus, faTrash, faXmark, faCircleXmark, faL, faBars } from "@fortawesome/free-solid-svg-icons";
import { faArrowRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/router";
import type { QueryObserverResult, RefetchOptions, RefetchQueryFilters } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";


// ------------------types------------------

type Conversation = {
  conversationId: string,
  title: string,
  createdAt: string,
  userId: string,
};

// ------------------utils to interact with database------------------

const persistMessagetoDb = async (message: Message) => {
  await fetch("/api/messages", {
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

type MessageInputProps = {
  setMessages: React.Dispatch<SetStateAction<ChatCompletionRequestMessage[]>>;
  disabled: boolean;
};

const MessageInput = ({ setMessages, disabled }: MessageInputProps) => {
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
        disabled={disabled}
      />
      <button className="px-2 text-white" disabled={disabled}>Send</button>
    </form>
  );
}

type ConversationItemProps = {
  conversationData: Conversation,
  isActive: boolean,
  setActiveConversationId: Dispatch<SetStateAction<string>>,
  refreshConversations: <TPageData>(options?: (RefetchOptions & RefetchQueryFilters<TPageData>) | undefined) => Promise<QueryObserverResult<Conversation[], unknown>>,
  disabled: boolean,
};

const ConversationItem = ({ conversationData, isActive, setActiveConversationId, refreshConversations, disabled }: ConversationItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState<string | null>(null);

  const { conversationId, title } = conversationData;

  const hancleClickEdit = () => {
    setIsEditing(true);
  }

  const handleConfirmEdit = async () => {
    if (!newTitle) return;
    await updateConversationTitle(conversationId, newTitle);
    await refreshConversations(); // IMPROBE: avoid querying db again using the return value from update?
    setIsEditing(false);
    setNewTitle(null);
  }

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNewTitle(null);
  }

  const handleClickDelete = async () => {
    await deleteConversation(conversationId);
    await refreshConversations();
    setActiveConversationId("");
  }

  const handleClickItem = () => {
    if (disabled) return;
    setActiveConversationId(conversationId);
  }

  return (
    <div
      className={`w-full p-3 rounded-lg flex justify-between items-center text-white ${disabled ? "" : "hover:cursor-pointer"} ${isActive ? "bg-white/20" : "hover:bg-white/10"}`}
      onClick={handleClickItem}
    >
      {/* message icon and title */}
      <div className="flex items-center space-x-2 min-w-0">
        <FontAwesomeIcon icon={faMessage} size="sm" />

        {isEditing
          ? (
            <input
              className="bg-transparent text-sm"
              value={newTitle ?? title}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus={true}
              onBlur={() => void handleConfirmEdit()}
              disabled={disabled}
            />
          )
          : (
            <div className="text-sm truncate">
              {title}
            </div>
          )
        }
      </div>

      {/* edit and delete button */}
      <div className={isActive ? "visible" : "invisible"}>
        {isEditing
          ? (
            // confirm or cancel edit
            <div className="flex items-center space-x-2" onMouseDown={(e) => e.preventDefault()}>
              <button onClick={() => void handleConfirmEdit()} disabled={disabled}>
                <FontAwesomeIcon icon={faCheck} size="sm" className="hover:text-pink-400" />
              </button>
              <button onClick={handleCancelEdit} disabled={disabled}>
                <FontAwesomeIcon icon={faXmark} size="sm" className="hover:text-pink-400" />
              </button>
            </div>
          )
          : (
            // edit or delete
            <div className="flex items-center space-x-2">
              <button onClick={hancleClickEdit} disabled={disabled}>
                <FontAwesomeIcon icon={faPencil} size="sm" className="hover:text-pink-400" />
              </button>
              <button onClick={() => void handleClickDelete()} disabled={disabled}>
                <FontAwesomeIcon icon={faTrashCan} size="sm" className="hover:text-pink-400" />
              </button>
            </div>
          )}
      </div>
    </div>
  );
}

type ConversationsSidebarProps = {
  conversationId: string,
  setConversationId: Dispatch<SetStateAction<string>>,
  disabled: boolean,
};

const ConversationsSidebar = ({ conversationId, setConversationId, disabled }: ConversationsSidebarProps) => {
  const { data: conversations, isFetching, refetch } = useQuery({
    queryKey: ['hello'],
    queryFn: fetchAllConversations,
    refetchOnWindowFocus: false,
  });
  const router = useRouter();
  const { signOut } = useClerk();

  const handleClickNewConversation = async () => {
    const newConversation = await createNewConversation();
    await refetch();
    setConversationId(newConversation.conversationId); // Q: what is best practice - should I avoid sequential setState?
  }

  return (
    <div className="h-full p-2 flex flex-col space-y-2">
      {/* new conversation button */}
      <button
        className="w-full p-3 rounded-lg hover:bg-white/20 text-white flex items-center space-x-2 border-2 border-slate-300"
        onClick={() => void handleClickNewConversation()}
        disabled={disabled}
      >
        <FontAwesomeIcon icon={faPlus} size="sm" />
        <div className="text-sm">New Conversation</div>
      </button>

      {/* conversation items */}
      <div className="flex-1 overflow-auto">
        {isFetching ? (
          <LoadingSpinner />
        ) : (
          <div className="flex flex-col space-y-2">
            {conversations?.map((c) => {
              const isActive = c.conversationId === conversationId;
              return (
                <Fragment key={c.conversationId}>
                  <ConversationItem
                    conversationData={c}
                    isActive={isActive}
                    setActiveConversationId={setConversationId}
                    refreshConversations={refetch}
                    disabled={disabled}
                  />
                </Fragment>
              );
            })}
          </div>
        )}
      </div>

      <button
        className="w-full p-3 rounded-lg hover:bg-white/20 text-white flex items-center space-x-2 border-2 border-slate-300"
        onClick={() => {
          void signOut();
          void router.push("/");
        }}
        disabled={disabled}
      >
        <FontAwesomeIcon icon={faArrowRightFromBracket} size="sm" />
        <div className="text-sm">Log out</div>
      </button>
    </div >
  );
}

const LoadingSpinner = () => {
  return (
    <div className="h-full w-full flex justify-center items-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] text-white" />
    </div>
  );
}

type MessagesAreaProps = {
  messages: ChatCompletionRequestMessage[];
}

const MessagesArea = ({ messages }: MessagesAreaProps) => {
  const conversationAreaRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  const scrollToBottom = () => {
    if (!conversationAreaRef.current) return;
    const conversationAreaDiv = conversationAreaRef.current;
    conversationAreaDiv.scrollTop = conversationAreaDiv.scrollHeight - conversationAreaDiv.clientHeight;
  }

  // scroll to bottom and listen for user scroll
  useEffect(() => {
    // whenever the conversation area is scrolled, decide if should scroll to bottom later
    const onScroll = () => {
      if (!conversationAreaRef.current) return;
      const { scrollTop, clientHeight, scrollHeight } = conversationAreaRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10 for some accuracy tolerance
      setShouldScrollToBottom(isAtBottom);
    }

    scrollToBottom();
    conversationAreaRef.current?.addEventListener("scroll", onScroll);
    return () => conversationAreaRef.current?.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (shouldScrollToBottom) scrollToBottom();
  }, [messages]);

  return (
    <div className="h-full w-full overflow-auto" ref={conversationAreaRef}>
      {messages.map((m, i) => {
        return (
          <div key={i} className={m.role === "user" ? "bg-[#343541]" : "bg-[#444654]"}>
            <div className="container mx-auto px-5 lg:px-48 py-5 text-white whitespace-pre-wrap">
              {m.content}
            </div>
          </div>
        );
      })}
      <div className="h-32" />
    </div>
  );
}

// ------------------main component------------------

const Home: NextPage = () => {
  const [conversationId, setConversationId] = useState(""); // Q: empty string or null?
  const [messages, setMessages] = useState<ChatCompletionRequestMessage[]>([
    // { role: "user", content: "Hello, I'm Frank" },
    // { role: "assistant", content: "Hi, I'm ChatGPT" },
  ]);
  const [showSidebarOnMobile, setShowSidebarOnMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);

  // fetch assistant message when user message is added
  useEffect(() => {
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

      setStreaming(true);
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
      setStreaming(false);

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

  useEffect(() => {
    setShowSidebarOnMobile(false);
  }, [messages]);

  // fetch and display all messages when conversationId changes
  useEffect(() => {
    if (!conversationId.length) {
      setMessages([]);
      return;
    }

    const updateAllMessages = async () => {
      setLoading(true);
      const allMessages = await fetchAllMessages(conversationId);
      setMessages(allMessages);
      setLoading(false);
    }

    void updateAllMessages();
  }, [conversationId]);

  return (
    <div className="absolute left-0 right-0 top-0 bottom-0 flex flex-col sm:flex-row">
      {/* top menu bar on mobile */}
      <div className="bg-[#444654] px-3 py-2 flex justify-between sm:hidden">
        <button onClick={() => setShowSidebarOnMobile(true)}>
          <FontAwesomeIcon icon={faBars} size="xl" color="white" />
        </button>
      </div>

      {/* close side bar on mobile */}
      {showSidebarOnMobile && (
        <button className="absolute top-3 right-3 z-10 sm:hidden" onClick={() => setShowSidebarOnMobile(false)}>
          <FontAwesomeIcon icon={faCircleXmark} size="2xl" color="white" />
        </button>
      )}

      {/* side bar */}
      <div
        className={`
            absolute sm:relative top-0 bottom-0 left-0 z-10 w-64
            transform ${showSidebarOnMobile ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out
            sm:translate-x-0
            `
        }
      >
        <div className="w-full h-full bg-[#202123]">
          <ConversationsSidebar
            conversationId={conversationId}
            setConversationId={setConversationId}
            disabled={streaming}
          />
        </div>
      </div>

      {/* messages area and input */}
      <div className="grow relative">
        <div className="absolute left-0 right-0 top-0 bottom-0">
          {!conversationId.length && (
            <div className="relative h-full w-full flex justify-center items-center text-[#565869] text-lg sm:text-3xl space-x-2 sm:space-x-4">
              <FontAwesomeIcon icon={faCircleLeft} />
              <div>Select or Create a conversation</div>
            </div>
          )}
          {!!conversationId.length && (
            loading ? <LoadingSpinner /> : <MessagesArea messages={messages} />
          )}
        </div>

        {!!conversationId.length && !loading && (
          <div className="absolute left-0 right-0 bottom-0 sm:px-10 sm:py-10 bg-gradient-to-t from-[#343541] from-50% to-transparent">
            <div className="max-w-4xl mx-auto p-3 rounded-md bg-[#40414F]">
              <MessageInput setMessages={setMessages} disabled={streaming} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
