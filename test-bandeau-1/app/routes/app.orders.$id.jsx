import { useLoaderData } from "react-router";
import { Page, Card, Text, Divider } from "@shopify/polaris";

// ⚠️ VERSION TRAINING SANS API SHOPIFY
export const loader = async ({ params }) => {
  const { id } = params;

  // On génère une fausse commande à partir de l'id
  const order = {
    id,
    name: `#${id}`,
    processedAt: new Date().toISOString(),
    customer: {
      displayName: "Client de test",
      email: "client@test.com",
    },
    shippingAddress: {
      name: "Client de test",
      address1: "12 rue de la Boutique",
      address2: "",
      zip: "75001",
      city: "Paris",
      country: "France",
    },
    lineItems: {
      edges: [
        {
          node: {
            id: "line-1",
            name: "Produit A",
            quantity: 2,
            originalUnitPriceSet: {
              shopMoney: { amount: "19.90", currencyCode: "EUR" },
            },
          },
        },
        {
          node: {
            id: "line-2",
            name: "Produit B",
            quantity: 1,
            originalUnitPriceSet: {
              shopMoney: { amount: "39.90", currencyCode: "EUR" },
            },
          },
        },
      ],
    },
    subtotalPriceSet: {
      shopMoney: { amount: "79.70", currencyCode: "EUR" },
    },
    totalShippingPriceSet: {
      shopMoney: { amount: "5.00", currencyCode: "EUR" },
    },
    totalTaxSet: {
      shopMoney: { amount: "0.00", currencyCode: "EUR" },
    },
    totalPriceSet: {
      shopMoney: { amount: "84.70", currencyCode: "EUR" },
    },
    totalPriceSetShopMoneyCurrencyCode: "EUR",
  };

  return { order };
};

export default function OrderInvoice() {
  const { order } = useLoaderData();

  if (!order) {
    return (
      <Page title="Facture">
        <Card>
          <Text as="p">Commande introuvable.</Text>
        </Card>
      </Page>
    );
  }

  const currency = "EUR";
  const lineItems = order.lineItems.edges.map((edge) => edge.node);

  const formatMoney = (amount) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
    }).format(Number(amount));

  const handlePrint = () => {
    window.print();
  };

  return (
    <Page
      title={`Facture ${order.name}`}
      primaryAction={{
        content: "Imprimer",
        onAction: handlePrint,
      }}
    >
      <Card sectioned>
        <Text as="h2" variant="headingMd">
          Boutique
        </Text>
        <Text as="p">Facture : {order.name}</Text>
        <Text as="p">
          Date : {new Date(order.processedAt).toLocaleString("fr-FR")}
        </Text>
      </Card>

      <Card sectioned>
        <Text as="h2" variant="headingMd">
          Client
        </Text>
        <Text as="p">
          {order.customer?.displayName || "Client invité"}
        </Text>
        {order.customer?.email && (
          <Text as="p">Email : {order.customer.email}</Text>
        )}

        {order.shippingAddress && (
          <>
            <Divider borderColor="border-subdued" />
            <Text as="h3" variant="headingSm">
              Adresse de livraison
            </Text>
            <Text as="p">{order.shippingAddress.name}</Text>
            <Text as="p">{order.shippingAddress.address1}</Text>
            {order.shippingAddress.address2 && (
              <Text as="p">{order.shippingAddress.address2}</Text>
            )}
            <Text as="p">
              {order.shippingAddress.zip} {order.shippingAddress.city}
            </Text>
            <Text as="p">{order.shippingAddress.country}</Text>
          </>
        )}
      </Card>

      <Card title="Lignes de commande">
        <Card.Section>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px" }}>Article</th>
                <th style={{ textAlign: "right", padding: "8px" }}>Qté</th>
                <th style={{ textAlign: "right", padding: "8px" }}>
                  Prix unitaire
                </th>
                <th style={{ textAlign: "right", padding: "8px" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => {
                const unit =
                  item.originalUnitPriceSet.shopMoney.amount || 0;
                const total = Number(unit) * item.quantity;
                return (
                  <tr key={item.id}>
                    <td
                      style={{
                        padding: "8px",
                        borderTop: "1px solid #ddd",
                      }}
                    >
                      {item.name}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "right",
                        borderTop: "1px solid #ddd",
                      }}
                    >
                      {item.quantity}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "right",
                        borderTop: "1px solid #ddd",
                      }}
                    >
                      {formatMoney(unit)}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "right",
                        borderTop: "1px solid #ddd",
                      }}
                    >
                      {formatMoney(total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card.Section>
      </Card>

      <Card sectioned>
        <Text as="h2" variant="headingMd">
          Récapitulatif
        </Text>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            alignItems: "flex-end",
          }}
        >
          <Text as="p">
            Sous-total :{" "}
            {formatMoney(order.subtotalPriceSet.shopMoney.amount)}
          </Text>
          <Text as="p">
            Livraison :{" "}
            {formatMoney(
              order.totalShippingPriceSet.shopMoney.amount,
            )}
          </Text>
          <Text as="p">
            Taxes : {formatMoney(order.totalTaxSet.shopMoney.amount)}
          </Text>
          <Text as="p">
            <strong>
              Total : {formatMoney(order.totalPriceSet.shopMoney.amount)}
            </strong>
          </Text>
        </div>
      </Card>
    </Page>
  );
}
