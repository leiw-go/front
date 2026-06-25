import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDatePicker,
  ProFormDigit,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Drawer, message, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import {
  createLotteryPeriod,
  deleteLotteryPeriod,
  getLotteryPeriods,
  updateLotteryPeriod,
} from '@/services/ant-design-pro/api';

// 格式化开奖号码
const formatLotteryNumbers = (record: API.LotteryPeriod) => {
  const frontNumbers = [
    record.front1,
    record.front2,
    record.front3,
    record.front4,
    record.front5,
  ]
    .map((n) => String(n).padStart(2, '0'))
    .join(' ');
  const backNumbers = [record.back1, record.back2]
    .map((n) => String(n).padStart(2, '0'))
    .join(' ');
  return (
    <Space>
      <Tag color="blue">前区</Tag>
      {frontNumbers.split(' ').map((n) => (
        <Tag key={`front-${n}`} color="processing">
          {n}
        </Tag>
      ))}
      <Tag color="red">后区</Tag>
      {backNumbers.split(' ').map((n) => (
        <Tag key={`back-${n}`} color="error">
          {n}
        </Tag>
      ))}
    </Space>
  );
};

const PeriodManage: React.FC = () => {
  const actionRef = React.useRef<ActionType | null>(null);
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<API.LotteryPeriod>();
  const [showDetail, setShowDetail] = useState(false);

  // Create period mutation
  const { mutateAsync: addPeriodRun, isPending: addLoading } = useMutation({
    mutationFn: (values: API.LotteryPeriod) => createLotteryPeriod(values),
    onSuccess: () => {
      messageApi.success('开奖记录创建成功');
      queryClient.invalidateQueries({ queryKey: ['lotteryPeriods'] });
      actionRef.current?.reloadAndRest?.();
      setCreateModalOpen(false);
    },
    onError: () => {
      messageApi.error('开奖记录创建失败，请重试！');
    },
  });

  // Update period mutation
  const { mutateAsync: updatePeriodRun, isPending: updateLoading } =
    useMutation({
      mutationFn: (params: { id: string; body: API.LotteryPeriod }) =>
        updateLotteryPeriod(params.id, params.body),
      onSuccess: () => {
        messageApi.success('开奖记录更新成功');
        queryClient.invalidateQueries({ queryKey: ['lotteryPeriods'] });
        actionRef.current?.reloadAndRest?.();
        setEditModalOpen(false);
        setCurrentRow(undefined);
      },
      onError: () => {
        messageApi.error('开奖记录更新失败，请重试！');
      },
    });

  // Delete period mutation
  const { mutateAsync: delPeriodRun } = useMutation({
    mutationFn: (id: string) => deleteLotteryPeriod(id),
    onSuccess: () => {
      messageApi.success('开奖记录删除成功');
      queryClient.invalidateQueries({ queryKey: ['lotteryPeriods'] });
      actionRef.current?.reloadAndRest?.();
    },
    onError: () => {
      messageApi.error('开奖记录删除失败，请重试！');
    },
  });

  const columns: ProColumns<API.LotteryPeriod>[] = [
    {
      title: '期号',
      dataIndex: 'period',
      width: 120,
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
      title: '开奖日期',
      dataIndex: 'drawDate',
      valueType: 'date',
      width: 120,
    },
    {
      title: '开奖号码',
      dataIndex: 'lotteryNumbers',
      render: (_, record) => formatLotteryNumbers(record),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      valueType: 'dateTime',
      width: 180,
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      width: 120,
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
              await delPeriodRun(record.id);
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
      <ProTable<API.LotteryPeriod>
        headerTitle="开奖记录列表"
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
            新增开奖记录
          </Button>,
        ]}
        request={async (params) => {
          const { current = 1, pageSize = 10 } = params;
          const result = await getLotteryPeriods({
            page: current,
            size: pageSize,
          });
          return {
            data: result?.data?.data || [],
            success: result?.code === 200,
            total: result?.data?.total || 0,
          };
        }}
        columns={columns}
      />

      {/* Create Period Modal */}
      <ModalForm
        title="新增开奖记录"
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        width="700px"
        modalProps={{
          okButtonProps: { loading: addLoading },
          destroyOnClose: true,
        }}
        onFinish={async (values) => {
          try {
            await addPeriodRun(values as API.LotteryPeriod);
            return true;
          } catch {
            return false;
          }
        }}
      >
        <ProFormText
          name="period"
          label="期号"
          placeholder="如: 25001"
          rules={[{ required: true, message: '请输入期号' }]}
          width="md"
        />
        <ProFormDatePicker
          name="drawDate"
          label="开奖日期"
          rules={[{ required: true, message: '请选择开奖日期' }]}
          width="md"
        />
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'block',
              marginBottom: 8,
              color: 'rgba(0,0,0,0.85)',
            }}
          >
            前区号码（5个，01-35）
          </div>
          <Space>
            <ProFormDigit
              name="front1"
              placeholder="前区1"
              rules={[
                { required: true, message: '必填' },
                { type: 'number', min: 1, max: 35, message: '1-35' },
              ]}
              width={80}
              fieldProps={{ min: 1, max: 35 }}
            />
            <ProFormDigit
              name="front2"
              placeholder="前区2"
              rules={[
                { required: true, message: '必填' },
                { type: 'number', min: 1, max: 35, message: '1-35' },
              ]}
              width={80}
              fieldProps={{ min: 1, max: 35 }}
            />
            <ProFormDigit
              name="front3"
              placeholder="前区3"
              rules={[
                { required: true, message: '必填' },
                { type: 'number', min: 1, max: 35, message: '1-35' },
              ]}
              width={80}
              fieldProps={{ min: 1, max: 35 }}
            />
            <ProFormDigit
              name="front4"
              placeholder="前区4"
              rules={[
                { required: true, message: '必填' },
                { type: 'number', min: 1, max: 35, message: '1-35' },
              ]}
              width={80}
              fieldProps={{ min: 1, max: 35 }}
            />
            <ProFormDigit
              name="front5"
              placeholder="前区5"
              rules={[
                { required: true, message: '必填' },
                { type: 'number', min: 1, max: 35, message: '1-35' },
              ]}
              width={80}
              fieldProps={{ min: 1, max: 35 }}
            />
          </Space>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'block',
              marginBottom: 8,
              color: 'rgba(0,0,0,0.85)',
            }}
          >
            后区号码（2个，01-12）
          </div>
          <Space>
            <ProFormDigit
              name="back1"
              placeholder="后区1"
              rules={[
                { required: true, message: '必填' },
                { type: 'number', min: 1, max: 12, message: '1-12' },
              ]}
              width={80}
              fieldProps={{ min: 1, max: 12 }}
            />
            <ProFormDigit
              name="back2"
              placeholder="后区2"
              rules={[
                { required: true, message: '必填' },
                { type: 'number', min: 1, max: 12, message: '1-12' },
              ]}
              width={80}
              fieldProps={{ min: 1, max: 12 }}
            />
          </Space>
        </div>
      </ModalForm>

      {/* Edit Period Modal */}
      <ModalForm
        title="编辑开奖记录"
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) setCurrentRow(undefined);
        }}
        width="700px"
        modalProps={{
          okButtonProps: { loading: updateLoading },
          destroyOnClose: true,
        }}
        initialValues={{
          ...currentRow,
          drawDate: currentRow?.drawDate
            ? dayjs(currentRow.drawDate)
            : undefined,
        }}
        onFinish={async (values) => {
          try {
            if (currentRow?.id) {
              await updatePeriodRun({
                id: currentRow.id,
                body: values as API.LotteryPeriod,
              });
            }
            return true;
          } catch {
            return false;
          }
        }}
      >
        <ProFormText
          name="period"
          label="期号"
          rules={[{ required: true, message: '请输入期号' }]}
          width="md"
          disabled
        />
        <ProFormDatePicker
          name="drawDate"
          label="开奖日期"
          rules={[{ required: true, message: '请选择开奖日期' }]}
          width="md"
        />
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'block',
              marginBottom: 8,
              color: 'rgba(0,0,0,0.85)',
            }}
          >
            前区号码（5个，01-35）
          </div>
          <Space>
            <ProFormDigit
              name="front1"
              rules={[
                { required: true, message: '必填' },
                { type: 'number', min: 1, max: 35, message: '1-35' },
              ]}
              width={80}
              fieldProps={{ min: 1, max: 35 }}
            />
            <ProFormDigit
              name="front2"
              rules={[
                { required: true, message: '必填' },
                { type: 'number', min: 1, max: 35, message: '1-35' },
              ]}
              width={80}
              fieldProps={{ min: 1, max: 35 }}
            />
            <ProFormDigit
              name="front3"
              rules={[
                { required: true, message: '必填' },
                { type: 'number', min: 1, max: 35, message: '1-35' },
              ]}
              width={80}
              fieldProps={{ min: 1, max: 35 }}
            />
            <ProFormDigit
              name="front4"
              rules={[
                { required: true, message: '必填' },
                { type: 'number', min: 1, max: 35, message: '1-35' },
              ]}
              width={80}
              fieldProps={{ min: 1, max: 35 }}
            />
            <ProFormDigit
              name="front5"
              rules={[
                { required: true, message: '必填' },
                { type: 'number', min: 1, max: 35, message: '1-35' },
              ]}
              width={80}
              fieldProps={{ min: 1, max: 35 }}
            />
          </Space>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'block',
              marginBottom: 8,
              color: 'rgba(0,0,0,0.85)',
            }}
          >
            后区号码（2个，01-12）
          </div>
          <Space>
            <ProFormDigit
              name="back1"
              rules={[
                { required: true, message: '必填' },
                { type: 'number', min: 1, max: 12, message: '1-12' },
              ]}
              width={80}
              fieldProps={{ min: 1, max: 12 }}
            />
            <ProFormDigit
              name="back2"
              rules={[
                { required: true, message: '必填' },
                { type: 'number', min: 1, max: 12, message: '1-12' },
              ]}
              width={80}
              fieldProps={{ min: 1, max: 12 }}
            />
          </Space>
        </div>
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
        {currentRow?.period && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <h3>第 {currentRow.period} 期</h3>
            </div>
            <div>
              <strong>开奖日期：</strong> {currentRow.drawDate}
            </div>
            <div>
              <strong>开奖号码：</strong>
            </div>
            <div
              style={{
                padding: '12px 16px',
                background: '#f5f5f5',
                borderRadius: 8,
              }}
            >
              <Space direction="vertical" size="small">
                <div>
                  <Tag color="blue" style={{ marginRight: 8 }}>
                    前区
                  </Tag>
                  {formatLotteryNumbers(currentRow)}
                </div>
              </Space>
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

export default PeriodManage;
