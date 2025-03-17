import { Injectable } from '@nestjs/common';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import { SendOptions } from '../../base/mailer/mailer';
import {
  EmailRenderer,
  renderChangeEmailMail,
  renderChangeEmailNotificationMail,
  renderChangePasswordMail,
  renderLinkInvitationApproveMail,
  renderLinkInvitationDeclineMail,
  renderLinkInvitationReviewRequestMail,
  renderMemberAcceptedMail,
  renderMemberInvitationMail,
  renderMemberLeaveMail,
  renderMemberRemovedMail,
  renderOwnershipReceivedMail,
  renderOwnershipTransferredMail,
  renderSetPasswordMail,
  renderSignInMail,
  renderSignUpMail,
  renderTeamBecomeAdminMail,
  renderTeamBecomeCollaboratorMail,
  renderTeamDeleteIn1MonthMail,
  renderTeamDeleteIn24HoursMail,
  renderTeamLicenseMail,
  renderTeamWorkspaceDeletedMail,
  renderTeamWorkspaceExpiredMail,
  renderTeamWorkspaceExpireSoonMail,
  renderTeamWorkspaceUpgradedMail,
  renderVerifyChangeEmailMail,
  renderVerifyEmailMail,
} from '../../mails';
import { WorkspaceProps } from '../../mails/components';

type Props<T extends EmailRenderer<any>> =
  T extends EmailRenderer<infer P> ? P : never;
import { Mailer } from '../../base';
type Sender<T extends EmailRenderer<any>> = (
  to: string,
  props: Props<T>
) => Promise<SMTPTransport.SentMessageInfo>;

function make<T extends EmailRenderer<any>>(
  sender: {
    send: (options: SendOptions) => Promise<any>;
  },
  renderer: T,
  factory?: (props: Props<T>) => {
    props: Props<T>;
    options: Partial<SendOptions>;
  }
): Sender<T> {
  return async (to, props) => {
    const { props: overrideProps, options } = factory
      ? factory(props)
      : { props, options: {} };

    const { html, subject } = await renderer(overrideProps);
    return sender.send({
      to,
      subject,
      html,
      ...options,
    });
  };
}

@Injectable()
export class MailsService {
  constructor(private readonly mailer: Mailer) {}
  private make<T extends EmailRenderer<any>>(
    renderer: T,
    factory?: (props: Props<T>) => {
      props: Props<T>;
      options: Partial<SendOptions>;
    }
  ) {}

  private readonly convertWorkspaceProps = <
    T extends { workspace: WorkspaceProps },
  >(
    props: T
  ) => {
    return {
      props: {
        ...props,
        workspace: {
          ...props.workspace,
          avatar: 'cid:workspaceAvatar',
        },
      },
      options: {
        attachments: [
          {
            cid: 'workspaceAvatar',
            filename: 'workspaceAvatar',
            content: props.workspace.avatar,
            encoding: 'base64',
          },
        ],
      },
    };
  };

  private makeWorkspace<T extends EmailRenderer<any>>(renderer: T) {
    return this.make(renderer, this.convertWorkspaceProps);
  }

  // User mails
  sendSignUpMail = this.make(renderSignUpMail);
  sendSignInMail = this.make(renderSignInMail);
  sendChangePasswordMail = this.make(renderChangePasswordMail);
  sendSetPasswordMail = this.make(renderSetPasswordMail);
  sendChangeEmailMail = this.make(renderChangeEmailMail);
  sendVerifyChangeEmail = this.make(renderVerifyChangeEmailMail);
  sendVerifyEmail = this.make(renderVerifyEmailMail);
  sendNotificationChangeEmail = this.make(renderChangeEmailNotificationMail);

  // =================== Workspace Mails ===================
  sendMemberInviteMail = this.makeWorkspace(renderMemberInvitationMail);
  sendMemberAcceptedEmail = this.makeWorkspace(renderMemberAcceptedMail);
  sendMemberLeaveEmail = this.makeWorkspace(renderMemberLeaveMail);
  sendLinkInvitationReviewRequestMail = this.makeWorkspace(
    renderLinkInvitationReviewRequestMail
  );
  sendLinkInvitationApproveMail = this.makeWorkspace(
    renderLinkInvitationApproveMail
  );
  sendLinkInvitationDeclineMail = this.makeWorkspace(
    renderLinkInvitationDeclineMail
  );
  sendMemberRemovedMail = this.makeWorkspace(renderMemberRemovedMail);
  sendOwnershipTransferredMail = this.makeWorkspace(
    renderOwnershipTransferredMail
  );
  sendOwnershipReceivedMail = this.makeWorkspace(renderOwnershipReceivedMail);

  // =================== Team Workspace Mails ===================
  sendTeamWorkspaceUpgradedEmail = this.makeWorkspace(
    renderTeamWorkspaceUpgradedMail
  );
  sendTeamBecomeAdminMail = this.makeWorkspace(renderTeamBecomeAdminMail);
  sendTeamBecomeCollaboratorMail = this.makeWorkspace(
    renderTeamBecomeCollaboratorMail
  );
  sendTeamDeleteIn24HoursMail = this.makeWorkspace(
    renderTeamDeleteIn24HoursMail
  );
  sendTeamDeleteIn1MonthMail = this.makeWorkspace(renderTeamDeleteIn1MonthMail);
  sendTeamWorkspaceDeletedMail = this.makeWorkspace(
    renderTeamWorkspaceDeletedMail
  );
  sendTeamExpireSoonMail = this.makeWorkspace(
    renderTeamWorkspaceExpireSoonMail
  );
  sendTeamExpiredMail = this.makeWorkspace(renderTeamWorkspaceExpiredMail);
  sendTeamLicenseMail = this.make(renderTeamLicenseMail);
}
