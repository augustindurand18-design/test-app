import { useLoaderData, useSubmit, useActionData } from "react-router";
import { Page, Layout, Card, TextField, Button, Text, BlockStack, InlineStack, Select, RangeSlider, Divider, Checkbox, Toast, Frame } from "@shopify/polaris";
import { useState, useCallback, useEffect } from "react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { translations } from "../i18n"; 

// --- BACKEND ---
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  let settings = null;
  try {
    if (db.settings) {
      settings = await db.settings.findUnique({ where: { shop: session.shop } });
    }
  } catch (e) {}
  
  const defaults = { 
    brandColor: "#000000", secondaryColor: "#555555", titleColor: "#000000", 
    companyName: "", address: "", logoUrl: "", signatureUrl: "", layout: "classic",
    logoSize: 50, fontSize: 10, font: "Helvetica", showWatermark: true,
    siret: "", tvaIntra: "", legalInfo: "", 
    language: "fr", uiLanguage: "fr"
  };

  return { ...defaults, ...(settings || {}) };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const data = {
    companyName: formData.get("companyName"),
    address: formData.get("address"),
    logoUrl: formData.get("logoUrl"),
    signatureUrl: formData.get("signatureUrl"),
    brandColor: formData.get("brandColor"),
    secondaryColor: formData.get("secondaryColor"),
    titleColor: formData.get("titleColor"),
    layout: formData.get("layout"),
    logoSize: parseInt(formData.get("logoSize")),
    fontSize: parseInt(formData.get("fontSize")),
    font: formData.get("font"),
    showWatermark: formData.get("showWatermark") === "true",
    siret: formData.get("siret"),
    tvaIntra: formData.get("tvaIntra"),
    legalInfo: formData.get("legalInfo"),
    language: formData.get("language"),
  };

  if (data.logoUrl && data.logoUrl.length > 3000000) return { status: "error", message: "Logo trop lourd (>3Mo)" };
  
  await db.settings.upsert({
    where: { shop: session.shop },
    update: data,
    create: { shop: session.shop, ...data },
  });

  return { status: "success", message: "Design sauvegardé !" };
};

// --- FRONTEND ---
export default function SettingsPage() {
  const settings = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  
  const [formState, setFormState] = useState(settings);
  const [toastActive, setToastActive] = useState(false);

  // 1. TRADUCTION INTERFACE (UI)
  const uiLang = settings.uiLanguage || "fr";
  const txt = translations[uiLang]?.ui || translations["fr"].ui;

  // 2. TRADUCTION PREVIEW (DOCUMENT)
  // On écoute formState.language pour que ça change en direct
  const docLang = formState.language || "fr";
  const tDoc = translations[docLang]?.doc || translations["fr"].doc;

  useEffect(() => {
    if (actionData?.status === "success") setToastActive(true);
  }, [actionData]);

  const handleChange = (val, id) => setFormState({ ...formState, [id]: val });

  const handleUpload = (event, fieldName) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormState((prev) => ({ ...prev, [fieldName]: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const formData = new FormData();
    Object.keys(formState).forEach(key => formData.append(key, formState[key]));
    submit(formData, { method: "post" });
  };

  const getPreviewStyle = () => {
    if (formState.layout === "mirrored") return { flexDirection: "row-reverse", textAlign: "right" };
    if (formState.layout === "centered") return { flexDirection: "column", alignItems: "center", textAlign: "center" };
    return { flexDirection: "row", textAlign: "left" };
  };

  const getFontFamily = () => {
      if (['Helvetica', 'Times-Roman', 'Courier'].includes(formState.font)) return formState.font;
      return `'${formState.font}', sans-serif`;
  };

  return (
    <Frame>
    <Page title={txt.titles.settings}>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <Text variant="headingMd" as="h2">{txt.titles.config}</Text>
              
              <InlineStack gap="400">
                  <div style={{flex:1}}>
                    <Select
                        label={txt.labels.docLang}
                        options={[{label: 'Français 🇫🇷', value: 'fr'}, {label: 'English 🇺🇸', value: 'en'}, {label: 'Español 🇪🇸', value: 'es'}, {label: 'Deutsch 🇩🇪', value: 'de'}, {label: 'Italiano 🇮🇹', value: 'it'}]}
                        onChange={(v) => handleChange(v, 'language')} value={formState.language}
                    />
                  </div>
              </InlineStack>

              <Divider />

              <Text variant="headingMd" as="h2">{txt.titles.design}</Text>
              <InlineStack gap="400">
                  <div style={{flex:1}}>
                    <Select label={txt.labels.font} options={[{label:'Standard (Helvetica)', value:'Helvetica'}, {label:'Classique (Times)', value:'Times-Roman'}, {label:'Moderne (Roboto)', value:'Roboto'}, {label:'Luxe (Playfair Display)', value:'Playfair Display'}, {label:'Tech (Inconsolata)', value:'Inconsolata'}]} onChange={(v) => handleChange(v, 'font')} value={formState.font} />
                  </div>
                  <div style={{flex:1}}>
                    <Select label={txt.labels.layout} options={[{label:'Classic', value:'classic'}, {label:'Center', value:'centered'}, {label:'Mirror', value:'mirrored'}]} onChange={(v) => handleChange(v, 'layout')} value={formState.layout} />
                  </div>
              </InlineStack>

              <Checkbox label={txt.labels.showWatermark} checked={formState.showWatermark} onChange={(v) => handleChange(v, 'showWatermark')} />

              <Divider />
              <Text variant="headingMd" as="h2">{txt.titles.colors}</Text>
              <InlineStack gap="400">
                <div style={{flex:1}}><Text>{txt.labels.primaryColor}</Text><input type="color" value={formState.brandColor} onChange={(e) => handleChange(e.target.value, 'brandColor')} style={{width:"100%", height:35}}/></div>
                <div style={{flex:1}}><Text>{txt.labels.secondaryColor}</Text><input type="color" value={formState.secondaryColor} onChange={(e) => handleChange(e.target.value, 'secondaryColor')} style={{width:"100%", height:35}}/></div>
                <div style={{flex:1}}><Text>{txt.labels.titleColor}</Text><input type="color" value={formState.titleColor} onChange={(e) => handleChange(e.target.value, 'titleColor')} style={{width:"100%", height:35}}/></div>
              </InlineStack>

              <Divider />
              <Text variant="headingMd" as="h2">{txt.titles.identity}</Text>
              <TextField label={txt.labels.company} value={formState.companyName} onChange={(v) => handleChange(v, 'companyName')} autoComplete="off"/>
              <TextField label={txt.labels.address} value={formState.address} onChange={(v) => handleChange(v, 'address')} multiline={3} autoComplete="off"/>
              
              <InlineStack gap="400">
                  <div style={{flex:1}}><TextField label={txt.labels.siret} value={formState.siret} onChange={(v) => handleChange(v, 'siret')} autoComplete="off"/></div>
                  <div style={{flex:1}}><TextField label={txt.labels.tva} value={formState.tvaIntra} onChange={(v) => handleChange(v, 'tvaIntra')} autoComplete="off"/></div>
              </InlineStack>
              <TextField label={txt.labels.legal} value={formState.legalInfo} onChange={(v) => handleChange(v, 'legalInfo')} autoComplete="off"/>

              <Divider />
              <Text variant="headingMd" as="h2">{txt.titles.images}</Text>
              <InlineStack gap="400">
                  <div style={{flex:1}}>
                    <Text fontWeight="bold">{txt.labels.logo}</Text>
                    {formState.logoUrl && <img src={formState.logoUrl} style={{height: 30}} alt="Logo"/>}
                    <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'logoUrl')} />
                  </div>
                  <div style={{flex:1}}>
                    <Text fontWeight="bold">{txt.labels.signature}</Text>
                    {formState.signatureUrl && <img src={formState.signatureUrl} style={{height: 30}} alt="Signature"/>}
                    <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'signatureUrl')} />
                  </div>
              </InlineStack>

              <div style={{marginTop: 20, textAlign: "right"}}>
                <Button variant="primary" onClick={handleSave}>{txt.labels.save}</Button>
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>
        
        {/* COLONNE DROITE : PREVIEW */}
        <Layout.Section variant="oneThird">
            <Card>
                <div style={{
                    padding: "20px", 
                    border: "1px solid #ddd", 
                    minHeight: "500px", 
                    background: "white", 
                    fontFamily: getFontFamily(),
                    position: "relative",
                    overflow: "hidden" // Empêche le tampon de dépasser
                }}>
                    <div style={{textAlign: "center", color: "#999", marginBottom: 15, fontSize: 10, fontFamily: "sans-serif"}}>{txt.titles.preview}</div>
                    
                    {/* TAMPON PAYÉ TRADUIT ET STYLISÉ */}
                    {formState.showWatermark && (
                        <div style={{
                            position: "absolute", 
                            top: "35%", left: "50%", 
                            transform: "translate(-50%, -50%) rotate(-45deg)", 
                            fontSize: "50px", 
                            fontWeight: "bold", 
                            color: "#d32f2f", // Rouge tampon
                            opacity: 0.25, 
                            border: "5px solid #d32f2f", 
                            padding: "10px 30px", 
                            borderRadius: "10px",
                            zIndex: 0,
                            pointerEvents: "none",
                            whiteSpace: "nowrap"
                        }}>
                            {/* ICI ON UTILISE LE MOT TRADUIT */}
                            {tDoc.paid}
                        </div>
                    )}

                    <div style={{display: "flex", justifyContent: "space-between", marginBottom: 30, position: "relative", zIndex: 1, ...getPreviewStyle()}}>
                        <div style={{width: "48%"}}>
                            {formState.logoUrl ? <img src={formState.logoUrl} style={{height: formState.logoSize + 'px'}} /> : null}
                            <div style={{color: formState.titleColor, fontWeight: "bold", fontSize: (formState.fontSize + 4) + 'px', marginTop: 5}}>{formState.companyName || "COMPANY"}</div>
                            <div style={{color: formState.secondaryColor, marginTop: 5, fontSize: formState.fontSize + 'px'}}>{formState.address || "Address..."}</div>
                        </div>
                        <div style={{width: "48%"}}>
                            {/* ICI ON UTILISE LE MOT TRADUIT */}
                            <div style={{fontWeight: "bold", color: formState.brandColor, fontSize: (formState.fontSize + 6) + 'px'}}>{tDoc.invoice}</div>
                            <div style={{fontSize: formState.fontSize + 'px'}}>#1001</div>
                        </div>
                    </div>

                    <div style={{borderBottom: `2px solid ${formState.brandColor}`, paddingBottom: 5, marginBottom: 5, fontWeight: "bold", color: formState.secondaryColor, fontSize: formState.fontSize + 'px', display: 'flex', justifyContent: 'space-between'}}>
                        <span>{tDoc.description || "Produit"}</span><span>{tDoc.price || "Prix"}</span>
                    </div>
                    <div style={{padding: "8px 0", borderBottom: "1px solid #eee", fontSize: formState.fontSize + 'px', display: 'flex', justifyContent: 'space-between'}}>
                        <span>Produit A</span><span>50.00 €</span>
                    </div>

                    <div style={{marginTop: 20, textAlign: "right", fontSize: (formState.fontSize + 2) + 'px'}}>
                        <span style={{fontWeight: "bold", color: formState.brandColor}}>{tDoc.total}: 50.00 €</span>
                    </div>

                    {formState.signatureUrl && (
                        <div style={{marginTop: 30, textAlign: "right"}}>
                            <img src={formState.signatureUrl} style={{height: 40}} />
                        </div>
                    )}

                    <div style={{position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", fontSize: (formState.fontSize - 3) + 'px', color: "#999", borderTop: "1px solid #eee", paddingTop: 10, margin: "0 20px"}}>
                        {formState.siret && <span>SIRET: {formState.siret} </span>}
                        {formState.tvaIntra && <span> | TVA: {formState.tvaIntra}</span>}
                        {formState.legalInfo && <div>{formState.legalInfo}</div>}
                    </div>
                </div>
            </Card>
        </Layout.Section>
      </Layout>
      {toastActive && <Toast content={actionData?.message} onDismiss={() => setToastActive(false)} />}
    </Page>
    </Frame>
  );
}