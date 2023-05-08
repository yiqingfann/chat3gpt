import { type AppType } from "next/app";
import Head from "next/head";

import { api } from "~/utils/api";

import "~/styles/globals.css";
import { ClerkProvider, SignIn, SignedIn, SignedOut } from "@clerk/nextjs";

// Use font awesome icons with server-side rendering
// https://stackoverflow.com/questions/56334381/why-my-font-awesome-icons-are-being-displayed-big-at-first-and-then-updated-to-t
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
config.autoAddCss = false;

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <Head>
        <title>chat3gpt</title>
        <meta name="description" content="chat3gpt" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <ClerkProvider {...pageProps}>

        <SignedIn>
          {/* <SignOutButton /> */}
          <Component {...pageProps} />
        </SignedIn>

        <SignedOut>
          <div className="h-screen w-screen flex justify-center items-center">
            <SignIn />
          </div>
        </SignedOut>

      </ClerkProvider>
    </>
  );
};

export default api.withTRPC(MyApp);
