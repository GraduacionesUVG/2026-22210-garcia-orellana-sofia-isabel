import BackgroundDecor from "@/components/common/BackgroundDecor";
import LeftPanel from "@/features/auth/components/login/LeftPanel";
import RightPanel from "@/components/common/RightPanel";

export default function Page() {
  return (
    <main className="responsive-auth bg-background-light text-text-light font-sans min-h-screen flex items-center justify-center relative overflow-hidden">
      <BackgroundDecor />

      <section className="relative w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 shadow-2xl rounded-2xl overflow-hidden bg-surface-light border border-gray-200 m-4">
        <LeftPanel />
        <RightPanel />
      </section>
    </main>
  );
}
