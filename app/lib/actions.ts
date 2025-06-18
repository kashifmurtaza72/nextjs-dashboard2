"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

import { z } from "zod";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: "Please select a customer.",
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: "Please enter an amount greater than $0." }),
  status: z.enum(["pending", "paid"], {
    invalid_type_error: "Please select an invoice status.",
  }),
  date: z.string(),
});

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
  fieldValues?: {
    customerId?: string;
    amount?: string;
    status?: string;
  };
};

const CustomerFormSchema = z.object({
  id: z.string(),
  name: z.string({ invalid_type_error: "Please add customer name" }),
  email: z.string({ message: "Please add customer email" }),
  image_url: z.string({ message: "Please add customer image_url" }),

});

export type CustomerState = {
  errors?: {
    name?: string[];
    email?: string[];
    image_url?: string[];
  };
  message?: string | null;
  // cFieldValues?: {
  //   name?: string;
  //   email?: string;
  //   image_url?: string;
  // };
};

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(prevState: State, formData: FormData) {
  const rawFormData = {
    customerId: formData.get("customerId") as string,
    amount: formData.get("amount") as string,
    status: formData.get("status") as string,
  };

  const validatedFields = CreateInvoice.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Invoice.",
      fieldValues: rawFormData,
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    return {
      message: `Database Error: Failed to Create Invoice.${error}`,
      fieldValues: rawFormData,
    };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  const amountInCents = amount * 100;
  try {
    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;
  } catch (error) {
    console.log(error);
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  //  throw new Error('Failed to Delete Invoice');
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath("/dashboard/invoices");
}

const CreateCustomer = CustomerFormSchema.omit({ id: true });
//const UpdateCustomer = CustomerFormSchema.omit({ id: true});
export async function createCustomer(prevState: CustomerState, formData: FormData) {
  const rawCFormData = {
    //customerId: formData.get("customerId") as string,
    name: formData.get("name") as String,
    email: formData.get("email") as String,
    image_url: formData.get("image_url") as String,
  };
  
  
  //   for (const value of formData.values()) {
    //   console.log(value);
    // }
    
    const validatedFieldss = CreateCustomer.safeParse(rawCFormData);
    console.log(validatedFieldss, '6.12.25')


  if (!validatedFieldss.success) {
    return {
      errors: validatedFieldss.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Invoice.",
      //cFieldValues: rawCFormData,
    };
  }

    //console.log(validatedFieldss.data, 'kkkkkk')
   const { name, email, image_url } = validatedFieldss.data;
  //const amountInCents = amount * 100;
  //const date = new Date().toISOString().split("T")[0];

  try {
    await sql`
      INSERT INTO customers (name, email, image_url)
      VALUES (${name}, ${email}, ${image_url})
    `;
  } catch (error) {
    return {
      message: `Database Error: Failed to Create Invoice.${error}`,
      //cFieldValues: rawCFormData,
    };
  }

  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers");
}
