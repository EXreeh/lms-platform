# CognitiaX AI LMS — Upload System

This document describes how file uploads work today and how to prepare for production deployment.

## Current mode: local disk (`STORAGE_PROVIDER=local`)

Uploaded files are saved under:

```
backend/uploads/thumbnails/
backend/uploads/videos/
backend/uploads/resources/
```

They are served by Express at `/uploads/...` and proxied through Next.js in development.

### Local upload limits

| Type | Env variable | Default |
|------|--------------|---------|
| Video | `MAX_VIDEO_UPLOAD_MB` | 500 MB |
| Resource | `MAX_RESOURCE_UPLOAD_MB` | 50 MB |
| Thumbnail | (fixed) | 5 MB |

Frontend mirrors video/resource limits via:

- `NEXT_PUBLIC_MAX_VIDEO_UPLOAD_MB`
- `NEXT_PUBLIC_MAX_RESOURCE_UPLOAD_MB`

**Important:** Local disk uploads are for **development and small files only**.

- Railway/Render local filesystem is **not permanent** — files are lost on redeploy unless a persistent volume is mounted.
- Videos around **2 GB or larger** will fail in local mode. Users see a clear message that cloud storage is required for large videos.
- The frontend blocks oversized files **before** sending the upload request.

## Lesson videos (streaming)

Lesson videos use a protected HTML5 player:

- `controlsList="nodownload"` — hides browser download control where supported
- Picture-in-picture disabled
- Right-click context menu blocked on the video element
- Note shown: *"Video content is protected and available for streaming only."*

This is a UX/deterrent layer — not DRM. Direct URLs can still be accessed by determined users until cloud signed URLs are implemented.

## Resources (open vs download)

| Format | Behavior |
|--------|----------|
| PDF | Opens in browser (inline) |
| Images (JPG, PNG, WebP, GIF) | Opens in browser |
| Text (`.txt`) | Opens in browser |
| DOC, DOCX, PPT, PPTX, ZIP | Download only |

The backend sets `Content-Disposition: inline` for previewable types and correct `Content-Type` headers.

## API endpoints

| Method | Path | Role |
|--------|------|------|
| POST | `/api/uploads/thumbnail` | Teacher, Admin |
| POST | `/api/uploads/video` | Teacher, Admin |
| POST | `/api/uploads/resource` | Teacher, Admin |
| DELETE | `/api/uploads/:category/:filename` | Admin |

### Error codes

| Code | Meaning |
|------|---------|
| `VIDEO_FILE_TOO_LARGE` | Video exceeds local limit |
| `RESOURCE_FILE_TOO_LARGE` | Resource exceeds local limit |
| `INVALID_FILE_TYPE` | Blocked or unsupported MIME/extension |
| `STORAGE_UNAVAILABLE` | Upload folder missing or inaccessible |

## Future: Cloudflare R2 / AWS S3

Architecture stubs live in:

- `backend/src/services/storage/cloud-upload.types.ts` — presigned URL + multipart interfaces
- `backend/src/services/storage/cloud-upload.stub.ts` — placeholder until credentials are configured
- `backend/src/services/storage/s3-storage.ts` / `r2-storage.ts` — provider stubs

### Planned production flow (TODO)

1. Client requests presigned upload URL or initiates multipart upload via API
2. Browser uploads directly to R2/S3 (supports large files, multipart)
3. Backend stores metadata (`storageKey`, `mimeType`, `size`) in the database
4. Public or signed URLs used for streaming/download

Set `STORAGE_PROVIDER=r2` or `STORAGE_PROVIDER=s3` when implementing.

## Deployment checklist

- [ ] Mount persistent disk for `backend/uploads` **or** switch to R2/S3
- [ ] Set `MAX_VIDEO_UPLOAD_MB` / `MAX_RESOURCE_UPLOAD_MB` on backend
- [ ] Set matching `NEXT_PUBLIC_*` values on frontend
- [ ] Verify PDF opens inline (not forced download)
- [ ] Verify large video blocked with friendly message before upload starts
- [ ] Verify lesson video plays without download button in player UI

See also: [DEPLOYMENT.md](./DEPLOYMENT.md)
