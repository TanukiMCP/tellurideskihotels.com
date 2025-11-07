import { s as signIn, c as createUser } from '../../../chunks/auth_DNlywQiV.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const { action, email, password, name } = body;
    if (action === "sign-in") {
      const result = await signIn(email, password);
      if (!result) {
        return new Response(
          JSON.stringify({ error: { message: "Invalid credentials" } }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ user: result.user }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": `auth_token=${result.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
          }
        }
      );
    }
    if (action === "sign-up") {
      const user = await createUser(email, password, name);
      const result = await signIn(email, password);
      return new Response(
        JSON.stringify({ user }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": `auth_token=${result.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
          }
        }
      );
    }
    if (action === "sign-out") {
      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": "auth_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
          }
        }
      );
    }
    return new Response(
      JSON.stringify({ error: { message: "Invalid action" } }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: { message: error.message || "Authentication failed" } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
