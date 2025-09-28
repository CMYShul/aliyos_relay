import { useEffect, useState } from "react";

const DONORFUSE_LINK = "CMYAliyos";
const DEFAULT_CAMPAIGN_ID = 10531;

export default function DonatePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const rawUrl = window.location.href;
    const url = new URL(rawUrl);
    const params = url.searchParams;

    // Amount cleanup: remove $ and commas
    const amountRaw = params.get("amount");
    let amount;
    if (amountRaw) {
      const cleanAmount = amountRaw.replace(/[^0-9.]/g, "");
      amount = Number(cleanAmount);
    }

    // Full name parsing
    const nameParam = params.get("name") || "";
    const fullName = nameParam.trim() || undefined;
    let firstName, lastName;
    if (fullName) {
      const parts = fullName.split(/\s+/);
      firstName = parts.shift();
      lastName = parts.length ? parts.join(" ") : undefined;
    }

    // Handle message: take everything after `message=` in the URL
    // This allows HTML or & characters safely
    let message;
    const messageIndex = rawUrl.indexOf("message=");
    if (messageIndex >= 0) {
      message = decodeURIComponent(rawUrl.substring(messageIndex + 8));
      if (message === "") message = undefined;
    }

    const options = {
      link: params.get("link") || DONORFUSE_LINK,
      campaign: Number(params.get("campaign") || DEFAULT_CAMPAIGN_ID),
      amount: Number.isFinite(amount) ? amount : undefined,
      fullName: fullName,
      firstName: firstName,
      lastName: lastName,
      email: params.get("email") || undefined,
      phone: params.get("phone") || undefined,
      message: message,
    };

    const hasQueryParams = [...params.keys()].length > 0;
    if (!hasQueryParams) {
      setLoading(false);
      return;
    }

    if (!options.link || !options.campaign) {
      setError("Missing required configuration (link or campaign).");
      setLoading(false);
      return;
    }

    function tryShow() {
      try {
        if (window.DonorFuseClient && typeof window.DonorFuseClient.ShowPopup === "function") {
          for (const k of Object.keys(options)) {
            if (options[k] === undefined || options[k] === null || options[k] === "") delete options[k];
          }
          window.DonorFuseClient.ShowPopup(options, function (result) {
            console.log("DonorFuse callback:", result);
          });
          setLoading(false);
          return true;
        }
        return false;
      } catch (e) {
        console.error("Error calling DonorFuseClient:", e);
        setError("Error initializing donation popup.");
        setLoading(false);
        return false;
      }
    }

    if (tryShow()) return;

    const scriptSrc = "https://donate.donorfuse.com/assets/embed.js";
    const existing = document.querySelector(`script[src="${scriptSrc}"]`);
    if (existing) {
      const poll = setInterval(() => { if (tryShow()) clearInterval(poll); }, 200);
      setTimeout(() => { clearInterval(poll); if (loading) setLoading(false); }, 10000);
      return;
    }

    const s = document.createElement("script");
    s.src = scriptSrc;
    s.async = true;
    s.onload = () => {
      const poll = setInterval(() => { if (tryShow()) clearInterval(poll); }, 150);
      setTimeout(() => { clearInterval(poll); if (loading) setLoading(false); }, 8000);
    };
    s.onerror = () => { setError("Failed to load DonorFuse embed script."); setLoading(false); };
    document.body.appendChild(s);

  }, []);

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial', padding: 24 }}>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>Donation relay — DonorFuse popup</h1>

      {loading && <div><p>Opening donation popup…</p><p style={{ fontSize: 12, color: '#666' }}>If the popup doesn't appear automatically, make sure popups are allowed for this site and that your URL includes query parameters like <code>?amount=18.00&name=John%20Doe&email=john@example.com&phone=1234567890&message=Thanks</code>.</p></div>}

      {error && <div style={{ color: 'crimson', marginTop: 12 }}><strong>Error:</strong> {error}</div>}

      {!loading && !error && <div style={{ marginTop: 12 }}><p>Popup should be open (or no query params were supplied).</p></div>}

      <hr style={{ marginTop: 18 }} />

      <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
        <p>Defaults:</p>
        <ul>
          <li>DonorFuse link: <code>{DONORFUSE_LINK}</code></li>
          <li>Default campaign ID: <code>{DEFAULT_CAMPAIGN_ID}</code></li>
        </ul>
      </div>
    </div>
  );
}
