import { useEffect, useState } from "react";

const DONORFUSE_LINK = "CMYAliyos"; // update if needed
const DEFAULT_CAMPAIGN_ID = 10531;

export default function DonatePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Read supported params (human-readable)
    const amountRaw = params.get("amount");
   let amount;
if (amountRaw) {
  const cleanAmount = amountRaw.replace(/[^0-9.]/g, ""); // removes $ and commas
  amount = Number(cleanAmount);
}

    // Use `name` as the single full-name query param per your preference
    const nameParam = params.get("name") || "";
    const fullName = nameParam.trim() || undefined;

    // For compatibility: split into firstName + lastName (if possible)
    let firstName;
    let lastName;
    if (fullName) {
      const parts = fullName.split(/\s+/);
      firstName = parts.shift(); // first token
      lastName = parts.length ? parts.join(" ") : undefined;
    }

    const options = {
      link: params.get("link") || DONORFUSE_LINK,
      campaign: Number(params.get("campaign") || DEFAULT_CAMPAIGN_ID),
      amount: Number.isFinite(amount) ? amount : undefined,
      // include fullName explicitly and also firstName/lastName for compatibility
      fullName: fullName,
      firstName: firstName,
      lastName: lastName,
      email: params.get("email") || undefined,
      phone: params.get("phone") || undefined,
      message: params.get("message") || undefined,
    };

    // If no query params provided, don't auto-open (show instructions)
    const hasQueryParams = [...params.keys()].length > 0;

    if (!hasQueryParams) {
      setLoading(false);
      return;
    }

    // Simple required validation
    if (!options.link || !options.campaign) {
      setError("Missing required configuration (link or campaign).");
      setLoading(false);
      return;
    }

    // Helper: attempt to show popup (returns true if succeeded)
    function tryShow() {
      try {
        if (
          window.DonorFuseClient &&
          typeof window.DonorFuseClient.ShowPopup === "function"
        ) {
          // remove empty/undefined entries
          for (const k of Object.keys(options)) {
            if (
              options[k] === undefined ||
              options[k] === null ||
              options[k] === ""
            ) {
              delete options[k];
            }
          }

          // Auto-open the popup
          window.DonorFuseClient.ShowPopup(options, function (result) {
            console.log("DonorFuse callback:", result);
            // Per your preference: stay on page (no redirect)
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

    // If script already loaded, call immediately
    if (tryShow()) return;

    // Otherwise insert their embed script and poll for readiness
    const scriptSrc = "https://donate.donorfuse.com/assets/embed.js";
    const existing = document.querySelector(`script[src="${scriptSrc}"]`);
    if (existing) {
      const poll = setInterval(() => {
        if (tryShow()) clearInterval(poll);
      }, 200);
      // timeout fallback
      setTimeout(() => {
        clearInterval(poll);
        if (loading) setError("Timed out loading DonorFuse script.");
        setLoading(false);
      }, 10000);
      return;
    }

    const s = document.createElement("script");
    s.src = scriptSrc;
    s.async = true;
    s.onload = () => {
      const poll = setInterval(() => {
        if (tryShow()) clearInterval(poll);
      }, 150);
      // safety stop the poll after a while
      setTimeout(() => {
        clearInterval(poll);
        if (loading) setLoading(false);
      }, 8000);
    };
    s.onerror = () => {
      setError("Failed to load DonorFuse embed script.");
      setLoading(false);
    };
    document.body.appendChild(s);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>
        Donation relay — DonorFuse popup
      </h1>

      {loading && (
        <div>
          <p>Opening donation popup…</p>
          <p style={{ fontSize: 12, color: "#666" }}>
            If the popup doesn't appear automatically, make sure popups are
            allowed for this site and that your URL includes query parameters
            like:
            <br />
            <code>
              ?amount=180&name=John%20Doe&email=john@example.com&phone=1234567890&message=Thanks
            </code>
          </p>
        </div>
      )}

      {error && (
        <div style={{ color: "crimson", marginTop: 12 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {!loading && !error && (
        <div style={{ marginTop: 12 }}>
          <p>Popup should be open (or no query params were supplied).</p>
        </div>
      )}

      <hr style={{ marginTop: 18 }} />

      <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
        <p>Defaults:</p>
        <ul>
          <li>
            DonorFuse link: <code>{DONORFUSE_LINK}</code>
          </li>
          <li>
            Default campaign ID: <code>{DEFAULT_CAMPAIGN_ID}</code>
          </li>
        </ul>
      </div>
    </div>
  );
}
