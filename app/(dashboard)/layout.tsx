import { TopNav } from "@/components/top-nav";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "sonner";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <TopNav />
      <div className="pt-[86px] min-h-screen">{children}</div>
      <SiteFooter />
      <Toaster position="top-right" richColors theme="dark" />
    </>
  );
}
