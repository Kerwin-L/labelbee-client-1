import React from 'react';
import { Form, Input, Tooltip } from 'antd';
import styles from './index.module.scss';
import SelectFolder from '../SelectFolder';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface IProps {
  disabled: boolean;
}

const isRequired = true;
const DefaultConfig: React.FC<IProps> = ({ disabled }) => {
  const { t } = useTranslation();

  return (
    <>
      <Form.Item
        name='name'
        label={<span className={styles.formTitle}>{t('ProjectName')}</span>}
        rules={[{ required: isRequired, message: t('Required') }]}
      >
        <Input disabled={disabled} placeholder={t('InputProjectName')} />
      </Form.Item>
      <Form.Item
        name='path'
        label={<span className={styles.formTitle}>{t('SelectImageFolder')}</span>}
        rules={[{ required: isRequired, message: t('Required') }]}
      >
        <SelectFolder disabled={disabled} key='path' />
      </Form.Item>
      <Form.Item
        name='resultPath'
        label={
          <span className={styles.formTitle}>
            {t('SelectResultFolder')}
            <Tooltip title={t('SelectResultFolderNotify')} placement='bottom'>
              <ExclamationCircleOutlined style={{ marginLeft: 5 }} />
            </Tooltip>
          </span>
        }
        rules={[{ required: isRequired, message: t('Required') }]}
      >
        <SelectFolder disabled={disabled} key='resultPath' />
      </Form.Item>
    </>
  );
};

export default DefaultConfig;
