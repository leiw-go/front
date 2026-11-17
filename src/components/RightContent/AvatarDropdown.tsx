import {
  BellOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  SkinOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import type { MenuProps } from 'antd';
import { Spin } from 'antd';
import React, { startTransition, useState } from 'react';
import { outLogin } from '@/services/ant-design-pro/api';
import HeaderDropdown from '../HeaderDropdown';

type GlobalHeaderRightProps = {
  children?: React.ReactNode;
};

/**
 * 下拉菜单项对应的路由。
 * 这些页面原来挂在顶部菜单里，现已统一收敛到右上角头像下拉。
 */
const MENU_PATHS: Record<string, string> = {
  'user-manage': '/account/user-manage',
  'role-manage': '/system/role-manage',
  'message-center': '/crm/message-center',
  settings: '/account/settings',
};

export const AvatarDropdown: React.FC<GlobalHeaderRightProps> = ({
  children,
}) => {
  const loginOut = async () => {
    await outLogin();
    localStorage.removeItem('token');
    const { search, pathname } = window.location;
    const urlParams = new URL(window.location.href).searchParams;
    const searchParams = new URLSearchParams({
      redirect: pathname + search,
    });
    const redirect = urlParams.get('redirect');
    if (window.location.pathname !== '/user/login' && !redirect) {
      history.replace({
        pathname: '/user/login',
        search: searchParams.toString(),
      });
    }
  };
  const { initialState, setInitialState } = useModel('@@initialState');
  // 用 click 触发：hover 触发时鼠标从菜单项移回用户名的间隙会让下拉直接消失
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const onMenuClick: MenuProps['onClick'] = (event) => {
    const { key } = event;
    setDropdownOpen(false);
    if (key === 'logout') {
      startTransition(() => {
        setInitialState((s) => ({ ...s, currentUser: undefined }));
      });
      loginOut();
      return;
    }
    if (key === 'theme') {
      setInitialState((s) => ({ ...s, settingDrawerOpen: true }));
      return;
    }
    const path = MENU_PATHS[key];
    if (path) {
      history.push(path);
    }
  };

  if (!initialState) {
    return <Spin size="small" />;
  }

  const { currentUser } = initialState;

  if (!currentUser) {
    return <Spin size="small" />;
  }

  const isAdmin = currentUser.roleCode === 'ADMIN';

  const menuItems: MenuProps['items'] = [
    ...(isAdmin
      ? [
          {
            key: 'user-manage',
            icon: <TeamOutlined />,
            label: '用户管理',
          } as const,
          {
            key: 'role-manage',
            icon: <SafetyCertificateOutlined />,
            label: '角色管理',
          } as const,
          {
            key: 'message-center',
            icon: <BellOutlined />,
            label: '站内信',
          } as const,
        ]
      : []),
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '个人设置',
    },
    {
      key: 'theme',
      icon: <SkinOutlined />,
      label: '主题设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ];

  return (
    <HeaderDropdown
      placement="bottomRight"
      trigger={['click']}
      open={dropdownOpen}
      onOpenChange={setDropdownOpen}
      menu={{
        selectedKeys: [],
        onClick: onMenuClick,
        items: menuItems,
      }}
      arrow
    >
      {children}
    </HeaderDropdown>
  );
};
