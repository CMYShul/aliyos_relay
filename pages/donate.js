import { useEffect } from "react";

const DONORFUSE_LINK = "CMYPAliyos";
const DEFAULT_CAMPAIGN_ID = 10596;

export default function DonatePage() {
  useEffect(() => {
    const rawUrl = window.location.href;
    const url = new URL(rawUrl);
    const params = url.searchParams;

    // Amount cleanup
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

    // Only include donation ID as message with prefix
    const donationIdRaw = params.get("message") || undefined;
    const donationId = donationIdRaw ? `Donation ID: ${donationIdRaw.trim()}` : undefined;

    const options = {
      link: params.get("link") || DONORFUSE_LINK,
      campaign: Number(params.get("campaign") || DEFAULT_CAMPAIGN_ID),
      amount: Number.isFinite(amount) ? amount : undefined,
      fullName: fullName,
      firstName: firstName,
      lastName: lastName,
      email: params.get("email") || undefined,
      phone: params.get("phone") || undefined,
      message: donationId,
    };

    function tryShow() {
      try {
        if (window.DonorFuseClient && typeof window.DonorFuseClient.ShowPopup === "function") {
          for (const k of Object.keys(options)) {
            if (options[k] === undefined || options[k] === null || options[k] === "") delete options[k];
          }
          window.DonorFuseClient.ShowPopup(options);
          return true;
        }
        return false;
      } catch (e) {
        console.error("Error calling DonorFuseClient:", e);
        return false;
      }
    }

    if (tryShow()) return;

    const scriptSrc = "https://donate.donorfuse.com/assets/embed.js";
    const existing = document.querySelector(`script[src="${scriptSrc}"]`);
    if (!existing) {
      const s = document.createElement("script");
      s.src = scriptSrc;
      s.async = true;
      s.onload = () => {
        const poll = setInterval(() => { if (tryShow()) clearInterval(poll); }, 150);
        setTimeout(() => { clearInterval(poll); }, 8000);
      };
      s.onerror = () => console.error("Failed to load DonorFuse embed script.");
      document.body.appendChild(s);
    } else {
      const poll = setInterval(() => { if (tryShow()) clearInterval(poll); }, 200);
    }
  }, []);

  // Empty fragment: no visible page content, only popup
  return <></>;
}
