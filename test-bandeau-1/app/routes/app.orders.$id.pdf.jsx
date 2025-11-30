import { authenticate } from "../shopify.server";
import { Page, Text, View, Document, StyleSheet, renderToStream } from "@react-pdf/renderer";

// Styles du PDF
const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12, fontFamily: "Helvetica" },
  header: { marginBottom: 20, textAlign: "center", fontSize: 20, fontWeight: "bold" },
  section: { margin: 10, padding: 10, borderBottom: "1px solid #EEE" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  tableHeader: { borderBottom: "1px solid #000", paddingBottom: 5, marginBottom: 5, flexDirection: "row" },
  totalSection: { marginTop: 20, alignItems: "flex-end" }
});

// Document PDF
const InvoiceDocument = ({ order }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text>FACTURE {order.name}</Text>
      </View>

      <View style={styles.section}>
        <Text style={{ fontSize: 14, marginBottom: 10 }}>Client :</Text>
        <Text>{order.customer?.displayName || "Client invité"}</Text>
        <Text>{order.customer?.email}</Text>
        <Text style={{ marginTop: 5, color: "gray" }}>
            Date : {new Date(order.processedAt).toLocaleDateString("fr-FR")}
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.tableHeader}>
            <Text style={{ width: "60%" }}>Produit</Text>
            <Text style={{ width: "20%", textAlign: "right" }}>Qté</Text>
            <Text style={{ width: "20%", textAlign: "right" }}>Prix</Text>
        </View>
        
        {order.lineItems.edges.map(({ node: item }) => (
          <View key={item.id} style={styles.row}>
            <Text style={{ width: "60%" }}>{item.name}</Text>
            <Text style={{ width: "20%", textAlign: "right" }}>{item.quantity}</Text>
            <Text style={{ width: "20%", textAlign: "right" }}>
                {item.originalUnitPriceSet.shopMoney.amount} {item.originalUnitPriceSet.shopMoney.currencyCode}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.totalSection}>
        <View style={{ width: 200 }}>
            <View style={styles.row}>
                <Text>Total:</Text>
                <Text>{order.totalPriceSet.shopMoney.amount} €</Text>
            </View>
        </View>
      </View>
    </Page>
  </Document>
);

export const loader = async ({ params, request }) => {
  const { admin } = await authenticate.admin(request);
  
  const response = await admin.graphql(
    `#graphql
    query getOrderForPdf($id: ID!) {
      order(id: $id) {
        name
        processedAt
        customer { displayName email }
        lineItems(first: 20) {
          edges {
            node {
              id name quantity
              originalUnitPriceSet { shopMoney { amount currencyCode } }
            }
          }
        }
        totalPriceSet { shopMoney { amount currencyCode } }
      }
    }`,
    { variables: { id: `gid://shopify/Order/${params.id}` } }
  );

  const data = await response.json();
  const order = data.data.order;

  const stream = await renderToStream(<InvoiceDocument order={order} />);

  return new Response(stream, {
    headers: {
      "Content-Type": "application/pdf",
      // AJOUT IMPORTANT : inline permet l'affichage dans l'iframe
      "Content-Disposition": `inline; filename="Facture-${order.name}.pdf"`,
    },
  });
};