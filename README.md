# ChaT3Gpt

A ChatGPT Clone built with [T3 Stack](https://create.t3.gg/). Have Fun!

Web App: https://chat.yiqing.dev/

Blog Post (Chinese): https://www.yiqing.dev/blogs/chat3gpt

![intro](./public/intro.gif)

## Tech Stack

- User Interface：React + TailwindCSS
- API Layer：tRPC
- Backend：NextJS
- Data Layer：Prisma
- Cloud Database：PlanetScale
- User Auth：Clerk
- Deploy：Vercel
- DX: TypeScript + ESLint

## Steps to run

```zsh
$ git clone git@github.com:yiqingfann/chat3gpt.git
$ cd chat3gpt
$ npm install
$ cp .env.example .env

# fill in .env with your keys

$ npm run dev

# open http://localhost:3000 in browser
```
