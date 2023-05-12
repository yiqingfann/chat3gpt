import { type AppType } from "next/app";
import Head from "next/head";

import { api } from "~/utils/api";

import "~/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from '@vercel/analytics/react';

// Use font awesome icons with server-side rendering
// https://stackoverflow.com/questions/56334381/why-my-font-awesome-icons-are-being-displayed-big-at-first-and-then-updated-to-t
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
config.autoAddCss = false;

const queryClient = new QueryClient();

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <Head>
        <title>chat3gpt</title>
        <meta name="description" content="chat3gpt" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <QueryClientProvider client={queryClient}>
        <ClerkProvider appearance={{
          variables: {
            colorPrimary: "#f4adc4",
            colorTextOnPrimaryBackground: "black",
            colorBackground: "white"
          }
        }}>
          <Component {...pageProps} />
          <Analytics />
        </ClerkProvider>
      </QueryClientProvider>
    </>
  );
};

export default api.withTRPC(MyApp);
