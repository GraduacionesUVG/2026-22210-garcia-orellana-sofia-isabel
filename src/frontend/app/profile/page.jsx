"use client";

import PageShell from "@/components/common/PageShell";
import Sidebar from "@/features/dashboard/components/Sidebar";
import ProfileHeader from "@/features/profile/components/ProfileHeader";
import ProfilePersonalSection from "@/features/profile/components/ProfilePersonalSection";
import ProfileSecuritySection from "@/features/profile/components/ProfileSecuritySection";
import ProfileActionsBar from "@/features/profile/components/ProfileActionsBar";
import ProfileFeedback from "@/features/profile/components/ProfileFeedback";
import { useProfilePage } from "@/features/profile/hooks/useProfilePage";

export default function Page() {
  const {
    form,
    loading,
    saving,
    loggingOut,
    errorMsg,
    successMsg,
    sidebarUser,
    hasChanges,
    inputClassName,
    onFieldChange,
    onCancel,
    onLogout,
    onSubmit,
  } = useProfilePage();

  return (
    <PageShell>
      <div className="app-shell h-screen flex overflow-hidden">
        <Sidebar user={sidebarUser} />

        <main className="app-main flex-1 flex flex-col h-full overflow-hidden relative bg-background-light">
          <div className="app-content flex-1 overflow-y-auto custom-scrollbar p-8">
            <div className="max-w-5xl mx-auto">
              <ProfileHeader />

              <ProfileFeedback
                errorMsg={errorMsg}
                successMsg={successMsg}
              />

              <form
                onSubmit={onSubmit}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {loading ? (
                  <div className="p-8 text-sm text-gray-500">Cargando perfil...</div>
                ) : (
                  <>
                    <div className="profile-form-body p-8 space-y-10">
                      <ProfilePersonalSection
                        form={form}
                        inputClassName={inputClassName}
                        onFieldChange={onFieldChange}
                      />

                      <hr className="border-gray-100" />

                      <ProfileSecuritySection
                        form={form}
                        inputClassName={inputClassName}
                        onFieldChange={onFieldChange}
                      />
                    </div>

                    <ProfileActionsBar
                      hasChanges={hasChanges}
                      saving={saving}
                      loggingOut={loggingOut}
                      onCancel={onCancel}
                      onLogout={onLogout}
                    />
                  </>
                )}
              </form>
            </div>
          </div>
        </main>
      </div>
    </PageShell>
  );
}
