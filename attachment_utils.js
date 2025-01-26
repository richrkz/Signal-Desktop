var ATTACHMENT_EXPIRY_DAYS = 45;

function isOlderThan45Days(attachment) {
  if (!attachment.uploadTimestamp) {
    return false;
  }
  var now = Date.now();
  var ageInDays = (now - attachment.uploadTimestamp) / (24 * 60 * 60 * 1000);
  return ageInDays > ATTACHMENT_EXPIRY_DAYS;
}

function isDownloadable(attachment) {
  // Simplified logic for demonstration
  return !attachment.error;
}

function isAttachmentLocallySaved(attachment) {
  return Boolean(attachment.path);
}

function isPermanentlyUndownloadable(attachment) {
  // Stickers are always downloadable
  if (attachment.isSticker) {
    return false;
  }
  return Boolean(
    (!isDownloadable(attachment) && attachment.error) ||
    (isOlderThan45Days(attachment) && !isAttachmentLocallySaved(attachment))
  );
}
