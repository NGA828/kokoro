import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Preference } from './preference.entity';
import { PreferencesController } from './preferences.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Preference])],
  controllers: [PreferencesController],
  exports: [TypeOrmModule],
})
export class PreferencesModule {}
