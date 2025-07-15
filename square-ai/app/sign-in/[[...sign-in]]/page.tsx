import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function Page() {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-32 h-32 flex justify-center items-center">
        <SignIn appearance={{ baseTheme: dark }} />
      </div>
    </div>
  );
}
