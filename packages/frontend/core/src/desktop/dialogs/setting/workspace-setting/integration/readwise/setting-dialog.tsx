import { Button, Modal } from '@affine/component';
import {
  IntegrationService,
  IntegrationTypeIcon,
} from '@affine/core/modules/integration';
import type { ReadwiseConfig } from '@affine/core/modules/integration/type';
import { useI18n } from '@affine/i18n';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback, useMemo } from 'react';

import { IntegrationCardIcon } from '../card';
import {
  IntegrationSettingItem,
  IntegrationSettingTextRadioGroup,
  type IntegrationSettingTextRadioGroupItem,
  IntegrationSettingToggle,
} from '../setting';
import * as styles from './setting-dialog.css';

export const SettingDialog = ({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: () => void;
}) => {
  const t = useI18n();
  return (
    <Modal
      open
      onOpenChange={onClose}
      contentOptions={{ className: styles.dialog }}
    >
      <header className={styles.header}>
        <IntegrationCardIcon className={styles.headerIcon}>
          <IntegrationTypeIcon type="readwise" />
        </IntegrationCardIcon>
        <div>
          <h1 className={styles.headerTitle}>
            {t['com.affine.integration.readwise.name']()}
          </h1>
          <p className={styles.headerCaption}>
            {t['com.affine.integration.readwise.setting.caption']()}
          </p>
        </div>
      </header>
      <ul className={styles.settings}>
        <NewHighlightSetting />
        <Divider />
        <UpdateStrategySetting />
        <Divider />
        <StartImport onImport={onImport} />
      </ul>
    </Modal>
  );
};

const Divider = () => {
  return <li className={styles.divider} />;
};

const NewHighlightSetting = () => {
  const t = useI18n();
  const readwise = useService(IntegrationService).readwise;
  const syncNewHighlights = useLiveData(
    useMemo(() => readwise.setting$('syncNewHighlights'), [readwise])
  );

  const toggle = useCallback(
    (value: boolean) => {
      readwise.updateSetting('syncNewHighlights', value);
    },
    [readwise]
  );

  return (
    <li>
      <IntegrationSettingToggle
        checked={!!syncNewHighlights}
        name={t['com.affine.integration.readwise.setting.sync-new-name']()}
        desc={t['com.affine.integration.readwise.setting.sync-new-desc']()}
        onChange={toggle}
      />
    </li>
  );
};

const UpdateStrategySetting = () => {
  const t = useI18n();
  const readwise = useService(IntegrationService).readwise;
  const updateStrategy = useLiveData(
    useMemo(() => readwise.setting$('updateStrategy'), [readwise])
  );

  const toggle = useCallback(
    (value: boolean) => {
      if (!value) readwise.updateSetting('updateStrategy', undefined);
      else readwise.updateSetting('updateStrategy', 'append');
    },
    [readwise]
  );

  const handleUpdate = useCallback(
    (value: ReadwiseConfig['updateStrategy']) => {
      readwise.updateSetting('updateStrategy', value);
    },
    [readwise]
  );

  const strategies = useMemo(
    () =>
      [
        {
          name: t[
            'com.affine.integration.readwise.setting.update-append-name'
          ](),
          desc: t[
            'com.affine.integration.readwise.setting.update-append-desc'
          ](),
          value: 'append',
        },
        {
          name: t[
            'com.affine.integration.readwise.setting.update-override-name'
          ](),
          desc: t[
            'com.affine.integration.readwise.setting.update-override-desc'
          ](),
          value: 'override',
        },
      ] satisfies IntegrationSettingTextRadioGroupItem[],
    [t]
  );

  return (
    <>
      <li>
        <IntegrationSettingToggle
          checked={!!updateStrategy}
          name={t['com.affine.integration.readwise.setting.update-name']()}
          desc={t['com.affine.integration.readwise.setting.update-desc']()}
          onChange={toggle}
        />
      </li>
      <li
        className={styles.updateStrategyGroup}
        data-collapsed={!updateStrategy}
      >
        <div className={styles.updateStrategyGroupContent}>
          <h6 className={styles.updateStrategyLabel}>
            {t['com.affine.integration.readwise.setting.update-strategy']()}
          </h6>
          <IntegrationSettingTextRadioGroup
            items={strategies}
            checked={updateStrategy}
            onChange={handleUpdate}
          />
        </div>
      </li>
    </>
  );
};

const StartImport = ({ onImport }: { onImport: () => void }) => {
  const t = useI18n();
  return (
    <IntegrationSettingItem
      name={t['com.affine.integration.readwise.setting.start-import-name']()}
      desc={t['com.affine.integration.readwise.setting.start-import-desc']()}
    >
      <Button onClick={onImport}>
        {t['com.affine.integration.readwise.setting.start-import-button']()}
      </Button>
    </IntegrationSettingItem>
  );
};
