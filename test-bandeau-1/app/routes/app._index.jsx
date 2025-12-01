import { useLoaderData, useSubmit, useActionData } from "react-router";
import { Page, Layout, Card, TextField, Button, Text, BlockStack, Banner, List, Link, Select } from "@shopify/polaris";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { translations } from "../i18n"; // Import Trad

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  let settings = null;
  try { if (db.settings) settings = await db.settings.findUnique({ where: { shop: session.shop } }); } catch (e) {}

  return { 
    smtpEmail: settings?.smtpEmail || "", 
    smtpPassword: settings?.smtpPassword || "",
    uiLanguage: settings?.uiLanguage || "fr"
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  try {
    await db.settings.upsert({
      where: { shop: session.shop },
      update: { 
        smtpEmail: formData.get("smtpEmail"), 
        smtpPassword: formData.get("smtpPassword"),
        uiLanguage: formData.get("uiLanguage") 
      },
      create: { 
        shop: session.shop, 
        smtpEmail: formData.get("smtpEmail"), 
        smtpPassword: formData.get("smtpPassword"),
        uiLanguage: formData.get("uiLanguage"),
      },
    });
    return { status: "success" };
  } catch (error) {
    return { status: "error" };
  }
};

export default function Index() {
  const { smtpEmail, smtpPassword, uiLanguage } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();

  const [formState, setFormState] = useState({ smtpEmail, smtpPassword, uiLanguage });
  const [bannerVisible, setBannerVisible] = useState(false);

  // CHARGEMENT DICTIONNAIRE
  const currentLang = formState.uiLanguage || "fr";
  const txt = translations[currentLang]?.ui || translations["fr"].ui;

  useEffect(() => { setFormState({ smtpEmail, smtpPassword, uiLanguage }); }, [smtpEmail, smtpPassword, uiLanguage]);
  useEffect(() => { if (actionData?.status === "success") setBannerVisible(true); }, [actionData]);

  const handleChange = (val, id) => setFormState({ ...formState, [id]: val });
  const handleSave = () => {
    const formData = new FormData();
    formData.append("smtpEmail", formState.smtpEmail);
    formData.append("smtpPassword", formState.smtpPassword);
    formData.append("uiLanguage", formState.uiLanguage);
    submit(formData, { method: "post" });
  };

  return (
    <Page title={txt.titles.dashboard}>
      <Layout>
        <Layout.Section>
            {bannerVisible && (
                <div style={{marginBottom: "20px"}}>
                    <Banner title={txt.text.saveSuccess} tone="success" onDismiss={() => setBannerVisible(false)} />
                </div>
            )}

            <Card>
                <BlockStack gap="400">
                    <Text variant="headingMd" as="h2">{txt.titles.welcome}</Text>
                    <p>{txt.text.welcomeSub}</p>
                    <Select
                        label={txt.labels.uiLang}
                        options={[{label: 'Français 🇫🇷', value: 'fr'}, {label: 'English 🇺🇸', value: 'en'}]}
                        onChange={(v) => handleChange(v, 'uiLanguage')}
                        value={formState.uiLanguage}
                    />
                </BlockStack>
            </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <Text variant="headingMd" as="h2">{txt.titles.smtp}</Text>
              <Text as="p" tone="subdued">{txt.text.smtpSub}</Text>

              <TextField 
                  label={txt.labels.gmailAddr} 
                  value={formState.smtpEmail} 
                  onChange={(v) => handleChange(v, 'smtpEmail')} 
                  autoComplete="email"
              />
              <TextField 
                  label={txt.labels.gmailPass} 
                  value={formState.smtpPassword} 
                  onChange={(v) => handleChange(v, 'smtpPassword')} 
                  type="password" 
                  autoComplete="off"
              />
              <div style={{textAlign: "right"}}>
                <Button variant="primary" onClick={handleSave}>{txt.labels.saveConfig}</Button>
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
            <Card>
                <BlockStack gap="200">
                    <Text variant="headingSm" as="h3">{txt.titles.nextSteps}</Text>
                    <List type="number">
                        <List.Item>{txt.text.step1}</List.Item>
                        <List.Item>{txt.text.step2}</List.Item>
                    </List>
                </BlockStack>
            </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}