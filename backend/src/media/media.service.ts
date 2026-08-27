import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export interface UploadResult {
  url: string;
  publicId: string | null;
  source: 'cloudinary' | 'local';
}

/**
 * Media storage. Uses Cloudinary when credentials are configured; otherwise
 * files are written to local disk and served from /media by the backend.
 * MySQL only ever stores the URL + metadata — never the binary itself.
 */
@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private cloudinaryReady = false;

  constructor(private readonly config: ConfigService) {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');
    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
      this.cloudinaryReady = true;
      this.logger.log('Cloudinary media storage enabled.');
    } else {
      this.logger.warn(
        'Cloudinary not configured — using local disk storage for uploads.',
      );
    }
  }

  isCloudinary(): boolean {
    return this.cloudinaryReady;
  }

  /** Upload a data-URI / buffer. Folder scopes the asset. */
  async upload(dataUriOrBuffer: string | Buffer, folder: string): Promise<UploadResult> {
    if (this.cloudinaryReady) {
      const dataUri =
        typeof dataUriOrBuffer === 'string'
          ? dataUriOrBuffer
          : `data:application/octet-stream;base64,${dataUriOrBuffer.toString('base64')}`;
      const res = await cloudinary.uploader.upload(dataUri, {
        folder: `kokoro-march/${folder}`,
        resource_type: 'auto',
      });
      return { url: res.secure_url, publicId: res.public_id, source: 'cloudinary' };
    }
    // Local fallback handled by controller (writes file to disk); signal via source.
    return { url: '', publicId: null, source: 'local' };
  }
}
