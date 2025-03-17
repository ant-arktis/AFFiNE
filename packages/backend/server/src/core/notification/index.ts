import { Module } from '@nestjs/common';

import { DocStorageModule } from '../doc';
import { PermissionModule } from '../permission';
import { StorageModule } from '../storage';
import { NotificationJob } from './job';
import { MailsService } from './mails';
import { NotificationResolver, UserNotificationResolver } from './resolver';
import { NotificationService } from './service';

@Module({
  imports: [PermissionModule, DocStorageModule, StorageModule],
  providers: [
    UserNotificationResolver,
    NotificationResolver,
    NotificationService,
    NotificationJob,
    MailsService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
export { MailsService };
