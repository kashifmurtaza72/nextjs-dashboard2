"use server";

import { z } from "zod";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const CustomerFormSchema = z.object({
  id: z.string(),
  name: z.string({ invalid_type_error: "Please add customer name" }),
  email: z.string({ message: "Please add customer email" }),
  image_url: z.string({ message: "Please add customer image_url" }),
});

export type State = {
  errors?: {
    name?: string[];
    email?: string[];
    image_url?: string[];
  };
  message?: string | null;
  cFieldValues?: {
    name?: string;
    email?: string;
    image_url?: string;
  };
};

const CreateCustomer = CustomerFormSchema.omit({ id: true });
export async function createCustomer(prevState: State, formData: FormData ) {
    console.log(prevState, 'kashif')
  const rawCFormData = {
    name: formData.get("name") as String,
    email: formData.get("email") as String,
    image_url: formData.get("image_url") as String,
  };

  const validatedFieldss = CreateCustomer.safeParse(rawCFormData);

  console.log(validatedFieldss);

  if (!validatedFieldss.success) {
    return {
      errors: validatedFieldss.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Invoice.",
      cFieldValues: rawCFormData,
    };
  }

  const { name, email, image_url } = validatedFieldss.data;

  try {
    // await sql`
    //   INSERT INTO customers (name, email, image_url)
    //   VALUES (${name}, ${email}, ${image_url})
    // `;
  } catch (error) {
    return {
      message: `Database Error: Failed to Create Invoice.${error}`,
      cFieldValues: rawCFormData,
    };
  }

  // revalidatePath("/dashboard/customers");
  // redirect("/dashboard/customers");
}
