import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center bg-background">
      <div className="flex flex-col items-center gap-8 p-8">
        <h1 className="text-5xl md:text-7xl font-bold text-foreground">
          Transformation Map
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
          Gamify your journey to a better you. Turn your goals into a visual map and track your progress every step of the way.
        </p>
        <Link href="/login">
          <Button size="lg">Start Your Transformation</Button>
        </Link>
      </div>
    </main>
  );
}