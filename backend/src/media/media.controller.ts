import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { CurrentUser, AuthUser } from '../common/decorators';
import { ProfilesService } from '../profiles/profiles.service';
import { writeFile, mkdir } from 'fs/promises';
import * as path from 'path';

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'audio/webm': 'webm',
  'audio/mp3': 'mp3',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
};
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

@Controller('media')
export class MediaController {
  constructor(
    private readonly media: MediaService,
    private readonly profiles: ProfilesService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser() auth: AuthUser,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; size: number },
    @Query('kind') kind: string = 'photo',
    @Query('messageConversationId') _convId?: string,
  ) {
    if (!file) throw new BadRequestException('No file provided.');
    const ext = ALLOWED_MIME[file.mimetype];
    if (!ext) {
      throw new BadRequestException(
        'Unsupported file type. Allowed: JPG, PNG, WEBP images and voice notes.',
      );
    }
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File too large (max 8 MB).');
    }

    const folder = kind === 'voice' ? 'messages' : kind === 'message' ? 'messages' : 'profiles';

    if (this.media.isCloudinary()) {
      const res = await this.media.upload(file.buffer, folder);
      return this.handleResult(auth.id, res, kind);
    }

    // Local-disk fallback: persist under backend/uploads and expose via /media.
    const uploadsDir = path.join(process.cwd(), 'uploads', folder);
    await mkdir(uploadsDir, { recursive: true });
    const name = `${auth.id}-${Date.now()}.${ext}`;
    await writeFile(path.join(uploadsDir, name), file.buffer);
    const url = `/media/${folder}/${name}`;
    return this.handleResult(
      auth.id,
      { url, publicId: null, source: 'local' },
      kind,
    );
  }

  private async handleResult(
    userId: string,
    res: { url: string; publicId: string | null; source: string },
    kind: string,
  ) {
    if (kind === 'photo') {
      await this.profiles.addPhoto(userId, res.url, res.source, res.publicId ?? undefined);
    }
    return {
      url: res.url,
      publicId: res.publicId,
      source: res.source,
      attachedToProfile: kind === 'photo',
    };
  }
}
