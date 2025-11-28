import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { useEffect, useState } from "react";

export const loader = async ({ request }) => {
  await authenticate.admin(request); // Vérifie qu'on est admin
  return null;
};

export const ErrorBoundary = boundary;

export default function Index() {
  const [message, setMessage] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#000000");
  const [textColor, setTextColor] = useState("#ffffff");
  const [isEnabled, setIsEnabled] = useState(true);
  const [textAlign, setTextAlign] = useState("center");

  // Charger config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/bandeau-message");
        if (!res.ok) return;

        const data = await res.json();

        if (data.message !== undefined) setMessage(data.message);
        if (data.backgroundColor) setBackgroundColor(data.backgroundColor);
        if (data.textColor) setTextColor(data.textColor);
        if (typeof data.isEnabled === "boolean") setIsEnabled(data.isEnabled);
        if (data.textAlign) setTextAlign(data.textAlign);
      } catch (err) {
        console.error("Erreur de chargement :", err);
      }
    };

    fetchConfig();
  }, []);

  // Sauvegarder config
  const handleSave = async () => {
    try {
      const response = await fetch("/api/bandeau-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          backgroundColor,
          textColor,
          isEnabled,
          textAlign,
        }),
      });

      if (!response.ok) throw new Error("Erreur HTTP");

      alert("Configuration enregistrée ✔️");
    } catch (err) {
      console.error(err);
      alert("Erreur ❌");
    }
  };

  return (
    <div style={{ padding: "16px", fontFamily: "system-ui" }}>
      <h1 style={{ marginBottom: "12px" }}>Configuration du bandeau</h1>

      {/* Message */}
      <label>Message :</label>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={{ width: "100%", marginBottom: "12px" }}
      />

      {/* Couleurs */}
      <label>Couleur de fond :</label>
      <input
        type="color"
        value={backgroundColor}
        onChange={(e) => setBackgroundColor(e.target.value)}
        style={{ marginBottom: "12px" }}
      />

      <label>Couleur du texte :</label>
      <input
        type="color"
        value={textColor}
        onChange={(e) => setTextColor(e.target.value)}
        style={{ marginBottom: "12px" }}
      />

      {/* Position du texte */}
      <label>Position du texte :</label>
      <select
        value={textAlign}
        onChange={(e) => setTextAlign(e.target.value)}
        style={{ width: "100%", padding: "6px", marginBottom: "12px" }}
      >
        <option value="left">Gauche</option>
        <option value="center">Centre</option>
        <option value="right">Droite</option>
      </select>

      {/* Toggle bandeau */}
      <label style={{ display: "block", marginBottom: "12px" }}>
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={(e) => setIsEnabled(e.target.checked)}
        />
        Afficher le bandeau
      </label>

      {/* Aperçu */}
      <div
        style={{
          padding: "10px",
          backgroundColor,
          color: textColor,
          opacity: isEnabled ? 1 : 0.4,
          textAlign,
        }}
      >
        {message || "(Aucun message)"}
      </div>

      <button
        onClick={handleSave}
        style={{ marginTop: "16px", padding: "8px 16px", cursor: "pointer" }}
      >
        Enregistrer
      </button>
    </div>
  );
}
