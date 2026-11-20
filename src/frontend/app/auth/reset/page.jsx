import { Suspense } from "react";
import BackgroundDecor from "@/components/common/BackgroundDecor";
import RightPanel from "@/components/common/RightPanel";
import ResetPasswordLeftPanel from "@/features/auth/components/reset/LeftPanel";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main className="responsive-auth bg-background-light text-text-light font-sans min-h-screen flex items-center justify-center relative overflow-hidden">
      <BackgroundDecor />

      <section className="relative w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 shadow-2xl rounded-2xl overflow-hidden bg-surface-light border border-gray-200 m-4">
        <Suspense fallback={<ResetSkeleton />}>
          <ResetPasswordLeftPanel />
        </Suspense>
        <RightPanel />
      </section>
    </main>
  );
}

function ResetSkeleton() {
  return (
    <div className="relative z-10 flex flex-col justify-center order-2 md:order-1 p-8 md:p-12">
      <div className="mb-8">
        <div className="h-8 w-64 bg-gray-200 rounded mb-3" />
        <div className="h-4 w-80 bg-gray-100 rounded" />
      </div>

      <div className="space-y-4">
        <div className="h-12 w-full bg-gray-100 rounded" />
        <div className="h-12 w-full bg-gray-100 rounded" />
        <div className="h-12 w-full bg-gray-200 rounded" />
      </div>

      <div className="mt-8 text-center">
        <div className="h-4 w-40 bg-gray-100 rounded mx-auto" />
      </div>
    </div>
  );
}
