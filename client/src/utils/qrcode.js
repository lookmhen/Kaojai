import QRCode from 'qrcode';

/**
 * 100% Local Offline SVG QR Code Generator
 * Generates SVG Data URI locally without calling any external API.
 * Works completely offline in LAN or standalone environments.
 */
export function generateQRCodeSVG(text, size = 180) {
  if (!text) return '';
  let svgMarkup = '';

  try {
    QRCode.toString(text, {
      type: 'svg',
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#1E293B',
        light: '#FFFFFF'
      }
    }, (err, svg) => {
      if (!err && svg) {
        svgMarkup = svg;
      }
    });
  } catch (err) {
    console.error('[QRCode Local Gen Error]:', err);
    return '';
  }

  if (!svgMarkup) return '';
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
}

export function generateRawQRCodeSVG(text, size = 180) {
  if (!text) return '';
  let svgMarkup = '';

  try {
    QRCode.toString(text, {
      type: 'svg',
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#1E293B',
        light: '#FFFFFF'
      }
    }, (err, svg) => {
      if (!err && svg) {
        svgMarkup = svg;
      }
    });
  } catch (err) {
    console.error('[QRCode Local Gen Error]:', err);
    return '';
  }

  return svgMarkup;
}
