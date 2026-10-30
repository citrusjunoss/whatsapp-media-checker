export type CheckMode = 'standard' | 'template_header';

export type MediaCategory = 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'unknown';

export type CheckStatus = 'pass' | 'warning' | 'error';

export interface CheckItem {
  id: string;
  name: string;
  status: CheckStatus;
  message: string;
  expected: string;
  actual: string;
  docUrl?: string;
}

export type AvailableFix = 
  | 'compress_image' 
  | 'make_sticker' 
  | 'convert_audio_mp3' 
  | 'transcode_video_ffmpeg'
  | 'fix_faststart'
  | 'convert_to_pdf';

export interface ValidationResult {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  detectedMime: string;
  detectedCategory: MediaCategory;
  mode: CheckMode;
  overallStatus: CheckStatus;
  statusReason: string;
  items: CheckItem[];
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    videoCodec?: string;
    audioCodec?: string;
    hasFastStart?: boolean;
    audioChannels?: number;
    isAnimated?: boolean;
    pageCount?: number;
    [key: string]: any;
  };
  suggestions: string[];
  availableFixes: AvailableFix[];
  timestamp: number;
}

export const SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5 MB
  VIDEO: 16 * 1024 * 1024, // 16 MB
  AUDIO: 16 * 1024 * 1024, // 16 MB
  DOCUMENT: 100 * 1024 * 1024, // 100 MB
  STICKER_STATIC: 100 * 1024, // 100 KB
  STICKER_ANIMATED: 500 * 1024, // 500 KB
};

export const FORMAT_DOC_LINKS = {
  STANDARD_MEDIA: 'https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/media',
  RESUMABLE_UPLOAD: 'https://developers.facebook.com/docs/graph-api/guides/upload',
};

// Document types allowed in Standard Mode
export const STANDARD_DOCUMENT_MIMES = [
  'application/pdf',
  'text/plain',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
];

export const STANDARD_AUDIO_MIMES = [
  'audio/aac',
  'audio/mp4',
  'audio/amr',
  'audio/mpeg',
  'audio/ogg',
];

export const STANDARD_VIDEO_MIMES = [
  'video/mp4',
  'video/3gp',
  'video/3gpp',
];

export const STANDARD_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
];

// Template Header allowed file_type parameter values in Graph API Resumable Upload
export const TEMPLATE_HEADER_ALLOWED_MIMES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/jpg'],
  VIDEO: ['video/mp4'],
  DOCUMENT: ['application/pdf'],
};
