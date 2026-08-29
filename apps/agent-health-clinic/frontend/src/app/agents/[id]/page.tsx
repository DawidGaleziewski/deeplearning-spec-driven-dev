import AgentDetail from "@/components/agents/AgentDetail";

export const metadata = { title: "Agent chart — AgentClinic" };

export default async function AgentDetailPage({
  params,
}: PageProps<"/agents/[id]">) {
  const { id } = await params;
  return <AgentDetail id={id} />;
}
