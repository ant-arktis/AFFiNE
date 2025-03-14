import type { EditorHost } from '@blocksuite/affine/block-std';
import { ShadowlessElement } from '@blocksuite/affine/block-std';
import { WithDisposable } from '@blocksuite/affine/global/lit';
import { css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import { type ChatItem, isChatMessage } from './chat-context';

export class ChatPanelUserMessage extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .avatar-container {
      width: 24px;
      height: 24px;
    }

    .avatar {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background-color: var(--affine-primary-color);
    }

    .avatar-container img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }
  `;

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor item!: ChatItem;

  @property({ attribute: false })
  accessor avatarUrl: string = '';

  @property({ attribute: false })
  accessor previewSpecBuilder: any;

  renderAvatar() {
    return html`<div class="user-info">
      <div class="avatar-container">
        ${this.avatarUrl
          ? html`<img .src=${this.avatarUrl} />`
          : html`<div class="avatar"></div>`}
      </div>
      You
    </div>`;
  }

  renderContent() {
    const { host, item } = this;

    if (isChatMessage(item)) {
      return html`<chat-text
        .host=${host}
        .attachments=${item.attachments}
        .text=${item.content}
        .state=${'finished'}
        .previewSpecBuilder=${this.previewSpecBuilder}
      ></chat-text>`;
    }

    return nothing;
  }

  protected override render() {
    return html`
      ${this.renderAvatar()}
      <div class="item-wrapper">${this.renderContent()}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'chat-panel-user-message': ChatPanelUserMessage;
  }
}
