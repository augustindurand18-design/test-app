import { useLoaderData } from "react-router";
import { Page, Card, Text, Divider } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ params, request }) => {
  const { admin } = await authenticate.admin(request);

  const orderId = `gid://shopify/Order/${params.id}`;

  const response = await admin.graphql(
    `#graphql
      query getOrder($id: ID!) {
        order(id: $id) {
          id
          name
          processedAt
          customer {
            displayName
            email
          }
          shippingAddress {
            name
            address1
            address2
            zip
            city
            country
          }
          lineItems(first: 50) {
            edges {
              node {
                id
                name
                quantity
                originalUnitPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
          subtotalPriceSet { shopMoney { amount currencyCode } }
          totalShippingPriceSet { shopMoney { amount currencyCode } }
          totalTaxSet { shopMoney { amount currencyCode } }
          totalPriceSet { shopMoney { amount currencyCode } }
        }
      }`,
    {
      variables: {
        id: orderId,
      },
    }
  );

  const data = await response.json();

  // CORRECTION : retour direct de l'objet
  return {
    order: data.data.order,
  };
};

export default function OrderInvoice() {
  const { order } = useLoaderData();

  if (!order) {
    return (
      <Page title="Facture introuvable">
        <Card sectioned>
          <Text as="p">Impossible de trouver cette commande.</Text>
        </Card>
      </Page>
    );
  }

  const currency = order.totalPriceSet.shopMoney.currencyCode;
  const lineItems = order.lineItems.edges.map((edge) => edge.node);

  const formatMoney = (amount) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
    }).format(Number(amount));

  const handlePrint = () => {
    window.print();
  };

  return (
    <Page
      title={`Facture ${order.name}`}
      primaryAction={{
        content: "Imprimer la facture",
        onAction: handlePrint,
      }}
    >
      <Card sectioned>
        <Text as="h2" variant="headingMd">
          Détails
        </Text>
        <Text as="p">Référence : {order.name}</Text>
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
          <Text as="p">{order.customer.email}</Text>
        )}

        {order.shippingAddress && (
          <>
            <Divider borderColor="border-subdued" />
            <div style={{ marginTop: "10px" }}>
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
            </div>
          </>
        )}
      </Card>

      <Card title="Articles commandés">
        <Card.Section>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px" }}>Produit</th>
                <th style={{ textAlign: "right", padding: "8px" }}>Qté</th>
                <th style={{ textAlign: "right", padding: "8px" }}>Prix Unit.</th>
                <th style={{ textAlign: "right", padding: "8px" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => {
                const unitPrice = item.originalUnitPriceSet.shopMoney.amount;
                const totalRow = Number(unitPrice) * item.quantity;
                
                return (
                  <tr key={item.id}>
                    <td style={{ padding: "8px", borderTop: "1px solid #dfe3e8" }}>
                      {item.name}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", borderTop: "1px solid #dfe3e8" }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", borderTop: "1px solid #dfe3e8" }}>
                      {formatMoney(unitPrice)}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", borderTop: "1px solid #dfe3e8" }}>
                      {formatMoney(totalRow)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card.Section>
      </Card>

      <Card sectioned>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px" }}>
          <Text as="p">
            Sous-total : {formatMoney(order.subtotalPriceSet.shopMoney.amount)}
          </Text>
          <Text as="p">
            Livraison : {formatMoney(order.totalShippingPriceSet.shopMoney.amount)}
          </Text>
          <Text as="p">
            Taxes : {formatMoney(order.totalTaxSet.shopMoney.amount)}
          </Text>
          <Text as="h3" variant="headingSm">
            Total : {formatMoney(order.totalPriceSet.shopMoney.amount)}
          </Text>
        </div>
      </Card>
    </Page>
  );
}