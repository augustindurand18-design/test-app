import { useLoaderData, useNavigate, useFetcher } from "react-router";
import { Page, Card, IndexTable, useIndexResourceState, Text, Button, Frame, Toast } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useState, useEffect, useCallback } from "react";
import db from "../db.server";
import { translations } from "../i18n"; // Import dictionnaire

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  
  // CHARGEMENT LANGUE
  let uiLang = "fr";
  try {
    if (db.settings) {
      const settings = await db.settings.findUnique({ where: { shop: session.shop } });
      if (settings?.uiLanguage) uiLang = settings.uiLanguage;
    }
  } catch (e) {}

  const response = await admin.graphql(
    `#graphql
      query getOrders {
        orders(first: 10, sortKey: PROCESSED_AT, reverse: true) {
          edges { node { id, name, processedAt, totalPriceSet { shopMoney { amount currencyCode } }, customer { displayName, email } } }
        }
      }`
  );

  const data = await response.json();
  const orders = data.data.orders.edges.map((edge) => {
    const node = edge.node;
    return { ...node, simpleId: node.id.split("/").pop() };
  });

  return { orders, shop: session.shop, uiLang };
};

export default function OrdersIndex() {
  const { orders, shop, uiLang } = useLoaderData();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  // SELECTION DICTIONNAIRE
  const txt = translations[uiLang]?.ui || translations["fr"].ui;

  const resourceName = { singular: 'commande', plural: 'commandes' };
  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(orders);

  const [toastActive, setToastActive] = useState(false);
  const toggleToast = useCallback(() => setToastActive((active) => !active), []);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.status === "success") {
        setToastActive(true);
    }
  }, [fetcher.state, fetcher.data]);

  const rowMarkup = orders.map(
    (order, index) => {
      const money = order.totalPriceSet.shopMoney;
      const previewUrl = `/app/print/${order.simpleId}?shop=${shop}`;
      const isSending = fetcher.state === "submitting" && fetcher.formData?.get("orderId") === order.simpleId;

      return (
        <IndexTable.Row id={order.id} key={order.id} position={index} selected={selectedResources.includes(order.id)}>
          <IndexTable.Cell><Text fontWeight="bold" as="span">{order.name}</Text></IndexTable.Cell>
          <IndexTable.Cell>
              <div>{order.customer?.displayName || "—"}</div>
              <div style={{fontSize: "11px", color: "gray"}}>{order.customer?.email}</div>
          </IndexTable.Cell>
          <IndexTable.Cell>{new Date(order.processedAt).toLocaleString(uiLang === 'en' ? 'en-US' : 'fr-FR')}</IndexTable.Cell>
          <IndexTable.Cell>{money.amount} {money.currencyCode}</IndexTable.Cell>
          
          <IndexTable.Cell>
            <div style={{display: "flex", gap: "10px"}}>
                <div onClick={(e) => e.stopPropagation()}>
                    <Button onClick={() => navigate(previewUrl)} size="slim">{txt.labels.view}</Button>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                    <fetcher.Form method="post" action="/api/send-invoice">
                        <input type="hidden" name="orderId" value={order.simpleId} />
                        <input type="hidden" name="email" value={order.customer?.email} />
                        <Button submit variant="primary" size="slim" loading={isSending} disabled={!order.customer?.email}>
                            {isSending ? txt.labels.sending : txt.labels.send}
                        </Button>
                    </fetcher.Form>
                </div>
            </div>
          </IndexTable.Cell>
        </IndexTable.Row>
      );
    },
  );

  return (
    <Frame>
        <Page title={txt.titles.orders}>
        <Card padding="0">
            <IndexTable
            resourceName={resourceName}
            itemCount={orders.length}
            selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
            onSelectionChange={handleSelectionChange}
            headings={[
                {title: txt.table.order}, 
                {title: txt.table.client}, 
                {title: txt.table.date}, 
                {title: txt.table.total}, 
                {title: txt.table.action}
            ]}
            >
            {rowMarkup}
            </IndexTable>
        </Card>
        {toastActive && <Toast content="Email envoyé !" onDismiss={toggleToast} />}
        </Page>
    </Frame>
  );
}