import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";

import { Montserrat } from "@next/font/google"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

const montserrat = Montserrat({
  subsets: ["latin"],
})

const Home: NextPage = () => {
  return (
    <div className={`absolute top-0 bottom-0 left-0 right-0 bg-primary text-white flex flex-col justify-center items-center ${montserrat.className}`}>
      <div className="text-5xl sm:text-7xl font-black">
        Cha<span className="text-accent-100">T3</span>Gpt
      </div>

      <div className="h-8" />

      <div className="text-xs sm:text-lg">
        A ChatGPT Clone built with T3 Stack. Have Fun!
      </div>

      <div className="h-8" />

      <Image src="/chat-logo.svg" alt="me" width="256" height="256" />

      <div className="h-10" />

      <Link href="/chat">
        <button className="bg-accent-100 hover:bg-accent-200 px-8 py-2 rounded-md text-lg text-black font-semibold">
          Start
        </button>
      </Link>

      {/* footer */}
      <div className="absolute left-0 right-0 bottom-5 flex justify-center">
        <Link href="https://github.com/yiqingfann/chat3gpt">
          <button className="p-3 rounded-lg hover:bg-white/10 flex items-center space-x-2">
            <FontAwesomeIcon icon={faGithub} size="xl" />
            <div>Github</div>
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Home;
