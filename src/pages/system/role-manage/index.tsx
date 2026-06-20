import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Drawer, message, Space, Tag } from 'antd';
import React, { useState } from 'react';
import {
  createRole,
  deleteRole,
  getRoles,
  updateRole,
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

const RoleManage: React.FC = () => {
  const actionRef = React.useRef<ActionType | null>(null);
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<API.RoleItem>();
  const [showDetail, setShowDetail] = useState(false);

  // Create role mutation
  const { mutateAsync: addRoleRun, isPending: addLoading } = useMutation({
    mutationFn: (values: API.RoleItem) => createRole(values),
    onSuccess: () => {
      messageApi.success('角色创建成功');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      actionRef.current?.reloadAndRest?.();
      setCreateModalOpen(false);
    },
    onError: () => {
      messageApi.error('角色创建失败，请重试！');
    },
  });

  // Update role mutation
  const { mutateAsync: updateRoleRun, isPending: updateLoading } = useMutation({
    mutationFn: (params: { id: string; body: API.RoleItem }) =>
      updateRole(params.id, params.body),
    onSuccess: () => {
      messageApi.success('角色更新成功');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      actionRef.current?.reloadAndRest?.();
      setEditModalOpen(false);
      setCurrentRow(undefined);
    },
    onError: () => {
      messageApi.error('角色更新失败，请重试！');
    },
  });

  // Delete role mutation
  const { mutateAsync: delRoleRun } = useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: () => {
      messageApi.success('角色删除成功');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      actionRef.current?.reloadAndRest?.();
    },
    onError: () => {
      messageApi.error('角色删除失败，请重试！');
    },
  });

  const columns: ProColumns<API.RoleItem>[] = [
    {
      title: '角色编码',
      dataIndex: 'roleCode',
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
      title: '角色名称',
      dataIndex: 'roleName',
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueEnum: statusEnum,
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
              await delRoleRun(record.id);
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
      <ProTable<API.RoleItem>
        headerTitle="角色列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 'auto',
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            key="add"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            新增角色
          </Button>,
        ]}
        request={async () => {
          const result = (await getRoles()) as unknown as API.ResponseResult<
            API.RoleItem[]
          >;
          return {
            data: result?.data || [],
            success: result?.code === 200,
            total: result?.data?.length || 0,
          };
        }}
        columns={columns}
      />

      {/* Create Role Modal */}
      <ModalForm
        title="新增角色"
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        width="600px"
        modalProps={{
          okButtonProps: { loading: addLoading },
          destroyOnClose: true,
        }}
        onFinish={async (values) => {
          try {
            await addRoleRun(values as API.RoleItem);
            return true;
          } catch {
            return false;
          }
        }}
      >
        <ProFormText
          name="roleCode"
          label="角色编码"
          placeholder="如: ADMIN"
          rules={[
            { required: true, message: '请输入角色编码' },
            {
              pattern: /^[A-Z_]+$/,
              message: '角色编码只能包含大写字母和下划线',
            },
          ]}
          width="md"
        />
        <ProFormText
          name="roleName"
          label="角色名称"
          placeholder="如: 管理员"
          rules={[{ required: true, message: '请输入角色名称' }]}
          width="md"
        />
        <ProFormText
          name="description"
          label="角色描述"
          width="md"
          fieldProps={{ rows: 2 }}
        />
        <ProFormDigit
          name="status"
          label="状态"
          width="md"
          initialValue={1}
          fieldProps={{ min: 0, max: 1 }}
        />
      </ModalForm>

      {/* Edit Role Modal */}
      <ModalForm
        title="编辑角色"
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) setCurrentRow(undefined);
        }}
        width="600px"
        modalProps={{
          okButtonProps: { loading: updateLoading },
          destroyOnClose: true,
        }}
        initialValues={currentRow}
        onFinish={async (values) => {
          try {
            if (currentRow?.id) {
              await updateRoleRun({
                id: currentRow.id,
                body: values as API.RoleItem,
              });
            }
            return true;
          } catch {
            return false;
          }
        }}
      >
        <ProFormText name="roleCode" label="角色编码" width="md" disabled />
        <ProFormText
          name="roleName"
          label="角色名称"
          rules={[{ required: true, message: '请输入角色名称' }]}
          width="md"
        />
        <ProFormText
          name="description"
          label="角色描述"
          width="md"
          fieldProps={{ rows: 2 }}
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
        {currentRow?.roleCode && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <h3>{currentRow.roleName}</h3>
              <Tag color={currentRow.status === 1 ? 'green' : 'default'}>
                {currentRow.status === 1 ? '启用' : '禁用'}
              </Tag>
            </div>
            <div>
              <strong>角色编码：</strong> {currentRow.roleCode}
            </div>
            <div>
              <strong>角色描述：</strong> {currentRow.description || '-'}
            </div>
            <div>
              <strong>创建时间：</strong> {currentRow.createTime || '-'}
            </div>
          </Space>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default RoleManage;
