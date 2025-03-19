import { ShadowlessElement } from '@blocksuite/affine/block-std';
import { unsafeCSSVar } from '@blocksuite/affine/shared/theme';
import { css, html } from 'lit';

import { AiThinkingIconWithAnimation } from '../_common/icons';

export class AiThinking extends ShadowlessElement {
  static override styles = css`
    .ai-thinking {
      display: flex;
      align-items: center;
      margin-left: -14px;
      color: ${unsafeCSSVar('primaryColor')};
      /* light/smMedium */
      font-family: Inter;
      font-size: 14px;
      font-style: normal;
      font-weight: 500;
      line-height: 22px;

      rive-player {
        display: contents;
      }

      .thinking-text {
        margin-left: -5px;
      }
    }
  `;
  protected override render() {
    return html`
      <div class="ai-thinking">
        ${AiThinkingIconWithAnimation}
        <span class="thinking-text">Thingking...</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-thinking': AiThinking;
  }
}

export default AiThinking;
