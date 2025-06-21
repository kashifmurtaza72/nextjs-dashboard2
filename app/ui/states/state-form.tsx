import { myAction } from "@/app/lib/actions";
import { Button } from "@/app/ui/button";
import { useActionState } from "react";
import { z } from "zod";
export default function Form() {
  const [state, formAction, isPending] = useActionState(myAction, undefined);

  const userSchema = z.object({
    firstName : z.string(),
    myEmail : z.string().email(), 
    profileUrl : z.string().url().nullish(), //.nullable(),  .optional()
    myAge : z.number().min(1),
    friends : z.array(z.string()).max(4), 
    settings : z.object({isSubscribed : z.boolean()})
  })

  type User = z.infer<typeof userSchema>
  
  const newUser : User = {
    firstName : 'Roman',
    myEmail : "kashif@gmail.com",
    profileUrl : undefined,  // null, "http://www.googlecom",
    myAge : 18,
    friends : ["hassan", "zahid", "yasir", 'amnan'],
    settings : {isSubscribed : true}
  }
  
  console.log(userSchema.safeParse(newUser))
  
  

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
