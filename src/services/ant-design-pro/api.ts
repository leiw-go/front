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

/** 获取所有权限 GET /api/roles/permissions */
export async function getPermissions(options?: { [key: string]: any }) {
  return request<API.ResponseResult<API.Permission[]>>('/api/roles/permissions', {
    method: 'GET',
    ...(options || {}),
  });
}
