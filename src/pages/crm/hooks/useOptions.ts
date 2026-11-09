import { useQuery } from '@tanstack/react-query';
import { getUsers } from '@/services/ant-design-pro/api';
import { listCustomers } from '@/services/crm/crmCustomer';
import { listInquiries } from '@/services/crm/crmInquiry';
import { listOrders } from '@/services/crm/crmOrder';
import { listCrmProducts } from '@/services/crm/crmProduct';
import { listQuotations } from '@/services/crm/crmQuotation';
import { formatAmount } from '../shared';

/**
 * 负责人下拉选项（对应后端 t_user）。
 */
export function useOwnerOptions() {
  const { data, isLoading } = useQuery({
    queryKey: ['crm', 'owner-options'],
    queryFn: async () => {
      const res = await getUsers();
      return res?.data ?? [];
    },
  });

  const options = (data ?? [])
    .filter((user) => Boolean(user.id))
    .map((user) => ({
      label: user.realName || user.username || (user.id as string),
      value: user.id as string,
    }));

  const nameOf = (ownerId?: string) => {
    if (!ownerId) return '-';
    return options.find((option) => option.value === ownerId)?.label ?? ownerId;
  };

  return { options, nameOf, loading: isLoading };
}

/**
 * 客户下拉选项（一次取前 200 条，按后端单页上限）。
 */
export function useCustomerOptions() {
  const { data, isLoading } = useQuery({
    queryKey: ['crm', 'customer-options'],
    queryFn: async () => {
      const res = await listCustomers({ page: 1, size: 200 });
      return res?.data?.data ?? [];
    },
  });

  const options = (data ?? []).map((customer) => ({
    label: customer.companyName ?? customer.shortName ?? customer.id ?? '-',
    value: customer.id ?? '',
  }));

  const nameOf = (customerId?: string) => {
    if (!customerId) return '-';
    return (
      options.find((option) => option.value === customerId)?.label ?? customerId
    );
  };

  return { options, nameOf, loading: isLoading };
}

/**
 * 询盘下拉选项（报价单关联询盘用）。
 */
export function useInquiryOptions() {
  const { data, isLoading } = useQuery({
    queryKey: ['crm', 'inquiry-options'],
    queryFn: async () => {
      const res = await listInquiries({ page: 1, size: 200 });
      return res?.data?.data ?? [];
    },
  });

  const options = (data ?? []).map((inquiry) => ({
    label: `${inquiry.inquiryNo ?? ''} ${inquiry.subject ?? ''}`.trim(),
    value: inquiry.id ?? '',
  }));

  return { options, loading: isLoading };
}

/**
 * 订单下拉选项（发货单、应收选择订单用）。
 */
export function useOrderOptions() {
  const { data, isLoading } = useQuery({
    queryKey: ['crm', 'order-options'],
    queryFn: async () => {
      const res = await listOrders({ page: 1, size: 200 });
      return res?.data?.data ?? [];
    },
  });

  const options = (data ?? []).map((order) => ({
    label: `${order.orderNo ?? ''} ${formatAmount(order.totalAmount)} ${
      order.currencyCode ?? ''
    }`.trim(),
    value: order.id ?? '',
  }));

  return { options, loading: isLoading };
}

/**
 * 报价单下拉选项（订单转单用）。
 */
export function useQuotationOptions() {
  const { data, isLoading } = useQuery({
    queryKey: ['crm', 'quotation-options'],
    queryFn: async () => {
      const res = await listQuotations({ page: 1, size: 200 });
      return res?.data?.data ?? [];
    },
  });

  const options = (data ?? [])
    .filter((quotation) => quotation.quotationStatus !== 'REJECTED')
    .map((quotation) => ({
      label: `${quotation.quotationNo ?? ''} ${
        quotation.currencyCode ?? ''
      } ${formatAmount(quotation.totalAmount)}`.trim(),
      value: quotation.id ?? '',
      quotation,
    }));

  return { options, loading: isLoading };
}

/**
 * 产品下拉选项（报价明细选产品用）。
 */
export function useProductOptions() {
  const { data, isLoading } = useQuery({
    queryKey: ['crm', 'product-options'],
    queryFn: async () => {
      const res = await listCrmProducts({ page: 1, size: 200 });
      return res?.data?.data ?? [];
    },
  });

  const options = (data ?? [])
    .filter((product) => product.productStatus === 1)
    .map((product) => ({
      label: `${product.productCode ?? ''} ${product.productName ?? ''}`.trim(),
      value: product.id ?? '',
      product,
    }));

  return { options, loading: isLoading };
}
