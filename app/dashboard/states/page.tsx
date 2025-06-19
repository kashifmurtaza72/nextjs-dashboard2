"use client";
import { myAction } from "@/app/lib/actions";
import { Button } from "@/app/ui/button";
import { useActionState } from "react";

export default function Page() {
  const [state, formAction, isPending] = useActionState(myAction, undefined);
  return (
    <form action={formAction}>
      <input type="text" name="username" />
      <Button type="submit">{isPending ? "Submitting" : "Submitted"}</Button>
      {state?.message && (
        <p className={state.success ? "text-green-500" : "text-red-500"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
