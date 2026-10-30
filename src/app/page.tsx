"use client";
import dynamic from "next/dynamic";

const GenUIChat = dynamic(() => import("@/components/GenUIChat"), { ssr: false });

export default function Home() {
  return (
    <main className="chat-page">
      <GenUIChat />
    </main>
  );
}
