import './config';

import { Global, Module } from '@nestjs/common';

import { Mailer, type SendOptions } from './mailer';

@Global()
@Module({
  providers: [Mailer],
  exports: [Mailer],
})
export class MailerModule {}

export { Mailer, type SendOptions };
