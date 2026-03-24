'use client';

import { Image } from 'antd';

interface ImageGalleryProps {
  mainImage: string;
  productId: string | number;
  category: 'hotel' | 'tour' | 'flight';
  altText?: string;
}

// Deterministic image pool selection based on product ID
function getGalleryImages(mainImage: string, productId: string | number, category: 'hotel' | 'tour' | 'flight'): string[] {
  const id = Number(productId) || 1;

  const pools: Record<string, { prefix: string; count: number }> = {
    hotel: { prefix: '/images/imghotel', count: 40 },
    tour: { prefix: '/images/imgtour', count: 40 },
    flight: { prefix: '/images/imgflight', count: 5 },
  };

  const { prefix, count } = pools[category];

  // Pick 7 unique indices deterministically from product ID
  const targetCount = Math.min(count, 7);
  const indices: number[] = [];
  let seed = id;
  while (indices.length < targetCount) {
    seed = (seed * 1103515245 + 12345) % 1000000;
    const idx = (Math.abs(seed) % count) + 1;
    if (!indices.includes(idx)) indices.push(idx);
  }

  const extras = indices.map(i => `${prefix}${i}.jpg`);
  // Ensure main image is first, remove duplicates
  const allImages = [mainImage, ...extras.filter(img => img !== mainImage)];
  return allImages.slice(0, 8);
}

export default function ImageGallery({ mainImage, productId, category, altText = '' }: ImageGalleryProps) {
  const images = getGalleryImages(mainImage, productId, category);

  return (
    <div>
      {/* Main large image */}
      <Image.PreviewGroup>
        {/* Hero image */}
        <div style={{ marginBottom: 8 }}>
          <Image
            src={images[0]}
            alt={altText}
            style={{
              width: '100%',
              height: 340,
              objectFit: 'cover',
              borderRadius: 12,
              cursor: 'pointer',
            }}
            preview={{ cover: <span style={{ fontSize: 14 }}>🔍 Xem ảnh</span> }}
          />
        </div>

        {/* Thumbnail grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
        }}>
          {images.slice(1).map((img, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              <Image
                src={img}
                alt={`${altText} ${idx + 2}`}
                style={{
                  width: '100%',
                  height: 90,
                  objectFit: 'cover',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
                preview={{
                  cover: idx === images.length - 2 ? (
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Xem tất cả</span>
                  ) : undefined,
                }}
              />
            </div>
          ))}
        </div>
      </Image.PreviewGroup>

      <div style={{ fontSize: 12, color: '#888', marginTop: 6, textAlign: 'right' }}>
        📷 {images.length} ảnh • Click để xem toàn màn hình
      </div>
    </div>
  );
}
