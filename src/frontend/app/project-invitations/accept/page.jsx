import InvitationAcceptSection from "@/features/projects/team/components/InvitationAcceptSection";

export default async function ProjectInvitationAcceptPage({ searchParams }) {
  const params = await searchParams;
  const token = typeof params?.token === "string" ? params.token : "";

  return <InvitationAcceptSection token={token} />;
}
