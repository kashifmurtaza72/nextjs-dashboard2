"use server";

import { z } from "zod";
import { writeFile } from "fs/promises";
import path from "path";
import { redirect } from "next/navigation";

import postgres from "postgres";
import { revalidatePath } from "next/cache";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const CFormSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(2, "Full name must be at least 2 characters long.") // Minimum length
    .max(100, "Full name cannot exceed 100 characters.") // Maximum length
    .regex(/^[a-zA-Z\s.]+$/, "Name can only contain letters"), // Allowed characters

  email: z.string().email(),
  image_url: z.any(),
  // image_url: z.object({
  //   size: z.number(),
  //   type: z.string(),
  //   name: z.string(),
  //   lastModified: z.number(),
  // }),
});

// export type FormState = {
//   success: boolean;
//   message: string;
// };

export type CState = {
  errors?: {
    name?: string[];
    email?: string[];
    image_url?: any[];
  };
  message?: string | null;
  fieldValues?: {
    name?: string;
    email?: string;
    image_url?: any;
  };
};

const CreateCustomer = CFormSchema.omit({ id: true });

export async function createCustomer(prevState: any, formData: FormData) {
  const image_url = formData.get("image_url") as File;

  const rawFormData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    image_url: formData.get("image_url") as File | null,
  };

  const validatedFields = CreateCustomer.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Customer.",
      fieldValues: rawFormData,
    };
  }

  // if (file && file.size > 0) {

  const bytes = await image_url.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filename = `${Date.now()}-${image_url.name.replaceAll(" ", "-")}`;
  const tmpurl = "/customers/" + filename;

  const uploadPath = path.join(process.cwd(), "public/customers", filename);
  await writeFile(uploadPath, buffer);
  // }

  const { name, email } = validatedFields.data;

  try {
    await sql`
      INSERT INTO customers (name, email, image_url)
      VALUES (${name}, ${email}, ${tmpurl})
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
