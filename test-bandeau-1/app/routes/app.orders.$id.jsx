import { useLoaderData } from "react-router";
import { Page, Card, Text, Divider } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request, params }) => {
  const { admin } = await authenticate.admin(request);
  const { id } = params;

  const globalId = `gid://shopify/Order/${id}`;

  const response = await admin.graphql(
    `#graphql
      query OrderForInvoice($id: ID!) {
        order(id: $id) {
          id
          name
          processedAt
          currencyCode
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
          subtotalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          totalShippingPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          totalTaxSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
        }
      }
    `,
    { variables: { id: globalId } },
  );

  const json = await response.json();
  const order = json.data.order;

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

  const currency = order.totalPriceSet.shopMoney.currencyCode;
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
          Date :{" "}
          {order.processedAt &&
            new Date(order.processedAt).toLocaleString("fr-FR")}
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
            {formatMoney(order.totalShippingPriceSet.shopMoney.amount)}
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
