import { authenticate } from "../shopify.server";
import { useLoaderData, Link } from "react-router";
import { Page, Card, Button, Text } from "@shopify/polaris";
import { Page as PdfPage, Text as PdfText, View, Document, StyleSheet, PDFViewer, Image } from "@react-pdf/renderer";
import React, { useState, useEffect } from "react";
import db from "../db.server"; 

// --- LOADER (Récupération des données) ---
export const loader = async ({ request, params }) => {
  const { session, admin } = await authenticate.admin(request);
  
  // 1. On récupère les réglages (sécurisé)
  let settings = null;
  try {
    if (db.settings) {
      settings = await db.settings.findUnique({ where: { shop: session.shop } });
    }
  } catch (e) {
    console.log("Erreur lecture BDD, utilisation des défauts");
  }

  // 2. On récupère la commande
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

  return { 
    order: data.data.order, 
    shop: session.shop,
    // Si settings est vide, on met des placeholders visibles
    settings: settings || { brandColor: "#000000", companyName: "NOM ENTREPRISE", address: "", logoUrl: null }
  };
};

// --- DESIGN DU PDF ---
const InvoiceDocument = ({ order, settings }) => {
  const color = settings?.brandColor || "#000000";

  const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 12, fontFamily: "Helvetica" },
    
    // En-tête flexible
    headerBlock: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    leftColumn: { flexDirection: 'column', width: "60%" },
    
    // Styles de marque
    logo: { height: 40, objectFit: 'contain', marginBottom: 5, alignSelf: 'flex-start' },
    brandName: { fontSize: 18, fontWeight: 'bold', color: color, marginBottom: 3 },
    address: { fontSize: 10, color: 'gray', lineHeight: 1.4 },
    
    // Infos commande (droite)
    rightColumn: { alignItems: 'flex-end' },
    invoiceTitle: { fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 5 },
    
    // Tableau
    tableHeader: { 
        flexDirection: "row", 
        borderBottomWidth: 2, 
        borderBottomColor: color, 
        paddingBottom: 5, 
        marginTop: 20,
        fontWeight: 'bold'
    },
    row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: '#EEE', paddingVertical: 8 },
    colProd: { width: "60%" },
    colQty: { width: "15%", textAlign: "right" },
    colPrice: { width: "25%", textAlign: "right" },
    
    totalText: { fontSize: 14, fontWeight: 'bold', color: color, marginTop: 30, textAlign: "right" }
  });

  return (
    <Document>
      <PdfPage size="A4" style={styles.page}>
        
        {/* EN-TÊTE : Logo + Nom + Adresse */}
        <View style={styles.headerBlock}>
            <View style={styles.leftColumn}>
                {/* 1. LE LOGO (S'il existe) */}
                {settings?.logoUrl && (
                    <Image src={settings.logoUrl} style={styles.logo} />
                )}

                {/* 2. LE NOM (S'affiche TOUJOURS) */}
                <PdfText style={styles.brandName}>
                    {settings?.companyName || "VOTRE ENTREPRISE"}
                </PdfText>

                {/* 3. L'ADRESSE */}
                <PdfText style={styles.address}>
                    {settings?.address || "Adresse non configurée"}
                </PdfText>
            </View>

            <View style={styles.rightColumn}>
                <PdfText style={styles.invoiceTitle}>{order.name}</PdfText>
                <PdfText style={{fontSize: 10}}>Date : {new Date(order.processedAt).toLocaleDateString("fr-FR")}</PdfText>
            </View>
        </View>

        {/* INFO CLIENT */}
        <View style={{marginBottom: 20}}>
            <PdfText style={{color: 'gray', fontSize: 10, marginBottom: 2}}>Facturé à :</PdfText>
            <PdfText style={{fontWeight: 'bold'}}>{order.customer?.displayName || "Client"}</PdfText>
            <PdfText>{order.customer?.email}</PdfText>
        </View>

        {/* TABLEAU */}
        <View>
          <View style={styles.tableHeader}>
              <PdfText style={styles.colProd}>Description</PdfText>
              <PdfText style={styles.colQty}>Qté</PdfText>
              <PdfText style={styles.colPrice}>Prix</PdfText>
          </View>
          {order.lineItems.edges.map(({ node: item }) => (
            <View key={item.id} style={styles.row}>
              <PdfText style={styles.colProd}>{item.name}</PdfText>
              <PdfText style={styles.colQty}>{item.quantity}</PdfText>
              <PdfText style={styles.colPrice}>
                  {item.originalUnitPriceSet.shopMoney.amount} {item.originalUnitPriceSet.shopMoney.currencyCode}
              </PdfText>
            </View>
          ))}
        </View>

        <PdfText style={styles.totalText}>
            TOTAL: {order.totalPriceSet.shopMoney.amount} {order.totalPriceSet.shopMoney.currencyCode}
        </PdfText>

      </PdfPage>
    </Document>
  );
};

// --- AFFICHAGE DE LA PAGE ---
export default function PrintPage() {
  const { order, shop, settings } = useLoaderData();
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  return (
    <Page title={`Impression : ${order.name}`}>
      <div style={{ marginBottom: "20px" }}>
        <Link to={`/app/orders?shop=${shop}`} style={{textDecoration: 'none'}}>
           <Button>Retour à la liste</Button>
        </Link>
      </div>
      
      <Card>
        <div style={{ height: "80vh", width: "100%" }}>
          {isClient ? (
            <PDFViewer width="100%" height="100%" showToolbar={true}>
              <InvoiceDocument order={order} settings={settings} />
            </PDFViewer>
          ) : (
            <div style={{ padding: "50px", textAlign: "center" }}><Text>Chargement du PDF...</Text></div>
          )}
        </div>
      </Card>
    </Page>
  );
}