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

  type LoginParams = {
    username?: string;
    password?: string;
    autoLogin?: boolean;
    type?: string;
  };

  // Generic backend response wrapper
  type ResponseResult<T> = {
    code: number;
    message: string;
    data: T;
    errors?: string[];
  };

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

  type Permission = {
    id?: string;
    permissionName: string;
    permissionCode: string;
    description?: string;
    createTime?: string;
  };

}
