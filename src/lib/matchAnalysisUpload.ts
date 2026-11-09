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

/**
 * Must match the match-videos bucket's file_size_limit, which cannot exceed the
 * project's global upload limit (Supabase → Storage → Settings, 50 MB today).
 * To allow bigger clips: raise the global limit, the bucket limit in
 * 20260928_create_match_analyses.sql, and this number together.
 */
export const MATCH_MAX_UPLOAD_MB = 50;
const ACCEPTED_TYPES = ["video/mp4", "video/quicktime"];
const ACCEPTED_EXTENSIONS = /\.(mp4|mov)$/i;

export type MatchFileProblem = { kind: "wrongType" } | { kind: "tooLarge"; sizeMb: number };

/** Checks what the bucket would reject anyway, so the user gets a clear message up front. */
export function checkMatchFile(file: File): MatchFileProblem | null {
  const typeOk = ACCEPTED_TYPES.includes(file.type) || (!file.type && ACCEPTED_EXTENSIONS.test(file.name));
  if (!typeOk) return { kind: "wrongType" };
  const sizeMb = file.size / (1024 * 1024);
  if (sizeMb > MATCH_MAX_UPLOAD_MB) return { kind: "tooLarge", sizeMb: Math.ceil(sizeMb) };
  return null;
}

/** Rejection reason of `done` when the user cancelled. */
export class UploadCancelledError extends Error {
  constructor() {
    super("upload cancelled");
    this.name = "UploadCancelledError";
  }
}

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
  let cancelled = false;
  let cancel: () => void = () => {};

  const done = new Promise<string>((resolve, reject) => {
    // tus' abort() fires neither onSuccess nor onError, so cancelling settles the promise here.
    cancel = () => {
      cancelled = true;
      void upload?.abort(true);
      reject(new UploadCancelledError());
    };
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
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
          contentType: file.type || (file.name.toLowerCase().endsWith(".mov") ? "video/quicktime" : "video/mp4"),
        },
        onProgress: (sent, total) => onProgress(Math.round((sent / total) * 100)),
        onSuccess: () => resolve(objectName),
        onError: reject,
      });

      upload.start();
    }, reject);
  });

  return { done, abort: () => cancel() };
}
