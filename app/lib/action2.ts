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
   image_url: z.any()
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
  //console.log(formData, "collecting...");
  
  
  const file = formData.get("image_url") as File;
  
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = file.name.replaceAll(" ", "-");
  const rawFormData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    file: formData.get("image_url") as File | null,
  };
  // try {
  //   await writeFile(
  //     path.join(process.cwd(), "public/customers/" + filename),
  //     buffer
  //   );
  //   return NextResponse.json({ Message: "Success", status: 201 });
  // } catch (error) {
  //   console.log("Error occured ", error);
  //   return NextResponse.json({ Message: "Failed", status: 500 });
  // }

  //  await writeFile(
  //     path.join(process.cwd(), "public/customers/" + filename),
  //     buffer
  //   );

  const validatedFields = CreateCustomer.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Customer.",
      fieldValues: rawFormData,
    };
  }

  if (file && file.size > 0) {

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
       //const filename = file.name.replaceAll(" ", "-");

      const filename =  `${Date.now()}-${file.name.replaceAll(" ", "-")}`

      const uploadPath = path.join(process.cwd(), 'public/customers', filename);
      await writeFile(uploadPath, buffer);
    }

  const { name, email } = validatedFields.data;
  const tmpurl = '/customers/'+filename
  
  

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
