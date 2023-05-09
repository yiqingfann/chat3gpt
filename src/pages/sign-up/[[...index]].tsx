import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="absolute top-0 bottom-0 left-0 right-0 bg-primary flex justify-center items-center">
      <SignUp />
    </div>
  );
}
