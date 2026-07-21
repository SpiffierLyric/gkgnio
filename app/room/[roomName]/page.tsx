import type { Metadata } from "next";
import { RoomClient } from "../../components/RoomClient";

export const metadata: Metadata = { title: "Game Room" };

export default async function RoomPage({ params }: { params: Promise<{ roomName: string }> }) {
  const { roomName } = await params;
  return <RoomClient roomName={decodeURIComponent(roomName)} />;
}
