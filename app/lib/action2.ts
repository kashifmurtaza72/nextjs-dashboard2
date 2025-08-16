"use server";

import { z } from "zod";
import { writeFile } from "fs/promises";
import path from "path";
import { redirect } from "next/navigation";

import postgres from "postgres";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";


const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });
const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const CFormSchema = z.object({
  name: z
    .string()
    .min(2, "Full name must be at least 2 characters long.") // Minimum length
    .max(100, "Full name cannot exceed 100 characters.") // Maximum length
    .regex(/^[a-zA-Z\s.]+$/, "Name can only contain letters"), // Allowed characters

  email: z.string().email(),
  image_url: z.any(),
  // .refine((file) => file?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
  // .refine(
  //   (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
  //   "Only .jpg, .jpeg, .png and .webp formats are supported."
  // ),
  oldImage: z.string().nullable(),
});

export type CState = {
  errors?: {
    name?: string[];
    email?: string[];
    image_url?: any[];
    oldImage?: string | null;
  };
  message?: string | null;
  fieldValues?: {
    name?: string;
    email?: string;
    image_url?: any;
    oldImage?: string | null;
  };
};

//const CreateCustomer = CFormSchema //.omit({ id: true });
//const UpdateInvoice = CFormSchema.omit({ id: true, date: true });

export async function createCustomer(prevState: any, formData: FormData) {
  const image_url = (formData.get("image_url") as File) || null;

  const rawFormData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    image_url: formData.get("image_url") as File | null,
  };

  const validatedFields = CFormSchema.safeParse(rawFormData);

  //console.log(validatedFields, 'kashifff')

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Customer.",
      fieldValues: rawFormData,
    };
  }

  // if (file && file.size > 0) {
  //let tmpurl = null;
  //let tmpurl: string | null = null;
  const bytes = await image_url.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filename = `${image_url.name.replaceAll(" ", "-")}`;

  let tmpurl = "/customers/" + filename;

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

export async function updateCustomer(id: string, formData: FormData) {
  const { name, email, image_url, oldImage } = CFormSchema.parse({
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    image_url: formData.get("image_url") as File | null,
    oldImage: formData.get("oldImage") as string | null,
  });

  //console.log(oldImage+"-oldimage",image_url+"-newimage");

  //const amountInCents = amount * 100;
  //image_url = ${image_url}

  let oldImageUrl = formData.get("oldImage") as string;
    const file = formData.get("image_url") as File;

    if (file && file.size > 0) {
      const uploadDir = path.join(process.cwd(), "public/customers");
      await fs.mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, file.name.replace("/customers/", ""));
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);

      // delete old file if exists
      if (oldImageUrl && oldImageUrl.startsWith("/customers")) {
        const oldPath = path.join(process.cwd(), "public", oldImageUrl);
        try {
          await fs.unlink(oldPath);
        } catch {
          // ignore if file not found
        }
      }

      oldImageUrl = `/uploads/${file.name}`;
    }

    let tmpurl = "/customers/" + file.name;


  try {
    await sql`
    UPDATE customers
    SET name = ${name}, email = ${email}, image_url = ${tmpurl}
    WHERE id = ${id}
  `;
  } catch (error) {
    console.log(error);
  }

  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers");
}

export async function deleteCustomer(id: string) {
  //  throw new Error('Failed to Delete Invoice');
  await sql`DELETE FROM customers WHERE id = ${id}`;
  revalidatePath("/dashboard/customers");
}
