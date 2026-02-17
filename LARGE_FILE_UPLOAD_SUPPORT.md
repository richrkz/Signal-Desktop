# Large File Upload Support (>100MB)

## Overview
This document describes the changes made to support uploading files larger than 100MB in Signal Desktop.

## Changes Made

### 1. Increased Default Attachment Size Limit
**File:** `ts/types/AttachmentSize.ts`

- **Previous limit:** 100MB (104,857,600 bytes)
- **New limit:** 500MB (524,288,000 bytes)
- The default maximum attachment size has been increased from 100MB to 500MB
- This limit can be overridden via the `global.attachments.maxBytes` remote config flag

### 2. Configuration
The attachment size limit is configurable through Signal's remote configuration system:

- **Remote Config Key:** `global.attachments.maxBytes`
- **Default Value:** 524,288,000 bytes (500MB)
- **Incoming Limit:** Automatically set to 125% of outgoing limit to account for encryption overhead

### 3. Technical Implementation

#### Streaming Architecture
The implementation uses Node.js streams throughout the upload pipeline, which means:
- Files are processed in chunks, not loaded entirely into memory
- Memory usage remains constant regardless of file size
- Supports files of virtually any size (limited only by disk space and network)

#### Upload Pipeline
1. **File Selection** → User selects file via `CompositionUpload` component
2. **Validation** → Size checked in `preProcessAttachment()` and `isAttachmentSizeOkay()`
3. **Processing** → File processed via `processAttachment()` with streaming
4. **Encryption** → Encrypted using `encryptAttachmentV2ToDisk()` with AES-256-CBC
5. **Upload** → Uploaded via TUS protocol (resumable uploads) using `tusUpload()`

#### Key Components
- **TUS Protocol:** Supports resumable uploads, automatically retries on failure
- **Encryption:** Uses streaming encryption with incremental MAC for integrity
- **CDN Support:** CDN 3 supports TUS protocol for efficient large file uploads

### 4. Error Handling
- If a file exceeds the limit, users see: "Sorry, the selected file exceeds message size restrictions. {limit} {units}"
- The error message dynamically shows the current limit (e.g., "500 MB")
- Upload failures are automatically retried with exponential backoff

### 5. Performance Considerations

#### Memory Usage
- Constant memory usage regardless of file size
- Files are streamed in chunks (typically 64KB - 256KB)
- No full file buffering in memory

#### Network Efficiency
- Resumable uploads via TUS protocol
- Automatic retry on network failures
- Progress tracking for user feedback

#### Encryption Overhead
- Padding: Files are padded to next power of 2 for privacy
- Encryption: AES-256-CBC adds ~16 bytes per block
- MAC: 32 bytes for message authentication
- Total overhead: Typically 5-10% of original file size

### 6. Compatibility

#### Server Requirements
- Server must support `global.attachments.maxBytes` config
- CDN must support TUS protocol (CDN 3)
- Sufficient storage quota for larger attachments

#### Client Requirements
- Sufficient disk space for temporary encrypted files
- Stable network connection (or resumable upload support)

## Testing Recommendations

### Unit Tests
- Test file size validation with files at boundary (499MB, 500MB, 501MB)
- Test encryption/decryption of large files
- Test TUS upload resumption after interruption

### Integration Tests
- Upload files of various sizes (100MB, 250MB, 500MB)
- Test upload interruption and resumption
- Test with slow/unstable network connections
- Verify memory usage remains constant

### Performance Tests
- Measure upload time for various file sizes
- Monitor memory usage during upload
- Test concurrent uploads

## Configuration Examples

### Setting Custom Limit via Remote Config
To set a different limit (e.g., 1GB):
```json
{
  "global.attachments.maxBytes": "1073741824"
}
```

### Checking Current Limit
The current limit is determined by:
1. Remote config value (`global.attachments.maxBytes`)
2. If not set or invalid, falls back to `DEFAULT_MAX` (500MB)

## Migration Notes

### Backward Compatibility
- Existing attachments under 100MB continue to work
- No database migrations required
- No changes to attachment storage format

### Forward Compatibility
- Clients with old limits can still receive larger attachments
- Incoming limit is automatically 125% of outgoing limit
- Graceful degradation if server doesn't support larger files

## Security Considerations

### Encryption
- All attachments encrypted with AES-256-CBC
- Unique IV per attachment
- HMAC-SHA256 for integrity verification
- Incremental MAC for streaming verification

### Privacy
- File size padding to next power of 2
- Prevents file size fingerprinting
- Metadata stripped during processing

## Known Limitations

1. **Server Limits:** Server may have its own limits that override client settings
2. **Storage Quota:** Users need sufficient storage quota
3. **Network Timeout:** Very large files may timeout on slow connections (mitigated by TUS resumable uploads)
4. **Mobile Clients:** Mobile clients may have different limits due to platform constraints

## Future Improvements

1. **Chunked Upload Progress:** More granular progress reporting
2. **Background Uploads:** Continue uploads when app is in background
3. **Compression:** Optional compression for certain file types
4. **Deduplication:** Avoid re-uploading identical files

## References

- TUS Protocol: https://tus.io/protocols/resumable-upload
- Signal Protocol: https://signal.org/docs/
- Remote Config: `ts/RemoteConfig.ts`
- Attachment Types: `ts/types/Attachment.ts`
- Upload Implementation: `ts/util/uploadAttachment.ts`
