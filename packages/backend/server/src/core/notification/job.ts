import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { JOB_SIGNAL, JobQueue, Mailer, OnJob } from '../../base';
import { NotificationService } from './service';

declare global {
  interface Jobs {
    'nightly.cleanExpiredNotifications': {};
    'notification.sendMail': {
      name: string;
      receiver: string;
      subject: string;
      content: string;
    };
  }
}

@Injectable()
export class NotificationJob {
  constructor(
    private readonly service: NotificationService,
    private readonly queue: JobQueue,
    private readonly mailer: Mailer
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async nightlyJob() {
    await this.queue.add(
      'nightly.cleanExpiredNotifications',
      {},
      {
        jobId: 'nightly-notification-clean-expired',
      }
    );
  }

  @OnJob('nightly.cleanExpiredNotifications')
  async cleanExpiredNotifications() {
    await this.service.cleanExpiredNotifications();
  }

  /**
   * specific error has been logged in {@link Mailer.send} already.
   */
  @OnJob('notification.sendMail')
  async handleSendMailJob(mail: Jobs['notification.sendMail']) {
    const result = await this.mailer.send(mail);

    return result === false ? JOB_SIGNAL.RETRY : null;
  }
}
