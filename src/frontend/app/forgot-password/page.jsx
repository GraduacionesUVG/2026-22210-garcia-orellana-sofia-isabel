import BackgroundDecor from "@/components/common/BackgroundDecor";
import RightPanel from "@/components/common/RightPanel";
import ForgotPasswordLeftPanel from "@/features/auth/components/forgot-password/LeftPanel";

export default function Page() {
  return (
    <main className="responsive-auth bg-background-light text-text-light font-sans min-h-screen flex items-center justify-center relative overflow-hidden">
      <BackgroundDecor />

      <section className="relative w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 shadow-2xl rounded-2xl overflow-hidden bg-surface-light border border-gray-200 m-4">
        <ForgotPasswordLeftPanel />
        <RightPanel />
      </section>
    </main>
  );
}
