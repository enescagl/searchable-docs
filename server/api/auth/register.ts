import { eq } from "drizzle-orm";
import { db } from "~/server/db/client";
import { users } from "~/server/db/schema";
import { RegisterSchema } from "~/shared/validations/register";

export default defineEventHandler(async (event) => {
  const { data, success, error } = await readValidatedBody(
    event,
    RegisterSchema.safeParse,
  );

  if (!success) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message,
    });
  }

  const { email, password } = data;

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (user) {
    throw createError({
      statusCode: 400,
      statusMessage: "User already exists",
    });
  }

  const hashedPassword = await hashPassword(password);

  const newUser = (
    await db
      .insert(users)
      .values({
        email,
        passwordHash: hashedPassword,
      })
      .returning()
  )[0];

  setUserSession(event, {
    user: {
      id: newUser.id,
      email: newUser.email,
      emailVerified: newUser.emailVerified,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  });
});
