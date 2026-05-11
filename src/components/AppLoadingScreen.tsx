import { LinkFridgeLogo } from "./LinkFridgeLogo";

type Props = {
  message?: string;
};

export function AppLoadingScreen({ message = "Loading…" }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-white px-6">
      <LinkFridgeLogo size={56} className="rounded-2xl shadow-apple" alt="" priority />
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-7 w-7 rounded-full border-2 border-moo-accent/30 border-t-moo-accent animate-spin"
          aria-hidden
        />
        <p className="text-sm font-medium text-moo-dark">{message}</p>
      </div>
    </div>
  );
}
