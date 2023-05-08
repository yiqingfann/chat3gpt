import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";

const Home: NextPage = () => {
  return (
    <div className="absolute top-0 bottom-0 left-0 right-0 bg-primary text-white flex flex-col justify-center items-center">
      <div className="text-7xl">ChaT3Gpt</div>

      <div className="h-8" />

      <div>A ChatGPT Clone built with T3 Stack. Have Fun!</div>

      <div className="h-8" />

      <Image src="/chat-logo.svg" alt="me" width="256" height="256" />

      <div className="h-8" />

      <Link href="/chat">
        <button className="bg-accent px-8 py-2 rounded-md text-lg text-black">
          Start
        </button>
      </Link>
    </div>
  );
};

export default Home;
