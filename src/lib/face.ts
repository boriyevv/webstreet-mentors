'use client';
// face-api.js (vladmandic) CDN orqali yuklanadi: brauzerda ishlaydi, serverga faqat 128 o'lchamli vektor yuboriladi.
declare global { interface Window { faceapi: any } }
const BASE = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12';
let loading: Promise<any> | null = null;

export function loadFace(): Promise<any> {
  if (loading) return loading;
  loading = (async () => {
    if (!window.faceapi) {
      await new Promise<void>((res, rej) => {
        const s = document.createElement('script');
        s.src = `${BASE}/dist/face-api.js`;
        s.onload = () => res();
        s.onerror = () => rej(new Error("Yuz tanish moduli yuklanmadi. Internetni tekshiring."));
        document.head.appendChild(s);
      });
    }
    const f = window.faceapi;
    await Promise.all([
      f.nets.tinyFaceDetector.loadFromUri(`${BASE}/model`),
      f.nets.faceLandmark68Net.loadFromUri(`${BASE}/model`),
      f.nets.faceRecognitionNet.loadFromUri(`${BASE}/model`),
    ]);
    return f;
  })().catch((e) => {
    loading = null;
    throw e;
  });
  return loading;
}

export const detectorOptions = (f: any) => new f.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 });

type Pt = { x: number; y: number };
export function eyeAspect(eye: Pt[]) {
  const d = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
  return (d(eye[1], eye[5]) + d(eye[2], eye[4])) / (2 * d(eye[0], eye[3]));
}

// Rasmni kichraytirib JPEG data URL qaytaradi
export function resizeImage(file: File | Blob, max = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error("Rasmni o'qib bo'lmadi"));
    img.src = url;
  });
}

export async function descriptorFromDataUrl(dataUrl: string): Promise<number[]> {
  const f = await loadFace();
  const img = new Image();
  img.src = dataUrl;
  await new Promise((r, j) => { img.onload = r; img.onerror = j; });
  const all = await f.detectAllFaces(img, detectorOptions(f)).withFaceLandmarks().withFaceDescriptors();
  if (all.length === 0) throw new Error('Rasmda yuz topilmadi. Yuzi aniq ko\'ringan rasm tanlang.');
  if (all.length > 1) throw new Error("Rasmda bir nechta yuz bor. Faqat o'qituvchining o'zi bo'lgan rasm tanlang.");
  return Array.from(all[0].descriptor as Float32Array);
}
