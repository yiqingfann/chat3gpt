import { type NextPage } from "next";
import Head from "next/head";

import { api } from "~/utils/api";

const Home: NextPage = () => {
  // some mock data
  const messages = [
    { role: "user", content: "Hello from React!" },
  ];

  // call backend api
  const { data, isLoading } = api.chat.getResponse.useQuery({
    messages: messages,
  });
  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>No data</div>;

  return (
    <>
      <Head>
        <title>chat3gpt</title>
        <meta name="description" content="chat3gpt" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>{data.message}</div>
    </>
  );
};

export default Home;
