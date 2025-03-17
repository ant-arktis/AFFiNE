import { ShadowlessElement } from '@blocksuite/affine/block-std';
import { WithDisposable } from '@blocksuite/affine/global/lit';
import { css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { type ChatMessage } from './chat-context';

export class ChatPanelUserMessage extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .message {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .images {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      gap: 8px;
      margin-bottom: 8px;
      max-width: 100%;
      overflow-x: auto;
      padding: 4px;
      scrollbar-width: auto;
    }

    .images::-webkit-scrollbar {
      height: 4px;
    }

    .images::-webkit-scrollbar-thumb {
      background-color: var(--affine-border-color);
      border-radius: 4px;
    }

    .images::-webkit-scrollbar-track {
      background: transparent;
    }

    img {
      max-width: 180px;
      max-height: 264px;
      object-fit: cover;
      border-radius: 8px;
      flex-shrink: 0;
    }

    .text-content {
      display: inline-block;
      text-align: left;
      max-width: 800px;
      max-height: 500px;
      overflow-y: auto;
      background: var(--affine-v2-aI-userTextBackground);
      border-radius: 8px;
      padding: 12px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  `;

  @property({ attribute: false })
  accessor item!: ChatMessage;

  renderImages(images: string[]) {
    return images.length > 0
      ? html`<div class="images">
          ${repeat(
            images,
            image => image,
            image => {
              return html`<img src="${image}" />`;
            }
          )}
        </div>`
      : nothing;
  }

  renderText(text: string) {
    return text.length > 0
      ? html`<div class="text-content">${text}</div>`
      : nothing;
  }

  renderContent() {
    const { item } = this;

    const imagesRendered = item.attachments
      ? this.renderImages(item.attachments)
      : nothing;
    return html` ${imagesRendered} ${this.renderText(item.content)} `;
  }

  protected override render() {
    return html` <div class="message">${this.renderContent()}</div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'chat-panel-user-message': ChatPanelUserMessage;
  }
}
