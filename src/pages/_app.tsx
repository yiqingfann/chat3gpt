import { type AppType } from "next/app";
import Head from "next/head";

import { api } from "~/utils/api";

import "~/styles/globals.css";
import { ClerkProvider, SignIn, SignOutButton, SignedIn, SignedOut } from "@clerk/nextjs";

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
          <SignOutButton />
          <Component {...pageProps} />
        </SignedIn>

        <div className="h-screen w-screen flex justify-center items-center">
          <SignedOut>
            <SignIn signUpUrl="/" />
          </SignedOut>
        </div>

      </ClerkProvider>
    </>
  );
};

export default api.withTRPC(MyApp);
