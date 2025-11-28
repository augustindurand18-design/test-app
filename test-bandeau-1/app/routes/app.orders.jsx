import { useLoaderData, Link } from "react-router";
import { Page, Card, DataTable, Text } from "@shopify/polaris";

// ⚠️ VERSION TRAINING SANS API SHOPIFY
export const loader = async () => {
  // On simule 3 commandes
  const orders = [
    {
      id: "1001",
      name: "#1001",
      processedAt: new Date().toISOString(),
      totalPriceSet: {
        shopMoney: { amount: "59.90", currencyCode: "EUR" },
      },
      customer: {
        displayName: "Jean Test",
        email: "jean.test@example.com",
      },
    },
    {
      id: "1002",
      name: "#1002",
      processedAt: new Date().toISOString(),
      totalPriceSet: {
        shopMoney: { amount: "19.90", currencyCode: "EUR" },
      },
      customer: {
        displayName: "Marie Exemple",
        email: "marie@example.com",
      },
    },
    {
      id: "1003",
      name: "#1003",
      processedAt: new Date().toISOString(),
      totalPriceSet: {
        shopMoney: { amount: "120.00", currencyCode: "EUR" },
      },
      customer: null,
    },
  ];

  return { orders };
};

export default function OrdersIndex() {
  const { orders } = useLoaderData();

  const rows = orders.map((order) => {
    const money = order.totalPriceSet.shopMoney;
    const orderId = order.id; // déjà simple

    return [
      order.name,
      order.customer?.displayName || "—",
      new Date(order.processedAt).toLocaleString("fr-FR"),
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
