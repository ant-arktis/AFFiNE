import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { getStreamAsBuffer } from 'get-stream';

import { JOB_SIGNAL, JobQueue, Mailer, OnJob, SendOptions } from '../../base';
import { type MailName, MailProps, Renderers } from '../../mails';
import { UserProps, WorkspaceProps } from '../../mails/components';
import { Models } from '../../models';
import { DocReader } from '../doc';
import { WorkspaceBlobStorage } from '../storage';
import { NotificationService } from './service';

type DynamicallyFetchedProps<Props> = {
  [Key in keyof Props]: Props[Key] extends infer Prop
    ? Prop extends UserProps
      ? {
          $$userId: string;
        } & Omit<Prop, 'email' | 'avatar'>
      : Prop extends WorkspaceProps
        ? {
            $$workspaceId: string;
          } & Omit<Prop, 'name' | 'avatar'>
        : Prop
    : never;
};

type SendMailJob<Mail extends MailName = MailName, Props = MailProps<Mail>> = {
  name: Mail;
  to: string;
  // NOTE(@forehalo):
  //   workspace avatar currently send as base64 img instead of a avatar url,
  //   so the content might be too large to be put in job payload.
  props: DynamicallyFetchedProps<Props>;
};

declare global {
  interface Jobs {
    'nightly.cleanExpiredNotifications': {};
    'notification.sendMail': {
      [K in MailName]: SendMailJob<K>;
    }[MailName];
  }
}

@Injectable()
export class NotificationJob {
  constructor(
    private readonly service: NotificationService,
    private readonly queue: JobQueue,
    private readonly mailer: Mailer,
    private readonly doc: DocReader,
    private readonly workspaceBlob: WorkspaceBlobStorage,
    private readonly models: Models
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

  @OnJob('notification.sendMail')
  async sendMail({ name, to, props }: Jobs['notification.sendMail']) {
    let options: Partial<SendOptions> = {};

    for (const key in props) {
      // @ts-expect-error allow
      const val = props[key];
      if (val && typeof val === 'object') {
        if ('$$workspaceId' in val) {
          const props = await this.fetchWorkspaceProps(val.$$workspaceId);

          if (!props) {
            return;
          }

          if (props.avatar) {
            props.avatar = 'cid:workspaceAvatar';
            options.attachments = [
              {
                cid: 'workspaceAvatar',
                filename: 'workspaceAvatar',
                content: props.avatar,
                encoding: 'base64',
              },
            ];
          }
          // @ts-expect-error replacement
          props[key] = props;
        } else if ('$$userId' in val) {
          const props = await this.fetchUserProps(val.$$userId);

          if (!props) {
            return;
          }

          // @ts-expect-error replacement
          props[key] = props;
        }
      }
    }

    const result = await this.mailer.send(name, {
      to,
      ...(await Renderers[name](
        // @ts-expect-error the job trigger part has been typechecked
        props
      )),
      ...options,
    });

    return result === false ? JOB_SIGNAL.RETRY : undefined;
  }

  private async fetchWorkspaceProps(workspaceId: string) {
    const workspace = await this.doc.getWorkspaceContent(workspaceId);

    if (!workspace) {
      return;
    }

    const props: WorkspaceProps = {
      name: workspace.name,
    };

    if (workspace.avatarKey) {
      const avatar = await this.workspaceBlob.get(
        workspace.id,
        workspace.avatarKey
      );

      if (avatar.body) {
        props.avatar = (await getStreamAsBuffer(avatar.body)).toString(
          'base64'
        );
      }
    }

    return props;
  }

  private async fetchUserProps(userId: string) {
    const user = await this.models.user.getWorkspaceUser(userId);
    if (!user) {
      return;
    }

    return { email: user.email } satisfies UserProps;
  }
}
