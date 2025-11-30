import { useLoaderData, useSubmit } from "react-router";
import { Page, Layout, Card, TextField, Button, Text, BlockStack, InlineStack, Thumbnail } from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "../shopify.server";
import db from "../db.server";

// --- BACKEND ---
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  // Sécurité pour la BDD
  let settings = null;
  try {
    if (db.settings) {
      settings = await db.settings.findUnique({ where: { shop: session.shop } });
    }
  } catch (e) { console.log("Erreur lecture BDD"); }

  if (!settings) {
    settings = { brandColor: "#000000", companyName: "", address: "", logoUrl: "" };
  }
  return settings;
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  if (!db.settings) return { status: "error", message: "BDD non prête" };

  const formData = await request.formData();

  const data = {
    brandColor: formData.get("brandColor"),
    companyName: formData.get("companyName"),
    address: formData.get("address"),
    logoUrl: formData.get("logoUrl"), // Ici on recevra le code Base64 de l'image
  };

  await db.settings.upsert({
    where: { shop: session.shop },
    update: data,
    create: { shop: session.shop, ...data },
  });

  return { status: "success" };
};

// --- FRONTEND ---
export default function SettingsPage() {
  const settings = useLoaderData();
  const submit = useSubmit();
  
  const safeSettings = settings || { brandColor: "#000000", companyName: "", address: "", logoUrl: "" };
  const [formState, setFormState] = useState(safeSettings);

  const handleChange = (val, id) => setFormState({ ...formState, [id]: val });

  // FONCTION MAGIQUE : Convertit l'image du PC en texte (Base64)
  const handleImageUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Le résultat ressemble à "data:image/png;base64,iVBORw0KGgo..."
        setFormState((prev) => ({ ...prev, logoUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSave = () => submit(formState, { method: "post" });

  return (
    <Page title="Personnalisation Facture">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <Text variant="headingMd" as="h2">Identité visuelle</Text>
              
              <TextField
                label="Nom de l'entreprise"
                value={formState.companyName}
                onChange={(v) => handleChange(v, 'companyName')}
                autoComplete="off"
              />

              <TextField
                label="Adresse complète"
                value={formState.address}
                onChange={(v) => handleChange(v, 'address')}
                multiline={3}
                autoComplete="off"
              />

              {/* SECTION LOGO UPLOAD */}
              <div>
                <Text variant="bodyMd" fontWeight="bold" as="p" style={{marginBottom: "8px"}}>Logo de l'entreprise</Text>
                <InlineStack align="start" blockAlign="center" gap="400">
                    {/* Prévisualisation */}
                    {formState.logoUrl ? (
                        <div style={{border: "1px solid #ccc", padding: "5px", borderRadius: "4px"}}>
                            <img src={formState.logoUrl} alt="Logo" style={{height: "50px", objectFit: "contain"}} />
                        </div>
                    ) : (
                        <div style={{width: 50, height: 50, background: "#eee", borderRadius: 4}}></div>
                    )}
                    
                    {/* Bouton d'upload caché dans un label */}
                    <div>
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
                            style={{marginBottom: "5px"}}
                        />
                        <Text variant="bodySm" tone="subdued" as="p">Format recommandé : PNG ou JPG (Max 500ko)</Text>
                    </div>
                </InlineStack>
                {/* Champ caché pour envoyer la donnée au serveur */}
                <input type="hidden" name="logoUrl" value={formState.logoUrl || ""} />
              </div>

              <div>
                <Text variant="bodyMd" fontWeight="bold" as="p">Couleur principale</Text>
                <div style={{display: "flex", gap: "10px", marginTop: "5px", alignItems: "center"}}>
                   <input 
                      type="color" 
                      value={formState.brandColor} 
                      onChange={(e) => handleChange(e.target.value, 'brandColor')} 
                      style={{height: "40px", width: "60px", cursor: "pointer", border: "1px solid #ccc"}}
                   />
                   <TextField 
                      value={formState.brandColor} 
                      onChange={(v) => handleChange(v, 'brandColor')} 
                      autoComplete="off"
                   />
                </div>
              </div>

              <div style={{marginTop: "20px", textAlign: "right", borderTop: "1px solid #eee", paddingTop: "20px"}}>
                <Button variant="primary" onClick={handleSave}>Sauvegarder les modifications</Button>
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>
        
        {/* APERÇU EN DIRECT */}
        <Layout.Section variant="oneThird">
            <Card>
                <div style={{padding: "20px", border: "1px dashed #ccc", minHeight: "350px", background: "white"}}>
                    <Text as="p" tone="subdued" alignment="center">Aperçu du document</Text>
                    <div style={{marginTop: 30, textAlign: "left"}}>
                        {/* Logo ou Nom */}
                        {formState.logoUrl ? (
                            <img src={formState.logoUrl} style={{maxHeight: 40, maxWidth: "100%", marginBottom: 10}} alt="Logo"/>
                        ) : null}
                        
                        <h2 style={{color: formState.brandColor, fontWeight: "bold", fontSize: "18px", margin: 0}}>
                            {formState.companyName || "VOTRE ENTREPRISE"}
                        </h2>
                        
                        <p style={{fontSize: 11, color: "#666", marginTop: 5, whiteSpace: "pre-line"}}>
                            {formState.address || "12 rue de l'exemple\n75000 Paris"}
                        </p>
                    </div>

                    <div style={{marginTop: 30, borderBottom: `2px solid ${formState.brandColor}`, paddingBottom: 5, display: "flex", justifyContent: "space-between"}}>
                        <Text fontWeight="bold">Produit</Text>
                        <Text fontWeight="bold">Prix</Text>
                    </div>
                    <div style={{padding: "10px 0", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", fontSize: "12px"}}>
                        <span>Produit Exemple</span>
                        <span>50.00 €</span>
                    </div>
                    
                    <div style={{marginTop: 20, textAlign: "right"}}>
                        <Text variant="headingMd" as="span" style={{color: formState.brandColor}}>Total: 50.00 €</Text>
                    </div>
                </div>
            </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}