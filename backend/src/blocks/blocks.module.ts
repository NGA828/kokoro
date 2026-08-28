import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Block } from './block.entity';
import { BlocksService } from './blocks.service';
import { BlocksController } from './blocks.controller';
import { RecommendationsModule } from '../recommendations/recommendations.module';

@Module({
  imports: [TypeOrmModule.forFeature([Block]), RecommendationsModule],
  providers: [BlocksService],
  controllers: [BlocksController],
  exports: [BlocksService],
})
export class BlocksModule {}
