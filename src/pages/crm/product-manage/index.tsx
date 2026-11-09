import {
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormList,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Descriptions,
  Drawer,
  message,
  Popconfirm,
  Space,
  Table,
  Tag,
} from 'antd';
import { useRef, useState } from 'react';
import ActionButton from '@/components/ActionButton';
import {
  createCrmProduct,
  deleteCrmProduct,
  getCrmProduct,
  listCrmProductPrices,
  listCrmProducts,
  replaceCrmProductPrices,
  updateCrmProduct,
} from '@/services/crm/crmProduct';
import {
  CURRENCIES,
  formatAmount,
  PRODUCT_CATEGORIES,
  toTableResult,
  UNITS,
} from '../shared';

const ProductManage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<Crm.CrmProductDto>();
  const [detail, setDetail] = useState<Crm.CrmProductDto>();
  const [prices, setPrices] = useState<Crm.CrmProductPriceDto[]>([]);

  const createMutation = useMutation({
    mutationFn: (values: Crm.CrmProductRequest) => createCrmProduct(values),
    onSuccess: () => {
      messageApi.success('产品创建成功');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      actionRef.current?.reload();
      setCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: Crm.CrmProductRequest) =>
      updateCrmProduct({ id: currentRow?.id as string }, values),
    onSuccess: () => {
      messageApi.success('产品更新成功');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      actionRef.current?.reload();
      setEditOpen(false);
      setCurrentRow(undefined);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCrmProduct({ id }),
    onSuccess: () => {
      messageApi.success('产品删除成功');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      actionRef.current?.reload();
    },
  });

  const replacePricesMutation = useMutation({
    mutationFn: (body: Crm.CrmProductPriceRequest[]) =>
      replaceCrmProductPrices({ id: currentRow?.id as string }, body),
    onSuccess: () => {
      messageApi.success('参考价保存成功');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      setPriceOpen(false);
      setCurrentRow(undefined);
    },
  });

  const openDetail = async (id: string) => {
    const res = await getCrmProduct({ id });
    setDetail(res?.data);
    setDetailOpen(true);
  };

  const openPrices = async (id: string) => {
    const [detailRes, priceRes] = await Promise.all([
      getCrmProduct({ id }),
      listCrmProductPrices({ id }),
    ]);
    setCurrentRow(detailRes?.data);
    setPrices(priceRes?.data ?? []);
    setPriceOpen(true);
  };

  const columns: ProColumns<Crm.CrmProductDto>[] = [
    {
      title: '产品编码',
      dataIndex: 'productCode',
      width: 140,
      render: (_, record) => (
        <a
          onClick={() => record.id && openDetail(record.id)}
          style={{ marginRight: 8 }}
        >
          {record.productCode}
        </a>
      ),
    },
    { title: '产品名称', dataIndex: 'productName', width: 180 },
    { title: '分类', dataIndex: 'category', width: 110 },
    {
      title: '规格',
      dataIndex: 'specification',
      search: false,
      ellipsis: true,
    },
    { title: '单位', dataIndex: 'unit', width: 80, search: false },
    {
      title: '成本价',
      dataIndex: 'costPrice',
      width: 140,
      search: false,
      render: (_, record) =>
        record.costPrice === undefined || record.costPrice === null
          ? '未维护'
          : `${formatAmount(record.costPrice)} ${record.costCurrency ?? ''}`,
    },
    {
      title: '默认售价',
      dataIndex: 'defaultPrice',
      width: 140,
      search: false,
      render: (_, record) =>
        record.defaultPrice === undefined || record.defaultPrice === null
          ? '-'
          : `${formatAmount(record.defaultPrice)} ${record.defaultCurrency ?? ''}`,
    },
    { title: 'MOQ', dataIndex: 'moq', width: 80, search: false },
    {
      title: '状态',
      dataIndex: 'productStatus',
      width: 90,
      valueType: 'select',
      valueEnum: {
        1: { text: '在售', status: 'Success' },
        0: { text: '停售', status: 'Default' },
      },
      render: (_, record) =>
        record.productStatus === 1 ? (
          <Tag color="success">在售</Tag>
        ) : (
          <Tag>停售</Tag>
        ),
    },
    {
      title: '操作',
      dataIndex: 'option',
      width: 110,
      fixed: 'right',
      search: false,
      render: (_, record) => (
        <Space size={4}>
          <ActionButton
            key="edit"
            title="编辑"
            icon={<EditOutlined />}
            onClick={() => {
              setCurrentRow(record);
              setEditOpen(true);
            }}
          />
          <ActionButton
            key="prices"
            title="多币种参考价"
            icon={<DollarOutlined />}
            onClick={() => record.id && openPrices(record.id)}
          />
          <Popconfirm
            key="delete"
            title="确认删除该产品？"
            onConfirm={() => record.id && deleteMutation.mutateAsync(record.id)}
          >
            <ActionButton title="删除" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const productFormItems = (
    <>
      <ProFormText
        name="productCode"
        label="产品编码"
        width="sm"
        rules={[{ required: true, message: '请输入产品编码' }]}
      />
      <ProFormText
        name="productName"
        label="产品名称"
        width="sm"
        rules={[{ required: true, message: '请输入产品名称' }]}
      />
      <ProFormSelect
        name="category"
        label="分类"
        width="sm"
        options={PRODUCT_CATEGORIES}
      />
      <ProFormSelect
        name="unit"
        label="单位"
        width="sm"
        options={UNITS}
        initialValue="PCS"
      />
      <ProFormText
        name="specification"
        label="规格"
        width="md"
        placeholder="如 30cm*20cm，ABS 材质"
      />
      <ProFormDigit
        name="weightKg"
        label="单件重量（kg）"
        width="sm"
        fieldProps={{ min: 0 }}
      />
      <ProFormDigit
        name="volumeCbm"
        label="单件体积（CBM）"
        width="sm"
        fieldProps={{ min: 0 }}
      />
      <ProFormDigit
        name="costPrice"
        label="成本单价"
        width="sm"
        fieldProps={{ min: 0, precision: 6 }}
        tooltip="留空表示该产品不能参与报价"
      />
      <ProFormSelect
        name="costCurrency"
        label="成本币种"
        width="sm"
        options={CURRENCIES.map((code) => ({ label: code, value: code }))}
        initialValue="USD"
      />
      <ProFormDigit
        name="defaultPrice"
        label="默认销售价"
        width="sm"
        fieldProps={{ min: 0, precision: 6 }}
      />
      <ProFormSelect
        name="defaultCurrency"
        label="默认币种"
        width="sm"
        options={CURRENCIES.map((code) => ({ label: code, value: code }))}
        initialValue="USD"
      />
      <ProFormDigit
        name="moq"
        label="起订量 MOQ"
        width="sm"
        fieldProps={{ min: 0 }}
        tooltip="报价明细数量不得低于该值"
      />
      <ProFormText name="hsCode" label="HS 编码" width="sm" />
      <ProFormText name="origin" label="产地" width="sm" />
      <ProFormSelect
        name="productStatus"
        label="状态"
        width="sm"
        options={[
          { label: '在售', value: 1 },
          { label: '停售', value: 0 },
        ]}
        initialValue={1}
      />
      <ProFormTextArea
        name="remark"
        label="备注"
        width="md"
        fieldProps={{ rows: 2 }}
      />
    </>
  );

  return (
    <PageContainer>
      {contextHolder}
      <ProTable<Crm.CrmProductDto>
        headerTitle="产品列表"
        actionRef={actionRef}
        rowKey="id"
        scroll={{ x: 'max-content' }}
        search={{ labelWidth: 'auto' }}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
          >
            新增产品
          </Button>,
        ]}
        request={async (params) => {
          const { current = 1, pageSize = 10, ...rest } = params;
          const res = await listCrmProducts({
            page: current,
            size: pageSize,
            keyword: rest.keyword as string | undefined,
            category: rest.category as string | undefined,
            productStatus: rest.productStatus as number | undefined,
          });
          return toTableResult<Crm.CrmProductDto>(res);
        }}
        columns={columns}
      />

      <ModalForm
        title="新增产品"
        open={createOpen}
        onOpenChange={setCreateOpen}
        width={760}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          try {
            await createMutation.mutateAsync(values as Crm.CrmProductRequest);
            return true;
          } catch {
            return false;
          }
        }}
      >
        {productFormItems}
      </ModalForm>

      <ModalForm
        key={currentRow?.id ?? 'product-edit'}
        title="编辑产品"
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setCurrentRow(undefined);
        }}
        initialValues={currentRow}
        width={760}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          try {
            await updateMutation.mutateAsync(values as Crm.CrmProductRequest);
            return true;
          } catch {
            return false;
          }
        }}
      >
        {productFormItems}
      </ModalForm>

      <ModalForm
        key={`prices-${currentRow?.id ?? 'none'}`}
        title={`维护多币种参考价${currentRow?.productName ? ` - ${currentRow.productName}` : ''}`}
        open={priceOpen}
        onOpenChange={(open) => {
          setPriceOpen(open);
          if (!open) setCurrentRow(undefined);
        }}
        initialValues={{
          prices: prices.map((price) => ({
            currencyCode: price.currencyCode,
            price: price.price,
            minQuantity: price.minQuantity,
            validFrom: price.validFrom,
            validTo: price.validTo,
          })),
        }}
        width={760}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          const list = (values.prices ?? []) as any[];
          try {
            await replacePricesMutation.mutateAsync(
              list.map((item) => ({
                currencyCode: item.currencyCode,
                price: item.price,
                minQuantity: item.minQuantity,
                validFrom: item.validFrom
                  ? String(item.validFrom).slice(0, 10)
                  : undefined,
                validTo: item.validTo
                  ? String(item.validTo).slice(0, 10)
                  : undefined,
              })),
            );
            return true;
          } catch {
            return false;
          }
        }}
      >
        <ProFormList
          name="prices"
          min={0}
          creatorButtonProps={{ creatorButtonText: '新增币种参考价' }}
        >
          <ProFormSelect
            name="currencyCode"
            label="币种"
            width="sm"
            options={CURRENCIES.map((code) => ({ label: code, value: code }))}
            rules={[{ required: true, message: '请选择币种' }]}
          />
          <ProFormDigit
            name="price"
            label="参考单价"
            width="sm"
            fieldProps={{ min: 0, precision: 6 }}
            rules={[{ required: true, message: '请输入参考单价' }]}
          />
          <ProFormDigit
            name="minQuantity"
            label="阶梯起点"
            width="sm"
            fieldProps={{ min: 0 }}
            initialValue={0}
          />
          <ProFormText
            name="validFrom"
            label="生效日"
            width="sm"
            placeholder="yyyy-MM-dd"
          />
          <ProFormText
            name="validTo"
            label="失效日"
            width="sm"
            placeholder="yyyy-MM-dd"
          />
        </ProFormList>
      </ModalForm>

      <Drawer
        title="产品详情"
        size={640}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="产品编码">
            {detail?.productCode ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="产品名称">
            {detail?.productName ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="分类">
            {detail?.category ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="规格">
            {detail?.specification ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="单位">
            {detail?.unit ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="单件重量">
            {detail?.weightKg ?? '-'} kg
          </Descriptions.Item>
          <Descriptions.Item label="单件体积">
            {detail?.volumeCbm ?? '-'} CBM
          </Descriptions.Item>
          <Descriptions.Item label="成本价">
            {detail?.costPrice === undefined || detail?.costPrice === null
              ? '未维护'
              : `${formatAmount(detail.costPrice)} ${detail.costCurrency ?? ''}`}
          </Descriptions.Item>
          <Descriptions.Item label="默认售价">
            {detail?.defaultPrice === undefined || detail?.defaultPrice === null
              ? '-'
              : `${formatAmount(detail.defaultPrice)} ${detail.defaultCurrency ?? ''}`}
          </Descriptions.Item>
          <Descriptions.Item label="MOQ">
            {detail?.moq ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="HS 编码">
            {detail?.hsCode ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="产地">
            {detail?.origin ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            {detail?.productStatus === 1 ? '在售' : '停售'}
          </Descriptions.Item>
        </Descriptions>

        <Table<Crm.CrmProductPriceDto>
          style={{ marginTop: 24 }}
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={detail?.prices ?? []}
          columns={[
            { title: '币种', dataIndex: 'currencyCode' },
            {
              title: '参考单价',
              dataIndex: 'price',
              render: (_, record) => formatAmount(record.price),
            },
            { title: '阶梯起点', dataIndex: 'minQuantity' },
            { title: '生效日', dataIndex: 'validFrom' },
            { title: '失效日', dataIndex: 'validTo' },
          ]}
        />
      </Drawer>
    </PageContainer>
  );
};

export default ProductManage;
