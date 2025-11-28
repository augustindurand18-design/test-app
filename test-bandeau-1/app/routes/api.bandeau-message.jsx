import { authenticate } from "../shopify.server";
import prisma from "../db.server";

/**
 * GET /api/bandeau-message
 * → renvoie la config pour la boutique courante
 */
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const existing = await prisma.bannerConfig.findUnique({
    where: { shop },
  });

  const config = existing || {
    message: "",
    backgroundColor: "#000000",
    textColor: "#ffffff",
    isEnabled: true,
    textAlign: "center",
  };

  return new Response(JSON.stringify(config), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

/**
 * POST /api/bandeau-message
 * → enregistre / met à jour la config
 */
export const action = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    const body = await request.json();
    const {
      message,
      backgroundColor = "#000000",
      textColor = "#ffffff",
      isEnabled = true,
      textAlign = "center",
    } = body;

    // upsert basé sur "shop" (unique)
    await prisma.bannerConfig.upsert({
      where: { shop },
      update: { message, backgroundColor, textColor, isEnabled, textAlign },
      create: { shop, message, backgroundColor, textColor, isEnabled, textAlign },
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur dans action /api/bandeau-message :", error);

    return new Response(
      JSON.stringify({
        ok: false,
        error: String(error?.message || error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
