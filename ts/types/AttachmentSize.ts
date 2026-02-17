// Copyright 2023 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import * as log from '../logging/log';
import { parseIntOrThrow } from '../util/parseIntOrThrow';
import type * as RemoteConfig from '../RemoteConfig';

export const KIBIBYTE = 1024;
const MEBIBYTE = 1024 * 1024;
// Increased from 100MB to 500MB to support larger file uploads
// This can be overridden via the 'global.attachments.maxBytes' remote config flag
const DEFAULT_MAX = 500 * MEBIBYTE;

/**
 * Gets the maximum outgoing attachment size in kilobytes.
 * This value can be configured via the 'global.attachments.maxBytes' remote config flag.
 * If the remote config is not set or invalid, defaults to 500MB.
 * 
 * @param getValue - Function to retrieve remote config values
 * @returns Maximum attachment size in kilobytes
 */
export const getMaximumOutgoingAttachmentSizeInKb = (
  getValue: typeof RemoteConfig.getValue
): number => {
  try {
    return (
      parseIntOrThrow(
        getValue('global.attachments.maxBytes'),
        'getMaximumOutgoingAttachmentSizeInKb'
      ) / KIBIBYTE
    );
  } catch (error) {
    log.warn(
      'Failed to parse integer out of global.attachments.maxBytes feature flag'
    );
    return DEFAULT_MAX / KIBIBYTE;
  }
};

export const getMaximumIncomingAttachmentSizeInKb = (
  getValue: typeof RemoteConfig.getValue
): number => {
  try {
    return (
      parseIntOrThrow(
        getValue('global.attachments.maxReceiveBytes'),
        'getMaximumIncomingAttachmentSizeInKb'
      ) / KIBIBYTE
    );
  } catch (_error) {
    // TODO: DESKTOP-5913. We're not gonna log until the new flag is fully deployed
    // Allow receiving files 25% larger than what we can send to account for encryption overhead
    return getMaximumOutgoingAttachmentSizeInKb(getValue) * 1.25;
  }
};

export const getMaximumIncomingTextAttachmentSizeInKb = (
  getValue: typeof RemoteConfig.getValue
): number => {
  try {
    return (
      parseIntOrThrow(
        getValue('global.textAttachmentLimitBytes'),
        'getMaximumIncomingTextAttachmentSizeInKb'
      ) / KIBIBYTE
    );
  } catch (_error) {
    // TODO: DESKTOP-6314. We're not gonna log until the new flag is fully deployed
    return KIBIBYTE * 5;
  }
};

export function getRenderDetailsForLimit(limitKb: number): {
  limit: number;
  units: string;
} {
  const units = ['kB', 'MB', 'GB'];
  let u = -1;
  let limit = limitKb * KIBIBYTE;
  do {
    limit /= KIBIBYTE;
    u += 1;
  } while (limit >= KIBIBYTE && u < units.length - 1);

  return {
    limit: Math.trunc(limit),
    units: units[u],
  };
}
