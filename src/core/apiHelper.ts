import { CheckMode, MediaCategory } from './rules';

export interface ApiHelperConfig {
  appId?: string;
  phoneNumberId?: string;
  wabaId?: string;
  accessToken?: string;
  toPhoneNumber?: string;
}

export function generateApiSnippets(
  file: { name: string; size: number; detectedMime: string; category: MediaCategory },
  mode: CheckMode,
  config: ApiHelperConfig = {}
) {
  const appId = config.appId?.trim() || 'YOUR_APP_ID';
  const phoneNumberId = config.phoneNumberId?.trim() || 'YOUR_PHONE_NUMBER_ID';
  const wabaId = config.wabaId?.trim() || 'YOUR_WABA_ID';
  const token = config.accessToken?.trim() || 'YOUR_SYSTEM_USER_ACCESS_TOKEN';
  const toPhone = config.toPhoneNumber?.trim() || '+1234567890';

  if (mode === 'template_header') {
    // 1. Resumable Upload Step 1 (Create Session)
    const step1Curl = `curl -i -X POST "https://graph.facebook.com/v26.0/${appId}/uploads\\
  ?file_name=${encodeURIComponent(file.name)}\\
  &file_length=${file.size}\\
  &file_type=${encodeURIComponent(file.detectedMime)}\\
  &access_token=${token}"`;

    // 2. Resumable Upload Step 2 (Binary Upload)
    const step2Curl = `curl -i -X POST "https://graph.facebook.com/v26.0/upload:<UPLOAD_SESSION_ID>" \\
  -H "Authorization: OAuth ${token}" \\
  -H "file_offset: 0" \\
  -H "Content-Type: ${file.detectedMime}" \\
  --data-binary "@${file.name}"`;

    // 3. Template Creation Component JSON
    const formatMap: Record<string, string> = {
      image: 'IMAGE',
      video: 'VIDEO',
      document: 'DOCUMENT',
    };
    const format = formatMap[file.category] || 'IMAGE';

    const templateComponentJson = JSON.stringify(
      {
        name: 'sample_template_with_header',
        category: 'MARKETING',
        language: 'en_US',
        components: [
          {
            type: 'HEADER',
            format: format,
            example: {
              header_handle: ['4.AbCdEf123456...<UPLOADED_FILE_HANDLE>'],
            },
          },
          {
            type: 'BODY',
            text: 'Hello {{1}}, check out our latest update attached above!',
            example: {
              body_text: [['John Doe']],
            },
          },
        ],
      },
      null,
      2
    );

    return {
      type: 'template_header',
      step1Curl,
      step2Curl,
      templateComponentJson,
    };
  }

  // Standard Media Mode
  const standardUploadCurl = `curl -X POST "https://graph.facebook.com/v26.0/${phoneNumberId}/media" \\
  -H "Authorization: Bearer ${token}" \\
  -F "messaging_product=whatsapp" \\
  -F "file=@${file.name};type=${file.detectedMime}"`;

  const categoryKey = file.category === 'sticker' ? 'sticker' : file.category;
  const sendPayload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: toPhone,
    type: categoryKey,
    [categoryKey]: {
      id: '<MEDIA_ID_RETURNED_FROM_UPLOAD>',
      ...(file.category === 'document' ? { filename: file.name } : {}),
      ...(file.category === 'image' || file.category === 'video'
        ? { caption: 'Here is your media file' }
        : {}),
    },
  };

  const sendMessageCurl = `curl -X POST "https://graph.facebook.com/v26.0/${phoneNumberId}/messages" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(sendPayload, null, 2)}'`;

  return {
    type: 'standard',
    standardUploadCurl,
    sendMessageCurl,
    sendPayloadJson: JSON.stringify(sendPayload, null, 2),
  };
}
