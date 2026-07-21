import { HeartTwoTone, SmileTwoTone } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Alert, Card, Typography } from 'antd';
import React from 'react';

const Admin: React.FC = () => {
  const intl = useIntl();
  return (
    <PageContainer
      content={intl.formatMessage({
        id: 'pages.admin.subPage.title',
        defaultMessage: 'This page can only be viewed by admin',
      })}
    >
      <Card>
        <Typography.Title level={2} style={{ textAlign: 'center' }}>
          <SmileTwoTone /> Prompt Design <HeartTwoTone twoToneColor="#eb2f96" />{' '}
          Admin
        </Typography.Title>
      </Card>
    </PageContainer>
  );
};

export default Admin;
