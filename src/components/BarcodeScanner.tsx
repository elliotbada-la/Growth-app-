import type { BrowserMultiFormatReader } from '@zxing/browser';
import type { Result } from '@zxing/library';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Barcode scanner with three routes to a number, because no single one works everywhere:
 *
 *  1. Live camera — needs `getUserMedia`, which browsers only grant on HTTPS or localhost.
 *  2. Photo — `capture="environment"` opens the camera app on phones whose browser
 *     won't stream video to a page, then the still is decoded. This is the iOS path.
 *  3. Typing the digits — always available, and the reliable fallback for a worn or
 *     curved label the decoder can't read.
 */

/**
 * The decoder is ~120 kB gzipped, so it is fetched on the first scan rather than on
 * every app open. Everything else in the app stays instant.
 */
async function createReader(): Promise<BrowserMultiFormatReader> {
  const [{ BrowserMultiFormatReader: Reader }, { BarcodeFormat, DecodeHintType }] =
    await Promise.all([import('@zxing/browser'), import('@zxing/library')]);

  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.ITF,
  ]);
  hints.set(DecodeHintType.TRY_HARDER, true);
  return new Reader(hints);
}

interface Props {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const doneRef = useRef(false);
  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'live' | 'unavailable'>(
    'idle',
  );
  const [message, setMessage] = useState('');
  const [manual, setManual] = useState('');

  const finish = useCallback(
    (code: string) => {
      if (doneRef.current) return;
      doneRef.current = true;
      controlsRef.current?.stop();
      onDetected(code);
    },
    [onDetected],
  );

  // Stop the camera whenever this closes, however it closes.
  useEffect(() => () => controlsRef.current?.stop(), []);

  const startCamera = useCallback(async () => {
    setMessage('');
    setCameraState('starting');

    if (!window.isSecureContext) {
      setCameraState('unavailable');
      setMessage('Camera needs a secure page (https, or localhost while developing).');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('unavailable');
      setMessage("This browser won't stream the camera to a page. Use Take a photo instead.");
      return;
    }

    try {
      const reader = await createReader();
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current ?? undefined,
        (result: Result | undefined) => {
          if (result) finish(result.getText());
        },
      );
      controlsRef.current = controls;
      setCameraState('live');
    } catch (err) {
      setCameraState('unavailable');
      const name = err instanceof Error ? err.name : '';
      setMessage(
        name === 'NotAllowedError'
          ? 'Camera permission was denied. Allow it in your browser settings, or use the other options.'
          : name === 'NotFoundError'
            ? 'No camera found on this device.'
            : "Couldn't start the camera. Try Take a photo or type the number.",
      );
    }
  }, [finish]);

  const decodePhoto = useCallback(
    async (file: File) => {
      setMessage('Reading photo…');
      const url = URL.createObjectURL(file);
      try {
        const reader = await createReader();
        const result = await reader.decodeFromImageUrl(url);
        finish(result.getText());
      } catch {
        setMessage("Couldn't read a barcode in that photo. Try again closer, or type the number.");
      } finally {
        URL.revokeObjectURL(url);
      }
    },
    [finish],
  );

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 dark:bg-slate-900 sm:rounded-3xl">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold">Scan a barcode</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close scanner"
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 aspect-video w-full overflow-hidden rounded-2xl bg-slate-900">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            className={`h-full w-full object-cover ${cameraState === 'live' ? '' : 'hidden'}`}
            muted
            playsInline
          />
          {cameraState !== 'live' && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-slate-300">
              <span className="text-3xl" aria-hidden="true">
                📷
              </span>
              {cameraState === 'starting' ? 'Starting camera…' : 'Point the camera at the barcode'}
            </div>
          )}
        </div>

        {message && (
          <p className="mt-2 rounded-xl bg-amber-50 p-2.5 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            {message}
          </p>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={startCamera}
            disabled={cameraState === 'starting' || cameraState === 'live'}
            className="btn btn-primary py-3"
          >
            {cameraState === 'live' ? 'Scanning…' : '📷 Use camera'}
          </button>

          <label className="btn btn-ghost cursor-pointer py-3">
            🖼️ Take a photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void decodePhoto(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>

        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const digits = manual.replace(/\D/g, '');
            if (digits.length >= 6) finish(digits);
            else setMessage('Enter at least 6 digits from the barcode.');
          }}
        >
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            inputMode="numeric"
            placeholder="Or type the barcode number"
            aria-label="Barcode number"
            className="field flex-1"
          />
          <button type="submit" className="btn btn-ghost">
            Go
          </button>
        </form>

        <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
          Barcodes are looked up in Open Food Facts, a free open database of packaged foods.
        </p>
      </div>
    </div>
  );
}
