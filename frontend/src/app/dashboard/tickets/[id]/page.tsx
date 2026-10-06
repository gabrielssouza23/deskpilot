import { TicketView } from "@/components/ticket/ticket-view";

export default async function TicketPage({ params }: PageProps<"/dashboard/tickets/[id]">) {
  const { id } = await params;
  return <TicketView id={Number(id)} />;
}
