import { useLoaderData, Link } from "react-router";
import { Page, Card, Text } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
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

  return { orders, shop: session.shop };
};

export default function OrdersIndex() {
  const { orders, shop } = useLoaderData();

  // Styles CSS simples pour le tableau HTML
  const tableStyle = { width: "100%", borderCollapse: "collapse", textAlign: "left" };
  const thStyle = { padding: "12px", borderBottom: "1px solid #dfe3e8", color: "#637381", fontWeight: "600" };
  const tdStyle = { padding: "12px", borderBottom: "1px solid #dfe3e8", verticalAlign: "middle" };
  const btnStyle = {
      display: "inline-block",
      backgroundColor: "black",
      color: "white",
      padding: "6px 12px",
      borderRadius: "4px",
      textDecoration: "none",
      fontWeight: "bold",
      fontSize: "13px"
  };

  return (
    <Page title="Mes Commandes">
      <Card padding="0">
        <div style={{ padding: "0 16px 16px" }}>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>Commande</th>
                        <th style={thStyle}>Client</th>
                        <th style={thStyle}>Date</th>
                        <th style={thStyle}>Total</th>
                        <th style={thStyle}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => {
                        const previewUrl = `/app/print/${order.simpleId}?shop=${shop}`;
                        
                        return (
                          <tr key={order.id}>
                              <td style={tdStyle}><span style={{fontWeight: "bold"}}>{order.name}</span></td>
                              <td style={tdStyle}>{order.customer?.displayName || "—"}</td>
                              <td style={tdStyle}>{new Date(order.processedAt).toLocaleString("fr-FR")}</td>
                              <td style={tdStyle}>{order.totalPriceSet.shopMoney.amount} {order.totalPriceSet.shopMoney.currencyCode}</td>
                              <td style={tdStyle}>
                                  {/* LIEN DIRECT SANS SCRIPT */}
                                  <Link to={previewUrl} style={btnStyle}>
                                      Voir la facture
                                  </Link>
                              </td>
                          </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </Card>
    </Page>
  );
}