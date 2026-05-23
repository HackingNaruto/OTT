'use server';

export async function loginAdmin(username, password) {
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD &&
    username !== undefined &&
    password !== undefined
  ) {
    return { success: true };
  }
  return { success: false, error: 'Invalid credentials' };
}
