import {
  CheckCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  ActionType,
  PageContainer,
  ProColumns,
  ProForm,
  ProFormDigit,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Button, Modal, Popconfirm, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import {
  createAccount,
  deleteAccount,
  listAccounts,
  testAccount,
  updateAccount,
} from '../strategy-manage/service';
import type { QuantAccountItem } from '../strategy-manage/data.d';

const statusEnum = {
  0: { text: '禁用', status: 'Default' },
  1: { text: '启用', status: 'Success' },
} as const;

const AccountManage: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const [form] = ProForm.useForm<QuantAccountItem>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<QuantAccountItem | undefined>();

  const { mutateAsync: addRun, isPending: addLoading } = useMutation({
    mutationFn: (values: QuantAccountItem) => createAccount(values),
    onSuccess: () => {
      message.success('账户创建成功');
      actionRef.current?.reload();
      setOpen(false);
    },
    onError: (e: any) =>
      message.error(`创建失败: ${e?.response?.data?.message || e.message}`),
  });

  const { mutateAsync: updateRun, isPending: updateLoading } = useMutation({
    mutationFn: (params: { id: string; body: QuantAccountItem }) =>
      updateAccount(params.id, params.body),
    onSuccess: () => {
      message.success('账户更新成功');
      actionRef.current?.reload();
      setOpen(false);
      setEditing(undefined);
    },
    onError: (e: any) =>
      message.error(`更新失败: ${e?.response?.data?.message || e.message}`),
  });

  const { mutateAsync: delRun } = useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onSuccess: () => {
      message.success('账户已删除');
      actionRef.current?.reload();
    },
    onError: () => message.error('删除失败'),
  });

  const { mutateAsync: testRun } = useMutation({
    mutationFn: (id: string) => testAccount(id),
    onSuccess: (res) => {
      const ok = (res.data || '').startsWith('ok:');
      message[ok ? 'success' : 'error'](`测试登录: ${res.data}`);
      actionRef.current?.reload();
    },
    onError: (e: any) =>
      message.error(`测试失败: ${e?.response?.data?.message || e.message}`),
  });

  const columns: ProColumns<QuantAccountItem>[] = [
    {
      title: '账户别名',
      dataIndex: 'accountName',
    },
    {
      title: '聚宽账号',
      dataIndex: 'username',
    },
    { title: '手机号', dataIndex: 'phone', hideInSearch: true },
    {
      title: '状态',
      dataIndex: 'isActive',
      valueType: 'select',
      valueEnum: statusEnum,
      render: (_, r) => {
        const meta = statusEnum[r.isActive as 0 | 1];
        return meta ? <Tag color={meta.status === 'Success' ? 'green' : 'default'}>{meta.text}</Tag> : '-';
      },
    },
    {
      title: '最近登录',
      dataIndex: 'lastLoginTime',
      valueType: 'dateTime',
      hideInSearch: true,
    },
    {
      title: '登录状态',
      dataIndex: 'lastLoginStatus',
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      valueType: 'dateTime',
      hideInSearch: true,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 240,
      render: (_, record) => [
        <a
          key="test"
          onClick={() => testRun(record.id!)}
        >
          <CheckCircleOutlined /> 测试登录
        </a>,
        <a
          key="edit"
          onClick={() => {
            setEditing(record);
            form.setFieldsValue({ ...record, password: '' });
            setOpen(true);
          }}
        >
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确定删除该账户?"
          onConfirm={() => delRun(record.id!)}
        >
          <a style={{ color: 'red' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer
      header={{
        title: '聚宽账户管理',
        subTitle: '管理聚宽 (JoinQuant) 账户凭据, 用于策略运行与回测',
      }}
    >
      <ProTable<QuantAccountItem>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={{ labelWidth: 'auto' }}
        pagination={{ pageSize: 10 }}
        request={async (params) => {
          const res = await listAccounts();
          return {
            data: res.data || [],
            total: res.data?.length || 0,
            success: res.code === 200,
          };
        }}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              form.setFieldsValue({ isActive: 1 });
              setEditing(undefined);
              setOpen(true);
            }}
          >
            新增账户
          </Button>,
          <Button
            key="refresh"
            icon={<ReloadOutlined />}
            onClick={() => actionRef.current?.reload()}
          >
            刷新
          </Button>,
        ]}
      />

      <Modal
        title={editing ? '编辑账户' : '新增账户'}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(undefined);
        }}
        onOk={() => form.submit()}
        confirmLoading={addLoading || updateLoading}
        width={520}
        destroyOnClose
      >
        <ProForm<QuantAccountItem>
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            if (editing) {
              const body: QuantAccountItem = { ...values };
              if (!body.password) {
                delete body.password;
              }
              await updateRun({ id: editing.id!, body });
            } else {
              await addRun(values);
            }
          }}
        >
          <ProFormText
            name="accountName"
            label="账户别名"
            rules={[{ required: true, message: '请输入账户别名' }]}
          />
          <ProFormText
            name="username"
            label="聚宽账号"
            rules={[{ required: true, message: '请输入聚宽账号' }]}
          />
          <ProFormText.Password
            name="password"
            label="聚宽密码"
            extra={editing ? '留空则不修改' : '密码在数据库中加密存储'}
            rules={editing ? [] : [{ required: true, message: '请输入聚宽密码' }]}
          />
          <ProFormText name="phone" label="绑定手机号" />
          <ProFormDigit name="isActive" label="状态 (1=启用, 0=禁用)" min={0} max={1} />
        </ProForm>
      </Modal>
    </PageContainer>
  );
};

export default AccountManage;
