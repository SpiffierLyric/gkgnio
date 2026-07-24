import type { Metadata } from "next";
import { DiagnosticsClient } from "../components/DiagnosticsClient";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = { title: "Service Log" };

export default function LogsPage() {
  return <main className="site-shell"><SiteHeader /><DiagnosticsClient /></main>;
}
