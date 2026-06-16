import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useIntl } from '@umijs/max';
import { Button, Drawer, message, Space, Tag } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import {
  createUser,
  deleteUser,
  getRoles,
  getUsers,
  updateUser,
} from '@/services/ant-design-pro/api';

const statusEnum = {
  0: {
    text: '禁用',
    status: 'Default',
  },
  1: {
    text: '启用',
    status: 'Success',
  },
};

const UserManage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const queryClient = useQueryClient();
  const intl = useIntl();
  const [messageApi, contextHolder] = message.useMessage();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<API.UserItem>();
  const [roles, setRoles] = useState<API.RoleItem[]>([]);
  const [showDetail, setShowDetail] = useState(false);

  // Load roles for selection
  useEffect(() => {
    getRoles().then((res) => {
      const result = res as unknown as API.ResponseResult<API.RoleItem[]>;
      if (result?.data) {
        setRoles(result.data);
      }
    });
  }, []);

  // Create user mutation
  const { mutateAsync: addUserRun, isPending: addLoading } = useMutation({
    mutationFn: (values: API.UserItem) => createUser(values),
    onSuccess: () => {
      messageApi.success('用户创建成功');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      actionRef.current?.reloadAndRest?.();
      setCreateModalOpen(false);
    },
    onError: () => {
      messageApi.error('用户创建失败，请重试！');
    },
  });

  // Update user mutation
  const { mutateAsync: updateUserRun, isPending: updateLoading } = useMutation({
    mutationFn: (params: { id: string; body: API.UserItem }) =>
      updateUser(params.id, params.body),
    onSuccess: () => {
      messageApi.success('用户更新成功');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      actionRef.current?.reloadAndRest?.();
      setEditModalOpen(false);
      setCurrentRow(undefined);
    },
    onError: () => {
      messageApi.error('用户更新失败，请重试！');
    },
  });

  // Delete user mutation
  const { mutateAsync: delUserRun } = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      messageApi.success('用户删除成功');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      actionRef.current?.reloadAndRest?.();
    },
    onError: () => {
      messageApi.error('用户删除失败，请重试！');
    },
  });

  const columns: ProColumns<API.UserItem>[] = [
    {
      title: '用户名',
      dataIndex: 'username',
      render: (dom, entity) => {
        return (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setCurrentRow(entity);
              setShowDetail(true);
            }}
          >
            {dom as string}
          </a>
        );
      },
    },
    {
      title: '真实姓名',
      dataIndex: 'realName',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueEnum: statusEnum,
    },
    {
      title: '角色',
      dataIndex: 'roleIds',
      render: (_, record) => {
        if (!record.roleIds || record.roleIds.length === 0) {
          return <Tag>无角色</Tag>;
        }
        const roleNames = record.roleIds
          .map((id) => roles.find((r) => r.id === id))
          .filter(Boolean)
          .map((r) => r!.roleName);
        return (
          <Space>
            {roleNames.map((name) => (
              <Tag key={name} color="blue">
                {name}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      valueType: 'dateTime',
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
        <a
          key="edit"
          onClick={() => {
            setCurrentRow(record);
            setEditModalOpen(true);
          }}
        >
          编辑
        </a>,
        <a
          key="delete"
          onClick={async () => {
            if (record.id) {
              await delUserRun(record.id);
            }
          }}
          style={{ color: 'red' }}
        >
          删除
        </a>,
      ],
    },
  ];

  return (
    <PageContainer>
      {contextHolder}
      <ProTable<API.UserItem>
        headerTitle="用户列表"
        actionRef={actionRef}
        rowKey="id"
        search={false}
        toolBarRender={() => [
          <Button
            type="primary"
            key="add"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            新增用户
          </Button>,
        ]}
        request={async () => {
          const result = (await getUsers()) as unknown as API.ResponseResult<
            API.UserItem[]
          >;
          return {
            data: result?.data || [],
            success: result?.code === 0,
            total: result?.data?.length || 0,
          };
        }}
        columns={columns}
      />

      {/* Create User Modal */}
      <ModalForm
        title="新增用户"
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        width="500px"
        modalProps={{
          okButtonProps: { loading: addLoading },
          destroyOnClose: true,
        }}
        onFinish={async (values) => {
          try {
            await addUserRun(values as API.UserItem);
            return true;
          } catch {
            return false;
          }
        }}
      >
        <ProFormText
          name="username"
          label="用户名"
          rules={[{ required: true, message: '请输入用户名' }]}
          width="md"
        />
        <ProFormText.Password
          name="password"
          label="密码"
          rules={[{ required: true, message: '请输入密码' }]}
          width="md"
        />
        <ProFormText name="realName" label="真实姓名" width="md" />
        <ProFormText name="email" label="邮箱" width="md" />
        <ProFormText name="phone" label="手机号" width="md" />
        <ProFormSelect
          name="roleIds"
          label="角色分配"
          width="md"
          mode="multiple"
          options={roles.map((role) => ({
            label: role.roleName,
            value: role.id,
          }))}
        />
        <ProFormDigit
          name="status"
          label="状态"
          width="md"
          initialValue={1}
          fieldProps={{ min: 0, max: 1 }}
        />
      </ModalForm>

      {/* Edit User Modal */}
      <ModalForm
        title="编辑用户 - 分配角色"
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) setCurrentRow(undefined);
        }}
        width="500px"
        modalProps={{
          okButtonProps: { loading: updateLoading },
          destroyOnClose: true,
        }}
        initialValues={{
          ...currentRow,
          password: undefined,
        }}
        onFinish={async (values) => {
          try {
            if (currentRow?.id) {
              const body: API.UserItem = {
                ...currentRow,
                ...values,
                password: values.password || undefined,
              };
              await updateUserRun({ id: currentRow.id, body });
            }
            return true;
          } catch {
            return false;
          }
        }}
      >
        <ProFormText name="realName" label="真实姓名" width="md" />
        <ProFormText name="email" label="邮箱" width="md" />
        <ProFormText name="phone" label="手机号" width="md" />
        <ProFormSelect
          name="roleIds"
          label="角色分配"
          width="md"
          mode="multiple"
          options={roles.map((role) => ({
            label: role.roleName,
            value: role.id,
          }))}
        />
        <ProFormDigit
          name="status"
          label="状态"
          width="md"
          fieldProps={{ min: 0, max: 1 }}
        />
      </ModalForm>

      {/* Detail Drawer */}
      <Drawer
        size={600}
        open={showDetail}
        onClose={() => {
          setCurrentRow(undefined);
          setShowDetail(false);
        }}
        closable={false}
      >
        {currentRow?.username && (
          <div>
            <h3>{currentRow.realName || currentRow.username}</h3>
            <p>用户名: {currentRow.username}</p>
            <p>真实姓名: {currentRow.realName || '-'}</p>
            <p>邮箱: {currentRow.email || '-'}</p>
            <p>手机号: {currentRow.phone || '-'}</p>
            <p>状态: {currentRow.status === 1 ? '启用' : '禁用'}</p>
            <p>
              角色:{' '}
              {currentRow.roleIds && currentRow.roleIds.length > 0
                ? currentRow.roleIds
                    .map((id) => roles.find((r) => r.id === id))
                    .filter(Boolean)
                    .map((r) => r!.roleName)
                    .join(', ')
                : '无角色'}
            </p>
            <p>创建时间: {currentRow.createTime || '-'}</p>
          </div>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default UserManage;
