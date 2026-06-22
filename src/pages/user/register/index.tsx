import {
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import {
  FormattedMessage,
  Helmet,
  Link,
  SelectLang,
  useIntl,
} from '@umijs/max';
import { App, Button, Space, Tabs } from 'antd';
import { createStyles } from 'antd-style';
import React, { useState } from 'react';
import { Footer } from '@/components';
import { register } from '@/services/ant-design-pro/api';
import Settings from '../../../../config/defaultSettings';

const useStyles = createStyles(({ token }) => {
  return {
    lang: {
      width: 42,
      height: 42,
      lineHeight: '42px',
      position: 'fixed',
      right: 16,
      borderRadius: token.borderRadius,
      ':hover': {
        backgroundColor: token.colorBgTextHover,
      },
    },
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'auto',
      backgroundImage:
        "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
      backgroundSize: '100% 100%',
    },
    footer: {
      textAlign: 'center',
      marginTop: 24,
    },
  };
});

const Lang = () => {
  const { styles } = useStyles();

  return (
    <div className={styles.lang} data-lang>
      {SelectLang && <SelectLang />}
    </div>
  );
};

const Register: React.FC = () => {
  const [submitting, setSubmitting] = useState(false);
  const { styles } = useStyles();
  const { message } = App.useApp();
  const intl = useIntl();

  const handleSubmit = async (values: API.RegisterParams) => {
    setSubmitting(true);
    try {
      const result = await register(values);
      const responseResult =
        result as unknown as API.ResponseResult<API.RegisterResponse>;

      if (responseResult?.code === 200) {
        message.success('注册成功！');
        // 跳转到登录页面
        setTimeout(() => {
          window.location.href = '/user/login';
        }, 1500);
      } else {
        message.error(responseResult?.message || '注册失败，请重试！');
      }
    } catch (error) {
      message.error('注册失败，请重试！');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>
          {intl.formatMessage({
            id: 'menu.register',
            defaultMessage: '注册',
          })}
          {Settings.title && ' - ' + Settings.title}
        </title>
      </Helmet>
      <Lang />
      <div
        style={{
          flex: '1',
          padding: '32px 0',
        }}
      >
        <LoginForm
          contentStyle={{
            minWidth: 280,
            maxWidth: '75vw',
          }}
          logo={<img alt="logo" src="/logo.svg" />}
          title="Ant Design"
          subTitle={intl.formatMessage({
            id: 'pages.layouts.userLayout.title',
          })}
          initialValues={{}}
          onFinish={async (values) => {
            await handleSubmit(values as API.RegisterParams);
          }}
          submitter={{
            searchConfig: {
              submitText: intl.formatMessage({
                id: 'pages.register.submit',
                defaultMessage: '注册',
              }),
            },
            submitButtonProps: {
              loading: submitting,
              size: 'large',
            },
          }}
        >
          <Tabs
            centered
            items={[
              {
                key: 'register',
                label: intl.formatMessage({
                  id: 'pages.register.tab',
                  defaultMessage: '用户注册',
                }),
              },
            ]}
          />

          <ProFormText
            name="username"
            fieldProps={{
              size: 'large',
              prefix: <UserOutlined />,
            }}
            placeholder={intl.formatMessage({
              id: 'pages.register.username.placeholder',
              defaultMessage: '用户名（2-64位）',
            })}
            rules={[
              {
                required: true,
                message: (
                  <FormattedMessage
                    id="pages.register.username.required"
                    defaultMessage="请输入用户名！"
                  />
                ),
              },
              {
                min: 2,
                max: 64,
                message: '用户名长度需在2-64位之间',
              },
            ]}
          />

          <ProFormText.Password
            name="password"
            fieldProps={{
              size: 'large',
              prefix: <LockOutlined />,
            }}
            placeholder={intl.formatMessage({
              id: 'pages.register.password.placeholder',
              defaultMessage: '密码（至少6位）',
            })}
            rules={[
              {
                required: true,
                message: (
                  <FormattedMessage
                    id="pages.register.password.required"
                    defaultMessage="请输入密码！"
                  />
                ),
              },
              {
                min: 6,
                message: '密码长度至少6位',
              },
            ]}
          />

          <ProFormText
            name="realName"
            fieldProps={{
              size: 'large',
              prefix: <UserOutlined />,
            }}
            placeholder={intl.formatMessage({
              id: 'pages.register.realName.placeholder',
              defaultMessage: '真实姓名（选填）',
            })}
          />

          <ProFormText
            name="email"
            fieldProps={{
              size: 'large',
              prefix: <MailOutlined />,
            }}
            placeholder={intl.formatMessage({
              id: 'pages.register.email.placeholder',
              defaultMessage: '邮箱（选填）',
            })}
            rules={[
              {
                type: 'email',
                message: '请输入正确的邮箱格式',
              },
            ]}
          />

          <ProFormText
            name="phone"
            fieldProps={{
              size: 'large',
              prefix: <PhoneOutlined />,
            }}
            placeholder={intl.formatMessage({
              id: 'pages.register.phone.placeholder',
              defaultMessage: '手机号（选填）',
            })}
            rules={[
              {
                pattern: /^1[3-9]\d{9}$/,
                message: '请输入正确的手机号格式',
              },
            ]}
          />

          <div className={styles.footer}>
            <Space direction="vertical">
              <span style={{ color: '#595959' }}>已有账号？</span>
              <Link to="/user/login" prefetch>
                <Button type="link">立即登录</Button>
              </Link>
            </Space>
          </div>
        </LoginForm>
      </div>
      <Footer />
    </div>
  );
};

export default Register;
