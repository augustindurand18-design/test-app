import { authenticate } from "../shopify.server";
import db from "../db.server";
import { Page as PdfPage, Text as PdfText, View, Document, StyleSheet, renderToStream, Image, Font } from "@react-pdf/renderer";
import nodemailer from "nodemailer";
import { translations } from "../i18n"; 

// 1. POLICES
Font.register({ family: 'Roboto', src: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxK.ttf' });
Font.register({ family: 'Open Sans', src: 'https://fonts.gstatic.com/s/opensans/v17/mem8YaGs126MiZpBA-UFVZ0e.ttf' });
Font.register({ family: 'Lato', src: 'https://fonts.gstatic.com/s/lato/v16/S6uyw4BMUTPHjx4wXg.ttf' });
Font.register({ family: 'Montserrat', src: 'https://fonts.gstatic.com/s/montserrat/v14/JTUSjIg1_i6t8kCHKm459Wlhyw.ttf' });
Font.register({ family: 'Oswald', src: 'https://fonts.gstatic.com/s/oswald/v31/TK3iWkUHHAIjg75oxSD03E0.ttf' });
Font.register({ family: 'Playfair Display', src: 'https://fonts.gstatic.com/s/playfairdisplay/v21/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWbn2PKdFvXDXbtM.ttf' });
Font.register({ family: 'Merriweather', src: 'https://fonts.gstatic.com/s/merriweather/v22/u-440qyriQwlOrhSvowK_l5-fCzm.ttf' });
Font.register({ family: 'Raleway', src: 'https://fonts.gstatic.com/s/raleway/v18/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVvaorCIPrQ.ttf' });
Font.register({ family: 'Inconsolata', src: 'https://fonts.gstatic.com/s/inconsolata/v20/QldKNThLqRwH-OJ1UHjlKGlZ5qg.ttf' });

// 2. DOCUMENT PDF
const InvoiceDocument = ({ order, settings }) => {
  const lang = settings.language || "fr";
  // On récupère la partie "doc" du dictionnaire
  const t = translations[lang]?.doc || translations["fr"].doc;

  const primary = settings.brandColor || "#000000";
  const secondary = settings.secondaryColor || "#555555";
  const titleColor = settings.titleColor || "#000000";
  const font = settings.font || "Helvetica";
  const baseSize = settings.fontSize || 10;
  
  const isPaid = order.displayFinancialStatus === 'PAID';
  const showWatermark = settings.showWatermark && isPaid;

  let headerDirection = 'row';
  let headerAlign = 'flex-start';
  let textAlign = 'left';

  if (settings.layout === 'mirrored') {
      headerDirection = 'row-reverse';
      textAlign = 'right';
  } else if (settings.layout === 'centered') {
      headerDirection = 'column';
      headerAlign = 'center';
      textAlign = 'center';
  }

  const styles = StyleSheet.create({
    page: { padding: 40, fontSize: baseSize, fontFamily: font },
    watermark: { position: 'absolute', top: 200, left: 100, right: 0, bottom: 0, transform: 'rotate(-45deg)', opacity: 0.15, fontSize: 120, fontWeight: 'bold', color: 'red', zIndex: -1 },
    header: { flexDirection: headerDirection, alignItems: headerAlign, justifyContent: 'space-between', marginBottom: 40 },
    headerInfoBlock: { flexDirection: 'column', alignItems: headerAlign, width: settings.layout === 'centered' ? '100%' : '55%' },
    headerInvoiceBlock: { flexDirection: 'column', alignItems: (settings.layout === 'mirrored' ? 'flex-start' : (settings.layout === 'centered' ? 'center' : 'flex-end')) },
    brandName: { fontSize: baseSize + 8, fontWeight: 'bold', color: titleColor, marginBottom: 4, textAlign: textAlign },
    logo: { height: settings.logoSize, objectFit: 'contain', marginBottom: 10, alignSelf: headerAlign },
    address: { fontSize: baseSize, color: secondary, textAlign: textAlign },
    title: { fontSize: baseSize + 6, fontWeight: 'bold', color: primary, textTransform: 'uppercase' },
    tableHeader: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: primary, paddingBottom: 5, marginTop: 10, fontWeight: 'bold', color: secondary, fontSize: baseSize },
    row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: '#EEE', paddingVertical: 8, fontSize: baseSize },
    colProd: { width: "60%" },
    colQty: { width: "15%", textAlign: "right" },
    colPrice: { width: "25%", textAlign: "right" },
    totalText: { fontSize: baseSize + 4, fontWeight: 'bold', color: primary, marginTop: 30, textAlign: "right" },
    signatureBlock: { marginTop: 50, alignSelf: 'flex-end', alignItems: 'center' },
    signatureImg: { height: 50, width: 100, objectFit: 'contain' },
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: baseSize - 2, color: '#999', borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 10 },
    footerRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 2 }
  });

  return (
    <Document>
      <PdfPage size="A4" style={styles.page}>
        {showWatermark && <View style={styles.watermark}><PdfText>{t.paid}</PdfText></View>}
        <View style={styles.header}>
            <View style={styles.headerInfoBlock}>
                {settings.logoUrl ? <Image src={settings.logoUrl} style={styles.logo} /> : null}
                <PdfText style={styles.brandName}>{settings.companyName || t.invoice}</PdfText>
                <PdfText style={styles.address}>{settings.address}</PdfText>
            </View>
            <View style={styles.headerInvoiceBlock}>
                <PdfText style={styles.title}>{t.invoice} {order.name}</PdfText>
                <PdfText style={{fontSize: baseSize, color: secondary}}>{t.date} : {new Date(order.processedAt).toLocaleDateString("fr-FR")}</PdfText>
                <PdfText style={{fontSize: baseSize, color: secondary, marginTop: 5}}>{t.statut} : {order.displayFinancialStatus}</PdfText>
            </View>
        </View>
        <View style={{marginBottom: 30}}>
            <PdfText style={{fontSize: baseSize, color: secondary, marginBottom: 4}}>{t.billedTo} :</PdfText>
            <PdfText>{order.customer?.displayName}</PdfText>
            <PdfText style={{color: secondary}}>{order.customer?.email}</PdfText>
        </View>
        <View>
          <View style={styles.tableHeader}>
              <PdfText style={styles.colProd}>{t.description}</PdfText>
              <PdfText style={styles.colQty}>{t.qty}</PdfText>
              <PdfText style={styles.colPrice}>{t.price}</PdfText>
          </View>
          {order.lineItems.edges.map(({ node: item }) => (
            <View key={item.id} style={styles.row}>
              <PdfText style={styles.colProd}>{item.name}</PdfText>
              <PdfText style={styles.colQty}>{item.quantity}</PdfText>
              <PdfText style={styles.colPrice}>{item.originalUnitPriceSet.shopMoney.amount} {item.originalUnitPriceSet.shopMoney.currencyCode}</PdfText>
            </View>
          ))}
        </View>
        <PdfText style={styles.totalText}>{t.total}: {order.totalPriceSet.shopMoney.amount} {order.totalPriceSet.shopMoney.currencyCode}</PdfText>
        {settings.signatureUrl && (
            <View style={styles.signatureBlock}>
                <PdfText style={{fontSize: baseSize, marginBottom: 5, color: secondary}}>{t.signature} :</PdfText>
                <Image src={settings.signatureUrl} style={styles.signatureImg} />
            </View>
        )}
        <View style={styles.footer}>
            <View style={styles.footerRow}>
                {settings.siret && <PdfText>SIRET: {settings.siret}  </PdfText>}
                {settings.tvaIntra && <PdfText> |  TVA: {settings.tvaIntra}</PdfText>}
            </View>
            {settings.legalInfo && <PdfText>{settings.legalInfo}</PdfText>}
        </View>
      </PdfPage>
    </Document>
  );
};

// 3. ACTION
export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const orderId = formData.get("orderId");
  const customerEmail = formData.get("email");

  if (!customerEmail) return { status: "error", message: "Aucun email client !" };

  let settings = null;
  try { if (db.settings) settings = await db.settings.findUnique({ where: { shop: session.shop } }); } catch (e) {}
  
  if (!settings?.smtpEmail || !settings?.smtpPassword) {
      return { status: "error", message: "Veuillez configurer votre Email Gmail dans l'onglet Personnalisation !" };
  }

  // --- CORRECTION TRADUCTION EMAIL ---
  const lang = settings.language || "fr";
  // On récupère la partie "doc" du dictionnaire
  const t = translations[lang]?.doc || translations["fr"].doc;

  const safeSettings = settings || { brandColor: "#000000", secondaryColor: "#555555", titleColor: "#000000", layout: "classic", logoSize: 50, fontSize: 10, font: "Helvetica", showWatermark: true, siret: "", tvaIntra: "", legalInfo: "", language: "fr" };

  const response = await admin.graphql(
    `#graphql
    query getOrderForPdf($id: ID!) {
      order(id: $id) { name, processedAt, displayFinancialStatus, customer { displayName email }, lineItems(first: 20) { edges { node { id name quantity originalUnitPriceSet { shopMoney { amount currencyCode } } } } }, totalPriceSet { shopMoney { amount currencyCode } } } }`,
    { variables: { id: `gid://shopify/Order/${orderId}` } }
  );
  const data = await response.json();
  const order = data.data.order;

  const stream = await renderToStream(<InvoiceDocument order={order} settings={safeSettings} />);
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const pdfBuffer = Buffer.concat(chunks);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: settings.smtpEmail, 
        pass: settings.smtpPassword 
    }
  });

  try {
    await transporter.sendMail({
        from: `"${settings.companyName || "Boutique"}" <${settings.smtpEmail}>`,
        to: customerEmail, 
        // CORRECTION : On utilise les variables traduites (t.emailSubject, t.emailBody)
        subject: `${t.emailSubject} ${order.name}`,
        text: `${t.emailHello} ${order.customer?.displayName || ""},\n\n${t.emailBody}\n\n${t.emailKind},\n${settings.companyName || "L'équipe"}`,
        attachments: [
            {
                filename: `Facture-${order.name}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }
        ]
    });

    return { status: "success", message: "Email envoyé !" };

  } catch (error) {
    console.error("❌ Erreur lors de l'envoi :", error);
    return { status: "error", message: "Erreur d'envoi" };
  }
};