// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 获取当前用户 GET /api/auth/currentUser */
export async function currentUser(options?: { [key: string]: any }) {
  return request<{
    data: API.CurrentUser;
  }>('/api/auth/currentUser', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 退出登录 POST /api/auth/logout */
export async function outLogin(options?: { [key: string]: any }) {
  return request<Record<string, any>>('/api/auth/logout', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 登录接口 POST /api/auth/login */
export async function login(body: API.LoginParams, options?: { [key: string]: any }) {
  return request<API.LoginResult>('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /api/notices */
export async function getNotices(options?: { [key: string]: any }) {
  return request<API.NoticeIconList>('/api/notices', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取规则列表 GET /api/rule */
export async function rule(
  params: {
    // query
    /** 当前的页码 */
    current?: number;
    /** 页面的容量 */
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.RuleList>('/api/rule', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 更新规则 PUT /api/rule */
export async function updateRule(options?: { [key: string]: any }) {
  return request<API.RuleListItem>('/api/rule', {
    method: 'POST',
    data: {
      method: 'update',
      ...(options || {}),
    },
  });
}

/** 新建规则 POST /api/rule */
export async function addRule(options?: { [key: string]: any }) {
  return request<API.RuleListItem>('/api/rule', {
    method: 'POST',
    data: {
      method: 'post',
      ...(options || {}),
    },
  });
}

/** 删除规则 DELETE /api/rule */
export async function removeRule(options?: { [key: string]: any }) {
  return request<Record<string, any>>('/api/rule', {
    method: 'POST',
    data: {
      method: 'delete',
      ...(options || {}),
    },
  });
}

// ========== User Management APIs ==========

/** 获取所有用户 GET /api/users */
export async function getUsers(options?: { [key: string]: any }) {
  return request<API.ResponseResult<API.UserItem[]>>('/api/users', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 创建用户 POST /api/users */
export async function createUser(body: API.UserItem, options?: { [key: string]: any }) {
  return request<API.ResponseResult<API.UserItem>>('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新用户 PUT /api/users/{id} */
export async function updateUser(id: string, body: API.UserItem, options?: { [key: string]: any }) {
  return request<API.ResponseResult<API.UserItem>>('/api/users/' + id, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除用户 DELETE /api/users/{id} */
export async function deleteUser(id: string, options?: { [key: string]: any }) {
  return request<API.ResponseResult<null>>('/api/users/' + id, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 根据ID获取用户 GET /api/users/{id} */
export async function getUserById(id: string, options?: { [key: string]: any }) {
  return request<API.ResponseResult<API.UserItem>>('/api/users/' + id, {
    method: 'GET',
    ...(options || {}),
  });
}

// ========== Role Management APIs ==========

/** 获取所有角色 GET /api/roles */
export async function getRoles(options?: { [key: string]: any }) {
  return request<API.ResponseResult<API.RoleItem[]>>('/api/roles', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 创建角色 POST /api/roles */
export async function createRole(body: API.RoleItem, options?: { [key: string]: any }) {
  return request<API.ResponseResult<API.RoleItem>>('/api/roles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新角色 PUT /api/roles/{id} */
export async function updateRole(id: string, body: API.RoleItem, options?: { [key: string]: any }) {
  return request<API.ResponseResult<API.RoleItem>>('/api/roles/' + id, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除角色 DELETE /api/roles/{id} */
export async function deleteRole(id: string, options?: { [key: string]: any }) {
  return request<API.ResponseResult<null>>('/api/roles/' + id, {
    method: 'DELETE',
    ...(options || {}),
  });
}

// ========== Product Management APIs ==========

/** 获取所有产品 GET /api/products */
export async function getProducts(options?: { [key: string]: any }) {
  return request<API.ResponseResult<API.ProductItem[]>>('/api/products', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 创建产品 POST /api/products */
export async function createProduct(body: API.ProductItem, options?: { [key: string]: any }) {
  return request<API.ResponseResult<API.ProductItem>>('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新产品 PUT /api/products/{id} */
export async function updateProduct(id: string, body: API.ProductItem, options?: { [key: string]: any }) {
  return request<API.ResponseResult<API.ProductItem>>('/api/products/' + id, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除产品 DELETE /api/products/{id} */
export async function deleteProduct(id: string, options?: { [key: string]: any }) {
  return request<API.ResponseResult<null>>('/api/products/' + id, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 根据ID获取产品 GET /api/products/{id} */
export async function getProductById(id: string, options?: { [key: string]: any }) {
  return request<API.ResponseResult<API.ProductItem>>('/api/products/' + id, {
    method: 'GET',
    ...(options || {}),
  });
}

// ========== Permission APIs ==========

/** 获取所有权限 GET /api/roles/permissions */
export async function getPermissions(options?: { [key: string]: any }) {
  return request<API.ResponseResult<API.Permission[]>>('/api/roles/permissions', {
    method: 'GET',
    ...(options || {}),
  });
}

// ========== Lottery Period APIs ==========

/** 获取所有开奖记录 GET /api/lottery/periods */
export async function getLotteryPeriods(
  params: {
    page?: number;
    size?: number;
  },
  options?: { [key: string]: any }
) {
  return request<API.ResponseResult<{
    data: API.LotteryPeriod[];
    total: number;
    page: number;
    size: number;
  }>>('/api/lottery/periods', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/** 创建开奖记录 POST /api/lottery/periods */
export async function createLotteryPeriod(body: API.LotteryPeriod, options?: { [key: string]: any }) {
  return request<API.ResponseResult<API.LotteryPeriod>>('/api/lottery/periods', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新开奖记录 PUT /api/lottery/periods/{id} */
export async function updateLotteryPeriod(id: string, body: API.LotteryPeriod, options?: { [key: string]: any }) {
  return request<API.ResponseResult<API.LotteryPeriod>>('/api/lottery/periods/' + id, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除开奖记录 DELETE /api/lottery/periods/{id} */
export async function deleteLotteryPeriod(id: string, options?: { [key: string]: any }) {
  return request<API.ResponseResult<null>>('/api/lottery/periods/' + id, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 根据ID获取开奖记录 GET /api/lottery/periods/{id} */
export async function getLotteryPeriodById(id: string, options?: { [key: string]: any }) {
  return request<API.ResponseResult<API.LotteryPeriod>>('/api/lottery/periods/' + id, {
    method: 'GET',
    ...(options || {}),
  });
}

// ========== Lottery Statistics APIs ==========

/** 单时间段号码统计 GET /api/lottery/statistics/single */
export async function getSinglePeriodStatistics(
  params: { startDate: string; endDate: string },
  options?: { [key: string]: any }
) {
  return request<API.ResponseResult<API.SinglePeriodStatisticsResponse>>('/api/lottery/statistics/single', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/** 多时间段号码统计对比 POST /api/lottery/statistics/multiple */
export async function getMultiplePeriodStatistics(
  body: API.MultiplePeriodStatisticsRequest,
  options?: { [key: string]: any }
) {
  return request<API.ResponseResult<API.MultiplePeriodStatisticsResponse>>('/api/lottery/statistics/multiple', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

// ========== Register API ==========

/** 用户注册 POST /api/auth/register */
export async function register(body: API.RegisterParams, options?: { [key: string]: any }) {
  return request<API.ResponseResult<API.RegisterResponse>>('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
