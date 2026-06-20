// @ts-ignore
/* eslint-disable */

declare namespace API {
  type CurrentUser = {
    name?: string;
    avatar?: string;
    userid?: string;
    email?: string;
    signature?: string;
    title?: string;
    group?: string;
    tags?: { key?: string; label?: string }[];
    notifyCount?: number;
    unreadCount?: number;
    country?: string;
    access?: string;
    roleCode?: string;
    geographic?: {
      province?: { label?: string; key?: string };
      city?: { label?: string; key?: string };
    };
    address?: string;
    phone?: string;
    status?: number;
  };

  type LoginResult = {
    code?: number;
    type?: string;
    currentAuthority?: string;
  };

  type PageParams = {
    current?: number;
    pageSize?: number;
  };

  type RuleListItem = {
    key?: number;
    disabled?: boolean;
    href?: string;
    avatar?: string;
    name?: string;
    owner?: string;
    desc?: string;
    callNo?: number;
    status?: number;
    updatedAt?: string;
    createdAt?: string;
    progress?: number;
  };

  type RuleList = {
    data?: RuleListItem[];
    /** 列表的内容总数 */
    total?: number;
    success?: boolean;
  };

  type FakeCaptcha = {
    code?: number;
    status?: string;
  };

  type LoginParams = {
    username?: string;
    password?: string;
    autoLogin?: boolean;
    type?: string;
  };

  type ErrorResponse = {
    /** 业务约定的错误码 */
    errorCode: string;
    /** 业务上的错误信息 */
    errorMessage?: string;
    /** 业务上的请求是否成功 */
    success?: boolean;
  };

  type NoticeIconList = {
    data?: NoticeIconItem[];
    /** 列表的内容总数 */
    total?: number;
    success?: boolean;
  };

  type NoticeIconItemType = 'notification' | 'message' | 'event';

  type NoticeIconItem = {
    id?: string;
    extra?: string;
    key?: string;
    read?: boolean;
    avatar?: string;
    title?: string;
    status?: string;
    datetime?: string;
    description?: string;
    type?: NoticeIconItemType;
  };

  // Generic backend response wrapper
  type ResponseResult<T> = {
    code: number;
    message: string;
    data: T;
    errors?: string[];
  };

  // User management types
  type UserItem = {
    id?: string;
    username: string;
    password?: string;
    realName?: string;
    email?: string;
    phone?: string;
    status?: number;
    roleIds?: string[];
    createTime?: string;
    updateTime?: string;
  };

  type LoginResponseData = {
    token: string;
    username: string;
    realName: string;
  };

  type CurrentUserResponse = {
    id: string;
    username: string;
    roleCode: string;
    realName: string;
    email: string;
    phone: string;
    status: number;
  };

  // Role management types
  type RoleItem = {
    id?: string;
    roleName: string;
    roleCode: string;
    description?: string;
    status?: number;
    permissionIds?: string[];
    createTime?: string;
    updateTime?: string;
  };

  // Product management types
  type ProductItem = {
    id?: string;
    productName: string;
    productCode: string;
    category?: string;
    description?: string;
    price?: number;
    status?: number;
    createTime?: string;
    updateTime?: string;
  };

  // Lottery Period types
  type LotteryPeriod = {
    id?: string;
    period: string;
    drawDate: string;
    front1: number;
    front2: number;
    front3: number;
    front4: number;
    front5: number;
    back1: number;
    back2: number;
    createTime?: string;
    updateTime?: string;
  };

  // Permission types
  type Permission = {
    id?: string;
    permissionName: string;
    permissionCode: string;
    description?: string;
    createTime?: string;
  };

  // Single period statistics types
  type NumberStatistic = {
    number: string;
    count: number;
  };

  type SinglePeriodStatisticsResponse = {
    totalPeriods: number;
    frontAreaStats: NumberStatistic[];
    backAreaStats: NumberStatistic[];
  };

  // Multiple period statistics types
  type PeriodRange = {
    label: string;
    startDate: string;
    endDate: string;
  };

  type MultiplePeriodStatisticsRequest = {
    ranges: PeriodRange[];
  };

  type MultiPeriodNumberStatistic = {
    number: string;
    counts: Record<string, number>;
    totalCount: number;
  };

  type PeriodSummary = {
    label: string;
    totalPeriods: number;
  };

  type MultiplePeriodStatisticsResponse = {
    periods: PeriodSummary[];
    frontAreaStats: MultiPeriodNumberStatistic[];
    backAreaStats: MultiPeriodNumberStatistic[];
  };
}
