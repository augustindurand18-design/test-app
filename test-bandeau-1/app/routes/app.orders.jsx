import { useLoaderData, useNavigate } from "react-router";
import { Page, Card, DataTable, Text, Button } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  // 1. On récupère la session complète
  const { admin, session } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
      query getOrders {
        orders(first: 10, sortKey: PROCESSED_AT, reverse: true) {
          edges {
            node {
              id
              name
              processedAt
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              customer {
                displayName
                email
              }
            }
          }
        }
      }`
  );

  const data = await response.json();

  const orders = data.data.orders.edges.map((edge) => {
    const node = edge.node;
    return {
      ...node,
      simpleId: node.id.split("/").pop(),
    };
  });

  // 2. IMPORTANT : On renvoie le shop explicitement
  return { 
    orders, 
    shop: session.shop 
  };
};

export default function OrdersIndex() {
  const { orders, shop } = useLoaderData();
  const navigate = useNavigate();

  // Affiche le shop dans la console de ton navigateur (F12) pour vérifier
  console.log("Nom de la boutique détecté :", shop);

  const rows = orders.map((order) => {
    const money = order.totalPriceSet.shopMoney;
    
    // 3. Construction de l'URL sécurisée
    // Si 'shop' est vide, le lien ne marchera pas dans un nouvel onglet
    const pdfUrl = `/app/orders/${order.simpleId}/pdf?shop=${shop}`;

    return [
      order.name,
      order.customer?.displayName || "—",
      new Date(order.processedAt).toLocaleString("fr-FR"),
      `${money.amount} ${money.currencyCode}`,
      <Button 
        url={pdfUrl} 
        target="_blank" 
        variant="plain"
      >
        Voir PDF
      </Button>,
    ];
  });

  return (
    <Page title="Mes Commandes">
      <Card>
        {orders.length === 0 ? (
          <div style={{ padding: "20px" }}>
            <Text as="p">Aucune commande.</Text>
          </div>
        ) : (
          <DataTable
            columnContentTypes={["text", "text", "text", "numeric", "text"]}
            headings={["Commande", "Client", "Date", "Total", "Action"]}
            rows={rows}
          />
        )}
      </Card>
    </Page>
  );
}