import { redirect } from "next/navigation";

/**
 * Редирект со старого роута /delivery на новый /delivery-and-payments
 */
export default function DeliveryPage() {
  redirect("/delivery-and-payments");
}
