import type { Metadata } from "next";
import { AdminClient } from "../components/AdminClient";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = { title: "Identity Library Admin" };

export default function AdminPage() {
  return (
    <main className="site-shell">
      <SiteHeader />
      <AdminClient />
    </main>
  );
}
