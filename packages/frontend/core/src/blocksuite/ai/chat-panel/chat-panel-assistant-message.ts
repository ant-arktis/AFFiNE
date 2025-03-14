import type { EditorHost } from '@blocksuite/affine/block-std';
import { ShadowlessElement } from '@blocksuite/affine/block-std';
import { WithDisposable } from '@blocksuite/affine/global/lit';
import { isInsidePageEditor } from '@blocksuite/affine/shared/utils';
import { AiIcon } from '@blocksuite/icons/lit';
import { css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import {
  EdgelessEditorActions,
  PageEditorActions,
} from '../_common/chat-actions-handle';
import { type AIError } from '../components/ai-item/types';
import { AIChatErrorRenderer } from '../messages/error';
import { isChatMessage } from './chat-context';
import { type ChatItem } from './chat-context';
import { HISTORY_IMAGE_ACTIONS } from './const';

const AffineAvatarIcon = AiIcon({
  width: '20px',
  height: '20px',
  style: 'color: var(--affine-primary-color)',
});

export class ChatPanelAssistantMessage extends WithDisposable(
  ShadowlessElement
) {
  static override styles = css`
    .message-info {
      color: var(--affine-placeholder-color);
      font-size: var(--affine-font-xs);
      font-weight: 400;
    }
  `;

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor item!: ChatItem;

  @property({ attribute: false })
  accessor isLast: boolean = false;

  @property({ attribute: false })
  accessor status: string = 'idle';

  @property({ attribute: false })
  accessor error: AIError | null = null;

  @property({ attribute: false })
  accessor previewSpecBuilder: any;

  @property({ attribute: false })
  accessor getSessionId!: () => Promise<string | undefined>;

  @property({ attribute: false })
  accessor retry!: () => void;

  renderAvatar() {
    const isAssistant =
      isChatMessage(this.item) && this.item.role === 'assistant';
    const isWithDocs =
      isAssistant &&
      'content' in this.item &&
      this.item.content &&
      this.item.content.includes('[^') &&
      /\[\^\d+\]:{"type":"doc","docId":"[^"]+"}/.test(this.item.content);

    return html`<div class="user-info">
      ${AffineAvatarIcon} AFFiNE AI
      ${isWithDocs
        ? html`<span class="message-info">with your docs</span>`
        : nothing}
    </div>`;
  }

  renderContent() {
    const { host, item, isLast, status, error } = this;

    if (isLast && status === 'loading') {
      return html`<ai-loading></ai-loading>`;
    }

    if (isChatMessage(item)) {
      const state = isLast
        ? status !== 'loading' && status !== 'transmitting'
          ? 'finished'
          : 'generating'
        : 'finished';
      const shouldRenderError = isLast && status === 'error' && !!error;
      return html`<chat-text
          .host=${host}
          .attachments=${item.attachments}
          .text=${item.content}
          .state=${state}
          .previewSpecBuilder=${this.previewSpecBuilder}
        ></chat-text>
        ${shouldRenderError ? AIChatErrorRenderer(host, error) : nothing}
        ${this.renderEditorActions()}`;
    } else {
      switch (item.action) {
        case 'Create a presentation':
          return html`<action-slides
            .host=${host}
            .item=${item}
          ></action-slides>`;
        case 'Make it real':
          return html`<action-make-real
            .host=${host}
            .item=${item}
          ></action-make-real>`;
        case 'Brainstorm mindmap':
          return html`<action-mindmap
            .host=${host}
            .item=${item}
          ></action-mindmap>`;
        case 'Explain this image':
        case 'Generate a caption':
          return html`<action-image-to-text
            .host=${host}
            .item=${item}
          ></action-image-to-text>`;
        default:
          if (HISTORY_IMAGE_ACTIONS.includes(item.action)) {
            return html`<action-image
              .host=${host}
              .item=${item}
            ></action-image>`;
          }

          return html`<action-text
            .item=${item}
            .host=${host}
            .isCode=${item.action === 'Explain this code' ||
            item.action === 'Check code error'}
          ></action-text>`;
      }
    }
  }

  renderEditorActions() {
    const { item, isLast, status } = this;

    if (!isChatMessage(item) || item.role !== 'assistant') return nothing;

    if (
      isLast &&
      status !== 'success' &&
      status !== 'idle' &&
      status !== 'error'
    )
      return nothing;

    const { host } = this;
    const { content, id: messageId } = item;

    const actions = isInsidePageEditor(host)
      ? PageEditorActions
      : EdgelessEditorActions;

    return html`
      <chat-copy-more
        .host=${host}
        .actions=${actions}
        .content=${content}
        .isLast=${isLast}
        .getSessionId=${this.getSessionId}
        .messageId=${messageId}
        .withMargin=${true}
        .retry=${() => this.retry()}
      ></chat-copy-more>
      ${isLast && !!content
        ? html`<chat-action-list
            .actions=${actions}
            .host=${host}
            .content=${content}
            .getSessionId=${this.getSessionId}
            .messageId=${messageId ?? undefined}
            .withMargin=${true}
          ></chat-action-list>`
        : nothing}
    `;
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
    'chat-panel-assistant-message': ChatPanelAssistantMessage;
  }
}
