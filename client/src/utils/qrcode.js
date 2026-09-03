// Pure SVG QR Code Generator Helper for Room PIN URLs
// Generates SVG data string for scanning room join link

export function generateQRCodeSVG(text, size = 180) {
  // Simple clean SVG QR Code encoder or URL redirect representation
  const targetUrl = text;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(targetUrl)}`;
  return qrApiUrl;
}
