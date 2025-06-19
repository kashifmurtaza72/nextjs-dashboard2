"use client";
import Breadcrumbs from "@/app/ui/customers/breadcrumbs";
import Form from "@/app/ui/states/state-form";
export default function Page() {
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[{ label: "States", href: "/dashboard/states" }]}
      />
      <Form />
    </main>
  );
}
