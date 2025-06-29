"use server";

import { z } from "zod";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const CFormSchema = z.object({
  id: z.string(),
   name: z.string()
  .min(2, "Full name must be at least 2 characters long.") // Minimum length
  .max(100, "Full name cannot exceed 100 characters.") // Maximum length
  .regex(/^[a-zA-Z\s.]+$/, "Name can only contain letters"), // Allowed characters
  
  email: z.string().email(),
  image_url: z.string({
    invalid_type_error: "Please enter image url.",
  }),
});

export type CState = {
  errors?: {
    name?: string[];
    email?: string[];
    image_url?: string[];
  };
  message?: string | null;
  fieldValues?: {
    name?: string;
    email?: string;
    image_url?: string;
  };
};

const CreateCustomer = CFormSchema.omit({ id: true });

export async function createCustomer(prevState: CState, formData: FormData) {
  const rawFormData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    image_url: formData.get("image_url") as string,
  };

  const validatedFields = CreateCustomer.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Customer.",
      fieldValues: rawFormData,
    };
  }

  const { name, email, image_url } = validatedFields.data;

  try {
    await sql`
      INSERT INTO customers (name, email, image_url)
      VALUES (${name}, ${email}, ${image_url})
    `;
  } catch (error) {
    return {
      message: `Database Error: Failed to Create Customer.${error}`,
      fieldValues: rawFormData,
    };
  }

  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers");
}
