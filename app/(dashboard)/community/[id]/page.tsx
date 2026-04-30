import { redirect } from "next/navigation";

export default async function CommunityGroupPage({
    params,
}: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    redirect(`/community?groupId=${id}`);
}