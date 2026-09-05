/**
 * Koleksi Preset Logo KKMTS Resmi & Utility Pengolahan Gambar Logo
 */

export interface LogoPreset {
  id: string;
  name: string;
  description: string;
  category: 'Kemenag' | 'KKMTS' | 'Madrasah';
  svgDataUri: string;
}

// Preset 1: Logo Ikhlas Beramal Kemenag RI
const KEMENAG_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#047857" />
      <stop offset="100%" stop-color="#064e3b" />
    </radialGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>
  </defs>
  <!-- Outer Pentagon / Star Shield -->
  <circle cx="100" cy="100" r="94" fill="url(#bgGrad)" stroke="url(#goldGrad)" stroke-width="6" />
  <circle cx="100" cy="100" r="84" fill="none" stroke="#fef08a" stroke-width="2" stroke-dasharray="4 3" opacity="0.8" />
  
  <!-- Star of Al-Quds (8 pointed star) -->
  <polygon points="100,28 116,60 152,60 124,84 135,118 100,98 65,118 76,84 48,60 84,60" fill="url(#goldGrad)" opacity="0.3" />

  <!-- Central Shield -->
  <path d="M100 45 C130 45 145 60 145 95 C145 130 100 155 100 155 C100 155 55 130 55 95 C55 60 70 45 100 45 Z" fill="#065f46" stroke="url(#goldGrad)" stroke-width="3" />

  <!-- Open Book (Al-Qur'an / Kitab) -->
  <path d="M100 115 C85 100 65 105 60 118 C70 120 88 118 100 126 C112 118 130 120 140 118 C135 105 115 100 100 115 Z" fill="#ffffff" stroke="#ca8a04" stroke-width="2" />
  <path d="M100 115 L100 126" stroke="#ca8a04" stroke-width="2" />
  
  <!-- Pen / Torch in center -->
  <polygon points="97,60 103,60 101,105 99,105" fill="url(#goldGrad)" stroke="#78350f" stroke-width="1" />
  <circle cx="100" cy="56" r="5" fill="#fef08a" />

  <!-- Ribbon -->
  <path d="M60 146 Q100 162 140 146 L136 158 Q100 172 64 158 Z" fill="url(#goldGrad)" stroke="#78350f" stroke-width="1.5" />
  <text x="100" y="157" font-size="8.5" font-weight="bold" font-family="Arial, sans-serif" fill="#78350f" text-anchor="middle" letter-spacing="1">IKHLAS BERAMAL</text>

  <!-- Circular Title -->
  <text x="100" y="184" font-size="10" font-weight="900" font-family="Arial, sans-serif" fill="#fef08a" text-anchor="middle" letter-spacing="2">KEMENAG RI</text>
</svg>
`)}`;

// Preset 2: Logo Resmi KKMTS Hijau-Emas Modern
const KKMTS_EMBLEM_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="kkmtsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="100%" stop-color="#022c22" />
    </linearGradient>
    <linearGradient id="goldKkmts" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="70%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#a16207" />
    </linearGradient>
  </defs>

  <!-- Outer Ring with Cog/Leaves styling -->
  <circle cx="100" cy="100" r="95" fill="url(#kkmtsGrad)" stroke="url(#goldKkmts)" stroke-width="5" />
  <circle cx="100" cy="100" r="86" fill="none" stroke="url(#goldKkmts)" stroke-width="1.5" stroke-dasharray="6 3" />

  <!-- Golden 8-pointed star base -->
  <rect x="52" y="52" width="96" height="96" rx="14" fill="none" stroke="url(#goldKkmts)" stroke-width="2.5" transform="rotate(45 100 100)" />
  <rect x="52" y="52" width="96" height="96" rx="14" fill="none" stroke="url(#goldKkmts)" stroke-width="2.5" />

  <!-- Central Crest Circle -->
  <circle cx="100" cy="100" r="54" fill="#047857" stroke="url(#goldKkmts)" stroke-width="3" />

  <!-- Open Book (Ilmu & Pendidikan) -->
  <path d="M100 96 C84 84 68 88 64 100 C74 102 88 98 100 107 C112 98 126 102 136 100 C132 88 116 84 100 96 Z" fill="#ffffff" stroke="url(#goldKkmts)" stroke-width="2" />
  
  <!-- Minaret / Pen symbol -->
  <path d="M97 68 L103 68 L103 94 L97 94 Z" fill="url(#goldKkmts)" />
  <polygon points="100,58 95,68 105,68" fill="url(#goldKkmts)" />
  <circle cx="100" cy="55" r="3" fill="#fef08a" />

  <!-- KKMTS Monogram Text -->
  <text x="100" y="128" font-size="16" font-weight="900" font-family="'Arial Black', Impact, sans-serif" fill="#fef08a" text-anchor="middle" letter-spacing="2">KKMTS</text>
  <text x="100" y="142" font-size="8.5" font-weight="bold" font-family="Arial, sans-serif" fill="#ffffff" text-anchor="middle" letter-spacing="1">KOTA BOGOR</text>
</svg>
`)}`;

// Preset 3: Logo Madrasah Tsanawiyah Perisai Pendidikan
const MTS_SHIELD_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="40%" stop-color="#0f766e" />
      <stop offset="100%" stop-color="#064e3b" />
    </linearGradient>
    <linearGradient id="goldAcc" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>
  </defs>

  <!-- Crest Shield -->
  <path d="M100 15 C155 15 180 35 180 85 C180 140 100 185 100 185 C100 185 20 140 20 85 C20 35 45 15 100 15 Z" fill="url(#shieldGrad)" stroke="url(#goldAcc)" stroke-width="5" />
  
  <path d="M100 24 C147 24 168 41 168 85 C168 132 100 172 100 172 C100 172 32 132 32 85 C32 41 53 24 100 24 Z" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6" />

  <!-- Islamic Crescent & Star -->
  <path d="M100 42 A 16 16 0 1 0 114 62 A 13 13 0 1 1 100 42" fill="url(#goldAcc)" />
  <polygon points="116,52 119,57 125,57 120,61 122,67 116,63 111,67 113,61 108,57 114,57" fill="url(#goldAcc)" />

  <!-- Education Torch -->
  <path d="M96 95 L104 95 L102 125 L98 125 Z" fill="#ffffff" />
  <polygon points="94,95 106,95 108,82 92,82" fill="url(#goldAcc)" />
  <path d="M100 68 C104 74 108 78 104 84 C100 82 96 84 96 80 C96 74 98 72 100 68 Z" fill="#f97316" />

  <!-- Open Book -->
  <path d="M100 118 C86 108 68 112 60 124 C72 125 86 122 100 130 C114 122 128 125 140 124 C132 112 114 108 100 118 Z" fill="#ffffff" stroke="url(#goldAcc)" stroke-width="2.5" />

  <text x="100" y="152" font-size="14" font-weight="900" font-family="'Arial Black', sans-serif" fill="#fef08a" text-anchor="middle" letter-spacing="2">MADRASAH</text>
  <text x="100" y="165" font-size="9" font-weight="bold" font-family="Arial, sans-serif" fill="#ffffff" text-anchor="middle" letter-spacing="1">TSANAWIYAH</text>
</svg>
`)}`;

export const DEFAULT_PRESET_LOGOS: LogoPreset[] = [
  {
    id: 'kemenag-ri',
    name: 'Logo Kemenag RI (Ikhlas Beramal)',
    description: 'Logo resmi Kementerian Agama RI berhias perisai bintang emas dan pita semboyan Ikhlas Beramal.',
    category: 'Kemenag',
    svgDataUri: KEMENAG_LOGO_SVG,
  },
  {
    id: 'kkmts-emerald-gold',
    name: 'Logo KKMTS Hijau Emas Geometris',
    description: 'Emblem modern KKMTS dengan ornamen bintang 8-sudut Islam dan kitab ilmu pengetahuan.',
    category: 'KKMTS',
    svgDataUri: KKMTS_EMBLEM_SVG,
  },
  {
    id: 'mts-shield-crest',
    name: 'Logo Perisai Madrasah Tsanawiyah',
    description: 'Perisai pendidikan Islami berlatar gradien biru-hijau toska dengan obor pendidikan dan bulan bintang.',
    category: 'Madrasah',
    svgDataUri: MTS_SHIELD_SVG,
  },
];

/**
 * Resize and compress user-uploaded image to Data URL
 * Ensures the image fits cleanly in LocalStorage without performance degradation.
 */
export async function resizeImageToDataUrl(
  file: File,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.88
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's an SVG, read directly as text Data URL for infinite sharpness
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Draw image resized
        ctx.drawImage(img, 0, 0, width, height);

        // Output as PNG if transparent, or JPEG
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Gagal memuat berkas gambar.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
