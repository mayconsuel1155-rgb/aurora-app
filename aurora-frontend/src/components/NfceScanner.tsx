import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, LoaderCircle } from 'lucide-react';
import type { IScannerControls } from '@zxing/browser';

interface NfceScannerProps {
  onDetected: (value: string) => void;
}

interface ScanRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

function buildScanRegions(width: number, height: number): ScanRegion[] {
  const regions: ScanRegion[] = [{ x: 0, y: 0, width, height }];
  const cropWidth = Math.round(width * 0.62);
  const cropHeight = Math.round(height * 0.62);
  const xPositions = [0, Math.round((width - cropWidth) / 2), width - cropWidth];
  const yPositions = [0, Math.round((height - cropHeight) / 2), height - cropHeight];

  for (const y of yPositions) {
    for (const x of xPositions) {
      regions.push({ x, y, width: cropWidth, height: cropHeight });
    }
  }
  return regions;
}

function drawScanCandidate(image: HTMLImageElement, region: ScanRegion, highContrast: boolean) {
  const canvas = document.createElement('canvas');
  const scale = Math.min(3, 1600 / Math.max(region.width, region.height));
  canvas.width = Math.max(1, Math.round(region.width * scale));
  canvas.height = Math.max(1, Math.round(region.height * scale));
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas indisponível');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  if (highContrast) context.filter = 'grayscale(1) contrast(1.65)';
  context.drawImage(
    image,
    region.x,
    region.y,
    region.width,
    region.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvas;
}

async function loadImage(url: string) {
  const image = new Image();
  image.src = url;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Imagem inválida'));
  });
  return image;
}

export default function NfceScanner({ onDetected }: NfceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const detectedRef = useRef(false);
  const onDetectedRef = useRef(onDetected);
  const [cameraError, setCameraError] = useState('');
  const [isStarting, setIsStarting] = useState(true);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    let isActive = true;

    const start = async () => {
      try {
        const { BrowserQRCodeReader } = await import('@zxing/browser');
        if (!videoRef.current || !isActive) return;
        const reader = new BrowserQRCodeReader();
        controlsRef.current = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' } } },
          videoRef.current,
          result => {
            if (!result || detectedRef.current) return;
            detectedRef.current = true;
            controlsRef.current?.stop();
            onDetectedRef.current(result.getText());
          },
        );
      } catch {
        if (isActive) setCameraError('Não foi possível acessar a câmera. Use uma foto ou cole o link da nota.');
      } finally {
        if (isActive) setIsStarting(false);
      }
    };

    void start();
    return () => {
      isActive = false;
      controlsRef.current?.stop();
    };
  }, []);

  const handleImage = async (file?: File) => {
    if (!file) return;
    setCameraError('');
    setIsProcessingImage(true);
    try {
      const { BrowserQRCodeReader } = await import('@zxing/browser');
      const imageUrl = URL.createObjectURL(file);
      try {
        const image = await loadImage(imageUrl);
        const reader = new BrowserQRCodeReader();
        const regions = buildScanRegions(image.naturalWidth, image.naturalHeight);

        for (const highContrast of [false, true]) {
          for (const region of regions) {
            try {
              const result = reader.decodeFromCanvas(drawScanCandidate(image, region, highContrast));
              onDetected(result.getText());
              return;
            } catch {
              await new Promise<void>(resolve => window.requestAnimationFrame(() => resolve()));
            }
          }
        }
        throw new Error('QR Code não encontrado');
      } finally {
        URL.revokeObjectURL(imageUrl);
      }
    } catch {
      setCameraError('Não encontrei um QR Code legível. Recorte a foto deixando somente o QR Code, com uma pequena margem branca, e tente novamente.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#101713]">
        <video ref={videoRef} muted playsInline className="h-full w-full object-cover" aria-label="Visualização da câmera" />
        <div className="pointer-events-none absolute inset-[15%] rounded-2xl border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,.35)]" />
        {isStarting && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <LoaderCircle className="animate-spin" aria-hidden="true" />
            <span className="ml-2">Abrindo câmera…</span>
          </div>
        )}
      </div>
      <p className="text-center text-sm text-[var(--color-aurora-text-muted)]">
        Posicione o QR Code da nota dentro do quadro.
      </p>
      <label className={`btn-outline flex items-center justify-center gap-2 px-4 py-3 ${isProcessingImage ? 'cursor-wait opacity-60' : 'cursor-pointer'}`}>
        {isProcessingImage
          ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
          : <ImagePlus size={18} aria-hidden="true" />}
        {isProcessingImage ? 'Analisando foto…' : 'Ler uma foto da nota'}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          disabled={isProcessingImage}
          className="sr-only"
          onChange={event => {
            void handleImage(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
      </label>
      {cameraError && <p className="status-danger rounded-xl p-3 text-sm" role="alert">{cameraError}</p>}
      <p className="flex items-center justify-center gap-2 text-xs text-[var(--color-aurora-text-muted)]">
        <Camera size={14} aria-hidden="true" /> A câmera é usada apenas durante a leitura.
      </p>
    </div>
  );
}
