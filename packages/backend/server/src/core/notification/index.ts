import { Module } from '@nestjs/common';

import { DocStorageModule } from '../doc';
import { PermissionModule } from '../permission';
import { StorageModule } from '../storage';
import { NotificationJob } from './job';
import { Mailer } from './mailer';
import { NotificationResolver, UserNotificationResolver } from './resolver';
import { NotificationService } from './service';

@Module({
  imports: [PermissionModule, DocStorageModule, StorageModule],
  providers: [
    UserNotificationResolver,
    NotificationResolver,
    NotificationService,
    NotificationJob,
    Mailer,
  ],
  exports: [NotificationService, Mailer],
})
export class NotificationModule {}
export { Mailer } from './mailer';
