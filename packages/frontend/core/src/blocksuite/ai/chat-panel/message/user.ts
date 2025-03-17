import '../content/images';
import '../content/pure-text';

import { ShadowlessElement } from '@blocksuite/affine/block-std';
import { WithDisposable } from '@blocksuite/affine/global/lit';
import { css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import { type ChatMessage } from '../chat-context';

export class ChatMessageUser extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .message {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
  `;

  @property({ attribute: false })
  accessor item!: ChatMessage;

  renderContent() {
    const { item } = this;

    return html`
      ${item.attachments
        ? html`<chat-content-images
            .images=${item.attachments}
          ></chat-content-images>`
        : nothing}
      <chat-content-pure-text .text=${item.content}></chat-content-pure-text>
    `;
  }

  protected override render() {
    return html` <div class="message">${this.renderContent()}</div> `;
  }
}

customElements.define('chat-message-user', ChatMessageUser);

declare global {
  interface HTMLElementTagNameMap {
    'chat-message-user': ChatMessageUser;
  }
}
