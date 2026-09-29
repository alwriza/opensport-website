import * as tus from "tus-js-client";
import { supabase } from "@/integrations/supabase/client";

/**
 * Resumable upload into the private match-videos bucket.
 *
 * supabase-js has no resumable upload and its `upload()` is a plain fetch with no
 * progress events, so this goes through Supabase's tus endpoint directly. Every
 * upload uses it, whatever the size: one path, not a size-dependent branch.
 */

/** Supabase's resumable endpoint requires exactly 6 MB chunks. */
const CHUNK_SIZE = 6 * 1024 * 1024;
const BUCKET = "match-videos";

export interface UploadHandle {
  /** Resolves with the object path stored in match_analyses.video_path. */
  done: Promise<string>;
  abort: () => void;
}

export function uploadMatchVideo(
  file: File,
  appUserId: string,
  onProgress: (percent: number) => void,
): UploadHandle {
  const objectName = `${appUserId}/${crypto.randomUUID()}-${file.name}`;
  let upload: tus.Upload | null = null;

  const done = new Promise<string>((resolve, reject) => {
    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (!token) {
        reject(new Error("not signed in"));
        return;
      }

      upload = new tus.Upload(file, {
        endpoint: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/upload/resumable`,
        headers: {
          authorization: `Bearer ${token}`,
          "x-upsert": "false",
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        chunkSize: CHUNK_SIZE,
        metadata: {
          bucketName: BUCKET,
          objectName,
          contentType: file.type,
        },
        onProgress: (sent, total) => onProgress(Math.round((sent / total) * 100)),
        onSuccess: () => resolve(objectName),
        onError: reject,
      });

      upload.start();
    }, reject);
  });

  return { done, abort: () => upload?.abort() };
}
