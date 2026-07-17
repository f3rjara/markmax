import { WritableSignal } from '@angular/core';
import { DatabaseService } from '../../core/services/database.service';

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function extractUuids(content: string): Set<string> {
  const uuids = new Set<string>();
  const re = /mm-image:\/\/([a-f0-9-]+)/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    uuids.add(match[1]);
  }
  return uuids;
}

export async function resolveContent(
  content: string,
  contentVersionRef: { current: number },
  dataUrlMap: Map<string, string>,
  db: DatabaseService,
  resolvedContent: WritableSignal<string>,
): Promise<void> {
  const version = ++contentVersionRef.current;

  const uuids = extractUuids(content);

  for (const uuid of uuids) {
    if (!dataUrlMap.has(uuid)) {
      const img = await db.getImageById(uuid);
      if (img) {
        const dataUrl = await blobToDataUrl(img.data);
        dataUrlMap.set(uuid, dataUrl);
      }
    }
  }

  for (const [uuid] of dataUrlMap) {
    if (!uuids.has(uuid)) {
      dataUrlMap.delete(uuid);
    }
  }

  if (version !== contentVersionRef.current) return;

  let resolved = content;
  for (const [uuid, dataUrl] of dataUrlMap) {
    resolved = resolved.replace(
      new RegExp(`\\(mm-image://${uuid}(\\s+"[^"]*")?\\)`, 'g'),
      `(${dataUrl}$1)`,
    );
  }
  resolvedContent.set(resolved);
}
