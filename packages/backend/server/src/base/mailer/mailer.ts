import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  createTestAccount,
  createTransport,
  getTestMessageUrl,
  SendMailOptions,
  Transporter,
} from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import { Config } from '../config';
import { metrics } from '../metrics';

export type SendOptions = SendMailOptions;

@Injectable()
export class Mailer implements OnModuleInit {
  private readonly logger = new Logger(Mailer.name);
  private smtp: Transporter<SMTPTransport.SentMessageInfo> | null = null;
  private usingTestAccount = false;
  constructor(private readonly config: Config) {}

  onModuleInit() {
    this.createSMTP();
  }

  createSMTP() {
    if (this.config.mailer.host) {
      this.smtp = createTransport(this.config.mailer);
    } else if (this.config.node.dev) {
      createTestAccount((err, account) => {
        if (!err) {
          this.smtp = createTransport({
            ...account.smtp,
            auth: {
              user: account.user,
              pass: account.pass,
            },
          });
          this.usingTestAccount = true;
        }
      });
    }
    this.logger.warn('Mailer SMTP transport is not configured.');
    return null;
  }

  async send(options: SendOptions) {
    if (!this.smtp) {
      this.logger.warn(`Mailer SMTP transport is not configured to send mail.`);
      return null;
    }

    const result = await this.smtp.sendMail({
      from: this.config.mailer.from,
      ...options,
    });

    if (this.usingTestAccount && result.accepted.length > 0) {
      this.logger.debug(`Mail preview url: ${getTestMessageUrl(result)}`);
    }

    return result;
  }
}
