import {
  type Container,
  createIdentifier,
  type ServiceIdentifier,
} from '@blocksuite/global/di';
import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { Bound, Point } from '@blocksuite/global/gfx';
import { DisposableGroup } from '@blocksuite/global/slot';
import { Extension } from '@blocksuite/store';

import { GfxExtension, GfxExtensionIdentifier } from '../extension.js';
import { type GfxController, GfxControllerIdentifier } from '../index.js';
import type {
  DragExtensionInitializeContext,
  DragInitializationOption,
  ExtensionDragEndContext,
  ExtensionDragMoveContext,
  ExtensionDragStartContext,
} from './drag.js';

export const TransformManagerIdentifier = GfxExtensionIdentifier(
  'element-transform-manager'
) as ServiceIdentifier<ElementTransformManager>;

export class ElementTransformManager extends GfxExtension {
  static override key = 'element-transform-manager';

  private readonly _disposable = new DisposableGroup();

  override mounted(): void {
    //
  }

  override unmounted(): void {
    this._disposable.dispose();
  }

  get keyboard() {
    return this.gfx.keyboard;
  }

  private _safeExecute(fn: () => void, errorMessage: string) {
    try {
      fn();
    } catch (e) {
      console.error(errorMessage, e);
    }
  }

  initializeDrag(options: DragInitializationOption) {
    let cancelledByExt = false;
    const context: DragExtensionInitializeContext = {
      /**
       * The elements that are being dragged
       */
      elements: options.movingElements,

      preventDefault: () => {
        cancelledByExt = true;
      },
    };
    const extension = this.std.provider.getAll(TransformExtensionIdentifier);
    const activeExtensionHandlers = Array.from(
      extension.values().map(ext => {
        return ext.onDragInitialize(context);
      })
    );

    if (cancelledByExt || context.elements.length === 0) {
      activeExtensionHandlers.forEach(handler => handler.clear?.());
      return;
    }

    const host = this.std.host;
    const { event } = options;
    const internal = {
      elements: context.elements.map(model => {
        return {
          view: this.gfx.view.get(model)!,
          originalBound: Bound.deserialize(model.xywh),
          model: model,
        };
      }),
      dragStartPos: Point.from(
        this.gfx.viewport.toModelCoordFromClientCoord([event.x, event.y])
      ),
    };
    let dragLastPos = internal.dragStartPos;
    let lastEvent = event;

    const viewportWatcher = this.gfx.viewport.viewportMoved.on(() => {
      onDragMove(lastEvent as PointerEvent);
    });
    const onDragMove = (event: PointerEvent) => {
      dragLastPos = Point.from(
        this.gfx.viewport.toModelCoordFromClientCoord([event.x, event.y])
      );

      const shiftPressed = this.keyboard.shiftKey$.peek();
      const moveContext: ExtensionDragMoveContext = {
        ...internal,
        event,
        dragLastPos,
        dx: dragLastPos.x - internal.dragStartPos.x,
        dy: dragLastPos.y - internal.dragStartPos.y,
      };

      if (shiftPressed) {
        const angle = Math.abs(Math.atan2(moveContext.dy, moveContext.dx));
        const direction =
          angle < Math.PI / 4 || angle > 3 * (Math.PI / 4) ? 'dx' : 'dy';

        moveContext[direction] = 0;
      }

      this._safeExecute(() => {
        activeExtensionHandlers.forEach(handler =>
          handler.onDragMove?.(moveContext)
        );
      }, 'Error while executing extension `onDragMove`');

      internal.elements.forEach(element => {
        const { view, originalBound } = element;

        view.onDragMove({
          currentBound: originalBound,
          dx: moveContext.dx,
          dy: moveContext.dy,
          elements: internal.elements,
        });
      });
    };
    const onDragEnd = (event: PointerEvent) => {
      host.removeEventListener('pointermove', onDragMove, false);
      host.removeEventListener('pointerup', onDragEnd, false);
      viewportWatcher.dispose();

      dragLastPos = Point.from(
        this.gfx.viewport.toModelCoordFromClientCoord([event.x, event.y])
      );
      const endContext: ExtensionDragEndContext = {
        ...internal,
        event,
        dragLastPos,
        dx: dragLastPos.x - internal.dragStartPos.x,
        dy: dragLastPos.y - internal.dragStartPos.y,
      };

      this._safeExecute(() => {
        activeExtensionHandlers.forEach(handler =>
          handler.onDragEnd?.(endContext)
        );
      }, 'Error while executing extension `onDragEnd` handler');

      internal.elements.forEach(element => {
        const { view, originalBound } = element;

        view.onDragEnd({
          currentBound: originalBound.moveDelta(endContext.dx, endContext.dy),
          dx: endContext.dx,
          dy: endContext.dy,
          elements: internal.elements,
        });
      });

      this._safeExecute(() => {
        activeExtensionHandlers.forEach(handler => handler.clear?.());
      }, 'Error while executing extension `clear` handler');
    };
    const listenEvent = () => {
      host.addEventListener('pointermove', onDragMove, false);
      host.addEventListener('pointerup', onDragEnd, false);
    };
    const dragStart = () => {
      internal.elements.forEach(({ view, originalBound }) => {
        view.onDragStart({
          currentBound: originalBound,
          elements: internal.elements,
        });
      });

      const dragStartContext: ExtensionDragStartContext = {
        ...internal,
        event: event as PointerEvent,
        dragLastPos,
      };

      this._safeExecute(() => {
        activeExtensionHandlers.forEach(handler =>
          handler.onDragStart?.(dragStartContext)
        );
      }, 'Error while executing extension `onDragStart` handler');
    };

    listenEvent();
    dragStart();
  }
}

export const TransformExtensionIdentifier =
  createIdentifier<TransformExtension>('element-transform-extension');

export class TransformExtension extends Extension {
  static key: string;

  get std() {
    return this.gfx.std;
  }

  constructor(protected readonly gfx: GfxController) {
    super();
  }

  mounted() {}

  unmounted() {}

  onDragInitialize(_: DragExtensionInitializeContext): {
    onDragStart?: (context: ExtensionDragStartContext) => void;
    onDragMove?: (context: ExtensionDragMoveContext) => void;
    onDragEnd?: (context: ExtensionDragEndContext) => void;
    clear?: () => void;
  } {
    return {};
  }

  static override setup(di: Container) {
    if (!this.key) {
      throw new BlockSuiteError(
        ErrorCode.ValueNotExists,
        'key is not defined in the TransformExtension'
      );
    }

    di.add(
      this as unknown as { new (gfx: GfxController): TransformExtension },
      [GfxControllerIdentifier]
    );
    di.addImpl(TransformExtensionIdentifier(this.key), provider =>
      provider.get(this)
    );
  }
}
