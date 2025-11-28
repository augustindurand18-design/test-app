import { useLoaderData, Link } from "react-router";
import { authenticate } from "../shopify.server";
import { Page, Card, DataTable, Text } from "@shopify/polaris";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  // On récupère les 10 dernières commandes via l’Admin GraphQL
  const response = await admin.graphql(
    `#graphql
      query LastOrders {
        orders(first: 10, sortKey: CREATED_AT, reverse: true) {
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
      }
    `
  );

  const json = await response.json();

  const orders = json.data.orders.edges.map((edge) => edge.node);

  return { orders };
};

export default function OrdersIndex() {
  const { orders } = useLoaderData();

  const rows = orders.map((order) => {
    const money = order.totalPriceSet.shopMoney;
    const orderId = order.id.split("/").pop(); // on extrait l’ID “nu”

    return [
      order.name,
      order.customer?.displayName || "—",
      new Date(order.processedAt).toLocaleString(),
      `${money.amount} ${money.currencyCode}`,
      <Link to={`/app/orders/${orderId}`}>Voir facture</Link>,
    ];
  });

  return (
    <Page title="Factures commandes (MVP)">
      <Card>
        {orders.length === 0 ? (
          <Text as="p">Aucune commande pour l’instant.</Text>
        ) : (
          <DataTable
            columnContentTypes={[
              "text",
              "text",
              "text",
              "numeric",
              "text",
            ]}
            headings={[
              "Commande",
              "Client",
              "Date",
              "Total",
              "Facture",
            ]}
            rows={rows}
          />
        )}
      </Card>
    </Page>
  );
}
