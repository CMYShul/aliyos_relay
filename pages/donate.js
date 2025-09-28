import { useEffect, useState } from 'react';

// Configuration: Update only if you want different defaults
const DONORFUSE_LINK = 'https://donate.donorfuse.com/CMYAliyos';
const DEFAULT_CAMPAIGN_ID = 10531;

export default function DonatePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Parse human-readable query parameters
    const params = new URLSearchParams(window.location.search);

    const amountRaw = params.get('amount');
    const amount = amountRaw ? Number(amountRaw) : undefined;

    const options = {
      link: params.get('link') || DONORFUSE_LINK,
      campaign: Number(params.get('campaign') || DEFAULT_CAMPAIGN_ID),
      amount: Number.isFinite(amount) ? amount : undefined,
      firstName: params.get('firstName') || undefined,
      lastName: params.get('lastName') || undefined,
      email: params.get('email') || undefined,
      phone: params.get('phone') || undefined,
      message: params.get('message') || undefined,
      // keep the UI on the page after donation (per your preference)
      // DonorFuseClient.ShowPopup options may accept other fields — passthrough
    };

    // Simple validation: ensure required fields for their embed are present
    if (!options.link || !options.campaign) {
      setError('Missing required configuration (link or campaign).');
      setLoading(false);
      return;
    }

    // Load the DonorFuse embed script dynamically, then open the popup
    const scriptSrc = 'https://donate.donorfuse.com/assets/embed.js';
    // If the script is already loaded, call directly
    function tryShow() {
      try {
        if (window.DonorFuseClient && typeof window.DonorFuseClient.ShowPopup === 'function') {
          // remove undefined properties (optional)
          for (const k of Object.keys(options)) {
            if (options[k] === undefined || options[k] === null || options[k] === '') delete options[k];
          }

          // Auto-open the popup
          window.DonorFuseClient.ShowPopup(options, function (result) {
            // result might contain success info — keep user on page as requested
            console.log('DonorFuse callback:', result);
          });
          setLoading(false);
          return true;
        }
        return false;
      } catch (e) {
        console.error('Error calling DonorFuseClient:', e);
        setError('Error initializing donation popup.');
        setLoading(false);
        return false;
      }
    }

    if (tryShow()) return; // already loaded

    // Otherwise append script
    const existing = document.querySelector(`script[src="${scriptSrc}"]`);
    if (existing) {
      // If script exists but DonorFuseClient not yet ready, poll
      const poll = setInterval(() => {
        if (tryShow()) clearInterval(poll);
      }, 200);
      // give up after 10s
      setTimeout(() => {
        clearInterval(poll);
        if (loading) setError('Timed out loading DonorFuse script.');
        setLoading(false);
      }, 10000);
      return;
    }

    const s = document.createElement('script');
    s.src = scriptSrc;
    s.async = true;
    s.onload = () => {
      // small delay to allow client to initialize
      const poll = setInterval(() => {
        if (tryShow()) clearInterval(poll);
      }, 150);
      setTimeout(() => { clearInterval(poll); if (loading) setLoading(false); }, 8000);
    };
    s.onerror = () => {
      setError('Failed to load DonorFuse embed script.');
      setLoading(false);
    };
    document.body.appendChild(s);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial', padding: 24 }}>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>Donation relay — DonorFuse popup</h1>

      {loading && (
        <div>
          <p>Opening donation popup…</p>
          <p style={{ fontSize: 12, color: '#666' }}>
            If the popup doesn't appear automatically, make sure popups are allowed for this site and that your URL includes
            query parameters like <code>?amount=180&firstName=Yosef&lastName=Cohen&email=yosef@example.com&phone=1234567890&message=Thanks</code>.
          </p>
        </div>
      )}

      {error && (
        <div style={{ color: 'crimson', marginTop: 12 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {!loading && !error && (
        <div style={{ marginTop: 12 }}>
          <p>Popup should be open. You can close this page when you're done, or navigate elsewhere.</p>
        </div>
      )}

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
