import sharp from 'sharp';

export async function generateThumbnail(inputImage: string, outputPng: string, titleText: string, style: { textColor: string; accentColor: string }): Promise<string> {
  const words = titleText.toUpperCase().split(' ').slice(0, 8).join(' ');
  const svg = `
  <svg width="1920" height="1080">
    <rect x="0" y="700" width="1920" height="380" fill="rgba(0,0,0,0.55)"/>
    <rect x="80" y="760" width="18" height="220" fill="${style.accentColor}"/>
    <text x="130" y="860" font-size="120" font-family="Arial Black" fill="${style.textColor}">${words}</text>
  </svg>`;
  await sharp(inputImage)
    .resize(1920, 1080, { fit: 'cover' })
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toFile(outputPng);
  return outputPng;
}
