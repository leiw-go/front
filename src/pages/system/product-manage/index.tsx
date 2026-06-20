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
import { Button, Drawer, message, Space, Tag } from 'antd';
import React, { useState } from 'react';
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
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

const categoryOptions = [
  { label: '数字彩', value: '数字彩' },
  { label: '乐透彩', value: '乐透彩' },
  { label: '竞彩', value: '竞彩' },
  { label: '高频彩', value: '高频彩' },
  { label: '其他', value: '其他' },
];

const ProductManage: React.FC = () => {
  const actionRef = React.useRef<ActionType | null>(null);
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<API.ProductItem>();
  const [showDetail, setShowDetail] = useState(false);

  // Create product mutation
  const { mutateAsync: addProductRun, isPending: addLoading } = useMutation({
    mutationFn: (values: API.ProductItem) => createProduct(values),
    onSuccess: () => {
      messageApi.success('产品创建成功');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      actionRef.current?.reloadAndRest?.();
      setCreateModalOpen(false);
    },
    onError: () => {
      messageApi.error('产品创建失败，请重试！');
    },
  });

  // Update product mutation
  const { mutateAsync: updateProductRun, isPending: updateLoading } =
    useMutation({
      mutationFn: (params: { id: string; body: API.ProductItem }) =>
        updateProduct(params.id, params.body),
      onSuccess: () => {
        messageApi.success('产品更新成功');
        queryClient.invalidateQueries({ queryKey: ['products'] });
        actionRef.current?.reloadAndRest?.();
        setEditModalOpen(false);
        setCurrentRow(undefined);
      },
      onError: () => {
        messageApi.error('产品更新失败，请重试！');
      },
    });

  // Delete product mutation
  const { mutateAsync: delProductRun } = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      messageApi.success('产品删除成功');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      actionRef.current?.reloadAndRest?.();
    },
    onError: () => {
      messageApi.error('产品删除失败，请重试！');
    },
  });

  const columns: ProColumns<API.ProductItem>[] = [
    {
      title: '产品编码',
      dataIndex: 'productCode',
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
      title: '产品名称',
      dataIndex: 'productName',
    },
    {
      title: '分类',
      dataIndex: 'category',
      render: (dom) => {
        const text = dom as string;
        const colorMap: Record<string, string> = {
          数字彩: 'blue',
          乐透彩: 'green',
          竞彩: 'orange',
          高频彩: 'purple',
          其他: 'default',
        };
        return <Tag color={colorMap[text] || 'default'}>{text || '-'}</Tag>;
      },
    },
    {
      title: '价格',
      dataIndex: 'price',
      valueType: 'money',
      render: (dom) => (dom ? `¥${dom}` : '-'),
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
              await delProductRun(record.id);
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
      <ProTable<API.ProductItem>
        headerTitle="产品列表"
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
            新增产品
          </Button>,
        ]}
        request={async () => {
          const result = (await getProducts()) as unknown as API.ResponseResult<
            API.ProductItem[]
          >;
          return {
            data: result?.data || [],
            success: result?.code === 200,
            total: result?.data?.length || 0,
          };
        }}
        columns={columns}
      />

      {/* Create Product Modal */}
      <ModalForm
        title="新增产品"
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        width="500px"
        modalProps={{
          okButtonProps: { loading: addLoading },
          destroyOnClose: true,
        }}
        onFinish={async (values) => {
          try {
            await addProductRun(values as API.ProductItem);
            return true;
          } catch {
            return false;
          }
        }}
      >
        <ProFormText
          name="productCode"
          label="产品编码"
          placeholder="如: DLT"
          rules={[{ required: true, message: '请输入产品编码' }]}
          width="md"
        />
        <ProFormText
          name="productName"
          label="产品名称"
          placeholder="如: 超级大乐透"
          rules={[{ required: true, message: '请输入产品名称' }]}
          width="md"
        />
        <ProFormSelect
          name="category"
          label="产品分类"
          width="md"
          options={categoryOptions}
          placeholder="请选择产品分类"
        />
        <ProFormDigit
          name="price"
          label="价格"
          width="md"
          min={0}
          fieldProps={{ precision: 2 }}
          addonAfter="元"
        />
        <ProFormText
          name="description"
          label="产品描述"
          width="md"
          fieldProps={{ rows: 3 }}
        />
        <ProFormDigit
          name="status"
          label="状态"
          width="md"
          initialValue={1}
          fieldProps={{ min: 0, max: 1 }}
        />
      </ModalForm>

      {/* Edit Product Modal */}
      <ModalForm
        title="编辑产品"
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
        initialValues={currentRow}
        onFinish={async (values) => {
          try {
            if (currentRow?.id) {
              await updateProductRun({
                id: currentRow.id,
                body: values as API.ProductItem,
              });
            }
            return true;
          } catch {
            return false;
          }
        }}
      >
        <ProFormText
          name="productCode"
          label="产品编码"
          rules={[{ required: true, message: '请输入产品编码' }]}
          width="md"
          disabled
        />
        <ProFormText
          name="productName"
          label="产品名称"
          rules={[{ required: true, message: '请输入产品名称' }]}
          width="md"
        />
        <ProFormSelect
          name="category"
          label="产品分类"
          width="md"
          options={categoryOptions}
        />
        <ProFormDigit
          name="price"
          label="价格"
          width="md"
          min={0}
          fieldProps={{ precision: 2 }}
          addonAfter="元"
        />
        <ProFormText
          name="description"
          label="产品描述"
          width="md"
          fieldProps={{ rows: 3 }}
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
        {currentRow?.productCode && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <h3>{currentRow.productName}</h3>
            </div>
            <div>
              <strong>产品编码：</strong> {currentRow.productCode}
            </div>
            <div>
              <strong>产品分类：</strong> {currentRow.category || '-'}
            </div>
            <div>
              <strong>价格：</strong>{' '}
              {currentRow.price ? `¥${currentRow.price}` : '-'}
            </div>
            <div>
              <strong>状态：</strong>{' '}
              {currentRow.status === 1 ? '启用' : '禁用'}
            </div>
            <div>
              <strong>产品描述：</strong> {currentRow.description || '-'}
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

export default ProductManage;
